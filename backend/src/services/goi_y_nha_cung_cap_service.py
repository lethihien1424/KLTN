from decimal import Decimal

from fastapi import HTTPException

from src.repositories.goi_y_nha_cung_cap_repository import GoiYNhaCungCapRepository
from src.repositories.nha_cung_cap_repository import NhaCungCapRepository
from src.services.supplier_scoring import evaluate
from src.services.supply_confirmation_service import SupplyConfirmationService, ENOUGH, UNKNOWN
from src.services.supplier_ranking_explanation import STATUS_ORDER, ranking_parts, ranking_policy, explain_ranking, comparison_reason
from src.services.supplier_score_preview_service import serial, SupplierScorePreviewService, POLICY


class GoiYNhaCungCapService:
    def __init__(self):
        self.repository = GoiYNhaCungCapRepository()

    @staticmethod
    def _sort_key(item):
        return (
            STATUS_ORDER.get(item["trang_thai_cung_ung"], 2),
            -item["diem_xep_hang"],
            item["don_gia"],
            item["lead_time_ngay"],
            item["ma_ncc"],
        )

    def suggest(self, db, material_code, purchase_quantity, forecast=None, explain_mapping=None):
        material = self.repository.material(db, material_code)
        if material is None:
            raise HTTPException(404, "Không tìm thấy nguyên liệu.")

        confirmation_service = SupplyConfirmationService()
        confirmation_service.validate_forecast(db, forecast, material_code)
        pairs = self.repository.active_suppliers_for_material(db, material_code)
        min_price = min((mapping.don_gia_nguyen_lieu for mapping, _ in pairs if mapping.don_gia_nguyen_lieu > 0), default=Decimal("0"))
        now = confirmation_service.now(db)
        suppliers = []
        evaluations = {}
        for mapping, supplier in pairs:
            status, confirmation, allocated = confirmation_service.evaluate_details(db, mapping, purchase_quantity, forecast, now=now)
            if supplier.ma_ncc not in evaluations:
                evaluations[supplier.ma_ncc] = evaluate(db, supplier.ma_ncc, NhaCungCapRepository())
            score, coverage, metrics = evaluations[supplier.ma_ncc]
            price_score, price_part, performance_part, rank_score = ranking_parts(min_price, mapping.don_gia_nguyen_lieu, score, coverage)
            suppliers.append({
                "ma_nguyen_lieu_ncc": mapping.ma_nguyen_lieu_ncc,
                "ma_ncc": supplier.ma_ncc,
                "ten_ncc": supplier.ten_ncc,
                "don_gia": mapping.don_gia_nguyen_lieu,
                "lead_time_ngay": mapping.lead_time_ngay,
                "diem_ncc": score,
                "diem_xep_hang": rank_score.quantize(Decimal("0.01")),
                "do_day_du_kpi": coverage * 100,
                "nguon_diem": "KPI_THUC_TE" if score is not None else "CHUA_CO_KPI",
                "ty_le_giao_dung_han_thuc_te": metrics["ty_le_giao_dung_han_thuc_te"],
                "ty_le_giao_du_thuc_te": metrics["ty_le_giao_du_thuc_te"],
                "trang_thai_cung_ung": status,
                "xac_nhan": confirmation_service.response(confirmation) if confirmation else None,
                "du_kha_nang_cung_cap": status == ENOUGH,
                "giai_thich_xep_hang": serial(explain_ranking(mapping, material, purchase_quantity, forecast,
                    status, confirmation, allocated, now, min_price, score, coverage, price_score, price_part, performance_part, rank_score)),
                **({"chi_tiet_diem_ncc": SupplierScorePreviewService().item(db, supplier, evaluated=evaluations[supplier.ma_ncc])}
                   if mapping.ma_nguyen_lieu_ncc == explain_mapping else {}),
            })
        suppliers.sort(key=self._sort_key)
        for index, item in enumerate(suppliers):
            explanation = item["giai_thich_xep_hang"]
            explanation["vi_tri"] = index + 1
            explanation["so_sanh"] = (comparison_reason(suppliers[index - 1], item) if index else
                comparison_reason(item, suppliers[1]) if len(suppliers) > 1 else "Chỉ có một NCC đủ điều kiện đang chào nguyên liệu; không có NCC khác để so sánh.")
        return {
            "chinh_sach_xep_hang": serial(ranking_policy()), "tinh_luc": now.isoformat(),
            "ma_nguyen_lieu": material.ma_nguyen_lieu,
            "ten_nguyen_lieu": material.ten_nguyen_lieu,
            "so_luong_can_mua": purchase_quantity,
            "nha_cung_cap": suppliers,
        }

    def explain(self, db, mapping_id, material_code, purchase_quantity, forecast=None):
        report = self.suggest(db, material_code, purchase_quantity, forecast, explain_mapping=mapping_id)
        selected = next((item for item in report["nha_cung_cap"] if item["ma_nguyen_lieu_ncc"] == mapping_id), None)
        if selected is None:
            raise HTTPException(404, "NCC không còn trong danh sách gợi ý cho nguyên liệu này.")
        return serial({"nha_cung_cap": selected, "chinh_sach_xep_hang": report["chinh_sach_xep_hang"],
            "chinh_sach_diem": POLICY, "tinh_luc": report["tinh_luc"]})
