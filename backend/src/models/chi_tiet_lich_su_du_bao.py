###D:\KLTN\KLTN\backend\src\models\chi_tiet_lich_su_du_bao.py
from sqlalchemy import (
    Column,
    Date,
    FetchedValue,
    ForeignKey,
    Integer,
    Numeric,
    String,
)

from src.core.database import Base


class ChiTietLichSuDuBao(Base):
    __tablename__ = "chi_tiet_lich_su_du_bao"

    ma_chi_tiet = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ma_lich_su_du_bao = Column(
        String(20),
        ForeignKey(
            "lich_su_du_bao.ma_lich_su_du_bao",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    ma_san_pham = Column(
        String(20),
        ForeignKey(
            "san_pham.ma_san_pham"
        ),
        nullable=False,
    )

    ma_nguyen_lieu = Column(
        String(20),
        ForeignKey(
            "nguyen_lieu.ma_nguyen_lieu",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    tu_ngay = Column(
        Date,
        nullable=False,
    )

    den_ngay = Column(
        Date,
        nullable=False,
    )

    so_luong_du_bao = Column(
        Integer,
        nullable=False,
    )

    can_duoi = Column(
        Integer,
        nullable=True,
    )

    can_tren = Column(
        Integer,
        nullable=True,
    )

    so_luong_du_bao_kg = Column(
        Numeric(14, 2),
        nullable=True,
    )