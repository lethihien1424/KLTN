from __future__ import annotations

from sqlalchemy import or_, select, text
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
            query = query.with_for_update()
        return db.scalar(query)

    @staticmethod
    def materials(db: Session, codes: list[str], lock=True):
        # Shared locks keep reference statuses stable until the write commits.
        query = select(NguyenLieu).where(
            NguyenLieu.ma_nguyen_lieu.in_(codes)
        ).order_by(NguyenLieu.ma_nguyen_lieu)
        return db.scalars(query.with_for_update(read=True) if lock else query).all()

    @staticmethod
    def active_for_product(db, code, exclude=None):
        query = select(CongThuc).where(CongThuc.ma_san_pham == code, CongThuc.trang_thai == "DANG_SU_DUNG")
        if exclude:
            query = query.where(CongThuc.ma_cong_thuc != exclude)
        return db.scalars(query).all()

    @staticmethod
    def details(db: Session, code: str):
        return db.execute(select(ChiTietCongThuc, NguyenLieu).join(NguyenLieu).where(
            ChiTietCongThuc.ma_cong_thuc == code
        ).order_by(ChiTietCongThuc.ma_nguyen_lieu)).all()

    @staticmethod
    def create(db: Session, values: dict):
        if "ma_cong_thuc" not in values and db.get_bind().dialect.name == "postgresql":
            # Explicit Excel codes may already occupy future sequence values.
            # Consume the normal sequence until an unused code is found; never reset it.
            values = dict(values)
            while True:
                sequence = db.scalar(text("SELECT nextval('cong_thuc_seq')"))
                code = f"CT{sequence:04d}"
                if db.get(CongThuc, code) is None:
                    values["ma_cong_thuc"] = code
                    break
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
