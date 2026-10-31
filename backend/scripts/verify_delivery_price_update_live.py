"""Live preview of the supplied illustrative workbook. No confirmed price writes."""
from io import BytesIO
import json
from pathlib import Path
import sys

from openpyxl import load_workbook

from verify_delivery_prices_http import request, upload
from verify_delivery_preview_live import probe, SNAPSHOT
from apply_delivery_prices_migration import identity

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'reports/delivery-price-updates/live'


def main():
    sys.stdout.reconfigure(encoding='utf-8'); OUT.mkdir(parents=True,exist_ok=True)
    report={'database':identity(),'before':json.loads(probe(SNAPSHOT)),'checks':[]}
    accounts=json.loads(probe('''
import json
from sqlalchemy import select,text
from sqlalchemy.orm import Session
from src.core.database import engine
from src.models.user_model import User
from src.core.security import create_access_token
from src.services.phan_quyen_service import PhanQuyenService
rows=[]
with Session(engine) as db:
    db.execute(text('SET TRANSACTION READ ONLY'))
    for user in db.scalars(select(User).where(User.trang_thai=='HOAT_DONG').order_by(User.ma_nguoi_dung)):
        rights={(p.chuc_nang,p.thao_tac) for p in PhanQuyenService().get_my_permissions(db=db,current_user=user).chi_tiet}
        rows.append({'token':create_access_token(user.ma_nguoi_dung,user.vai_tro),'rights':[list(r) for r in rights]})
print(json.dumps(rows))
'''))
    required={('don_mua_nguyen_lieu',op) for op in ('XEM','NHAP_FILE','SUA')}
    account=next(row for row in accounts if required <= {tuple(r) for r in row['rights']})
    token=account['token']; root='/giao-nguyen-lieu/lich-su/excel/prices'
    content=(ROOT/'test-fixtures/Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx').read_bytes()
    def record(name,status,**details):
        report['checks'].append({'name':name,'status':status,**details})
        print(name,status,json.dumps(details,ensure_ascii=False),flush=True)
    status,raw=request(root+'/template',token)
    assert status==200,raw.decode(errors='replace')
    (OUT/'Template_cap_nhat_gia_phieu_nhap.xlsx').write_bytes(raw)
    book=load_workbook(BytesIO(raw)); sheet=book['CapNhatGia']
    assert [c.value for c in sheet[1]]==['ma_phieu_nhan','ma_nguyen_lieu','don_gia_mua','don_vi_don_gia','ly_do']
    assert sheet.max_row-1==7
    record('official_template',status,rows=7,columns=5)
    status,raw=upload(root+'/preview',content,token)
    preview=json.loads(raw)
    assert status==200 and preview['valid'] and preview['total_rows']==7,preview
    assert len({r['ma_phieu_nhan'] for r in preview['items']})==4
    (OUT/'preview.json').write_text(json.dumps(preview,ensure_ascii=False,indent=2),encoding='utf-8')
    record('supplied_workbook_preview',status,rows=7,receipts=4,updated=preview['updated'],errors=preview['errors'])
    status,raw=upload(root+'/apply',content,token)
    assert status==422,raw.decode(errors='replace')
    record('apply_without_confirmation',status,detail=json.loads(raw))
    for endpoint in ('template','preview','apply'):
        status,raw=request(root+'/'+endpoint) if endpoint=='template' else upload(root+'/'+endpoint,content)
        assert status==401
        record('anonymous_'+endpoint,status)
    denied=next((row for row in accounts if not required <= {tuple(r) for r in row['rights']}),None)
    if denied:
        status,raw=upload(root+'/preview',content,denied['token'])
        assert status==403
        record('authenticated_without_required_rights',status)
    status,raw=request('/giao-nguyen-lieu/lich-su',token)
    assert status==200
    rows=json.loads(raw)
    record('receipt_list',status,receipts=len(rows),lines=sum(len(row['chi_tiet']) for row in rows))
    for row in rows:
        status,raw=request('/giao-nguyen-lieu/lich-su/phieu/'+row['ma_phieu_nhan'],token)
        assert status==200
        record('receipt_detail',status,receipt=row['ma_phieu_nhan'])
    if ('don_mua_nguyen_lieu','XUAT_EXCEL') in {tuple(r) for r in account['rights']}:
        status,raw=request('/giao-nguyen-lieu/lich-su/excel/export',token)
        assert status==200
        (OUT/'history_export_unchanged.xlsx').write_bytes(raw)
        record('existing_history_export',status,rows=load_workbook(BytesIO(raw)).active.max_row-1)
    status,raw=request('/giao-nguyen-lieu/lich-su/excel/template',token)
    assert status==200 and 'LichSuGiaoHang' in load_workbook(BytesIO(raw)).sheetnames
    record('existing_history_template',status)
    report['after']=json.loads(probe(SNAPSHOT))
    report['changed_tables']=sorted(name for name in set(report['before'])|set(report['after']) if report['before'].get(name)!=report['after'].get(name))
    report['confirmed_production_price_update']=False
    (OUT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    assert not report['changed_tables'],report['changed_tables']
    print('Live checks:',len(report['checks']),'Database unchanged:',not report['changed_tables'])


if __name__=='__main__':
    main()
