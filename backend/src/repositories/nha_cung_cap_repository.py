from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from src.models.nha_cung_cap_model import NhaCungCap
from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.chi_tiet_don_mua import ChiTietDonMua


class NhaCungCapRepository:
    @staticmethod
    def list(db: Session, search: str | None = None, trang_thai: str | None = None):
        query = select(NhaCungCap)
        if search and search.strip():
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            query = query.where(or_(
                NhaCungCap.ma_ncc.ilike(f"%{term}%", escape="/"),
                NhaCungCap.ten_ncc.ilike(f"%{term}%", escape="/"),
            ))
        if trang_thai is not None:
            query = query.where(NhaCungCap.trang_thai == trang_thai)
        return list(db.scalars(query.order_by(NhaCungCap.ma_ncc)))

    @staticmethod
    def get(db: Session, code: str, lock: bool = False):
        query = select(NhaCungCap).where(NhaCungCap.ma_ncc == code)
        if lock:
            query = query.with_for_update()
        return db.scalar(query)

    @staticmethod
    def add(db: Session, values: dict):
        model = NhaCungCap(**values)
        db.add(model)
        db.flush()
        db.refresh(model)
        return model

    @staticmethod
    def update(db: Session, model: NhaCungCap, values: dict):
        for key, value in values.items():
            setattr(model, key, value)
        db.flush()
        db.refresh(model)
        return model

    @staticmethod
    def mappings(db: Session, supplier_code: str):
        return list(db.scalars(select(NguyenLieuNhaCungCap).where(
            NguyenLieuNhaCungCap.ma_ncc == supplier_code
        ).order_by(NguyenLieuNhaCungCap.ma_nguyen_lieu_ncc)))

    @staticmethod
    def global_lead_time_range(db: Session):
        return db.execute(select(
            func.min(NguyenLieuNhaCungCap.lead_time_ngay),
            func.max(NguyenLieuNhaCungCap.lead_time_ngay),
        )).one()

    @staticmethod
    def received_orders(db: Session, supplier_code: str):
        return list(db.scalars(select(DonMuaNguyenLieu).where(
            DonMuaNguyenLieu.ma_ncc == supplier_code,
            DonMuaNguyenLieu.trang_thai == "DA_NHAN_HANG",
            DonMuaNguyenLieu.ngay_du_kien_giao.is_not(None),
            DonMuaNguyenLieu.ngay_giao_thuc_te.is_not(None),
        ).order_by(DonMuaNguyenLieu.ma_don_mua).with_for_update(read=True)
          .execution_options(populate_existing=True)))

    @staticmethod
    def received_details(db: Session, order_code: str):
        return list(db.scalars(select(ChiTietDonMua).where(
            ChiTietDonMua.ma_don_mua == order_code
        ).order_by(ChiTietDonMua.ma_chi_tiet_don_mua).with_for_update(read=True)
          .execution_options(populate_existing=True)))
