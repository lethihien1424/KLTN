from sqlalchemy import Column, FetchedValue, ForeignKey, Numeric, String, Text

from src.core.database import Base


class ChiTietDonMua(Base):
    __tablename__ = "chi_tiet_don_mua"

    ma_chi_tiet_don_mua = Column(String(20), primary_key=True, server_default=FetchedValue())
    ma_don_mua = Column(String(20), ForeignKey("don_mua_nguyen_lieu.ma_don_mua"), nullable=False)
    ma_nguyen_lieu = Column(String(20), ForeignKey("nguyen_lieu.ma_nguyen_lieu"), nullable=False)
    so_luong_mua = Column(Numeric(14, 2), nullable=False)
    don_gia_vnd_kg = Column(Numeric(15, 2), nullable=False)
    so_luong_thuc_nhan = Column(Numeric(14, 2), nullable=False, server_default="0")
    ly_do_khong_nhan = Column(Text, nullable=True)
