##D:\KLTN\KLTN\backend\src\repositories\du_bao_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.chi_tiet_lich_su_du_bao import (
    ChiTietLichSuDuBao,
)
from src.models.danh_gia_mo_hinh import (
    DanhGiaMoHinh,
)
from src.models.lich_su_du_bao import (
    LichSuDuBao,
)
from src.models.user_model import User


class DuBaoRepository:
    @staticmethod
    def tao_lich_su(
        db: Session,
        lich_su: LichSuDuBao,
    ) -> LichSuDuBao:
        db.add(lich_su)
        db.flush()
        return lich_su

    @staticmethod
    def tao_chi_tiet(
        db: Session,
        chi_tiet: ChiTietLichSuDuBao,
    ) -> ChiTietLichSuDuBao:
        db.add(chi_tiet)
        db.flush()
        return chi_tiet

    @staticmethod
    def lay_danh_sach_lich_su(
        db: Session,
    ):
        statement = (
            select(
                LichSuDuBao,
                User.ho_ten.label("ho_ten_nguoi_thuc_hien"),
            )
            .outerjoin(
                User,
                User.ma_nguoi_dung
                == LichSuDuBao.nguoi_thuc_hien,
            )
            .where(
                LichSuDuBao.so_tuan_du_bao.in_((4, 8)),
                LichSuDuBao.cau_hinh_mo_hinh == "PROPHET",
            )
            .order_by(
                LichSuDuBao.thoi_gian_chay.desc(),
                LichSuDuBao.ma_lich_su_du_bao.desc(),
            )
        )

        return db.execute(statement).all()

    @staticmethod
    def lay_lich_su_theo_ma(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> LichSuDuBao | None:
        statement = select(LichSuDuBao).where(
            LichSuDuBao.ma_lich_su_du_bao
            == ma_lich_su_du_bao,
            LichSuDuBao.so_tuan_du_bao.in_((4, 8)),
            LichSuDuBao.cau_hinh_mo_hinh == "PROPHET",
        )

        return db.scalar(statement)

    @staticmethod
    def lay_lich_su_moi_nhat(
        db: Session,
    ) -> LichSuDuBao | None:
        statement = (
            select(LichSuDuBao)
            .where(
                LichSuDuBao.trang_thai == "THANH_CONG",
                LichSuDuBao.so_tuan_du_bao.in_((4, 8)),
                LichSuDuBao.cau_hinh_mo_hinh == "PROPHET",
            )
            .order_by(
                LichSuDuBao.thoi_gian_chay.desc(),
                LichSuDuBao.ma_lich_su_du_bao.desc(),
            )
            .limit(1)
        )

        return db.scalar(statement)

    @staticmethod
    def lay_chi_tiet_da_luu(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> list[ChiTietLichSuDuBao]:
        statement = (
            select(ChiTietLichSuDuBao)
            .where(
                ChiTietLichSuDuBao.ma_lich_su_du_bao
                == ma_lich_su_du_bao,
                ChiTietLichSuDuBao.ma_nguyen_lieu.is_(None),
                ChiTietLichSuDuBao.ma_san_pham.is_not(None),
            )
            .order_by(
                ChiTietLichSuDuBao.ma_san_pham.asc(),
                ChiTietLichSuDuBao.tu_ngay.asc(),
            )
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def lay_danh_gia_da_luu(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> list[DanhGiaMoHinh]:
        statement = (
            select(DanhGiaMoHinh)
            .where(
                DanhGiaMoHinh.ma_lich_su_du_bao
                == ma_lich_su_du_bao,
            )
            .order_by(
                DanhGiaMoHinh.ma_san_pham.asc(),
                DanhGiaMoHinh.mo_hinh.asc(),
            )
        )

        return list(db.scalars(statement).all())