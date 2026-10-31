"""PN numbering, migration preservation, Excel compatibility and concurrency."""
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from decimal import Decimal
from io import BytesIO
from pathlib import Path
import unittest
from unittest.mock import patch
from uuid import uuid4

from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

import test_purchase_excel as fixtures
from src.core.database import engine
from src.core.receipt_numbering import MIGRATION_SQL, NUMBER_DEFAULT
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.stock_movement_model import StockMovement
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
from src.services.delivery_excel_service import DeliveryExcelService, PRICED_COLUMNS
from src.services.delivery_history_service import DeliveryHistoryService
from src.services.delivery_kpi_service import DeliveryKpiService
from src.services.delivery_price_update_service import DeliveryPriceUpdateService, COLUMNS as PRICE_COLUMNS
from src.schemas.don_mua_schema import DonMuaNhanHangRequest


class ReceiptNumberTests(unittest.TestCase):
    setUp = fixtures.PurchaseExcelTests.setUp
    tearDown = fixtures.PurchaseExcelTests.tearDown
    count = fixtures.PurchaseExcelTests.count
    import_rows = fixtures.PurchaseExcelTests.import_rows

    def historical(self, external="OLD", delivery="1", date=None):
        header = DeliveryReceipt(ma_phieu_nhan=uuid4().hex, request_id=uuid4().hex, ma_ncc="NCC1",
            nguon="LICH_SU", ma_don_cu=external, lan_giao_cu=delivery, ngay_dat_hang=fixtures.today()-timedelta(days=10),
            ngay_du_kien_giao=fixtures.today(), ngay_giao_thuc_te=date or fixtures.today(), hoan_tat=True, nguoi_xac_nhan="TEST")
        self.db.add(header); self.db.flush()
        self.db.add(DeliveryReceiptLine(ma_phieu_nhan=header.ma_phieu_nhan, ma_nguyen_lieu="NL1", don_vi="kg",
            so_luong_dat=10, so_luong_giao=10, so_luong_nhap_kho=10))
        self.db.flush()
        return header

    def price_file(self, ids):
        book = Workbook(); sheet = book.active; sheet.title = "CapNhatGia"; sheet.append(PRICE_COLUMNS)
        for code in ids: sheet.append([code, "NL1", 12, "kg", "Chứng từ"])
        return fixtures.workbook_bytes(book)

    def snapshot(self):
        tables = ["phieu_nhan_nguyen_lieu", "chi_tiet_phieu_nhan_nguyen_lieu", "giao_dich_ton_kho", "ton_kho_nguyen_lieu",
                  "don_mua_nguyen_lieu", "chi_tiet_don_mua", "nguyen_lieu_nha_cung_cap", "nha_cung_cap"]
        return {name: self.db.scalar(text(f"SELECT coalesce(jsonb_agg(v ORDER BY v::text), '[]'::jsonb) FROM (SELECT to_jsonb(t) - 'ma_phieu_nhap' AS v FROM {name} t) x")) for name in tables}

    def test_database_default_shared_across_sources_unique_and_grows_past_9999(self):
        first = self.historical()
        self.assertEqual(first.ma_phieu_nhap, "PN0001")
        self.assertEqual(len(first.ma_phieu_nhan), 32)
        with self.db.begin_nested():
            with self.assertRaises(IntegrityError):
                with self.db.begin_nested():
                    duplicate = self.historical(external="OTHER")
                    duplicate.ma_phieu_nhap = first.ma_phieu_nhap; self.db.flush()
        self.db.execute(text("SELECT setval('phieu_nhap_number_seq', 9999, true)"))
        self.assertEqual(self.historical(external="LARGE").ma_phieu_nhap, "PN10000")
        self.assertEqual(self.historical(external="LARGER").ma_phieu_nhap, "PN10001")

    def test_rollback_never_reuses_allocated_number(self):
        self.db.commit()
        issued = self.historical().ma_phieu_nhap
        self.db.rollback()
        self.assertEqual(self.count(DeliveryReceipt), 0)
        next_receipt = self.historical()
        self.assertGreater(int(next_receipt.ma_phieu_nhap[2:]), int(issued[2:]))

    def receive_in_batches(self):
        self.db.info["audit_actor"] = {"ma_nguoi_dung": "TEST", "ho_ten": "Test"}
        self.db.add(TonKhoNguyenLieu(ma_nguyen_lieu="NL1", ngay_ghi_nhan=fixtures.today(), ton_kho_thuc_te=100,
            so_luong_book=0, ton_kho_an_toan=0, ton_kho_toi_da=1000, trang_thai="DANG_SU_DUNG")); self.db.commit()
        self.import_rows([fixtures.row(quantity=10)])
        order = self.service.orders.list(self.db)[0]
        detail = self.service.orders.approve(self.db, order["ma_don_mua"], self.actor)
        code = detail["chi_tiet"][0]["ma_chi_tiet_don_mua"]
        for quantity, closed in [(4, False), (6, True)]:
            payload = DonMuaNhanHangRequest(ngay_giao_thuc_te=fixtures.today(), request_id=uuid4().hex,
                hoan_tat=closed, chi_tiet=[dict(ma_chi_tiet_don_mua=code, so_luong_thuc_nhan=quantity)])
            self.service.orders.receive(self.db, order["ma_don_mua"], payload)
            # Retrying the same receipt does not allocate another business number.
            self.service.orders.receive(self.db, order["ma_don_mua"], payload)
        return order["ma_don_mua"]

    def test_real_multiple_receipts_and_historical_import_share_sequence(self):
        self.receive_in_batches()
        old_stock = self.db.get(TonKhoNguyenLieu, ("NL1", fixtures.today())).ton_kho_thuc_te
        book = Workbook(); sheet = book.active; sheet.title = "LichSuGiaoHang"; sheet.append(PRICED_COLUMNS)
        sheet.append(["OLD_IMPORT", "NCC1", "DOT1", (fixtures.today()-timedelta(days=10)).isoformat(), fixtures.today().isoformat(),
            fixtures.today().isoformat(), "NL1", 10, 10, 10, 0, 10, True, None, None, 12])
        report = DeliveryExcelService().import_file(self.db, fixtures.workbook_bytes(book), "old.xlsx", True)
        self.assertEqual(report["imported"], 1)
        rows = list(self.db.scalars(select(DeliveryReceipt).order_by(DeliveryReceipt.ma_phieu_nhap)))
        self.assertEqual([r.ma_phieu_nhap for r in rows], ["PN0001", "PN0002", "PN0003"])
        self.assertEqual([r.nguon for r in rows], ["THUC_TE", "THUC_TE", "LICH_SU"])
        self.assertEqual(self.db.get(TonKhoNguyenLieu, ("NL1", fixtures.today())).ton_kho_thuc_te, old_stock)
        self.assertEqual(self.count(StockMovement), 2)

    def test_legacy_migration_orders_stably_preserves_every_other_value_and_reruns(self):
        self.receive_in_batches()
        self.historical(external="EARLY", date=fixtures.today()-timedelta(days=2)); self.db.commit()
        before = self.snapshot()
        expected = list(self.db.scalars(select(DeliveryReceipt.ma_phieu_nhan).order_by(
            DeliveryReceipt.ngay_giao_thuc_te, DeliveryReceipt.thoi_gian, DeliveryReceipt.ma_phieu_nhan)))
        self.db.execute(text("ALTER TABLE phieu_nhan_nguyen_lieu DROP COLUMN ma_phieu_nhap CASCADE"))
        self.db.execute(text("DROP SEQUENCE phieu_nhap_number_seq"))
        self.db.execute(text(MIGRATION_SQL)); self.db.expire_all()
        actual = dict(self.db.execute(select(DeliveryReceipt.ma_phieu_nhan, DeliveryReceipt.ma_phieu_nhap)).all())
        self.assertEqual(actual, {code: f"PN{i:04d}" for i, code in enumerate(expected, 1)})
        self.assertEqual(before, self.snapshot())
        self.db.execute(text(MIGRATION_SQL)); self.db.expire_all()
        self.assertEqual(actual, dict(self.db.execute(select(DeliveryReceipt.ma_phieu_nhan, DeliveryReceipt.ma_phieu_nhap)).all()))
        self.assertEqual(before, self.snapshot())
        self.assertEqual(self.historical(external="NEW").ma_phieu_nhap, "PN0004")

    def test_rerun_preserves_existing_codes_and_consumed_sequence_values(self):
        header = self.historical(); original = header.ma_phieu_nhap
        self.db.execute(text("SELECT setval('phieu_nhap_number_seq', 100, true)"))
        self.db.execute(text(MIGRATION_SQL)); self.db.expire_all()
        self.assertEqual(self.db.get(DeliveryReceipt, header.ma_phieu_nhan).ma_phieu_nhap, original)
        self.assertEqual(self.historical(external="NEXT").ma_phieu_nhap, "PN0101")

    def test_migration_failure_rolls_back_added_column_without_business_changes(self):
        self.historical(); self.db.commit(); before = self.snapshot()
        self.db.execute(text("ALTER TABLE phieu_nhan_nguyen_lieu DROP COLUMN ma_phieu_nhap CASCADE")); self.db.commit()
        with self.assertRaises(Exception):
            with self.db.begin_nested():
                self.db.execute(text(MIGRATION_SQL))
                self.db.execute(text("SELECT 1 / 0"))
        exists = self.db.scalar(text("SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='phieu_nhan_nguyen_lieu' AND column_name='ma_phieu_nhap')"))
        self.assertFalse(exists)
        self.assertEqual(before, self.snapshot())

    def test_read_search_filter_detail_and_export_return_pn_with_uuid_preserved(self):
        header = self.historical(); self.db.commit()
        for filters in [dict(search=header.ma_phieu_nhap), dict(ma_phieu_nhap=header.ma_phieu_nhap)]:
            rows = DeliveryHistoryService.read(self.db, **filters)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["ma_phieu_nhan"], header.ma_phieu_nhan)
            self.assertEqual(rows[0]["ma_phieu_nhap"], header.ma_phieu_nhap)
        for code in [header.ma_phieu_nhan, header.ma_phieu_nhap]:
            self.assertEqual(DeliveryHistoryService.detail(self.db, code)["ma_phieu_nhan"], header.ma_phieu_nhan)
        book = load_workbook(BytesIO(DeliveryHistoryService.export(self.db, ma_phieu_nhap=header.ma_phieu_nhap)))
        sheet = book.active
        self.assertEqual(sheet.cell(2, 1).value, header.ma_phieu_nhap)
        self.assertEqual(sheet.cell(2, sheet.max_column).value, header.ma_phieu_nhan)
        self.assertEqual(sheet.max_row, 2)

    def test_price_template_pn_and_legacy_uuid_update_same_internal_line(self):
        header = self.historical(); self.db.commit()
        before_metrics = DeliveryKpiService.summarize(self.db, "NCC1")
        self.db.info["audit_actor"] = {"ma_nguoi_dung": "TEST", "ho_ten": "Test"}
        template = load_workbook(BytesIO(DeliveryPriceUpdateService.template(self.db)))
        self.assertEqual(template["CapNhatGia"].cell(2, 1).value, header.ma_phieu_nhap)
        service = DeliveryPriceUpdateService()
        for code in [header.ma_phieu_nhap, header.ma_phieu_nhan]:
            content = self.price_file([code])
            preview = service.preview(self.db, content, "prices.xlsx")
            self.assertTrue(preview["valid"])
            self.assertEqual(preview["items"][0]["ma_phieu_nhan"], header.ma_phieu_nhan)
            self.assertEqual(preview["items"][0]["ma_phieu_nhap"], header.ma_phieu_nhap)
            applied = service.apply(self.db, content, "prices.xlsx", True, preview["preview_token"], "Kiểm tra chứng từ")
            self.assertTrue(applied["valid"])
        self.assertEqual(self.count(DeliveryReceipt), 1)
        self.assertEqual(self.count(StockMovement), 0)
        self.assertEqual(self.count(TonKhoNguyenLieu), 0)
        self.assertEqual(self.db.scalar(select(DeliveryReceiptLine)).don_gia_mua, Decimal("12.00"))
        self.assertEqual(before_metrics, DeliveryKpiService.summarize(self.db, "NCC1"))

    def test_mixed_pn_uuid_duplicate_and_unknown_number_cannot_update(self):
        header = self.historical(); self.db.commit()
        report = DeliveryPriceUpdateService().preview(self.db, self.price_file([header.ma_phieu_nhap, header.ma_phieu_nhan]), "mixed.xlsx")
        self.assertFalse(report["valid"])
        self.assertTrue(any("Trùng" in error["message"] for error in report["errors"]))
        self.assertFalse(DeliveryPriceUpdateService().preview(self.db, self.price_file(["PN9999"]), "unknown.xlsx")["valid"])

    def test_api_rbac_is_unchanged(self):
        from src.routes.delivery_routes import router
        self.app.include_router(router, prefix="/api")
        header = self.historical(); self.db.commit()
        root = "/api/giao-nguyen-lieu/lich-su"
        response = self.client.get(root, params={"search": header.ma_phieu_nhap})
        self.assertEqual(response.status_code, 200); self.assertEqual(response.json()[0]["ma_phieu_nhap"], header.ma_phieu_nhap)
        self.assertEqual(self.client.get(root+"/phieu/"+header.ma_phieu_nhan).status_code, 200)
        self.rights = set()
        self.assertEqual(self.client.get(root).status_code, 403)
        self.assertEqual(self.client.get(root+"/phieu/"+header.ma_phieu_nhap).status_code, 403)
        self.assertEqual(self.client.get(root+"/excel/export").status_code, 403)


class ReceiptSequenceConcurrencyTests(unittest.TestCase):
    def test_concurrent_allocations_are_unique_and_rollback_leaves_gaps(self):
        schema = "test_receipt_concurrency_" + uuid4().hex
        with engine.begin() as connection:
            connection.execute(text(f'CREATE SCHEMA "{schema}"'))
            connection.execute(text(f'SET LOCAL search_path TO "{schema}"'))
            connection.execute(text("CREATE SEQUENCE phieu_nhap_number_seq AS BIGINT NO CYCLE"))
            connection.execute(text("CREATE TABLE receipt(id VARCHAR(32) PRIMARY KEY, ma_phieu_nhap VARCHAR(32) UNIQUE NOT NULL DEFAULT " + NUMBER_DEFAULT + ")"))
        try:
            def allocate(index):
                with engine.connect() as connection:
                    transaction = connection.begin()
                    connection.execute(text(f'SET LOCAL search_path TO "{schema}"'))
                    code = connection.scalar(text("INSERT INTO receipt(id) VALUES (:id) RETURNING ma_phieu_nhap"), {"id": uuid4().hex})
                    if index % 5 == 0: transaction.rollback()
                    else: transaction.commit()
                    return code
            with ThreadPoolExecutor(max_workers=8) as executor:
                codes = list(executor.map(allocate, range(40)))
            self.assertEqual(len(set(codes)), 40)
            self.assertTrue(all(code.startswith("PN") and len(code) >= 6 for code in codes))
            next_code = allocate(41)
            self.assertGreater(int(next_code[2:]), max(int(code[2:]) for code in codes))
        finally:
            assert schema.startswith("test_receipt_concurrency_") and len(schema) == len("test_receipt_concurrency_") + 32
            with engine.begin() as connection:
                connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
