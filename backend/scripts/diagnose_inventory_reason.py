"""Read-only live diagnosis; run inside the backend container, never print tokens."""
import json
from pathlib import Path
from hashlib import sha256
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from sqlalchemy import text, select
from src.core.database import engine
from src.models.user_model import User
from src.services.phan_quyen_service import PhanQuyenService
from src.core.security import create_access_token


def show(label, value):
    print(json.dumps({label: value}, ensure_ascii=True, default=str), flush=True)


def request(path, token, payload=None):
    headers = {"Authorization": "Bearer " + token, "Origin": "http://localhost:5173"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    req = Request("http://127.0.0.1:8000/api" + path, headers=headers,
                  data=json.dumps(payload).encode() if payload is not None else None,
                  method="PUT" if payload is not None else "GET")
    try:
        response = urlopen(req, timeout=20)
    except HTTPError as exc:
        response = exc
    body = response.read().decode()
    try:
        body = json.loads(body)
    except ValueError:
        body = body[:500]
    show("http", {"method": req.method, "path": path, "status": response.status,
                  "cors": response.headers.get("Access-Control-Allow-Origin"), "body": body})


with engine.connect() as connection:
    with connection.begin():
        connection.execute(text("SET TRANSACTION READ ONLY"))
        show("database", dict(connection.execute(text("SELECT current_database() AS name, current_user AS db_user, inet_server_addr() AS address, inet_server_port() AS port")).mappings().one()))
        tables = connection.execute(text("SELECT tablename FROM pg_tables WHERE schemaname=current_schema() ORDER BY tablename")).scalars().all()
        show("inventory_tables", [t for t in tables if t in ("ton_kho_nguyen_lieu", "giao_dich_ton_kho", "giu_nguyen_lieu_san_xuat", "phieu_xuat_nguyen_lieu", "schema_migrations")])
        if "schema_migrations" in tables:
            show("migrations", connection.execute(text("SELECT * FROM schema_migrations ORDER BY 1")).mappings().all())
        show("reason_constraints", connection.execute(text("SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='ly_do_chuc_nang'::regclass AND contype='c'")).mappings().all())
        show("stock_reasons", connection.execute(text("SELECT l.id,l.ma_ly_do,l.ten_ly_do,l.trang_thai FROM ly_do l JOIN ly_do_chuc_nang f ON f.ly_do_id=l.id WHERE f.chuc_nang='DIEU_CHINH_TON_KHO'")).mappings().all())
        show("excelsa", connection.execute(text("SELECT t.* FROM ton_kho_nguyen_lieu t JOIN nguyen_lieu n USING(ma_nguyen_lieu) WHERE lower(n.ten_nguyen_lieu) LIKE '%excelsa%' ORDER BY ngay_ghi_nhan DESC LIMIT 2")).mappings().all())

for module in ("src/routes/ly_do_routes.py", "src/services/stock_schema_service.py"):
    path = Path(module)
    show("runtime_file", {"path": module, "exists": path.exists(), "sha256": sha256(path.read_bytes()).hexdigest() if path.exists() else None})

from sqlalchemy.orm import Session
with Session(engine) as db:
    db.execute(text("SET TRANSACTION READ ONLY"))
    user = None
    for candidate in db.scalars(select(User).where(User.trang_thai == "HOAT_DONG").order_by(User.ma_nguoi_dung)):
        selected = {(p.chuc_nang, p.thao_tac) for p in PhanQuyenService().get_my_permissions(db=db, current_user=candidate).chi_tiet}
        if ("ton_kho_nguyen_lieu", "SUA") in selected:
            user = candidate
            break
    if user is None:
        show("api_probe", "No active inventory editor; cannot probe authenticated endpoint.")
    else:
        show("api_probe_user", user.ma_nguoi_dung)
        token = create_access_token(user.ma_nguoi_dung, user.vai_tro)
        request("/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO", token)
        row = db.execute(text("SELECT t.* FROM ton_kho_nguyen_lieu t JOIN nguyen_lieu n USING(ma_nguyen_lieu) WHERE lower(n.ten_nguyen_lieu) LIKE '%excelsa%' ORDER BY ngay_ghi_nhan DESC LIMIT 1")).mappings().first()
        if row:
            # Invalid schema prevents execution: reproduces empty-reason validation without writing stock.
            payload = {k: str(row[k]) for k in ("ton_kho_thuc_te", "ton_kho_an_toan", "ton_kho_toi_da", "trang_thai")}
            payload["ly_do_id"] = ""
            request(f'/ton-kho-nguyen-lieu/{row["ma_nguyen_lieu"]}/{row["ngay_ghi_nhan"]}', token, payload)
    db.rollback()
