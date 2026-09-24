from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    ForeignKey,
    Integer,
    Numeric,
    String,
    text,
)

from src.core.database import Base


class DanhGiaMoHinh(Base):
    __tablename__ = "danh_gia_mo_hinh"

    ma_danh_gia = Column(
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

    mo_hinh = Column(
        String(30),
        nullable=False,
    )

    horizon = Column(
        Integer,
        nullable=False,
    )

    so_fold = Column(
        Integer,
        nullable=False,
    )

    so_diem_danh_gia = Column(
        Integer,
        nullable=False,
    )

    chu_ky = Column(
        Integer,
        nullable=True,
    )

    mae = Column(
        Numeric(14, 4),
        nullable=False,
    )

    rmse = Column(
        Numeric(14, 4),
        nullable=False,
    )

    wape = Column(
        Numeric(14, 4),
        nullable=True,
    )

    smape = Column(
        Numeric(14, 4),
        nullable=False,
    )

    thoi_gian_tao = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text(
            "CURRENT_TIMESTAMP"
        ),
    )