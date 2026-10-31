"""Read-only inspection. Run from backend: python scripts/audit_inventory.py."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import text
from src.core.database import engine

with engine.connect() as connection:
    with connection.begin():
        connection.execute(text("SET TRANSACTION READ ONLY"))
        for name, query in {
            "tables": "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND (table_name LIKE '%kho%' OR table_name LIKE '%san_xuat%' OR table_name LIKE '%giao_dich%')",
            "latest_stocks": "SELECT DISTINCT ON (ma_nguyen_lieu) ma_nguyen_lieu,ngay_ghi_nhan,ton_kho_thuc_te,so_luong_book,ton_kho_kha_dung FROM ton_kho_nguyen_lieu ORDER BY ma_nguyen_lieu,ngay_ghi_nhan DESC",
            "plan_states": "SELECT trang_thai_san_xuat,count(*) FROM ke_hoach_san_xuat GROUP BY 1",
            "stock_constraints": "SELECT conname,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='ton_kho_nguyen_lieu'::regclass",
        }.items():
            print(name, connection.execute(text(query)).all())
