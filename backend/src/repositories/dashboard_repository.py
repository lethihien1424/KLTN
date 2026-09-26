from sqlalchemy import and_, func, select

from src.models.de_xuat_nhap_hang import DeXuatNhapHang
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu


class DashboardRepository:
    @staticmethod
    def active_material_count(db):
        return db.scalar(select(func.count()).select_from(NguyenLieu).where(
            NguyenLieu.trang_thai == "DANG_SU_DUNG"
        ))

    @staticmethod
    def low_stock(db):
        latest = select(
            TonKhoNguyenLieu.ma_nguyen_lieu.label("material_code"),
            func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded_date"),
        ).group_by(TonKhoNguyenLieu.ma_nguyen_lieu).subquery()
        return db.execute(
            select(TonKhoNguyenLieu, NguyenLieu)
            .join(latest, and_(
                TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material_code,
                TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded_date,
            ))
            .join(NguyenLieu, NguyenLieu.ma_nguyen_lieu == TonKhoNguyenLieu.ma_nguyen_lieu)
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG",
                TonKhoNguyenLieu.ton_kho_kha_dung < TonKhoNguyenLieu.ton_kho_an_toan,
            )
            .order_by(TonKhoNguyenLieu.ma_nguyen_lieu)
        ).all()

    @staticmethod
    def proposal_counts(db):
        return dict(db.execute(select(
            DeXuatNhapHang.trang_thai, func.count()
        ).group_by(DeXuatNhapHang.trang_thai)).all())

    @staticmethod
    def order_counts(db):
        return dict(db.execute(select(
            DonMuaNguyenLieu.trang_thai, func.count()
        ).group_by(DonMuaNguyenLieu.trang_thai)).all())

    @staticmethod
    def purchase_values(db):
        return dict(db.execute(select(
            DonMuaNguyenLieu.trang_thai,
            func.sum(DonMuaNguyenLieu.tong_tien),
        ).where(DonMuaNguyenLieu.trang_thai.in_((
            "DA_DUYET", "DA_NHAN_HANG"
        ))).group_by(DonMuaNguyenLieu.trang_thai)).all())

    @staticmethod
    def active_supplier_counts(db):
        return db.execute(select(
            func.count(),
            func.count().filter(and_(
                NhaCungCap.ty_le_giao_dung_han_thuc_te.is_not(None),
                NhaCungCap.ty_le_giao_du_thuc_te.is_not(None),
            )),
        ).where(NhaCungCap.trang_thai == "DANG_HOAT_DONG")).one()

    @staticmethod
    def active_supplier_performance(db):
        return list(db.scalars(select(NhaCungCap).where(
            NhaCungCap.trang_thai == "DANG_HOAT_DONG"
        ).order_by(NhaCungCap.ma_ncc)))
