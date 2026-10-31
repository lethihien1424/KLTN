"""Read-only HTTP/browser verification; rejected imports cannot change business data."""
import argparse
from io import BytesIO
import json
import os
import shutil
import subprocess
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import urlencode
from openpyxl import load_workbook
from backup_inventory_migration_state import command, sql, ROOT

REPORT = ROOT / "reports/supply-excel/live-verification.json"
COLUMNS = ["ma_ncc", "ma_nguyen_lieu", "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat",
           "lead_time_ngay", "ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du"]


def fingerprints():
    names = json.loads(sql("milano_coffee", "SELECT json_agg(tablename ORDER BY tablename) FROM pg_tables WHERE schemaname='public';"))
    return {name: sql("milano_coffee", 'BEGIN READ ONLY; SELECT count(*), md5(coalesce(string_agg(row_to_json(t)::text, chr(10) ORDER BY row_to_json(t)::text),\'\')) FROM public."' + name + '" t; ROLLBACK;') for name in names}


def reconcile_deployment(report, current):
    original = report["before_deploy"]
    changed = sorted(name for name in set(original) | set(current) if original.get(name) != current.get(name))
    report["deployment_unchanged"] = not changed
    report["deployment_changed_tables"] = changed
    report["deployment_business_unchanged"] = not changed
    if changed != ["nhat_ky_hoat_dong"]: return
    delta = int(current[changed[0]].split("|")[0]) - int(original[changed[0]].split("|")[0])
    if not 0 < delta <= 10: return
    rows = json.loads(sql("milano_coffee", f"SELECT json_agg(t) FROM (SELECT ma_nhat_ky,hanh_dong,ket_qua,thoi_gian FROM nhat_ky_hoat_dong ORDER BY thoi_gian DESC,ma_nhat_ky DESC LIMIT {delta}) t;"))
    if not all(row["hanh_dong"] == "DANG_NHAP" for row in rows): return
    ids = ",".join("'" + row["ma_nhat_ky"].replace("'", "''") + "'" for row in rows)
    prior = sql("milano_coffee", "SELECT count(*), md5(coalesce(string_agg(row_to_json(t)::text, chr(10) ORDER BY row_to_json(t)::text),'')) FROM public.nhat_ky_hoat_dong t WHERE ma_nhat_ky NOT IN (" + ids + ");")
    # Keep the all-table mismatch visible; verify the exact previous audit rows are intact.
    report["deployment_business_unchanged"] = prior == original["nhat_ky_hoat_dong"]
    report["concurrent_login_audit_rows"] = rows


def main():
    parser = argparse.ArgumentParser(); parser.add_argument("--snapshot", action="store_true"); args = parser.parse_args()
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    if args.snapshot:
        REPORT.write_text(json.dumps({"before_deploy": fingerprints()}, indent=2), encoding="utf-8")
        print("Saved read-only fingerprints before application deployment."); return
    report = json.loads(REPORT.read_text(encoding="utf-8"))
    before = fingerprints()
    reconcile_deployment(report, before)
    # Use existing dynamic permissions; no role edits, password changes, or persisted token.
    token = command(["exec", "milano_backend", "python", "-c", """
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from src.core.database import engine
from src.core.security import create_access_token
from src.models.user_model import User
from src.services.phan_quyen_service import PhanQuyenService
with Session(engine) as db:
    db.execute(text('SET TRANSACTION READ ONLY'))
    for user in db.scalars(select(User).where(User.trang_thai=='HOAT_DONG').order_by(User.ma_nguoi_dung)):
        permissions={(p.chuc_nang,p.thao_tac) for p in PhanQuyenService().get_my_permissions(db=db,current_user=user).chi_tiet}
        if all(('nguyen_lieu_nha_cung_cap', op) in permissions for op in ('XEM','NHAP_FILE','XUAT_EXCEL')):
            print(create_access_token(user.ma_nguoi_dung,user.vai_tro)); break
    else: raise RuntimeError('No active user with existing supply Excel permissions')
"""])

    def request(path, data=None, content_type=None):
        headers = {"Authorization": "Bearer " + token}
        if content_type: headers["Content-Type"] = content_type
        req = Request("http://127.0.0.1:8000/api" + path, data=data, headers=headers)
        try:
            with urlopen(req, timeout=60) as response: return response.status, response.read()
        except HTTPError as error: return error.code, error.read()

    prefix = "/nguyen-lieu-nha-cung-cap"
    status, raw = request(prefix); assert status == 200, f"Supply list returned HTTP {status}"
    mappings = json.loads(raw); assert mappings, "Need an existing supply mapping for read-only duplicate verification"
    sample = mappings[0]
    status, template = request(prefix + "/excel/template"); assert status == 200
    book = load_workbook(BytesIO(template)); sheet = book["CungUng"]
    assert [cell.value for cell in sheet[1]] == COLUMNS
    for filters in ({}, {"ma_ncc": sample["ma_ncc"]}, {"search": sample["ma_nguyen_lieu"]}):
        query = "?" + urlencode(filters) if filters else ""
        status, data = request(prefix + "/excel/export" + query); assert status == 200
        exported = list(load_workbook(BytesIO(data), read_only=True).active.values)
        status, raw = request(prefix + query); assert status == 200
        assert len(exported) - 1 == len(json.loads(raw))
    sheet.append([sample[key] for key in COLUMNS])
    stream = BytesIO(); book.save(stream)

    def upload(content, endpoint, confirmed=False):
        boundary = "MilanoSupplyReadOnlyVerification"
        body = (f"--{boundary}\r\nContent-Disposition: form-data; name=\"confirmed\"\r\n\r\n{str(confirmed).lower()}\r\n"
                f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"supply.xlsx\"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n").encode() + content + f"\r\n--{boundary}--\r\n".encode()
        return request(prefix + "/excel/" + endpoint, body, "multipart/form-data; boundary=" + boundary)

    status, raw = upload(stream.getvalue(), "preview"); assert status == 200
    preview = json.loads(raw); assert not preview["valid"] and preview["errors"]
    status, raw = upload(stream.getvalue(), "import", True); assert status == 422
    status, raw = upload(stream.getvalue(), "import", False); assert status == 422
    # Valid preview of an unused pair; deliberately never confirm it against live data.
    pair = json.loads(sql("milano_coffee", "SELECT row_to_json(t) FROM (SELECT n.ma_ncc, l.ma_nguyen_lieu FROM nha_cung_cap n CROSS JOIN nguyen_lieu l WHERE NOT EXISTS (SELECT 1 FROM nguyen_lieu_nha_cung_cap m WHERE m.ma_ncc=n.ma_ncc AND m.ma_nguyen_lieu=l.ma_nguyen_lieu) ORDER BY n.ma_ncc,l.ma_nguyen_lieu LIMIT 1) t;"))
    sheet.cell(2, 1, pair["ma_ncc"]); sheet.cell(2, 2, pair["ma_nguyen_lieu"])
    stream = BytesIO(); book.save(stream)
    status, raw = upload(stream.getvalue(), "preview"); assert status == 200 and json.loads(raw)["valid"]
    env = dict(os.environ, MILANO_LIVE_TEST_TOKEN=token, MILANO_LIVE_SUPPLY_SAMPLE=json.dumps(sample))
    npx = shutil.which("npx.cmd") or shutil.which("npx")
    result = subprocess.run([npx, "playwright", "test", "--config", "playwright.live.config.ts", "tests/supply-live.spec.ts"], cwd=ROOT / "frontend", env=env)
    after = fingerprints()
    report.update({"http_template_export_preview": "PASS", "http_invalid_imports": "422; no writes", "browser_exit_code": result.returncode,
                   "after_verification": after, "business_unchanged": before == after, "valid_live_import": "Not committed; covered in isolated PostgreSQL rollback tests"})
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"report": str(REPORT), "deployment_unchanged": report["deployment_unchanged"],
                      "deployment_business_unchanged": report["deployment_business_unchanged"], "business_unchanged": before == after}))
    assert result.returncode == 0 and before == after and report["deployment_business_unchanged"]


if __name__ == "__main__": main()
