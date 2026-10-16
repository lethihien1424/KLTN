###D:\KLTN\KLTN\backend\src\models\phan_quyen_model.py
from sqlalchemy import (
    Column,
    DateTime,
    FetchedValue,
    ForeignKey,
    String,
    Text,
    text,
)
from sqlalchemy.orm import relationship

from src.core.database import Base


class NhomQuyen(Base):
    __tablename__ = "nhom_quyen"

    ma = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    ten_quyen = Column(
        String(100),
        nullable=False,
    )

    dien_giai = Column(
        Text,
        nullable=True,
    )

    nguoi_tao = Column(
        String(20),
        ForeignKey(
            "users.ma_nguoi_dung",
            onupdate="CASCADE",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    nguoi_cap_nhat = Column(
        String(20),
        ForeignKey(
            "users.ma_nguoi_dung",
            onupdate="CASCADE",
            ondelete="SET NULL",
        ),
        nullable=True,
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

    vai_tro_ap_dung = relationship(
        "NhomQuyenVaiTro",
        back_populates="nhom_quyen",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    chi_tiet = relationship(
        "ChiTietNhomQuyen",
        back_populates="nhom_quyen",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class NhomQuyenVaiTro(Base):
    __tablename__ = "nhom_quyen_vai_tro"

    ma_nhom_quyen = Column(
        String(20),
        ForeignKey(
            "nhom_quyen.ma",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    vai_tro = Column(
        String(50),
        primary_key=True,
    )

    nhom_quyen = relationship(
        "NhomQuyen",
        back_populates="vai_tro_ap_dung",
    )


class ChiTietNhomQuyen(Base):
    __tablename__ = "chi_tiet_nhom_quyen"

    ma_nhom_quyen = Column(
        String(20),
        ForeignKey(
            "nhom_quyen.ma",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    chuc_nang = Column(
        String(50),
        primary_key=True,
    )

    thao_tac = Column(
        String(30),
        primary_key=True,
    )

    nhom_quyen = relationship(
        "NhomQuyen",
        back_populates="chi_tiet",
    )