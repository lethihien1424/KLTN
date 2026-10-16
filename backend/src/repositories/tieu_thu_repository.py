###D:\KLTN\KLTN\backend\src\repositories\tieu_thu_repository.py

from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.lich_su_tieu_thu_model import LichSuTieuThu


class TieuThuRepository:

    @staticmethod
    def get_nhu_cau_qua_khu(
        db: Session,
        ma_san_pham: str,
        ngay_chay: date,
    ) -> list[dict]:

        statement = (
            select(
                LichSuTieuThu.ma_lich_su,
                LichSuTieuThu.ma_don_hang,
                LichSuTieuThu.ma_san_pham,
                LichSuTieuThu.ngay_ban.label(
                    "ngay_ban"
                ),
                LichSuTieuThu.so_luong_ban.label(
                    "so_luong"
                ),
                LichSuTieuThu.trang_thai_don_hang.label(
                    "trang_thai_don_hang"
                ),
            )
            .where(
                LichSuTieuThu.ma_san_pham == ma_san_pham,
                LichSuTieuThu.trang_thai_don_hang.in_(
                    ["DA_GIAO_HANG", "CHO_GIAO_HANG"]
                ),
                LichSuTieuThu.ngay_ban.is_not(None),
                LichSuTieuThu.ngay_ban < ngay_chay,
            )
            .order_by(
                LichSuTieuThu.ngay_ban,
                LichSuTieuThu.ma_don_hang,
            )
        )

        return [
            dict(row)
            for row in db.execute(statement).mappings().all()
        ]

    @staticmethod
    def get_lich_su_tieu_thu(
        db: Session,
        ma_san_pham: str,
        ngay_chay: date,
    ) -> list[LichSuTieuThu]:

        statement = (
            select(LichSuTieuThu)
            .where(
                LichSuTieuThu.ma_san_pham == ma_san_pham,
                LichSuTieuThu.trang_thai_don_hang.in_(
                    ["DA_GIAO_HANG", "CHO_GIAO_HANG"]
                ),
                LichSuTieuThu.ngay_ban.is_not(None),
                LichSuTieuThu.ngay_ban < ngay_chay,
            )
            .order_by(
                LichSuTieuThu.ngay_ban,
                LichSuTieuThu.ma_don_hang,
            )
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_ke_hoach_san_xuat_qua_khu(
        db: Session,
        ma_san_pham: str,
        ngay_chay: date,
    ) -> list[KeHoachSanXuat]:

        statement = (
            select(KeHoachSanXuat)
            .where(
                KeHoachSanXuat.ma_san_pham == ma_san_pham,
                KeHoachSanXuat.ngay_ban < ngay_chay,
                KeHoachSanXuat.trang_thai_san_xuat
                == "CHO_SAN_XUAT",
            )
            .order_by(KeHoachSanXuat.ngay_ban)
        )

        return list(db.scalars(statement).all())
