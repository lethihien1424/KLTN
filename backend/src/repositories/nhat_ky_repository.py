import logging

from sqlalchemy import inspect
from sqlalchemy.orm import Session

from src.models.nhat_ky_hoat_dong_model import (
    NhatKyHoatDong,
)


logger = logging.getLogger(__name__)


class NhatKyRepository:
    def has_table(
        self,
        db: Session,
    ) -> bool:
        try:
            return inspect(
                db.get_bind()
            ).has_table(
                "nhat_ky_hoat_dong"
            )

        except Exception:
            logger.exception(
                "Không thể kiểm tra bảng "
                "nhật ký hoạt động."
            )

            return False

    def log_action(
        self,
        db: Session,
        ma_nguoi_dung: str | None,
        hanh_dong: str,
        ket_qua: str,
        mo_ta: str | None = None,
    ) -> None:
        try:
            log = NhatKyHoatDong(
                ma_nguoi_dung=ma_nguoi_dung,
                hanh_dong=hanh_dong,
                ket_qua=ket_qua,
                mo_ta=mo_ta,
            )

            db.add(log)

            db.commit()

        except Exception:
            db.rollback()

            logger.exception(
                "Không thể ghi nhật ký "
                "hoạt động."
            )