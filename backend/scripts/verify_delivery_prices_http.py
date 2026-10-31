"""Exercise deployed receipt APIs without creating any production receipts.

Live import is called only without confirmation (expected 422). Successful import
is tested separately in rollback-only schemas, never in the public database.
"""
import base64
from decimal import Decimal
from io import BytesIO
import json
from pathlib import Path
import sys
from urllib.parse import quote
from uuid import uuid4

from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font

from apply_delivery_prices_migration import snapshot, identity
from verify_delivery_preview_live import probe

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/delivery-prices-migration/live-http'
OLD_COLUMNS = ['ma_don_cu','ma_ncc','lan_giao','ngay_dat','ngay_du_kien','ngay_nhan','ma_nguyen_lieu',
               'so_luong_dat','so_luong_giao','so_luong_dat_chat_luong','so_luong_khong_dat','so_luong_chap_nhan','hoan_tat','ly_do','ghi_chu']


def request(path, token=None, data=None, content_type=None):
    headers = {'Authorization': 'Bearer ' + token} if token else {}
    if content_type:
        headers['Content-Type'] = content_type
    encoded = base64.b64encode(data).decode() if data is not None else None
    config = repr(('http://127.0.0.1:8000/api' + path, encoded, headers))
    output = probe('''
import base64,json
from urllib.request import Request,urlopen
from urllib.error import HTTPError
url,encoded,headers=''' + config + '''
try:
    with urlopen(Request(url,data=base64.b64decode(encoded) if encoded is not None else None,headers=headers),timeout=60) as response:
        print(json.dumps([response.status,base64.b64encode(response.read()).decode()]))
except HTTPError as error:
    print(json.dumps([error.code,base64.b64encode(error.read()).decode()]))
''')
    status, raw = json.loads(output)
    return status, base64.b64decode(raw)


def upload(path, content, token=None):
    boundary = 'ReceiptReadOnly' + uuid4().hex
    # Deliberately omit confirmed=true. A successful production import is forbidden.
    data = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="history.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n').encode() + content + f'\r\n--{boundary}--\r\n'.encode()
    return request(path, token, data, 'multipart/form-data; boundary=' + boundary)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    OUT.mkdir(parents=True, exist_ok=True)
    report = {'database': identity(), 'before': snapshot(), 'checks': []}
    def record(name, status, **details):
        report['checks'].append({'name': name, 'status': status, **details})
        print(name, status, json.dumps(details, ensure_ascii=False), flush=True)
    accounts = json.loads(probe('''
import json
from sqlalchemy import select,text
from sqlalchemy.orm import Session
from src.core.database import engine
from src.core.security import create_access_token
from src.models.user_model import User
from src.services.phan_quyen_service import PhanQuyenService
accounts=[]
with Session(engine) as db:
    db.execute(text('SET TRANSACTION READ ONLY'))
    for user in db.scalars(select(User).where(User.trang_thai=='HOAT_DONG').order_by(User.ma_nguoi_dung)):
        rights={(p.chuc_nang,p.thao_tac) for p in PhanQuyenService().get_my_permissions(db=db,current_user=user).chi_tiet}
        accounts.append({'token':create_access_token(user.ma_nguoi_dung,user.vai_tro),'rights':[list(r) for r in rights]})
print(json.dumps(accounts))
'''))
    required = {('don_mua_nguyen_lieu', op) for op in ('XEM','NHAP_FILE','XUAT_EXCEL')} | {('nha_cung_cap','TINH_DIEM')}
    account = next(a for a in accounts if required <= {tuple(r) for r in a['rights']})
    token = account['token']; rights = {tuple(r) for r in account['rights']}
    root = '/giao-nguyen-lieu/lich-su'
    status, raw = request(root, token)
    assert status == 200, raw.decode()
    receipts = json.loads(raw)
    assert len(receipts) == report['before']['phieu_nhan_nguyen_lieu'][0]
    record('list', status, receipts=len(receipts), lines=sum(len(r['chi_tiet']) for r in receipts))
    for row in receipts:
        status, raw = request(root + '/phieu/' + quote(row['ma_phieu_nhan'], safe=''), token)
        assert status == 200, raw.decode()
        detail = json.loads(raw)
        assert detail == row
        assert 'tong_gia_tri_nhap' in detail
        for line in detail['chi_tiet']:
            assert {'don_gia_mua','don_vi_don_gia','thanh_tien'} <= line.keys()
        record('detail', status, receipt=row['ma_phieu_nhan'], lines=len(detail['chi_tiet']), total=detail['tong_gia_tri_nhap'])
    (OUT/'receipts.json').write_text(json.dumps(receipts, ensure_ascii=False, indent=2), encoding='utf-8')
    status, raw = request(root + '/excel/export', token)
    assert status == 200
    (OUT/'history-export.xlsx').write_bytes(raw)
    sheet = load_workbook(BytesIO(raw), read_only=True).active
    export_rows = list(sheet.values)
    headers = export_rows[0]
    for name in ('Đơn giá mua (VND)','Đơn vị đơn giá','Thành tiền (VND)','Tổng giá trị nhập (VND)'):
        assert name in headers
    assert len(export_rows)-1 == sum(len(r['chi_tiet']) for r in receipts)
    expected_ids = {r['ma_phieu_nhan'] for r in receipts}
    assert {r[0] for r in export_rows[1:]} == expected_ids
    missing = sum(r[headers.index('Đơn giá mua (VND)')] == 'Chưa có giá' for r in export_rows[1:])
    record('export', status, rows=len(export_rows)-1, missing_price_rows=missing, columns=len(headers))
    status, template = request(root + '/excel/template', token)
    assert status == 200
    assert [c.value for c in load_workbook(BytesIO(template)).active[1]] == OLD_COLUMNS + ['don_gia_mua']
    (OUT/'template-v2.xlsx').write_bytes(template)
    record('template', status, columns=16, price_column='P')
    sample = receipts[0]['chi_tiet'][0] if receipts else None
    assert sample, 'Need an existing material for a read-only preview'
    prefix = 'PREVIEW_ONLY_' + uuid4().hex[:12]
    content = None
    for case in ('v2_priced_seven','v2_formatted_seven','v1_legacy_seven','v2_bad_price'):
        book = Workbook(); tab = book.active; tab.title = 'LichSuGiaoHang'
        legacy = case == 'v1_legacy_seven'
        tab.append(OLD_COLUMNS if legacy else [*OLD_COLUMNS, 'don_gia_mua'])
        for index in range(7):
            data = [prefix+str(index),receipts[0]['ma_ncc'],'DOT1','2026-01-01','2026-01-03','2026-01-02',
                    sample['ma_nguyen_lieu'],100,100,100,0,100,True,None,None]
            if not legacy:
                data.append('12.34')
            tab.append(data)
        if case == 'v2_formatted_seven':
            tab['Q10050'].font = Font(bold=True)
        if case == 'v2_bad_price':
            tab['P2'] = '-1'
        stream = BytesIO(); book.save(stream); content = stream.getvalue()
        (OUT/(case+'.xlsx')).write_bytes(content)
        status, raw = upload(root+'/excel/preview', content, token)
        response = json.loads(raw)
        assert status == 200 and response['total_rows'] == 7 and response['imported'] == 0, response
        assert response['valid'] == (case != 'v2_bad_price'), response
        if case == 'v2_bad_price':
            assert any(e['row'] == 2 and 'P2' in e['message'] for e in response['errors'])
        else:
            assert len(response['items']) == 7
            for item in response['items']:
                if legacy:
                    assert item['tong_gia_tri_nhap'] is None
                else:
                    assert Decimal(item['tong_gia_tri_nhap']) == Decimal('1234')
                    assert Decimal(item['chi_tiet'][0]['don_gia_mua']) == Decimal('12.34')
                    assert Decimal(item['chi_tiet'][0]['thanh_tien']) == Decimal('1234')
        record(case,status,response=response)
    status, raw = upload(root+'/excel/import', content, token)
    assert status == 422, raw.decode()
    record('import_without_confirmation', status, response=json.loads(raw), production_receipts_created=0)
    for path in (root, root+'/excel/export', root+'/excel/template', root+'/phieu/'+receipts[0]['ma_phieu_nhan']):
        status, raw = request(path)
        assert status == 401
        record('anonymous_'+path, status)
    status, raw = upload(root+'/excel/preview', content)
    assert status == 401
    record('anonymous_preview',status)
    denied = next((a for a in accounts if ('don_mua_nguyen_lieu','XEM') not in {tuple(r) for r in a['rights']}), None)
    if denied:
        status, raw = request(root, denied['token'])
        assert status == 403
        record('authenticated_without_view', status)
    if ('hieu_suat_nha_cung_cap','XEM') in rights:
        for supplier in sorted({r['ma_ncc'] for r in receipts}):
            status, raw = request('/nha-cung-cap/'+quote(supplier,safe='')+'/hieu-suat-chi-tiet',token)
            assert status == 200, raw.decode()
            record('supplier_performance',status,supplier=supplier)
    for code in sorted({r['ma_don_mua'] for r in receipts if r['ma_don_mua']}):
        status, raw = request('/don-mua-nguyen-lieu/'+quote(code,safe='')+'/lich-su-nhan-hang',token)
        assert status == 200, raw.decode()
        record('order_receipt_history',status,order=code)
    report['after'] = snapshot()
    report['changed_business_tables'] = sorted(name for name in set(report['before'])|set(report['after']) if report['before'].get(name)!=report['after'].get(name))
    report['successful_production_import_called'] = False
    (OUT/'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    assert not report['changed_business_tables'], report['changed_business_tables']
    print('HTTP checks:',len(report['checks']),'Changed business tables:',report['changed_business_tables'])


if __name__ == '__main__':
    main()
