"""Dashboard merge regressions: mocks only, no DB connections or startup hooks."""
from datetime import date
from decimal import Decimal as D
from types import SimpleNamespace as NS
import unittest
from unittest.mock import Mock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from src.core.database import get_db
from src.dependencies.permission_dependency import _permission_context, _get_selected_permissions
from src.repositories.dashboard_repository import DashboardRepository
from src.routes.dashboard_routes import router, controller
from src.schemas.dashboard_schema import DashboardSupplierPerformance
from src.services.dashboard_service import DashboardService


class DashboardMergeTests(unittest.TestCase):
    def setUp(self):
        self.service = DashboardService()
        self.service.repository = Mock()
        self.metrics = {"ty_le_giao_dung_han_thuc_te": D("75.25"), "ty_le_giao_du_thuc_te": D("80"),
                        "ty_le_chat_luong_dat_thuc_te": D("96"), "thoi_gian_giao_tb_ngay": D("2.5"),
                        "so_don": 4, "so_don_dang_giao": 1, "so_phieu": 7}

    def test_measured_supplier_kpis_and_new_ranking_coexist(self):
        for score, rank in [(None, "TRUNG_BINH"), (D(0), "YEU"), (D(50), "TRUNG_BINH"), (D(65), "TOT"), (D(80), "XUAT_SAC")]:
            with self.subTest(score=score):
                self.service.repository.active_supplier_performance.return_value = [NS(ma_ncc="NCC1", ten_ncc="Supplier", diem_dieu_kien_thuong_mai=score,
                    ty_le_giao_dung_han_thuc_te=D(1), ty_le_giao_du_thuc_te=D(1))]
                with patch("src.services.delivery_kpi_service.DeliveryKpiService.summarize", return_value=self.metrics) as summarize:
                    result = self.service.supplier_performance(None)[0]
                summarize.assert_called_once_with(None, "NCC1")
                self.assertEqual(result["xep_loai"], rank)
                for key, value in self.metrics.items():
                    self.assertEqual(result[key], value)
                serialized = DashboardSupplierPerformance.model_validate(result).model_dump(mode="json")
                self.assertEqual(serialized["ty_le_chat_luong_dat_thuc_te"], "96.00")
                self.assertEqual(serialized["thoi_gian_giao_tb_ngay"], "2.50")
                self.assertEqual(serialized["diem_ncc"], None if score is None else f"{score:.2f}")

    def test_partial_evidence_still_counts_as_actual_supplier_performance(self):
        db = Mock(); db.execute.return_value.one.return_value = (3, 1)
        self.assertEqual(DashboardRepository.active_supplier_counts(db), (3, 1))
        sql = str(db.execute.call_args.args[0])
        self.assertIn("ty_le_giao_du_thuc_te IS NOT NULL", sql)
        self.assertNotIn("ty_le_giao_dung_han_thuc_te IS NOT NULL", sql)

    def test_new_period_resolution_handles_iso_week_and_leap_year(self):
        self.assertEqual(self.service._resolve_period_dates("tuan", 2020, week=53)[:2], (date(2020, 12, 28), date(2021, 1, 3)))
        self.assertEqual(self.service._resolve_period_dates("thang", 2024, 2)[:2], (date(2024, 2, 1), date(2024, 2, 29)))
        with self.assertRaises(HTTPException):
            self.service._resolve_period_dates("tuan", 2021, week=53)

    def test_overview_keeps_all_purchase_and_supplier_fields(self):
        repo = self.service.repository
        repo.proposal_counts.return_value = {"DA_DUYET": 2}
        repo.order_counts.return_value = {"DA_NHAN_HANG": 3}
        repo.purchase_values.return_value = {"DA_NHAN_HANG": D(25)}
        repo.active_supplier_counts.return_value = (4, 2)
        repo.active_material_count.return_value = 5; repo.low_stock.return_value = []
        value = self.service.overview(None)
        self.assertEqual(value["don_mua"]["CHUA_DUYET"], 0)
        self.assertEqual(value["don_mua"]["DA_NHAN_HANG"], 3)
        self.assertEqual(value["mua_hang"]["gia_tri_da_nhan_hang"], D(25))
        self.assertEqual(value["nha_cung_cap"]["co_du_lieu_hieu_suat_thuc_te"], 2)

    def test_dashboard_routes_register_without_duplicates(self):
        app = FastAPI(); app.include_router(router)
        schema = app.openapi()
        routes = [(method, r.path) for r in router.routes for method in r.methods]
        self.assertEqual(len(routes), len(set(routes)))
        for suffix in ("/hieu-suat-nha-cung-cap", "/tong-quan", "/canh-bao-ton-kho", "/san-pham-tieu-thu", "/so-sanh-prophet", "/nguyen-lieu-cung-ung"):
            self.assertTrue(any(path.endswith(suffix) for path in schema["paths"]), suffix)

    def test_supplier_endpoint_denies_ungranted_admin_and_accepts_dynamic_view(self):
        app = FastAPI(); app.include_router(router)
        user = NS(ma_nguoi_dung="admin", vai_tro="ADMIN", trang_thai="HOAT_DONG")
        selected = set()
        app.dependency_overrides[_permission_context] = lambda: (user, selected)
        app.dependency_overrides[get_db] = lambda: None
        path = next(r.path for r in router.routes if r.path.endswith("/hieu-suat-nha-cung-cap"))
        with TestClient(app) as client, patch.object(controller, "supplier_performance", return_value=[]) as read:
            self.assertEqual(client.get(path).status_code, 403)
            read.assert_not_called()
            selected.add(("hieu_suat_nha_cung_cap", "XEM"))
            self.assertEqual(client.get(path).status_code, 200)
            selected.clear()
            self.assertEqual(client.get(path).status_code, 403)

    def test_permission_context_keeps_dynamic_admin_and_account_status_checks(self):
        user = NS(ma_nguoi_dung="admin", vai_tro="ADMIN", trang_thai="HOAT_DONG")
        with patch("src.dependencies.permission_dependency.PhanQuyenService") as permissions:
            permissions.return_value.get_my_permissions.return_value = NS(chi_tiet=[])
            self.assertEqual(_get_selected_permissions(None, user), set())
            user.trang_thai = "NGUNG_HOAT_DONG"
            with self.assertRaises(HTTPException):
                _get_selected_permissions(None, user)


if __name__ == "__main__":
    unittest.main()
