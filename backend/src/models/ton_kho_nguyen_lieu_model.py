from sqlalchemy import (
    Column,
    Computed,
    Date,
    ForeignKey,
    Numeric,
    String,
)

from src.core.database import Base


class TonKhoNguyenLieu(Base):
    __tablename__ = "ton_kho_nguyen_lieu"

    ma_nguyen_lieu = Column(
        String(20),
        ForeignKey("nguyen_lieu.ma_nguyen_lieu"),
        primary_key=True,
        nullable=False,
    )

    ngay_ghi_nhan = Column(
        Date,
        primary_key=True,
        nullable=False,
    )

    ton_kho_thuc_te = Column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    so_luong_book = Column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    ton_kho_an_toan = Column(
        Numeric(14, 2),
        nullable=False,
        default=0,
        server_default="0",
    )

    ton_kho_toi_da = Column(
        Numeric(14, 2),
        nullable=False,
    )

    ton_kho_kha_dung = Column(
        Numeric(14, 2),
        Computed(
            "ton_kho_thuc_te - so_luong_book",
            persisted=True,
        ),
    )

    trang_thai = Column(
        String(30),
        nullable=False,
    )