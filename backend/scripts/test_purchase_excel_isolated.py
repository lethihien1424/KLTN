"""Run workspace code in Docker /tmp, never restart/migrate the running app.

Tests use PostgreSQL transaction-local schemas; compare every public table before/after.
"""
import json
from pathlib import Path
import subprocess
import sys
from verify_delivery_preview_live import DOCKER, probe, SNAPSHOT

ROOT = Path(__file__).resolve().parents[2]


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    output = ROOT / "reports/purchase-excel"; output.mkdir(parents=True, exist_ok=True)
    before = json.loads(probe(SNAPSHOT))
    files = {str(p.relative_to(ROOT)).replace("\\", "/"): p.read_text(encoding="utf-8")
             for folder in ["backend/src", "backend/tests"] for p in (ROOT / folder).rglob("*.py")}
    runner = '''
import sys, pathlib, tempfile, unittest, json
sys.path.insert(0, '/tmp/delivery-preview-test-deps')
sys.path.insert(0, '/tmp/milano-purchase-excel-test-deps')
files=json.loads(sys.stdin.read())
with tempfile.TemporaryDirectory(prefix='purchase-excel-') as temp:
    for name,content in files.items():
        path=pathlib.Path(temp,name); path.parent.mkdir(parents=True, exist_ok=True); path.write_text(content,encoding='utf-8')
    sys.path.insert(0,str(pathlib.Path(temp,'backend')))
    sys.path.insert(0,str(pathlib.Path(temp,'backend/tests')))
    result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromName('test_purchase_excel'))
    print(json.dumps({'run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':len(result.skipped)}))
    sys.exit(0 if result.wasSuccessful() else 1)
'''
    result = subprocess.run([DOCKER, "exec", "-i", "milano_backend", "python", "-c", runner],
                            input=json.dumps(files), text=True, encoding="utf-8", capture_output=True, timeout=240)
    (output / "backend-tests.txt").write_text(result.stdout + result.stderr, encoding="utf-8")
    print(result.stderr); print(result.stdout)
    after = json.loads(probe(SNAPSHOT))
    changed = [name for name in set(before) | set(after) if before.get(name) != after.get(name)]
    (output / "data-preservation.json").write_text(json.dumps({"before": before, "after": after,
        "changed_public_tables": changed, "test_exit_code": result.returncode,
        "live_migration_applied": False, "running_application_restarted": False}, indent=2), encoding="utf-8")
    assert not changed, changed
    assert result.returncode == 0


if __name__ == "__main__": main()
