##D:\KLTN\KLTN\backend\src\repositories\du_bao_repository.py
from sqlalchemy.orm import Session

from src.models.chi_tiet_lich_su_du_bao import (
    ChiTietLichSuDuBao,
)
from src.models.lich_su_du_bao import (
    LichSuDuBao,
)


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