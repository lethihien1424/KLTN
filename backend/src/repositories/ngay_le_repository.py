###D:\KLTN\KLTN\backend\src\repositories\ngay_le_repository.py
from datetime import date

from sqlalchemy.orm import Session

from src.models.ngay_le_model import NgayLe


class NgayLeRepository:
    @staticmethod
    def get_ngay_le_trong_khoang(
        db: Session,
        tu_ngay: date,
        den_ngay: date,
    ):
        """
        Lấy các ngày lễ có khoảng thời gian
        giao với khoảng thời gian cần xử lý.
        """
        return (
            db.query(NgayLe)
            .filter(
                NgayLe.ngay_bat_dau <= den_ngay,
                NgayLe.ngay_ket_thuc >= tu_ngay,
            )
            .order_by(NgayLe.ngay_bat_dau.asc())
            .all()
        )

    @staticmethod
    def get_tat_ca_ngay_le(
        db: Session,
    ):
        return (
            db.query(NgayLe)
            .order_by(NgayLe.ngay_bat_dau.asc())
            .all()
        )