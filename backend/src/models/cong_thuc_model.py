from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    ForeignKey,
    Numeric,
    String,
    text,
)

from src.core.database import Base


class CongThuc(Base):
    __tablename__ = "cong_thuc"

    ma_cong_thuc = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ten_cong_thuc = Column(
        String(150),
        nullable=False,
    )

    ma_san_pham = Column(
        String(20),
        ForeignKey("san_pham.ma_san_pham"),
        nullable=False,
    )

    he_so_thu_hoi = Column(
        Numeric(5, 4),
        nullable=False,
    )

    ty_le_hao_hut = Column(
        Numeric(5, 4),
        nullable=False,
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

    trang_thai = Column(
        String(30),
        nullable=False,
        default="DANG_SU_DUNG",
        server_default="DANG_SU_DUNG",
    )