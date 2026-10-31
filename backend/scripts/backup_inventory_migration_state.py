"""Verify the Docker database, back it up, then reconcile an already-complete upgrade.

No DDL is replayed. If any inventory upgrade effect is missing, stop for review.
Run from the repo root: python backend/scripts/backup_inventory_migration_state.py --expected-database milano_coffee --record-completed
"""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[2]
WINDOWS_DOCKER = Path("C:/Program Files/Docker/Docker/resources/bin/docker.exe")
DOCKER = str(WINDOWS_DOCKER) if WINDOWS_DOCKER.exists() else shutil.which("docker")
VERSION = "20261028_inventory_ledger"
TABLES = ("nguyen_lieu", "ton_kho_nguyen_lieu", "ke_hoach_san_xuat", "don_mua_nguyen_lieu", "chi_tiet_don_mua",
          "giao_dich_ton_kho", "giu_nguyen_lieu_san_xuat", "phieu_xuat_nguyen_lieu")


def command(args, input_text=None):
    result = subprocess.run([DOCKER, *args], input=input_text, text=True, encoding="utf-8", capture_output=True, timeout=120)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return result.stdout.strip()


def sql(database, statement):
    return command(["exec", "-i", "milano_postgres", "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", database], statement)


def fingerprints(database):
    return {table: sql(database, 'BEGIN READ ONLY; SELECT count(*), md5(coalesce(string_agg(row_to_json(t)::text, chr(10) ORDER BY row_to_json(t)::text),\'\')) FROM public."' + table + '" t; ROLLBACK;') for table in TABLES}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected-database", required=True)
    parser.add_argument("--record-completed", action="store_true")
    args = parser.parse_args()
    database = args.expected_database
    identity = json.loads(sql(database, "BEGIN READ ONLY; SELECT json_build_object('database',current_database(),'user',current_user,'cluster',system_identifier::text,'port',current_setting('port')::int) FROM pg_control_system(); ROLLBACK;"))
    # Get the backend's identity as well, so a host-native PostgreSQL with the same name cannot be selected.
    probe = "import json; from sqlalchemy import text; from src.core.database import engine; c=engine.connect(); print(json.dumps(dict(c.execute(text(\"SELECT current_database() AS database, system_identifier::text AS cluster, current_setting('port')::int AS port FROM pg_control_system()\")).mappings().one())))"
    backend_identity = json.loads(command(["exec", "milano_backend", "python", "-c", probe]))
    if any(identity[key] != backend_identity[key] for key in ("database", "cluster", "port")) or identity["database"] != database:
        raise RuntimeError("Backend/database identity mismatch. Nothing changed.")
    # The prior startup upgraded these structures without recording a migration version.
    readiness = json.loads(sql(database, """BEGIN READ ONLY;
    SELECT json_build_object(
      'tables', (SELECT count(*)=3 FROM pg_tables WHERE schemaname='public' AND tablename IN ('giao_dich_ton_kho','giu_nguyen_lieu_san_xuat','phieu_xuat_nguyen_lieu')),
      'movement_columns', (SELECT count(*)=14 FROM information_schema.columns WHERE table_schema='public' AND table_name='giao_dich_ton_kho' AND column_name IN ('id','ma_nguyen_lieu','thoi_gian','ngay_kiem_ke','loai','so_luong','ton_truoc','ton_sau','giu_truoc','giu_sau','tham_chieu','nguoi_thuc_hien','ly_do','ghi_chu')),
      'reservation_columns', (SELECT count(*)=7 FROM information_schema.columns WHERE table_schema='public' AND table_name='giu_nguyen_lieu_san_xuat' AND column_name IN ('ma_ke_hoach','ma_nguyen_lieu','ma_cong_thuc','so_luong_ke_hoach','so_luong_giu','so_luong_xuat','da_huy')),
      'operation_columns', (SELECT count(*)=3 FROM information_schema.columns WHERE table_schema='public' AND table_name='phieu_xuat_nguyen_lieu' AND column_name IN ('id','ma_ke_hoach','payload')),
      'reason_constraint', EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='ly_do_chuc_nang'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%DIEU_CHINH_TON_KHO%'),
      'reason_links', (SELECT count(*)=3 FROM ly_do_chuc_nang WHERE chuc_nang='DIEU_CHINH_TON_KHO' AND ly_do_id IN ('LD_TK_DAU_KY','LD_TK_KIEM_KE','LD_TK_KHAC')),
      'plan_trigger', EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='ke_hoach_san_xuat'::regclass AND tgname='protect_reserved_production_plan_trigger' AND tgenabled <> 'D'),
      'available_generated', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='ton_kho_nguyen_lieu' AND column_name='ton_kho_kha_dung' AND is_generated='ALWAYS'));
    ROLLBACK;"""))
    if not all(readiness.values()):
        raise RuntimeError("Inventory schema needs review; no marker recorded: " + json.dumps(readiness))
    recorded = sql(database, "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version='20261028_inventory_ledger');") == "t"
    print(json.dumps({"database": identity, "readiness": readiness, "already_recorded": recorded}))
    if not args.record_completed or recorded:
        return
    before = fingerprints(database)
    folder = ROOT / "reports/inventory-reason-fix" / datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    folder.mkdir(parents=True, exist_ok=False)
    backup = folder / "milano_coffee_before.dump"
    with backup.open("wb") as stream:
        dump = subprocess.run([DOCKER, "exec", "milano_postgres", "pg_dump", "-U", "postgres", "-d", database, "-Fc"], stdout=stream, stderr=subprocess.PIPE, timeout=120)
    if dump.returncode or backup.stat().st_size == 0:
        raise RuntimeError("Database backup failed; migration marker not changed.")
    with backup.open("rb") as stream:
        verify = subprocess.run([DOCKER, "exec", "-i", "milano_postgres", "pg_restore", "--list"], stdin=stream, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if verify.returncode:
        raise RuntimeError("Backup archive is unreadable; migration marker not changed.")
    if fingerprints(database) != before:
        raise RuntimeError("Business data changed during backup. Stop for review.")
    # Only acknowledge the verified existing schema; do not replay its DDL/seeds.
    sql(database, "BEGIN; SELECT pg_advisory_xact_lock(20261028,1); INSERT INTO schema_migrations(version) VALUES ('20261028_inventory_ledger') ON CONFLICT DO NOTHING; COMMIT;")
    after = fingerprints(database)
    report = {"database": identity, "backup": str(backup), "backup_bytes": backup.stat().st_size,
              "backup_sha256": sha256(backup.read_bytes()).hexdigest(), "migration": VERSION,
              "action": "Recorded previously completed startup migration; no DDL or seed replayed",
              "business_before": before, "business_after": after, "business_unchanged": before == after}
    (folder / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report))
    if before != after:
        raise RuntimeError("Business data changed; inspect verification report.")


if __name__ == "__main__":
    main()
