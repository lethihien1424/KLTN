"""Verify deployed preview using read-only DB probes; never call live import."""
import hashlib
import base64
from io import BytesIO
import json
from pathlib import Path
import subprocess
import sys
from uuid import uuid4

from openpyxl import load_workbook
from openpyxl.styles import Font

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/delivery-preview'
DOCKER = r'C:/Program Files/Docker/Docker/resources/bin/docker.exe'


def docker(args, content=None):
    result = subprocess.run([DOCKER, *args], input=content, text=True,
                            encoding='utf-8', capture_output=True, timeout=180)
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout.strip()


def probe(code):
    return docker(['exec', '-i', 'milano_backend', 'python', '-'], code)


SNAPSHOT = '''
import json
from sqlalchemy import text
from src.core.database import engine
with engine.connect() as c:
    c.execute(text('SET TRANSACTION READ ONLY'))
    tables = list(c.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).scalars())
    result = {}
    for name in tables:
        quoted = c.dialect.identifier_preparer.quote(name)
        row = c.execute(text("SELECT count(*), md5(coalesce(string_agg(row_to_json(t)::text, chr(10) ORDER BY row_to_json(t)::text),'')) FROM public." + quoted + " t")).one()
        result[name] = list(row)
    print(json.dumps(result))
'''


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    OUT.mkdir(parents=True, exist_ok=True)
    report = {'before': json.loads(probe(SNAPSHOT))}
    (OUT / 'before.json').write_text(json.dumps(report['before'], indent=2), encoding='utf-8')
    target = 'src/services/delivery_excel_service.py'
    report['workspace_sha256'] = hashlib.sha256((ROOT / 'backend' / target).read_bytes()).hexdigest()
    report['container_sha256'] = probe('import hashlib; print(hashlib.sha256(open(' + repr(target) + ', "rb").read()).hexdigest())')
    assert report['workspace_sha256'] == report['container_sha256']
    files = {p.name: p.read_text(encoding='utf-8') for p in
             (ROOT / 'backend/reason_tests').glob('test_*.py')}
    runner = '''
import os, sys, tempfile, pathlib, unittest, json
sys.path.insert(0, '/tmp/delivery-preview-test-deps')
os.environ['INVENTORY_TEST_POSTGRES'] = '1'
files = json.loads(sys.stdin.read())
with tempfile.TemporaryDirectory(prefix='delivery-preview-') as temp:
    for name, content in files.items():
        pathlib.Path(temp, name).write_text(content, encoding='utf-8')
    sys.path.insert(0, temp)
    suite = unittest.defaultTestLoader.loadTestsFromName('test_delivery_history')
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    print(json.dumps({'run':result.testsRun, 'passed':result.testsRun-len(result.failures)-len(result.errors)-len(result.skipped), 'failures':len(result.failures), 'errors':len(result.errors), 'skipped':len(result.skipped)}))
    sys.exit(0 if result.wasSuccessful() else 1)
'''
    result = subprocess.run([DOCKER, 'exec', '-i', 'milano_backend', 'python', '-c', runner],
                            input=json.dumps(files), text=True, encoding='utf-8', capture_output=True, timeout=180)
    (OUT / 'api-tests.txt').write_text(result.stdout + result.stderr, encoding='utf-8')
    print(result.stderr, flush=True)
    assert result.returncode == 0, result.stdout
    report['api_tests'] = json.loads(result.stdout.splitlines()[-1])
    token = probe('''
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from src.core.database import engine
from src.core.security import create_access_token
from src.models.user_model import User
from src.services.phan_quyen_service import PhanQuyenService
with Session(engine) as db:
    db.execute(text('SET TRANSACTION READ ONLY'))
    for user in db.scalars(select(User).where(User.trang_thai=='HOAT_DONG').order_by(User.ma_nguoi_dung)):
        rights={(p.chuc_nang,p.thao_tac) for p in PhanQuyenService().get_my_permissions(db=db,current_user=user).chi_tiet}
        if {('don_mua_nguyen_lieu','NHAP_FILE'),('nha_cung_cap','TINH_DIEM')} <= rights:
            print(create_access_token(user.ma_nguoi_dung,user.vai_tro)); break
    else: raise RuntimeError('No active user with preview permissions')
''')
    sample = json.loads(probe('''
import json
from sqlalchemy import text
from src.core.database import engine
with engine.connect() as c:
    c.execute(text('SET TRANSACTION READ ONLY'))
    supplier=c.execute(text('SELECT ma_ncc FROM nha_cung_cap ORDER BY ma_ncc LIMIT 1')).scalar_one()
    material=c.execute(text('SELECT ma_nguyen_lieu FROM nguyen_lieu ORDER BY ma_nguyen_lieu LIMIT 1')).scalar_one()
    print(json.dumps([supplier,material]))
'''))
    root = 'http://127.0.0.1:8000/api/giao-nguyen-lieu/lich-su/excel/'

    def request(endpoint, data=None, content_type=None):
        headers = {'Authorization': 'Bearer ' + token}
        if content_type:
            headers['Content-Type'] = content_type
        # Use container loopback so a host-native service cannot intercept ports.
        encoded = base64.b64encode(data).decode() if data is not None else None
        config = repr((root + endpoint, encoded, headers))
        output = probe('''
import base64, json
from urllib.request import Request, urlopen
from urllib.error import HTTPError
url, encoded, headers = ''' + config + '''
try:
    with urlopen(Request(url, data=base64.b64decode(encoded) if encoded is not None else None, headers=headers), timeout=60) as response:
        print(json.dumps([response.status,base64.b64encode(response.read()).decode()]))
except HTTPError as error:
    print(json.dumps([error.code,base64.b64encode(error.read()).decode()]))
''')
        status, encoded = json.loads(output)
        return status, base64.b64decode(encoded)

    status, template = request('template')
    assert status == 200
    report['template_status'] = status
    prefix = 'PREVIEW_' + uuid4().hex[:12]
    report['live_cases'] = {}
    for case in ('seven', 'seven_formatted', 'seven_invalid'):
        book = load_workbook(BytesIO(template))
        sheet = book['LichSuGiaoHang']
        for index in range(7):
            sheet.append([prefix + str(index), sample[0], 'DOT1', '2026-01-01', '2026-01-03',
                          '2026-01-02', sample[1], 100, 100, 100, 0, 100, True, None, None])
        if case == 'seven_formatted':
            sheet['P10050'].font = Font(bold=True)
        if case == 'seven_invalid':
            sheet['D2'] = '02/01/2026'
            sheet['H3'] = 0
            sheet['I4'] = 'not a number'
            sheet['I5'] = -1
            sheet['I6'] = 1.234
            sheet['M7'] = 'yes'
            sheet['I8'] = '=100'
        stream = BytesIO()
        book.save(stream)
        content = stream.getvalue()
        (OUT / (case + '.xlsx')).write_bytes(content)
        boundary = 'DeliveryPreview' + uuid4().hex
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{case}.xlsx"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n').encode() + content + f'\r\n--{boundary}--\r\n'.encode()
        status, raw = request('preview', body, 'multipart/form-data; boundary=' + boundary)
        response = json.loads(raw)
        report['live_cases'][case] = {'http_status': status, 'response': response}
        print(case, status, json.dumps(response, ensure_ascii=False), flush=True)
        assert status == 200 and response['total_rows'] == 7 and response['imported'] == 0
        assert response['valid'] == (case != 'seven_invalid')
        if case == 'seven_invalid':
            assert {e['row'] for e in response['errors']} == set(range(2, 9))
            for coordinate in ('D2', 'H3', 'I4', 'I5', 'I6', 'M7', 'I8'):
                assert any(coordinate in e['message'] for e in response['errors'])
    report['after'] = json.loads(probe(SNAPSHOT))
    report['changed_tables'] = [name for name in set(report['before']) | set(report['after'])
                                if report['before'].get(name) != report['after'].get(name)]
    report['database_unchanged'] = not report['changed_tables']
    (OUT / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print('API tests:', report['api_tests'], 'Changed tables:', report['changed_tables'])
    assert report['database_unchanged']


if __name__ == '__main__':
    main()
