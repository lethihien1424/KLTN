from sqlalchemy import (
    Column,
    FetchedValue,
    Numeric,
    String,
)

from src.core.database import Base


class NhaCungCap(Base):
    __tablename__ = "nha_cung_cap"

    ma_ncc = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ten_ncc = Column(
        String(150),
        nullable=False,
    )

    trang_thai = Column(
        String(30),
        nullable=False,
        default="DANG_HOAT_DONG",
        server_default="DANG_HOAT_DONG",
    )

    diem_dieu_kien_thuong_mai = Column(
        Numeric(5, 2),
        nullable=True,
        default=0,
        server_default="0",
    )