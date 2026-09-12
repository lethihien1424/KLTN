from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    String,
    text,
)

from src.core.database import Base


class User(Base):
    __tablename__ = "users"

    ma_nguoi_dung = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    mat_khau = Column(
        String(255),
        nullable=False,
    )

    ho_ten = Column(
        String(100),
        nullable=False,
    )

    vai_tro = Column(
        String(50),
        nullable=False,
    )

    trang_thai = Column(
        String(30),
        nullable=False,
        default="HOAT_DONG",
        server_default="HOAT_DONG",
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