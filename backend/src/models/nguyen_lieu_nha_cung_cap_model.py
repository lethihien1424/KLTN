from sqlalchemy import (
    Column,
    FetchedValue,
    ForeignKey,
    Integer,
    Numeric,
    String,
)

from src.core.database import Base


class NguyenLieuNhaCungCap(Base):
    __tablename__ = "nguyen_lieu_nha_cung_cap"

    ma_nguyen_lieu_ncc = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ma_ncc = Column(
        String(20),
        ForeignKey("nha_cung_cap.ma_ncc"),
        nullable=False,
    )

    ma_nguyen_lieu = Column(
        String(20),
        ForeignKey("nguyen_lieu.ma_nguyen_lieu"),
        nullable=False,
    )

    don_gia_nguyen_lieu = Column(
        Numeric(15, 2),
        nullable=False,
    )

    so_luong_ton_kho = Column(
        Numeric(14, 2),
        nullable=False,
    )

    so_luong_book = Column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    so_luong_xuat = Column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    lead_time_ngay = Column(
        Integer,
        nullable=False,
    )

    ty_le_chat_luong_dat = Column(
        Numeric(5, 4),
        nullable=False,
    )

    ty_le_giao_dung_han = Column(
        Numeric(5, 4),
        nullable=False,
    )

    ty_le_giao_du = Column(
        Numeric(5, 4),
        nullable=False,
    )