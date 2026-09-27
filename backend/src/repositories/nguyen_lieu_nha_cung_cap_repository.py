from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.nha_cung_cap_model import NhaCungCap


class NguyenLieuNhaCungCapRepository:
    @staticmethod
    def _joined_query():
        return (
            select(NguyenLieuNhaCungCap, NhaCungCap, NguyenLieu)
            .join(NhaCungCap, NguyenLieuNhaCungCap.ma_ncc == NhaCungCap.ma_ncc)
            .join(NguyenLieu, NguyenLieuNhaCungCap.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu)
        )

    def list(self, db: Session, search=None, ma_ncc=None, ma_nguyen_lieu=None):
        query = self._joined_query()
        if search and search.strip():
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            query = query.where(or_(
                NguyenLieuNhaCungCap.ma_nguyen_lieu_ncc.ilike(f"%{term}%", escape="/"),
                NguyenLieuNhaCungCap.ma_ncc.ilike(f"%{term}%", escape="/"),
                NhaCungCap.ten_ncc.ilike(f"%{term}%", escape="/"),
                NguyenLieuNhaCungCap.ma_nguyen_lieu.ilike(f"%{term}%", escape="/"),
                NguyenLieu.ten_nguyen_lieu.ilike(f"%{term}%", escape="/"),
            ))
        if ma_ncc is not None:
            query = query.where(NguyenLieuNhaCungCap.ma_ncc == ma_ncc)
        if ma_nguyen_lieu is not None:
            query = query.where(NguyenLieuNhaCungCap.ma_nguyen_lieu == ma_nguyen_lieu)
        return db.execute(query.order_by(NguyenLieuNhaCungCap.ma_nguyen_lieu_ncc)).all()

    def detail(self, db: Session, code: str):
        return db.execute(self._joined_query().where(
            NguyenLieuNhaCungCap.ma_nguyen_lieu_ncc == code
        )).one_or_none()

    @staticmethod
    def get(db: Session, code: str, lock=False):
        query = select(NguyenLieuNhaCungCap).where(
            NguyenLieuNhaCungCap.ma_nguyen_lieu_ncc == code
        )
        if lock:
            query = query.with_for_update()
        return db.scalar(query)

    @staticmethod
    def find_pair(db: Session, supplier_code: str, material_code: str, lock=False):
        query = select(NguyenLieuNhaCungCap).where(
            NguyenLieuNhaCungCap.ma_ncc == supplier_code,
            NguyenLieuNhaCungCap.ma_nguyen_lieu == material_code,
        )
        if lock:
            query = query.with_for_update()
        return db.scalar(query)

    @staticmethod
    def supplier(db: Session, code: str):
        return db.get(NhaCungCap, code)

    @staticmethod
    def material(db: Session, code: str):
        return db.get(NguyenLieu, code)

    @staticmethod
    def add(db: Session, values: dict):
        model = NguyenLieuNhaCungCap(**values)
        db.add(model)
        db.flush()
        db.refresh(model)
        return model

    @staticmethod
    def update(db: Session, model, values: dict):
        for key, value in values.items():
            setattr(model, key, value)
        db.flush()
        db.refresh(model)
        return model
