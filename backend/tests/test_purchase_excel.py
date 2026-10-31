"""PostgreSQL integration tests in a disposable schema, rolled back after each test."""
from datetime import timedelta
from decimal import Decimal
from io import BytesIO
from types import SimpleNamespace
import unittest
import asyncio
import httpx
from unittest.mock import patch
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from openpyxl import Workbook, load_workbook
from sqlalchemy import select, text, func
from sqlalchemy.orm import Session

import src.models
from src.core.database import Base, engine, get_db
from src.dependencies.auth_dependency import get_current_user
from src.models.user_model import User
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.chi_tiet_don_mua import ChiTietDonMua
from src.models.purchase_excel_import import PurchaseExcelImport
from src.routes.don_mua_routes import router
from src.services.phan_quyen_service import PhanQuyenService
from src.services.purchase_excel_service import PurchaseExcelService, COLUMNS, today, workbook_bytes
from src.schemas.don_mua_schema import DonMuaCreate, DonMuaTuChoiRequest, DonMuaNhanHangRequest


class TestClient:
    def __init__(self, app): self.app = app

    def request(self, method, path, **kwargs):
        async def send():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=self.app), base_url="http://test") as client:
                return await client.request(method, path, **kwargs)
        return asyncio.run(send())

    def get(self, path, **kwargs): return self.request("GET", path, **kwargs)
    def post(self, path, **kwargs): return self.request("POST", path, **kwargs)
    def close(self): pass


def row(ref="REF1", supplier="NCC1", material="NL1", quantity="2.25", unit="kg", price="3.14", delivery=None, note="Ghi chú"):
    return [ref, supplier, material, quantity, unit, price, delivery or (today() + timedelta(days=7)).isoformat(), note]


def file_bytes(rows=None):
    book = Workbook(); sheet = book.active; sheet.title = "DonMua"; sheet.append(COLUMNS)
    for values in rows if rows is not None else [row()]: sheet.append(values)
    return workbook_bytes(book)


class PurchaseExcelTests(unittest.TestCase):
    def setUp(self):
        self.connection = engine.connect()
        self.outer = self.connection.begin()
        self.schema = "test_purchase_excel_" + uuid4().hex
        self.connection.execute(text(f'CREATE SCHEMA "{self.schema}"'))
        self.connection.execute(text(f'SET LOCAL search_path TO "{self.schema}"'))
        Base.metadata.create_all(self.connection)
        for table, column, prefix in [("don_mua_nguyen_lieu", "ma_don_mua", "DM"), ("chi_tiet_don_mua", "ma_chi_tiet_don_mua", "CT")]:
            self.connection.execute(text(f"CREATE SEQUENCE {table}_test_seq"))
            self.connection.execute(text(f"ALTER TABLE {table} ALTER COLUMN {column} SET DEFAULT ('{prefix}' || nextval('{table}_test_seq'))"))
        self.db = Session(bind=self.connection, join_transaction_mode="create_savepoint", expire_on_commit=False)
        roles = Base.metadata.tables["roles"]
        self.db.execute(roles.insert().values(ma_vai_tro="CUSTOM", ten_vai_tro="Test custom"))
        self.actor = User(ma_nguoi_dung="TEST", mat_khau="unused", ho_ten="Test", vai_tro="CUSTOM", trang_thai="HOAT_DONG")
        self.db.add(self.actor)
        for code in ["NCC1", "NCC2"]:
            self.db.add(NhaCungCap(ma_ncc=code, ten_ncc=code, trang_thai="DANG_HOAT_DONG"))
        for code, unit in [("NL1", "kg"), ("NL2", "kg"), ("NL3", "g")]:
            self.db.add(NguyenLieu(ma_nguyen_lieu=code, ten_nguyen_lieu=code, don_vi_do_luong=unit, trang_thai="DANG_SU_DUNG"))
        self.db.flush()
        for supplier in ["NCC1", "NCC2"]:
            for material in ["NL1", "NL2", "NL3"]:
                self.db.add(NguyenLieuNhaCungCap(ma_nguyen_lieu_ncc=supplier + material, ma_ncc=supplier,
                    ma_nguyen_lieu=material, don_gia_nguyen_lieu=Decimal("100"), so_luong_ton_kho=100,
                    lead_time_ngay=3, ty_le_chat_luong_dat=1, ty_le_giao_dung_han=1, ty_le_giao_du=1))
        self.db.commit()
        self.service = PurchaseExcelService()
        self.app = FastAPI(); self.app.include_router(router, prefix="/api")
        self.app.dependency_overrides[get_db] = lambda: self.db
        self.app.dependency_overrides[get_current_user] = lambda: self.actor
        self.rights = {"XEM", "THEM", "NHAP_FILE", "XUAT_EXCEL"}
        self.permission_patch = patch.object(PhanQuyenService, "get_my_permissions", side_effect=lambda **kwargs:
            SimpleNamespace(chi_tiet=[SimpleNamespace(chuc_nang="don_mua_nguyen_lieu", thao_tac=right) for right in self.rights]))
        self.permission_patch.start()
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close(); self.permission_patch.stop(); self.db.close()
        self.outer.rollback(); self.connection.close()

    def count(self, model):
        return self.db.scalar(select(func.count()).select_from(model))

    def import_rows(self, rows=None):
        return self.service.import_file(self.db, file_bytes(rows), "orders.xlsx", True, self.actor)

    def test_template_and_preview_do_not_write(self):
        template = load_workbook(BytesIO(self.service.template()))
        self.assertEqual(template.sheetnames, ["DonMua", "HuongDan", "ViDu"])
        self.assertEqual([c.value for c in template["DonMua"][1]], COLUMNS)
        self.assertGreater(template["ViDu"].max_row, 2)
        self.assertTrue(self.service.preview(self.db, file_bytes(), "orders.xlsx")["valid"])
        self.assertEqual(self.count(DonMuaNguyenLieu), 0)

    def test_single_order_snapshot_decimal_pending_no_stock_or_receipts(self):
        from src.models.delivery_receipt_model import DeliveryReceipt
        from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
        from src.models.stock_movement_model import StockMovement
        before = [self.count(m) for m in [DeliveryReceipt, TonKhoNguyenLieu, StockMovement]]
        result = self.import_rows()
        self.assertEqual(result["imported"], 1)
        order = self.db.scalar(select(DonMuaNguyenLieu))
        detail = self.db.scalar(select(ChiTietDonMua))
        self.assertEqual(order.tong_tien, Decimal("7.07"))
        self.assertEqual(detail.don_gia_vnd_kg, Decimal("3.14"))
        self.assertEqual(order.trang_thai, "CHUA_DUYET")
        self.assertEqual(order.nguoi_tao, "TEST")
        self.assertIsNone(order.ma_de_xuat); self.assertIsNone(order.nguoi_duyet)
        self.assertEqual(detail.so_luong_thuc_nhan, 0)
        self.assertEqual(before, [self.count(m) for m in [DeliveryReceipt, TonKhoNguyenLieu, StockMovement]])
        output = self.service.orders.detail(self.db, order.ma_don_mua)
        self.assertEqual(output["nguon"], "EXCEL_TRUC_TIEP")
        self.assertEqual(output["ghi_chu"], "Ghi chú")

    def test_multiple_lines_orders_suppliers_and_grams(self):
        result = self.import_rows([row(), row(material="NL2"), row(ref="REF2", supplier="NCC2", material="NL3", unit="g", quantity=1000, price="0.10")])
        self.assertEqual(result["imported"], 2); self.assertEqual(self.count(ChiTietDonMua), 3)
        gram = self.db.scalar(select(ChiTietDonMua).where(ChiTietDonMua.ma_nguyen_lieu == "NL3"))
        self.assertEqual(gram.so_luong_mua, Decimal("1.00")); self.assertEqual(gram.don_gia_vnd_kg, Decimal("100.00"))

    def test_structure_formula_corrupt_and_empty(self):
        for content, filename in [(b"broken", "bad.xlsx"), (file_bytes(), "bad.csv")]:
            with self.assertRaises(HTTPException): self.service.parse(content, filename)
        book = Workbook(); book.active.title = "DonMua"; book.active.append(["wrong"])
        with self.assertRaises(HTTPException): self.service.parse(workbook_bytes(book), "bad.xlsx")
        formula = row(); formula[3] = "=1+1"
        report = self.service.preview(self.db, file_bytes([formula]), "bad.xlsx")
        self.assertFalse(report["valid"]); self.assertTrue(any(e["column"] == COLUMNS[3] and e["row"] == 2 for e in report["errors"]))
        self.assertFalse(self.service.preview(self.db, file_bytes([]), "empty.xlsx")["valid"])

    def test_row_column_validation_and_all_or_nothing(self):
        invalid = [
            (1, "MISSING"), (2, "MISSING"), (3, 0), (3, "1.001"), (4, "g"), (5, "NaN"),
            (5, "-1"), (6, "2020-01-01"), (6, "invalid"), (0, ""), (7, "x" * 2001),
        ]
        for column, value in invalid:
            with self.subTest(column=column, value=str(value)[:20]):
                bad = row(ref="BAD"); bad[column] = value
                report = self.import_rows([row(), bad])
                self.assertFalse(report["valid"])
                self.assertTrue(any(e["row"] == 3 and e["column"] == COLUMNS[column] for e in report["errors"]))
                self.assertEqual(self.count(DonMuaNguyenLieu), 0)

    def test_inactive_missing_mapping_inconsistent_headers_and_gram_precision(self):
        for rows in [[row(), row(material="NL2", supplier="NCC2")], [row(), row(material="NL2", note="different")],
                     [row(), row(material="NL2", delivery=(today()+timedelta(days=8)).isoformat())],
                     [row(material="NL3", unit="g", quantity=1)]]:
            self.assertFalse(self.import_rows(rows)["valid"])
        material = self.db.get(NguyenLieu, "NL1"); material.trang_thai = "NGUNG_SU_DUNG"; self.db.flush()
        self.assertFalse(self.import_rows()["valid"])
        material.trang_thai = "DANG_SU_DUNG"
        mapping = self.db.get(NguyenLieuNhaCungCap, "NCC1NL1"); self.db.delete(mapping); self.db.flush()
        self.assertFalse(self.import_rows()["valid"])

    def test_duplicates_in_file_and_existing_even_changed_reference(self):
        for rows in [[row(), row()], [row(), row(ref="ANOTHER")]]:
            self.assertFalse(self.import_rows(rows)["valid"])
        self.assertTrue(self.import_rows()["valid"])
        self.assertFalse(self.import_rows()["valid"])
        self.assertFalse(self.import_rows([row(ref="ANOTHER")])["valid"])
        self.assertEqual(self.count(DonMuaNguyenLieu), 1)

    def test_existing_manual_and_proposal_orders_not_overwritten(self):
        existing = DonMuaNguyenLieu(ma_don_mua="OLD1", ma_ncc="NCC1", ma_de_xuat="DX_APPROVED", nguoi_tao="TEST",
            ngay_dat_hang=today(), ngay_du_kien_giao=today()+timedelta(days=7), tong_tien=Decimal("7.07"), trang_thai="DA_DUYET")
        self.db.add(existing); self.db.flush()
        self.service.repository.replace_details(self.db, "OLD1", [dict(ma_nguyen_lieu="NL1", so_luong_mua=Decimal("2.25"), don_gia_vnd_kg=Decimal("3.14"))])
        self.db.commit()
        self.assertFalse(self.import_rows()["valid"])
        self.assertFalse(self.import_rows([row(ref="OLD1", quantity=3)])["valid"])
        self.assertEqual(self.db.get(DonMuaNguyenLieu, "OLD1").ma_de_xuat, "DX_APPROVED")
        self.assertEqual(self.db.get(DonMuaNguyenLieu, "OLD1").trang_thai, "DA_DUYET")

    def test_transaction_failure_rolls_back_headers_lines_and_metadata(self):
        original = self.service.repository.replace_details
        calls = []
        def fail_second(db, code, lines):
            calls.append(code)
            original(db, code, lines)
            if len(calls) == 2: raise RuntimeError("simulated transaction failure")
        with patch.object(self.service.repository, "replace_details", side_effect=fail_second):
            with self.assertRaises(RuntimeError): self.import_rows([row(), row(ref="REF2", supplier="NCC2")])
        for model in [DonMuaNguyenLieu, ChiTietDonMua, PurchaseExcelImport]: self.assertEqual(self.count(model), 0)

    def test_ordinary_create_approve_reject_and_pending_receipt_guard(self):
        payload = DonMuaCreate(ma_ncc="NCC1", ngay_dat_hang=today(), ngay_du_kien_giao=today()+timedelta(days=7),
                              chi_tiet=[dict(ma_nguyen_lieu="NL1", so_luong_mua="2")])
        created = self.service.orders.create(self.db, payload, self.actor)
        self.assertEqual(created["tong_tien"], Decimal("200.00"))
        code = created["ma_don_mua"]
        receipt = DonMuaNhanHangRequest(ngay_giao_thuc_te=today(), chi_tiet=[dict(ma_chi_tiet_don_mua=created["chi_tiet"][0]["ma_chi_tiet_don_mua"], so_luong_thuc_nhan=2)])
        with self.assertRaises(HTTPException) as caught: self.service.orders.receive(self.db, code, receipt)
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(self.service.orders.approve(self.db, code, self.actor)["trang_thai"], "DA_DUYET")
        self.import_rows()
        other = self.db.scalar(select(DonMuaNguyenLieu).where(DonMuaNguyenLieu.ma_don_mua != code))
        self.assertEqual(self.service.orders.reject(self.db, other.ma_don_mua, DonMuaTuChoiRequest(ly_do_tu_choi="Test"), self.actor)["trang_thai"], "TU_CHOI")

    def test_explicit_approval_then_receive_imported_order_normally(self):
        from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
        from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
        self.db.add(TonKhoNguyenLieu(ma_nguyen_lieu="NL1", ngay_ghi_nhan=today(), ton_kho_thuc_te=10,
            so_luong_book=0, ton_kho_an_toan=0, ton_kho_toi_da=1000, trang_thai="DANG_SU_DUNG"))
        self.db.commit()
        self.db.info["audit_actor"] = {"ma_nguoi_dung": "TEST"}
        self.import_rows()
        order = self.db.scalar(select(DonMuaNguyenLieu))
        detail = self.service.orders.approve(self.db, order.ma_don_mua, self.actor)
        result = self.service.orders.receive(self.db, order.ma_don_mua, DonMuaNhanHangRequest(
            ngay_giao_thuc_te=today(), chi_tiet=[dict(ma_chi_tiet_don_mua=detail["chi_tiet"][0]["ma_chi_tiet_don_mua"], so_luong_thuc_nhan="2.25")]))
        self.assertEqual(result["trang_thai"], "DA_NHAN_HANG")
        self.assertEqual(self.count(DeliveryReceipt), 1)
        receipt_line = self.db.scalar(select(DeliveryReceiptLine))
        self.assertEqual(receipt_line.don_gia_mua, Decimal("3.14"))
        self.assertEqual(self.db.get(TonKhoNguyenLieu, ("NL1", today())).ton_kho_thuc_te, Decimal("12.25"))

    def test_database_integrity_error_rolls_back_whole_batch(self):
        original = self.service.repository.replace_details
        count = 0
        def broken_fk(db, code, lines):
            nonlocal count
            count += 1
            if count == 2: lines = [{**lines[0], "ma_nguyen_lieu": "MISSING"}]
            original(db, code, lines)
        with patch.object(self.service.repository, "replace_details", side_effect=broken_fk):
            with self.assertRaises(HTTPException) as caught: self.import_rows([row(), row(ref="REF2", supplier="NCC2")])
        self.assertEqual(caught.exception.status_code, 422)
        for model in [DonMuaNguyenLieu, ChiTietDonMua, PurchaseExcelImport]: self.assertEqual(self.count(model), 0)

    def test_export_all_details_all_filters_and_text_safety(self):
        rows = []
        for i in range(25):
            rows.extend([row(ref=f"R{i}", quantity=i+1), row(ref=f"R{i}", material="NL2", quantity=i+1)])
        self.assertEqual(self.import_rows(rows)["imported"], 25)
        supplier = self.db.get(NhaCungCap, "NCC1"); supplier.ten_ncc = "=Supplier"; self.db.commit()
        content, filename = self.service.export(self.db, search="=Supplier", ma_ncc="NCC1", trang_thai="CHUA_DUYET", ngay_dat_tu=today(), ngay_dat_den=today())
        book = load_workbook(BytesIO(content)); sheet = book["DonMua"]
        self.assertEqual(sheet.max_row, 51)
        self.assertEqual(sheet["D2"].data_type, "s")
        self.assertEqual(sheet["L2"].value, 3.14)
        self.assertEqual(sheet["Q2"].value, "EXCEL_TRUC_TIEP")
        self.assertEqual(filename, f"Danh_sach_don_mua_nguyen_lieu_{today():%Y%m%d}.xlsx")
        for filters in [dict(search="not found"), dict(ma_ncc="NCC2"), dict(trang_thai="DA_DUYET"), dict(ngay_dat_tu=today()+timedelta(days=1))]:
            content, _ = self.service.export(self.db, **filters)
            self.assertEqual(load_workbook(BytesIO(content))["DonMua"].max_row, 1)
        with self.assertRaises(HTTPException): self.service.export(self.db, ngay_dat_tu=today(), ngay_dat_den=today()-timedelta(days=1))

    def test_api_permissions_and_confirmation_required(self):
        base = "/api/don-mua-nguyen-lieu/excel"
        for missing in ["XEM", "THEM", "NHAP_FILE"]:
            self.rights = {"XEM", "THEM", "NHAP_FILE", "XUAT_EXCEL"} - {missing}
            self.assertEqual(self.client.get(base+"/template").status_code, 403)
            for endpoint in ["preview", "import"]:
                response = self.client.post(base+"/"+endpoint, files={"file": ("orders.xlsx", file_bytes())}, data={"confirmed": "true"})
                self.assertEqual(response.status_code, 403)
        self.rights = {"XEM", "THEM", "NHAP_FILE"}
        self.assertEqual(self.client.get(base+"/export").status_code, 403)
        self.rights.add("XUAT_EXCEL")
        self.assertEqual(self.client.get(base+"/template").status_code, 200)
        self.assertEqual(self.client.post(base+"/import", files={"file": ("orders.xlsx", file_bytes())}).status_code, 422)
        self.assertEqual(self.client.post(base+"/preview", files={"file": ("orders.xlsx", file_bytes())}).json()["valid"], True)
        result = self.client.post(base+"/import", files={"file": ("orders.xlsx", file_bytes())}, data={"confirmed": "true"})
        self.assertEqual(result.status_code, 200); self.assertEqual(result.json()["imported"], 1)
        self.assertEqual(self.client.get(base+"/export").status_code, 200)


if __name__ == "__main__": unittest.main(verbosity=2)
