from sqlalchemy import select

from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.nha_cung_cap_model import NhaCungCap


class GoiYNhaCungCapRepository:
    @staticmethod
    def material(db, code):
        return db.get(NguyenLieu, code)

    @staticmethod
    def active_suppliers_for_material(db, material_code):
        return db.execute(
            select(NguyenLieuNhaCungCap, NhaCungCap)
            .join(
                NhaCungCap,
                NguyenLieuNhaCungCap.ma_ncc == NhaCungCap.ma_ncc,
            )
            .where(
                NguyenLieuNhaCungCap.ma_nguyen_lieu == material_code,
                NhaCungCap.trang_thai == "DANG_HOAT_DONG",
            )
        ).all()
