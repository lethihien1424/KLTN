from datetime import date

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from src.models.nguyen_lieu_model import NguyenLieu
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu


class TonKhoRepository:
    @staticmethod
    def list(db: Session, search=None, trang_thai=None, ngay_ghi_nhan=None, latest_only=False):
        query = select(TonKhoNguyenLieu, NguyenLieu).join(NguyenLieu)
        if search and search.strip():
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            query = query.where(or_(
                TonKhoNguyenLieu.ma_nguyen_lieu.ilike(f"%{term}%", escape="/"),
                NguyenLieu.ten_nguyen_lieu.ilike(f"%{term}%", escape="/"),
            ))
        if trang_thai is not None:
            query = query.where(TonKhoNguyenLieu.trang_thai == trang_thai)
        if ngay_ghi_nhan is not None:
            query = query.where(TonKhoNguyenLieu.ngay_ghi_nhan == ngay_ghi_nhan)
        if latest_only:
            latest = select(
                TonKhoNguyenLieu.ma_nguyen_lieu.label("material"),
                func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded"),
            ).group_by(TonKhoNguyenLieu.ma_nguyen_lieu).subquery()
            query = query.join(latest, and_(
                TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material,
                TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded,
            ))
        return db.execute(query.order_by(
            TonKhoNguyenLieu.ngay_ghi_nhan.desc(), TonKhoNguyenLieu.ma_nguyen_lieu,
        )).all()

    @staticmethod
    def history(db: Session, material_code: str):
        return db.execute(select(TonKhoNguyenLieu, NguyenLieu).join(NguyenLieu).where(
            TonKhoNguyenLieu.ma_nguyen_lieu == material_code
        ).order_by(TonKhoNguyenLieu.ngay_ghi_nhan.desc())).all()

    @staticmethod
    def get(db: Session, material_code: str, recorded_date: date, lock=False):
        query = select(TonKhoNguyenLieu).where(
            TonKhoNguyenLieu.ma_nguyen_lieu == material_code,
            TonKhoNguyenLieu.ngay_ghi_nhan == recorded_date,
        )
        if lock:
            query = query.with_for_update()
        return db.scalar(query)

    @staticmethod
    def latest_for_receipt(db: Session, material_code: str):
        return db.scalar(select(TonKhoNguyenLieu).where(
            TonKhoNguyenLieu.ma_nguyen_lieu == material_code
        ).order_by(TonKhoNguyenLieu.ngay_ghi_nhan.desc()).limit(1)
          .with_for_update().execution_options(populate_existing=True))

    @staticmethod
    def add_received_quantity(db: Session, model, quantity):
        model.ton_kho_thuc_te += quantity
        db.flush()

    @staticmethod
    def material(db: Session, code: str, lock=False):
        query = select(NguyenLieu).where(NguyenLieu.ma_nguyen_lieu == code)
        if lock:
            query = query.with_for_update(read=True)
        return db.scalar(query)

    @staticmethod
    def add(db: Session, values: dict):
        model = TonKhoNguyenLieu(**values)
        db.add(model)
        db.flush()
        db.refresh(model)  # Load PostgreSQL GENERATED ALWAYS value.
        return model

    @staticmethod
    def update(db: Session, model, values: dict):
        for key, value in values.items():
            setattr(model, key, value)
        db.flush()
        db.refresh(model)
        return model
