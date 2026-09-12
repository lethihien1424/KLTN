from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    Numeric,
    String,
    text,
)

from src.core.database import Base


class SanPham(Base):
    __tablename__ = "san_pham"

    ma_san_pham = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ten_san_pham = Column(
        String(150),
        nullable=False,
    )

    khoi_luong = Column(
        Numeric(10, 3),
        nullable=False,
    )

    don_vi_do_luong = Column(
        String(20),
        nullable=False,
        default="kg",
        server_default="kg",
    )

    nhom_san_pham = Column(
        String(100),
        nullable=True,
    )

    trang_thai = Column(
        String(30),
        nullable=False,
    )

    don_gia = Column(
        Numeric(15, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    don_vi_tien_te = Column(
        String(10),
        nullable=False,
        default="VND",
        server_default="VND",
    )

    thoi_gian_tao = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    thoi_gian_cap_nhat = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )