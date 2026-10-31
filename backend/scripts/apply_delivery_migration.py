"""Back up the verified Docker database before this additive delivery migration."""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import re
import subprocess
from backup_inventory_migration_state import DOCKER, ROOT, command, sql


def snapshot(database, tables):
    result = {}
    for table in tables:
        if not re.fullmatch(r"[a-z_][a-z0-9_]*", table): raise RuntimeError("Unexpected table identifier")
        result[table] = sql(database, 'BEGIN READ ONLY; SELECT count(*),md5(coalesce(string_agg(row_to_json(t)::text,chr(10) ORDER BY row_to_json(t)::text),\'\')) FROM public."' + table + '" t; ROLLBACK;')
    return result


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--apply", action="store_true"); args = parser.parse_args()
    database = "milano_coffee"
    identity_query = "SELECT json_build_object('database',current_database(),'cluster',system_identifier::text) FROM pg_control_system()"
    identity = json.loads(sql(database, identity_query))
    probe = "import json; from src.core.database import engine; from sqlalchemy import text; c=engine.connect(); print(json.dumps(dict(c.execute(text('SELECT current_database() AS database,system_identifier::text AS cluster FROM pg_control_system()')).mappings().one())))"
    if json.loads(command(["exec", "milano_backend", "python", "-c", probe])) != identity:
        raise RuntimeError("Backend and Docker database identity mismatch")
    applied = sql(database, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261029_delivery_history')") == "t"
    prerequisite = sql(database, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261028_inventory_ledger')") == "t"
    print(json.dumps({"database": identity, "inventory_prerequisite": prerequisite, "delivery_migration_applied": applied}))
    if not prerequisite: raise RuntimeError("Apply/reconcile the inventory migration first")
    if applied or not args.apply: return
    tables = sql(database, "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'schema_migrations' ORDER BY tablename").splitlines()
    before = snapshot(database, tables)
    folder = ROOT / "reports/delivery-history" / datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    folder.mkdir(parents=True, exist_ok=False)
    backup = folder / "milano_before.dump"
    with backup.open("wb") as output:
        result = subprocess.run([DOCKER, "exec", "milano_postgres", "pg_dump", "-U", "postgres", "-d", database, "-Fc"], stdout=output, stderr=subprocess.PIPE, timeout=120)
    if result.returncode or backup.stat().st_size == 0: raise RuntimeError("Backup failed; migration not applied")
    with backup.open("rb") as source:
        result = subprocess.run([DOCKER, "exec", "-i", "milano_postgres", "pg_restore", "--list"], stdin=source, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if result.returncode: raise RuntimeError("Backup verification failed; migration not applied")
    if snapshot(database, tables) != before: raise RuntimeError("Business data changed during backup; review before migration")
    migration = (ROOT / "database/migrations/20261029_delivery_history.sql").read_text(encoding="utf-8")
    sql(database, migration)
    after = snapshot(database, tables)
    new_counts = {table: sql(database, 'SELECT count(*) FROM public.' + table) for table in ("phieu_nhan_nguyen_lieu", "chi_tiet_phieu_nhan_nguyen_lieu")}
    report = {"database": identity, "backup": str(backup), "backup_sha256": sha256(backup.read_bytes()).hexdigest(),
              "migration": "20261029_delivery_history", "business_before": before, "business_after": after,
              "business_unchanged": before == after, "new_table_rows": new_counts}
    (folder / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"verification": str(folder / "verification.json"), "business_unchanged": before == after, "new_table_rows": new_counts}))
    if before != after or any(value != "0" for value in new_counts.values()):
        raise RuntimeError("Post-migration data verification requires review")


if __name__ == "__main__": main()
