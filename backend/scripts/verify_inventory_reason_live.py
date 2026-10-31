"""Verify the real browser form without committing an inventory adjustment."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from backup_inventory_migration_state import command, fingerprints, ROOT


def main():
    before = fingerprints("milano_coffee")
    code = """
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from src.core.database import engine
from src.core.security import create_access_token
from src.models.user_model import User
from src.services.phan_quyen_service import PhanQuyenService
with Session(engine) as db:
    db.execute(text('SET TRANSACTION READ ONLY'))
    for user in db.scalars(select(User).where(User.trang_thai=='HOAT_DONG').order_by(User.ma_nguoi_dung)):
        selected={(p.chuc_nang,p.thao_tac) for p in PhanQuyenService().get_my_permissions(db=db,current_user=user).chi_tiet}
        if ('ton_kho_nguyen_lieu','SUA') in selected and ('ton_kho_nguyen_lieu','XEM') in selected:
            print(create_access_token(user.ma_nguoi_dung,user.vai_tro))
            break
    else:
        raise RuntimeError('No active inventory editor available for live verification')
"""
    token = command(["exec", "milano_backend", "python", "-c", code])
    env = dict(os.environ, MILANO_LIVE_TEST_TOKEN=token)
    npx = shutil.which("npx.cmd") or shutil.which("npx")
    if not npx:
        raise RuntimeError("npx is unavailable")
    result = subprocess.run([npx, "playwright", "test", "--config", "playwright.live.config.ts"], cwd=ROOT / "frontend", env=env)
    env.pop("MILANO_LIVE_TEST_TOKEN", None)
    after = fingerprints("milano_coffee")
    verification = {"test_exit_code": result.returncode, "business_before": before, "business_after": after, "business_unchanged": before == after}
    report = ROOT / "reports/inventory-reason-fix/live-verification.json"
    report.parent.mkdir(parents=True, exist_ok=True)
    report.write_text(json.dumps(verification, indent=2), encoding="utf-8")
    print(json.dumps({"live_verification": str(report), "business_unchanged": before == after}))
    return result.returncode if before == after else 1


if __name__ == "__main__":
    sys.exit(main())
