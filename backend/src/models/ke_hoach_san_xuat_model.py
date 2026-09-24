###D:\KLTN\KLTN\backend\src\models\ke_hoach_san_xuat_model.py
from sqlalchemy import (
    Column,
    Date,
    FetchedValue,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from src.core.database import Base


class KeHoachSanXuat(Base):
    __tablename__ = "ke_hoach_san_xuat"

    ma_ke_hoach = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ma_don_hang = Column(
        String(50),
        nullable=False,
    )

    ngay_don_hang = Column(
        Date,
        nullable=False,
    )

    ma_san_pham = Column(
        String(20),
        ForeignKey("san_pham.ma_san_pham"),
        nullable=False,
    )

    so_luong = Column(
        Integer,
        nullable=False,
    )

    trang_thai_san_xuat = Column(
        String(30),
        nullable=False,
        default="CHO_SAN_XUAT",
        server_default="CHO_SAN_XUAT",
    )

    __table_args__ = (
        UniqueConstraint(
            "ma_don_hang",
            "ma_san_pham",
        ),
    )