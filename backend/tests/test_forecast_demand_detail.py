"""Isolated tests: mocks only, no database connections or mutations."""
from datetime import date, datetime, timezone
from decimal import Decimal as D
from types import SimpleNamespace as NS
import unittest
from unittest.mock import Mock, patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from src.services.forecast_demand_detail_service import ForecastDemandDetailService
from src.services.nhu_cau_nguyen_lieu_service import NhuCauNguyenLieuService
from src.schemas.forecast_demand_detail_schema import ForecastDemandDetail


class ForecastDemandTests(unittest.TestCase):
    def setUp(self):
        self.service = ForecastDemandDetailService()
        self.repo = Mock()
        self.service.repository = self.repo
        self.repo.forecast.return_value = NS(ma_lich_su_du_bao="RUN1", thoi_gian_chay=datetime(2026, 10, 3, tzinfo=timezone.utc), so_tuan_du_bao=4, trang_thai="THANH_CONG")
        self.repo.forecast_details.return_value = [
            NS(ma_san_pham="SP1", so_luong_du_bao=60, tu_ngay=date(2026, 10, 12), den_ngay=date(2026, 10, 18)),
            NS(ma_san_pham="SP2", so_luong_du_bao=20, tu_ngay=date(2026, 10, 5), den_ngay=date(2026, 11, 1)),
            NS(ma_san_pham="SP1", so_luong_du_bao=40, tu_ngay=date(2026, 10, 5), den_ngay=date(2026, 10, 11)),
        ]
        self.repo.products.return_value = {
            "SP1": NS(ma_san_pham="SP1", ten_san_pham="Một", khoi_luong=D("250"), don_vi_do_luong="g"),
            "SP2": NS(ma_san_pham="SP2", ten_san_pham="Hai", khoi_luong=D("0.5"), don_vi_do_luong="kg"),
        }
        self.repo.active_boms.return_value = [
            NS(ma_san_pham="SP1", ma_cong_thuc="B1", ten_cong_thuc="BOM1", he_so_thu_hoi=D("0.8"), ty_le_hao_hut=D("0.2")),
            NS(ma_san_pham="SP2", ma_cong_thuc="B2", ten_cong_thuc="BOM2", he_so_thu_hoi=D("0.8"), ty_le_hao_hut=D("0.2")),
        ]
        self.repo.bom_details.return_value = [
            NS(ma_cong_thuc="B1", ma_nguyen_lieu="M1", ty_le_phoi_tron=D("0.6")),
            NS(ma_cong_thuc="B1", ma_nguyen_lieu="M2", ty_le_phoi_tron=D("0.4")),
            NS(ma_cong_thuc="B2", ma_nguyen_lieu="M1", ty_le_phoi_tron=D("1")),
        ]
        self.repo.materials.return_value = {code: NS(ten_nguyen_lieu=code, don_vi_do_luong="kg") for code in ("M1", "M2")}

    def read(self):
        result = self.service.read(None, "RUN1")
        ForecastDemandDetail.model_validate(result)
        self.repo.latest_inventories.assert_not_called()
        self.repo.incoming_quantities.assert_not_called()
        return result

    def test_metadata_and_bom_arithmetic_match_demand_table(self):
        result = self.read()
        self.assertEqual(result["tong_san_pham"], 2)
        self.assertEqual(result["tu_ngay"], date(2026, 10, 5))
        self.assertEqual(result["den_ngay"], date(2026, 11, 1))
        self.assertEqual(result["so_tuan_du_bao"], 4)
        self.assertEqual(result["san_pham"][0]["so_luong_du_bao"], D("100"))
        self.assertEqual(result["san_pham"][0]["bom"]["khoi_luong_thanh_pham_kg"], D("0.25"))
        self.assertEqual([row["nhu_cau_du_bao_kg"] for row in result["nguyen_lieu"]], [D("31.25"), D("12.50")])
        self.assertEqual(result["nguyen_lieu"][0]["cach_tinh"][0]["nhu_cau_kg"], D("18.75"))
        self.repo.forecast.assert_called_once_with(None, "RUN1")
        self.repo.forecast_details.assert_called_once_with(None, "RUN1")
        self.repo.latest_inventories.return_value = {code: NS(ton_kho_kha_dung=D("0"), ton_kho_an_toan=D("0"), ton_kho_toi_da=D("1000")) for code in ("M1", "M2")}
        preview = NhuCauNguyenLieuService()
        preview.repository = self.repo
        preview.incoming = Mock()
        preview.incoming.quantities.return_value = {}
        table = preview.preview(None, "RUN1")
        self.assertEqual([row["nhu_cau_du_bao_kg"] for row in table["chi_tiet"]], [row["nhu_cau_du_bao_kg"] for row in result["nguyen_lieu"]])

    def test_missing_or_ambiguous_bom_preserves_info_but_hides_partial_totals(self):
        for boms in [self.repo.active_boms.return_value[:1], self.repo.active_boms.return_value * 2]:
            with self.subTest(boms=len(boms)):
                self.repo.active_boms.return_value = boms
                result = self.read()
                self.assertFalse(result["du_bom"])
                self.assertEqual(result["nguyen_lieu"], [])
                self.assertTrue(any(row["loi_bom"] for row in result["san_pham"]))
                self.assertEqual(result["tong_san_pham"], 2)

    def test_invalid_mix_is_reported(self):
        self.repo.bom_details.return_value[0].ty_le_phoi_tron = D("0.9")
        result = self.read()
        self.assertIn("100%", result["san_pham"][0]["loi_bom"])
        self.assertEqual(result["nguyen_lieu"], [])

    def test_empty_run_and_missing_run(self):
        self.repo.forecast_details.return_value = []
        result = self.read()
        self.assertEqual(result["tong_san_pham"], 0)
        self.assertIsNone(result["tu_ngay"])
        self.assertFalse(result["du_bom"])
        self.repo.forecast.return_value = None
        with self.assertRaises(HTTPException) as caught:
            self.read()
        self.assertEqual(caught.exception.status_code, 404)

    def test_negative_forecast_is_rejected(self):
        self.repo.forecast_details.return_value[0].so_luong_du_bao = -1
        with self.assertRaises(HTTPException) as caught:
            self.read()
        self.assertEqual(caught.exception.status_code, 422)

    def test_round_only_after_summing_contributions(self):
        self.repo.products.return_value["SP1"].khoi_luong = D("10")  # 0.01 kg
        self.repo.products.return_value["SP2"].khoi_luong = D("0.01")
        for row in self.repo.forecast_details.return_value:
            row.so_luong_du_bao = 1
        for bom in self.repo.active_boms.return_value:
            bom.he_so_thu_hoi = D("0.9")
            bom.ty_le_hao_hut = D("0.1")
        for line in self.repo.bom_details.return_value:
            line.ty_le_phoi_tron = D("0.3") if line.ma_nguyen_lieu == "M1" else D("0.7")
        self.repo.bom_details.return_value.append(NS(ma_cong_thuc="B2", ma_nguyen_lieu="M2", ty_le_phoi_tron=D("0.7")))
        result = self.read()
        self.assertEqual(result["nguyen_lieu"][0]["nhu_cau_du_bao_kg"], D("0.01"))

    def test_dynamic_rbac_for_history_and_detail(self):
        from src.core.database import get_db
        from src.dependencies.auth_dependency import get_current_user
        from src.routes.nhu_cau_nguyen_lieu_routes import router
        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_db] = lambda: None
        app.dependency_overrides[get_current_user] = lambda: NS(trang_thai="HOAT_DONG")
        selected = NS(chi_tiet=[])
        response = self.read()
        with patch("src.dependencies.permission_dependency.PhanQuyenService.get_my_permissions", return_value=selected), patch("src.services.forecast_demand_detail_service.ForecastDemandDetailService.read", return_value=response) as read, patch("src.services.lich_su_du_bao_service.LichSuDuBaoService.lay_danh_sach", return_value=[]):
            with TestClient(app) as client:
                for path in ("/nhu-cau-nguyen-lieu/lich-su", "/nhu-cau-nguyen-lieu/RUN1/chi-tiet"):
                    self.assertEqual(client.get(path).status_code, 403)
                read.assert_not_called()
                selected.chi_tiet = [NS(chuc_nang="nhu_cau_nguyen_lieu", thao_tac="XEM")]
                self.assertEqual(client.get("/nhu-cau-nguyen-lieu/lich-su").json(), [])
                detail = client.get("/nhu-cau-nguyen-lieu/RUN1/chi-tiet")
                self.assertEqual(detail.status_code, 200)
                self.assertEqual(detail.json()["ma_lich_su_du_bao"], "RUN1")
                selected.chi_tiet = []
                self.assertEqual(client.get("/nhu-cau-nguyen-lieu/RUN1/chi-tiet").status_code, 403)


if __name__ == "__main__":
    unittest.main()
