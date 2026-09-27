from sqlalchemy import and_, func, select

from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.chi_tiet_don_mua import ChiTietDonMua
from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
from src.models.cong_thuc_model import CongThuc
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.lich_su_du_bao import LichSuDuBao
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu


class NhuCauNguyenLieuRepository:
    @staticmethod
    def forecast(db, code):
        return db.get(LichSuDuBao, code)

    @staticmethod
    def forecast_details(db, code):
        return db.scalars(select(ChiTietLichSuDuBao).where(
            ChiTietLichSuDuBao.ma_lich_su_du_bao == code
        ).order_by(ChiTietLichSuDuBao.ma_san_pham)).all()

    @staticmethod
    def active_boms(db, product_codes):
        return db.scalars(select(CongThuc).where(
            CongThuc.ma_san_pham.in_(product_codes),
            CongThuc.trang_thai == "DANG_SU_DUNG",
        ).order_by(CongThuc.ma_san_pham, CongThuc.ma_cong_thuc)).all()

    @staticmethod
    def bom_details(db, bom_codes):
        return db.scalars(select(ChiTietCongThuc).where(
            ChiTietCongThuc.ma_cong_thuc.in_(bom_codes)
        ).order_by(ChiTietCongThuc.ma_cong_thuc, ChiTietCongThuc.ma_nguyen_lieu)).all()

    @staticmethod
    def materials(db, codes):
        return {row.ma_nguyen_lieu: row for row in db.scalars(select(NguyenLieu).where(
            NguyenLieu.ma_nguyen_lieu.in_(codes)
        ))}

    @staticmethod
    def latest_inventories(db, codes):
        latest = select(
            TonKhoNguyenLieu.ma_nguyen_lieu.label("material"),
            func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded"),
        ).where(TonKhoNguyenLieu.ma_nguyen_lieu.in_(codes)).group_by(
            TonKhoNguyenLieu.ma_nguyen_lieu
        ).subquery()
        rows = db.scalars(select(TonKhoNguyenLieu).join(latest, and_(
            TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material,
            TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded,
        )))
        return {row.ma_nguyen_lieu: row for row in rows}

    @staticmethod
    def incoming_quantities(db, codes, committed_statuses):
        rows = db.execute(select(
            ChiTietDonMua.ma_nguyen_lieu,
            func.sum(ChiTietDonMua.so_luong_mua - ChiTietDonMua.so_luong_thuc_nhan),
        ).join(DonMuaNguyenLieu).where(
            ChiTietDonMua.ma_nguyen_lieu.in_(codes),
            DonMuaNguyenLieu.trang_thai.in_(committed_statuses),
            ChiTietDonMua.so_luong_mua > ChiTietDonMua.so_luong_thuc_nhan,
        ).group_by(ChiTietDonMua.ma_nguyen_lieu)).all()
        return dict(rows)
