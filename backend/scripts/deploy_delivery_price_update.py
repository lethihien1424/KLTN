"""Back up and deploy the receipt price editor; never apply workbook prices."""
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import subprocess

from apply_delivery_prices_migration import identity
from backup_inventory_migration_state import ROOT, DOCKER, command
from verify_delivery_preview_live import probe, SNAPSHOT

OUT = ROOT / 'reports/delivery-price-updates/deployment'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    report = {'database': identity(), 'before': json.loads(probe(SNAPSHOT)), 'created_at_utc': datetime.now(timezone.utc).isoformat()}
    report['previous_images'] = {name: command(['inspect', name, '--format', '{{.Image}}']) for name in ('milano_backend', 'milano_frontend')}
    backup = OUT / ('milano_coffee_before_' + datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S') + '.dump')
    with backup.open('wb') as output:
        result = subprocess.run([DOCKER,'exec','milano_postgres','pg_dump','-U','postgres','-d','milano_coffee','-Fc'], stdout=output, stderr=subprocess.PIPE, timeout=120)
    if result.returncode or not backup.stat().st_size:
        raise RuntimeError('Backup failed. Deployment stopped.')
    with backup.open('rb') as source:
        checked = subprocess.run([DOCKER,'exec','-i','milano_postgres','pg_restore','--list'], stdin=source, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if checked.returncode:
        raise RuntimeError('Backup archive verification failed. Deployment stopped.')
    report.update(backup=str(backup), backup_sha256=sha256(backup.read_bytes()).hexdigest(), backup_bytes=backup.stat().st_size, backup_verified=True)
    manifest=OUT/'verification.json'; manifest.write_text(json.dumps(report,indent=2),encoding='utf-8')
    assert json.loads(probe(SNAPSHOT)) == report['before'], 'Database changed during backup'
    print('Verified backup. Building application containers only.', flush=True)
    result = subprocess.run([DOCKER,'compose','up','-d','--build','--no-deps','backend','frontend'], cwd=ROOT, timeout=600)
    if result.returncode:
        raise RuntimeError('Application deployment failed; database backup retained.')
    report['after'] = json.loads(probe(SNAPSHOT))
    report['changed_tables'] = sorted(name for name in set(report['before'])|set(report['after']) if report['before'].get(name) != report['after'].get(name))
    report['current_images'] = {name:command(['inspect',name,'--format','{{.Image}}']) for name in ('milano_backend','milano_frontend')}
    manifest.write_text(json.dumps(report,indent=2),encoding='utf-8')
    assert not report['changed_tables'], report['changed_tables']
    print('Deployed. Database fingerprints unchanged. No workbook prices applied.',flush=True)


if __name__=='__main__':
    main()
