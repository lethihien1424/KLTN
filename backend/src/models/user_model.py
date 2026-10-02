### D:\KLTN\KLTN\backend\src\models\user_model.py
from sqlalchemy import Column, DateTime, FetchedValue, String, text

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

    nguoi_thao_tac = Column(
        String(20),
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

    email = Column(
        String(100),
        nullable=True,
    )

    so_dien_thoai = Column(
        String(20),
        nullable=True,
    )

    dia_chi = Column(
        String(255),
        nullable=True,
    )