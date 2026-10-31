"""Run workspace code in /tmp in Docker, using rollback-only PostgreSQL schemas.

Does not replace deployed code, run application startup, or migrate public tables.
"""
import json
import base64
from pathlib import Path
import subprocess
import sys

from verify_delivery_preview_live import DOCKER, probe, SNAPSHOT

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/delivery-price-updates'


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    OUT.mkdir(parents=True, exist_ok=True)
    before = json.loads(probe(SNAPSHOT))
    files = {}
    for folder, pattern in [('backend/src', '*.py'), ('backend/reason_tests', '*.py'), ('database/migrations', '*.sql')]:
        for path in (ROOT / folder).rglob(pattern):
            files[str(path.relative_to(ROOT)).replace('\\', '/')] = path.read_text(encoding='utf-8')
    fixture = ROOT / 'test-fixtures/Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx'
    files[str(fixture.relative_to(ROOT)).replace('\\', '/')] = base64.b64encode(fixture.read_bytes()).decode()
    runner = '''
import os, sys, tempfile, pathlib, json, unittest, base64
os.environ['INVENTORY_TEST_POSTGRES'] = '1'
sys.path.insert(0, '/tmp/delivery-preview-test-deps')
files = json.loads(sys.stdin.read())
with tempfile.TemporaryDirectory(prefix='delivery-prices-') as temp:
    for name, content in files.items():
        path=pathlib.Path(temp,name); path.parent.mkdir(parents=True, exist_ok=True)
        if name.endswith('.xlsx'): path.write_bytes(base64.b64decode(content))
        else: path.write_text(content, encoding='utf-8')
    sys.path.insert(0, str(pathlib.Path(temp,'backend')))
    sys.path.insert(0, str(pathlib.Path(temp,'backend/reason_tests')))
    suite=unittest.defaultTestLoader.loadTestsFromNames(['test_delivery_excel_parser','test_delivery_history','test_delivery','test_delivery_prices','test_inventory','test_delivery_price_update'])
    result=unittest.TextTestRunner(verbosity=2).run(suite)
    print(json.dumps({'run':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors)-len(result.skipped),'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped)}))
    sys.exit(0 if result.wasSuccessful() else 1)
'''
    result = subprocess.run([DOCKER, 'exec', '-i', 'milano_backend', 'python', '-c', runner], input=json.dumps(files),
                            text=True, encoding='utf-8', capture_output=True, timeout=240)
    (OUT / 'backend-tests.txt').write_text(result.stdout + result.stderr, encoding='utf-8')
    print(result.stderr)
    print(result.stdout)
    after = json.loads(probe(SNAPSHOT))
    report = {'before': before, 'after': after, 'tests': json.loads(result.stdout.splitlines()[-1]) if result.stdout else None,
              'changed_tables': sorted(name for name in set(before) | set(after) if before.get(name) != after.get(name)),
              'public_migration_applied_by_tests': False, 'deployed_code_changed': False,
              'public_price_migration_present': probe("from sqlalchemy import text; from src.core.database import engine; c=engine.connect(); print(c.execute(text(\"SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261030_delivery_prices')\")).scalar_one())") == 'True'}
    (OUT / 'verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    assert not report['changed_tables'], report['changed_tables']
    assert result.returncode == 0


if __name__ == '__main__':
    main()
