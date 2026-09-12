from sqlalchemy import (
    Column,
    FetchedValue,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
)

from src.core.database import Base


class ChiTietCongThuc(Base):
    __tablename__ = "chi_tiet_cong_thuc"

    ma_chi_tiet_cong_thuc = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ma_cong_thuc = Column(
        String(20),
        ForeignKey(
            "cong_thuc.ma_cong_thuc",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    ma_nguyen_lieu = Column(
        String(20),
        ForeignKey("nguyen_lieu.ma_nguyen_lieu"),
        nullable=False,
    )

    ty_le_phoi_tron = Column(
        Numeric(5, 4),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "ma_cong_thuc",
            "ma_nguyen_lieu",
        ),
    )