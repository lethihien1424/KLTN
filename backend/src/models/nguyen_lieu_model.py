from sqlalchemy import (
    Column,
    FetchedValue,
    String,
)

from src.core.database import Base


class NguyenLieu(Base):
    __tablename__ = "nguyen_lieu"

    ma_nguyen_lieu = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ten_nguyen_lieu = Column(
        String(100),
        nullable=False,
        unique=True,
    )

    don_vi_do_luong = Column(
        String(20),
        nullable=False,
        default="kg",
        server_default="kg",
    )

    trang_thai = Column(
        String(30),
        nullable=False,
        default="DANG_SU_DUNG",
        server_default="DANG_SU_DUNG",
    )