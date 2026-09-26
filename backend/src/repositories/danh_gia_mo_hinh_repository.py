###D:\KLTN\KLTN\backend\src\repositories\danh_gia_mo_hinh_repository.py
from sqlalchemy.orm import Session

from src.models.danh_gia_mo_hinh import (
    DanhGiaMoHinh,
)


class DanhGiaMoHinhRepository:

    @staticmethod
    def tao_danh_gia(
        db: Session,
        danh_gia: DanhGiaMoHinh,
    ) -> DanhGiaMoHinh:

        db.add(danh_gia)
        db.flush()

        return danh_gia