from decimal import Decimal

from fastapi import HTTPException

from src.repositories.goi_y_nha_cung_cap_repository import GoiYNhaCungCapRepository


class GoiYNhaCungCapService:
    def __init__(self):
        self.repository = GoiYNhaCungCapRepository()

    @staticmethod
    def _sort_key(item):
        score = item["diem_ncc"]
        return (
            not item["du_kha_nang_cung_cap"],
            -(score if score is not None else Decimal("-1")),
            item["don_gia"],
            item["lead_time_ngay"],
            item["ma_ncc"],
        )

    def suggest(self, db, material_code, purchase_quantity):
        material = self.repository.material(db, material_code)
        if material is None:
            raise HTTPException(404, "Không tìm thấy nguyên liệu.")

        suppliers = []
        for mapping, supplier in self.repository.active_suppliers_for_material(
            db, material_code
        ):
            available = mapping.so_luong_ton_kho - mapping.so_luong_book
            suppliers.append({
                "ma_ncc": supplier.ma_ncc,
                "ten_ncc": supplier.ten_ncc,
                "don_gia": mapping.don_gia_nguyen_lieu,
                "ton_kho_kha_dung_ncc": available,
                "lead_time_ngay": mapping.lead_time_ngay,
                "diem_ncc": supplier.diem_dieu_kien_thuong_mai,
                "ty_le_giao_dung_han_thuc_te": supplier.ty_le_giao_dung_han_thuc_te,
                "ty_le_giao_du_thuc_te": supplier.ty_le_giao_du_thuc_te,
                "du_kha_nang_cung_cap": available >= purchase_quantity,
            })
        suppliers.sort(key=self._sort_key)
        return {
            "ma_nguyen_lieu": material.ma_nguyen_lieu,
            "ten_nguyen_lieu": material.ten_nguyen_lieu,
            "so_luong_can_mua": purchase_quantity,
            "nha_cung_cap": suppliers,
        }
