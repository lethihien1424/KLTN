from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    String,
    Text,
    text,
)

from src.core.database import Base


class NhatKyHoatDong(Base):
    __tablename__ = "nhat_ky_hoat_dong"

    ma_nhat_ky = Column(
        String(20),
        primary_key=True,
        server_default=text(
            "'NKHD' || LPAD("
            "nextval('nhat_ky_hoat_dong_seq')::TEXT, 6, '0'"
            ")"
        ),
    )

    ma_tai_khoan = Column(
        String(20),
        ForeignKey(
            "tai_khoan.ma_tai_khoan",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    hanh_dong = Column(String(50), nullable=False)

    ket_qua = Column(
        String(30),
        nullable=False,
        default="THANH_CONG",
        server_default="THANH_CONG",
    )

    thoi_gian = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    mo_ta = Column(Text, nullable=True)