###D:\KLTN\KLTN\backend\src\models\lich_su_tieu_thu_model.py
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    FetchedValue,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)

from src.core.database import Base


class LichSuTieuThu(Base):
    __tablename__ = "lich_su_tieu_thu"

    ma_lich_su = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ma_don_hang = Column(
        String(50),
        nullable=False,
    )

    ma_san_pham = Column(
        String(20),
        ForeignKey("san_pham.ma_san_pham"),
        nullable=False,
    )

    ngay_ban = Column(
        Date,
        nullable=False,
    )

    so_luong_ban = Column(
        Integer,
        nullable=False,
    )

    gia_goc = Column(
        Numeric(15, 2),
        nullable=True,
    )

    muc_giam_gia = Column(
        Numeric(5, 4),
        nullable=False,
        default=0,
        server_default="0",
    )

    gia_ban_sau_giam = Column(
        Numeric(15, 2),
        nullable=True,
    )

    co_khuyen_mai = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    chuong_trinh_km = Column(
        String(150),
        nullable=True,
    )

    kenh_ban_hang = Column(
        String(50),
        nullable=True,
    )

    ma_ngay_le = Column(
        String(20),
        ForeignKey(
            "ngay_le.ma_ngay_le",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    trang_thai_san_xuat = Column(
        String(30),
        nullable=False,
        default="DA_SAN_XUAT",
        server_default="DA_SAN_XUAT",
    )

    __table_args__ = (
        UniqueConstraint(
            "ma_don_hang",
            "ma_san_pham",
        ),
    )