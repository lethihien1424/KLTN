from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException

from src.repositories.nhu_cau_nguyen_lieu_repository import NhuCauNguyenLieuRepository
from src.services.quy_doi_bom_service import QuyDoiBomService


ZERO = Decimal("0")
TWO_PLACES = Decimal("0.01")


def round_quantity(value):
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


class HangDangVeService:
    """Current commitment rule; date filtering can be added when demand dates exist."""

    COMMITTED_STATUSES = ("DA_DUYET",)

    def __init__(self, repository):
        self.repository = repository

    def quantities(self, db, material_codes):
        return self.repository.incoming_quantities(db, material_codes, self.COMMITTED_STATUSES)


class NhuCauNguyenLieuService:
    def __init__(self):
        self.repository = NhuCauNguyenLieuRepository()
        self.converter = QuyDoiBomService()
        self.incoming = HangDangVeService(self.repository)

    def preview(self, db, forecast_code):
        if self.repository.forecast(db, forecast_code) is None:
            raise HTTPException(404, "Không tìm thấy lịch sử dự báo.")
        forecast_details = self.repository.forecast_details(db, forecast_code)
        if not forecast_details:
            raise HTTPException(422, "Lịch sử dự báo chưa có chi tiết.")

        forecast_by_product = defaultdict(lambda: ZERO)
        for row in forecast_details:
            forecast_by_product[row.ma_san_pham] += row.so_luong_du_bao_kg
        boms = self.repository.active_boms(db, list(forecast_by_product))
        bom_details = self.repository.bom_details(db, [row.ma_cong_thuc for row in boms])
        demand = self.converter.calculate(forecast_by_product, boms, bom_details)

        codes = sorted(demand)
        materials = self.repository.materials(db, codes)
        inventories = self.repository.latest_inventories(db, codes)
        incoming = self.incoming.quantities(db, codes)
        missing_inventory = [code for code in codes if code not in inventories]
        if missing_inventory:
            raise HTTPException(422, "Thiếu snapshot tồn kho cho nguyên liệu: " + ", ".join(missing_inventory))

        result = []
        for code in codes:
            inventory = inventories[code]
            available = inventory.ton_kho_kha_dung
            safety = inventory.ton_kho_an_toan
            inbound = incoming.get(code, ZERO)
            shortage = demand[code] + safety - available - inbound
            shortage_positive = max(ZERO, shortage)
            # Inventory immediately after receipt may not exceed the configured maximum.
            purchase_capacity = max(ZERO, inventory.ton_kho_toi_da - available - inbound)
            purchase = min(shortage_positive, purchase_capacity)
            material = materials.get(code)
            if material is None:
                raise HTTPException(422, f"Nguyên liệu {code} trong BOM không tồn tại.")
            result.append({
                "ma_nguyen_lieu": code,
                "ten_nguyen_lieu": material.ten_nguyen_lieu,
                "nhu_cau_du_bao_kg": round_quantity(demand[code]),
                "ton_kho_kha_dung": round_quantity(available),
                "ton_kho_an_toan": round_quantity(safety),
                "so_luong_dang_ve": round_quantity(inbound),
                "so_luong_thieu_kg": round_quantity(shortage),
                "ton_kho_toi_da": round_quantity(inventory.ton_kho_toi_da),
                "so_luong_can_mua_kg": round_quantity(purchase),
            })
        return {"ma_lich_su_du_bao": forecast_code, "chi_tiet": result}
