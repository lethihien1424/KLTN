"""Back up and verify the exact Docker database before additive price migration."""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
import subprocess

from backup_inventory_migration_state import ROOT, DOCKER, command, sql
from verify_delivery_preview_live import probe

DATABASE = 'milano_coffee'
VERSION = '20261030_delivery_prices'
TABLE = 'chi_tiet_phieu_nhan_nguyen_lieu'


def identity():
    statement = "SELECT json_build_object('database',current_database(),'cluster',system_identifier::text) FROM pg_control_system()"
    database = json.loads(sql(DATABASE, 'BEGIN READ ONLY; ' + statement + '; ROLLBACK;'))
    backend = json.loads(probe('''
import json
from sqlalchemy import text
from src.core.database import engine
with engine.connect() as c:
    c.execute(text('SET TRANSACTION READ ONLY'))
    print(json.dumps(dict(c.execute(text("SELECT current_database() AS database,system_identifier::text AS cluster FROM pg_control_system()")).mappings().one())))
'''))
    if database != backend or database['database'] != DATABASE:
        raise RuntimeError('Backend/PostgreSQL identity mismatch. Nothing applied.')
    return database


def snapshot():
    # New NULL columns change row JSON even though old data is untouched. Exclude
    # only these new fields on the receipt-line table when comparing old data.
    return json.loads(probe('''
import json
from sqlalchemy import text
from src.core.database import engine
with engine.connect() as c:
    c.execute(text('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY'))
    tables=list(c.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'schema_migrations' ORDER BY tablename")).scalars())
    result={}
    for name in tables:
        quoted=c.dialect.identifier_preparer.quote(name)
        expression="(to_jsonb(t) - ARRAY['don_gia_mua','don_vi_don_gia','thanh_tien'])::text" if name=='chi_tiet_phieu_nhan_nguyen_lieu' else 'to_jsonb(t)::text'
        result[name]=list(c.execute(text("SELECT count(*),md5(coalesce(string_agg("+expression+",chr(10) ORDER BY "+expression+"),'')) FROM public."+quoted+" t")).one())
    print(json.dumps(result))
'''))


def columns():
    return json.loads(sql(DATABASE, """BEGIN READ ONLY;
SELECT json_agg(t) FROM (
 SELECT column_name,data_type,numeric_precision,numeric_scale,character_maximum_length,is_nullable,is_generated,generation_expression
 FROM information_schema.columns WHERE table_schema='public' AND table_name='chi_tiet_phieu_nhan_nguyen_lieu'
 ORDER BY ordinal_position
) t; ROLLBACK;"""))


def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--apply', action='store_true'); args=parser.parse_args()
    verified_identity=identity()
    before_columns=columns()
    applied=sql(DATABASE, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261030_delivery_prices')") == 't'
    print(json.dumps({'database':verified_identity,'migration_recorded':applied,'columns':[c['column_name'] for c in before_columns]}), flush=True)
    if not args.apply:
        return
    folder=ROOT/'reports/delivery-prices-migration'/datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
    folder.mkdir(parents=True,exist_ok=False)
    report={'database':verified_identity,'before_columns':before_columns,'before':snapshot(),'migration':VERSION,'previously_recorded':applied}
    report_path=folder/'verification.json'
    def save():
        report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    save()
    backup=folder/'milano_coffee_before.dump'
    with backup.open('wb') as output:
        result=subprocess.run([DOCKER,'exec','milano_postgres','pg_dump','-U','postgres','-d',DATABASE,'-Fc'],stdout=output,stderr=subprocess.PIPE,timeout=120)
    if result.returncode or not backup.stat().st_size:
        raise RuntimeError('Backup failed. No migration applied.')
    with backup.open('rb') as source:
        archive=subprocess.run([DOCKER,'exec','-i','milano_postgres','pg_restore','--list'],stdin=source,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=120)
    if archive.returncode:
        raise RuntimeError('Backup archive verification failed. No migration applied.')
    (folder/'backup-archive-list.txt').write_bytes(archive.stdout)
    report.update(backup=str(backup),backup_bytes=backup.stat().st_size,backup_sha256=sha256(backup.read_bytes()).hexdigest(),backup_archive_verified=True)
    save()
    if identity()!=verified_identity or snapshot()!=report['before']:
        raise RuntimeError('Identity or business data changed during backup. No migration applied.')
    migration=ROOT/'database/migrations'/f'{VERSION}.sql'
    report['migration_sha256']=sha256(migration.read_bytes()).hexdigest()
    save()
    result=sql(DATABASE,'SET search_path TO public;\n'+migration.read_text(encoding='utf-8'))
    (folder/'migration-output.txt').write_text(result,encoding='utf-8')
    report['after_columns']=columns()
    report['after']=snapshot()
    report['changed_business_tables']=sorted(name for name in set(report['before'])|set(report['after']) if report['before'].get(name)!=report['after'].get(name))
    report['migration_recorded']=sql(DATABASE,"SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261030_delivery_prices')")=='t'
    report['null_price_rows']=int(sql(DATABASE,"SELECT count(*) FROM public.chi_tiet_phieu_nhan_nguyen_lieu WHERE don_gia_mua IS NULL AND don_vi_don_gia IS NULL AND thanh_tien IS NULL"))
    description=command(['exec','milano_postgres','psql','-X','-U','postgres','-d',DATABASE,'-c',r'\d+ public.chi_tiet_phieu_nhan_nguyen_lieu'])
    (folder/'table-description.txt').write_text(description,encoding='utf-8')
    save()
    found={c['column_name']:c for c in report['after_columns']}
    assert (found['don_gia_mua']['numeric_precision'],found['don_gia_mua']['numeric_scale'])==(15,2)
    assert found['don_vi_don_gia']['character_maximum_length']==20
    assert (found['thanh_tien']['numeric_precision'],found['thanh_tien']['numeric_scale'],found['thanh_tien']['is_generated'])==(30,4,'ALWAYS')
    assert all(found[name]['is_nullable']=='YES' for name in ('don_gia_mua','don_vi_don_gia','thanh_tien'))
    assert not report['changed_business_tables'], report['changed_business_tables']
    assert report['migration_recorded']
    if not any(c['column_name']=='don_gia_mua' for c in before_columns):
        assert report['null_price_rows']==report['before'][TABLE][0]
    print(json.dumps({'report':str(report_path),'backup':str(backup),'receipt_rows_before_after':[report['before']['phieu_nhan_nguyen_lieu'][0],report['after']['phieu_nhan_nguyen_lieu'][0]],'line_rows_before_after':[report['before'][TABLE][0],report['after'][TABLE][0]],'changed_business_tables':report['changed_business_tables'],'null_price_rows':report['null_price_rows']}),flush=True)


if __name__=='__main__':
    main()
