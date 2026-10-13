"""Clone schema only, run rollback tests, then remove only our disposable DB.

Run from backend: .venv/Scripts/python.exe scripts/run_rbac_postgres_tests.py
Requires the existing milano_postgres container and backend image.
"""
import json
import shutil
import subprocess
import sys
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DOCKER = shutil.which('docker.exe' if sys.platform == 'win32' else 'docker') or r'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
CONTAINER = 'milano_postgres'
SOURCE = 'milano_coffee'
TARGET = 'milano_rbac_test_' + uuid.uuid4().hex[:12]


def docker(*args, input_text=None):
    result = subprocess.run([DOCKER, *args], input=input_text, text=True, encoding='utf-8', capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout


def psql(database, sql):
    return docker('exec', '-i', CONTAINER, 'psql', '-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', database, input_text=sql)


def business_fingerprint():
    tables = psql(SOURCE, "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;").splitlines()
    return {
        table: psql(SOURCE, 'SELECT count(*), md5(coalesce(string_agg(row_to_json(t)::text, chr(10) ORDER BY row_to_json(t)::text),\'\')) FROM public."' + table.replace('"', '""') + '" t;')
        for table in tables
    }


def main():
    if not TARGET.startswith('milano_rbac_test_') or TARGET == SOURCE:
        raise RuntimeError('Invalid disposable DB name.')
    before = business_fingerprint()
    created = False
    try:
        psql('postgres', f'CREATE DATABASE "{TARGET}";')
        created = True
        schema = docker('exec', CONTAINER, 'pg_dump', '--schema-only', '--no-owner', '--no-privileges', '-U', 'postgres', SOURCE)
        psql(TARGET, schema)
        prerequisites = [ROOT / 'database/init/03_add_user_contact_fields.sql'] + sorted((ROOT / 'database/init/migrations').glob('202609*.sql'))
        for file in prerequisites:
            psql(TARGET, file.read_text(encoding='utf-8'))
        migration = (ROOT / 'database/init/migrations/20261004_dynamic_rbac.sql').read_text(encoding='utf-8')
        psql(TARGET, migration)
        psql(TARGET, migration)
        print('Migration applied twice to disposable DB; source data not copied.', flush=True)
        metadata = json.loads(docker('inspect', CONTAINER))[0]
        network = next(iter(metadata['NetworkSettings']['Networks']))
        image = json.loads(docker('inspect', 'milano_backend'))[0]['Config']['Image']
        code = "import subprocess,sys; subprocess.run([sys.executable,'-m','pip','install','-q','httpx'],check=True); sys.exit(subprocess.call([sys.executable,'-m','unittest','discover','-s','tests','-v']))"
        result = subprocess.run([
            DOCKER, 'run', '--rm', '--network', network,
            '--env-file', str(ROOT / 'backend/.env'),
            '-e', f'DB_HOST={CONTAINER}', '-e', f'DB_NAME={TARGET}', '-e', 'DATABASE_URL=',
            '-e', 'RBAC_TEST_POSTGRES=1', '-e', 'PYTHONDONTWRITEBYTECODE=1',
            '-v', str(ROOT) + ':/workspace:ro', '-w', '/workspace/backend',
            image, 'python', '-c', code,
        ])
        return result.returncode
    finally:
        if created:
            # TARGET was generated above and created by this invocation only.
            psql('postgres', f'DROP DATABASE "{TARGET}" WITH (FORCE);')
        if business_fingerprint() != before:
            raise RuntimeError('Source database fingerprint changed during tests.')
        print('Source database rows unchanged; disposable database removed.', flush=True)


if __name__ == '__main__':
    sys.exit(main())
