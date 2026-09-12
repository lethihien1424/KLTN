from datetime import date
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


class KeHoachSanXuat(Base):
    __tablename__ = "ke_hoach_san_xuat"

    ma_ke_hoach: Mapped[UUID] = mapped_column(
        primary_key=True,
    )

    ma_don_hang: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    ngay_don_hang: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    ma_san_pham: Mapped[str] = mapped_column(
        String(20),
        ForeignKey("san_pham.ma_san_pham"),
        nullable=False,
    )

    so_luong: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    trang_thai_san_xuat: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="CHO_SAN_XUAT",
    )

    san_pham = relationship(
        "SanPham",
        back_populates="ke_hoach_san_xuat",
    )