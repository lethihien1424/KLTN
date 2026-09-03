from sqlalchemy import Column, FetchedValue, String

from src.core.database import Base


class TaiKhoan(Base):
    __tablename__ = "tai_khoan"

    ma_tai_khoan = Column(
        String(20),
        primary_key=True,
        server_default=FetchedValue(),
    )

    mat_khau = Column(String(255), nullable=False)
    ho_ten = Column(String(100), nullable=False)
    vai_tro = Column(String(50), nullable=False)

    trang_thai = Column(
        String(30),
        nullable=False,
        default="HOAT_DONG",
        server_default="HOAT_DONG",
    )