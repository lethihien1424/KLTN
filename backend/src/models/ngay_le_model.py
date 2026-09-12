from sqlalchemy import (
    Column,
    Date,
    FetchedValue,
    String,
)

from src.core.database import Base


class NgayLe(Base):
    __tablename__ = "ngay_le"

    ma_ngay_le = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ten_ngay_le = Column(
        String(150),
        nullable=False,
    )

    ngay_bat_dau = Column(
        Date,
        nullable=False,
    )

    ngay_ket_thuc = Column(
        Date,
        nullable=False,
    )

    loai_ngay_le = Column(
        String(50),
        nullable=False,
    )