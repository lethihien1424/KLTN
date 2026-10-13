from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    ForeignKey,
    String,
    Text,
    text,
    JSON,
)

from src.core.database import Base


class NhatKyHoatDong(Base):
    __tablename__ = "nhat_ky_hoat_dong"
    module = Column(String(80), nullable=True)
    chuc_nang = Column(String(100), nullable=True)
    ma_doi_tuong = Column(String(100), nullable=True)
    ten_nguoi_thao_tac = Column(String(255), nullable=True)
    du_lieu_truoc = Column(JSON, nullable=True)
    du_lieu_sau = Column(JSON, nullable=True)

    ma_nhat_ky = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ma_nguoi_dung = Column(
        String(20),
        ForeignKey(
            "users.ma_nguoi_dung",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    hanh_dong = Column(
        String(50),
        nullable=False,
    )

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

    mo_ta = Column(
        Text,
        nullable=True,
    )
