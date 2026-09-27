from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.cong_thuc_model import CongThuc
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.san_pham_model import SanPham


class CongThucRepository:
    @staticmethod
    def list(db: Session, search=None, ma_san_pham=None, trang_thai=None):
        query = select(CongThuc, SanPham.ten_san_pham).join(SanPham)
        if search and search.strip():
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            query = query.where(or_(
                CongThuc.ma_cong_thuc.ilike(f"%{term}%", escape="/"),
                CongThuc.ten_cong_thuc.ilike(f"%{term}%", escape="/"),
                SanPham.ten_san_pham.ilike(f"%{term}%", escape="/"),
            ))
        if ma_san_pham is not None:
            query = query.where(CongThuc.ma_san_pham == ma_san_pham)
        if trang_thai is not None:
            query = query.where(CongThuc.trang_thai == trang_thai)
        return db.execute(query.order_by(CongThuc.ma_cong_thuc)).all()

    @staticmethod
    def get(db: Session, code: str, lock=False):
        query = select(CongThuc).where(CongThuc.ma_cong_thuc == code)
        if lock:
            query = query.with_for_update()
        return db.scalar(query)

    @staticmethod
    def product(db: Session, code: str, lock=False):
        query = select(SanPham).where(SanPham.ma_san_pham == code)
        if lock:
            query = query.with_for_update(read=True)
        return db.scalar(query)

    @staticmethod
    def materials(db: Session, codes: list[str]):
        # Shared locks keep reference statuses stable until the write commits.
        return db.scalars(select(NguyenLieu).where(
            NguyenLieu.ma_nguyen_lieu.in_(codes)
        ).order_by(NguyenLieu.ma_nguyen_lieu).with_for_update(read=True)).all()

    @staticmethod
    def details(db: Session, code: str):
        return db.execute(select(ChiTietCongThuc, NguyenLieu).join(NguyenLieu).where(
            ChiTietCongThuc.ma_cong_thuc == code
        ).order_by(ChiTietCongThuc.ma_nguyen_lieu)).all()

    @staticmethod
    def create(db: Session, values: dict):
        model = CongThuc(**values)
        db.add(model)
        db.flush()  # Fetch the database-generated CT code; do not commit.
        return model

    @staticmethod
    def replace_details(db: Session, code: str, items):
        existing = {row.ma_nguyen_lieu: row for row in db.scalars(
            select(ChiTietCongThuc).where(ChiTietCongThuc.ma_cong_thuc == code)
        )}
        desired = {item.ma_nguyen_lieu: item.ty_le_phoi_tron for item in items}
        for material, row in existing.items():
            if material not in desired:
                db.delete(row)  # Remove only obsolete BOM lines, never the formula.
            else:
                row.ty_le_phoi_tron = desired[material]
        for material, ratio in desired.items():
            if material not in existing:
                db.add(ChiTietCongThuc(ma_cong_thuc=code, ma_nguyen_lieu=material, ty_le_phoi_tron=ratio))
        db.flush()
