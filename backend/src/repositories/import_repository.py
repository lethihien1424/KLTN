##D:\KLTN\KLTN\backend\src\repositories\import_repository.py

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.ctkm_model import (
    ChiTietCTKM,
    ChuongTrinhKhuyenMai,
)
from src.models.san_pham_model import SanPham


class ImportRepository:
    @staticmethod
    def add(
        db: Session,
        model,
    ):
        db.add(model)
        return model

    @staticmethod
    def flush(
        db: Session,
    ) -> None:
        db.flush()

    @staticmethod
    def commit(
        db: Session,
    ) -> None:
        db.commit()

    @staticmethod
    def rollback(
        db: Session,
    ) -> None:
        db.rollback()

    @staticmethod
    def get_ctkm_by_codes(
        db: Session,
        codes: set[str],
    ) -> dict[str, ChuongTrinhKhuyenMai]:
        if not codes:
            return {}

        records = db.scalars(
            select(ChuongTrinhKhuyenMai)
            .where(
                ChuongTrinhKhuyenMai.ma_ctkm.in_(codes)
            )
            .with_for_update()
        ).all()

        return {
            item.ma_ctkm: item
            for item in records
        }

    @staticmethod
    def get_existing_products(
        db: Session,
        codes: set[str],
    ) -> set[str]:
        if not codes:
            return set()

        return set(
            db.scalars(
                select(SanPham.ma_san_pham)
                .where(SanPham.ma_san_pham.in_(codes))
            ).all()
        )

    @staticmethod
    def get_ctkm_products(
        db: Session,
        ma_ctkm: str,
    ) -> set[str]:
        return set(
            db.scalars(
                select(ChiTietCTKM.ma_san_pham)
                .where(ChiTietCTKM.ma_ctkm == ma_ctkm)
            ).all()
        )

    
    @staticmethod
    def get_ctkm_orders(
        db: Session,
        ma_ctkm: str,
    ):
        from sqlalchemy import text

        return db.execute(
            text(
                """
                SELECT
                    ma_don_hang,
                    ma_san_pham,
                    ngay_ban,
                    so_luong_ban,
                    muc_giam_gia,
                    gia_goc,
                    gia_ban_sau_giam
                FROM lich_su_tieu_thu
                WHERE ma_ctkm = :ma_ctkm
                """
            ),
            {"ma_ctkm": ma_ctkm},
        ).all()


    @staticmethod
    def create_ctkm(
        db: Session,
        values: dict,
    ) -> ChuongTrinhKhuyenMai:
        record = ChuongTrinhKhuyenMai(**values)
        db.add(record)
        db.flush()
        return record

    @staticmethod
    def add_ctkm_product(
        db: Session,
        ma_ctkm: str,
        ma_san_pham: str,
    ) -> None:
        db.add(
            ChiTietCTKM(
                ma_ctkm=ma_ctkm,
                ma_san_pham=ma_san_pham,
            )
        )

    @staticmethod
    def remove_ctkm_product(
        db: Session,
        ma_ctkm: str,
        ma_san_pham: str,
    ) -> None:
        record = db.get(
            ChiTietCTKM,
            (ma_ctkm, ma_san_pham),
        )

        if record is not None:
            db.delete(record)
