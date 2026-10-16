###D:\KLTN\KLTN\backend\src\repositories\du_lieu_ban_hang_repository.py
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.ctkm_model import (
    ChuongTrinhKhuyenMai,
    ChiTietCTKM,
)
from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.lich_su_tieu_thu_model import LichSuTieuThu
from src.models.ngay_le_model import NgayLe
from src.models.san_pham_model import SanPham


class DuLieuBanHangRepository:
    @staticmethod
    def get_products(db: Session):
        return db.scalars(
            select(SanPham)
            .order_by(SanPham.ma_san_pham)
        ).all()

    @staticmethod
    def get_product(
        db: Session,
        product_id: str,
    ) -> SanPham | None:
        return db.scalar(
            select(SanPham).where(
                SanPham.ma_san_pham == product_id
            )
        )

    @staticmethod
    def get_holidays(db: Session):
        return db.execute(
            select(
                NgayLe.ma_ngay_le,
                NgayLe.ten_ngay_le,
            )
            .order_by(NgayLe.ma_ngay_le)
        ).all()

    @staticmethod
    def holiday_exists(
        db: Session,
        holiday_id: str,
    ) -> bool:
        return db.scalar(
            select(NgayLe.ma_ngay_le).where(
                NgayLe.ma_ngay_le == holiday_id
            )
        ) is not None

    @staticmethod
    def get_ctkm(
        db: Session,
        ma_ctkm: str,
    ) -> ChuongTrinhKhuyenMai | None:
        return db.scalar(
            select(ChuongTrinhKhuyenMai).where(
                ChuongTrinhKhuyenMai.ma_ctkm == ma_ctkm
            )
        )

    @staticmethod
    def ctkm_applies_to_product(
        db: Session,
        ma_ctkm: str,
        ma_san_pham: str,
    ) -> bool:
        return db.scalar(
            select(ChiTietCTKM.ma_ctkm)
            .where(
                ChiTietCTKM.ma_ctkm == ma_ctkm,
                ChiTietCTKM.ma_san_pham == ma_san_pham,
            )
            .limit(1)
        ) is not None

    @staticmethod
    def get_order(
        db: Session,
        ma: str,
    ) -> LichSuTieuThu | None:
        return db.scalar(
            select(LichSuTieuThu)
            .where(LichSuTieuThu.ma_lich_su == ma)
            .with_for_update()
        )

    @staticmethod
    def get_plan(
        db: Session,
        ma: str,
    ) -> KeHoachSanXuat | None:
        return db.scalar(
            select(KeHoachSanXuat)
            .where(KeHoachSanXuat.ma_ke_hoach == ma)
            .with_for_update()
        )

    @staticmethod
    def plan_for_pair(
        db: Session,
        order_id: str,
        product_id: str,
    ) -> KeHoachSanXuat | None:
        return db.scalar(
            select(KeHoachSanXuat)
            .where(
                KeHoachSanXuat.ma_don_hang == order_id,
                KeHoachSanXuat.ma_san_pham == product_id,
            )
            .with_for_update()
        )

    @staticmethod
    def order_exists(
        db: Session,
        order_id: str,
        product_id: str,
        exclude_id: str | None = None,
    ) -> bool:
        statement = select(
            LichSuTieuThu.ma_lich_su
        ).where(
            LichSuTieuThu.ma_don_hang == order_id,
            LichSuTieuThu.ma_san_pham == product_id,
        )

        if exclude_id is not None:
            statement = statement.where(
                LichSuTieuThu.ma_lich_su != exclude_id
            )

        return db.scalar(statement.limit(1)) is not None