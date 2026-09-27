from sqlalchemy import Column, FetchedValue, ForeignKey, Numeric, String, UniqueConstraint

from src.core.database import Base


class ChiTietDeXuatNhapHang(Base):
    __tablename__ = "chi_tiet_de_xuat_nhap_hang"

    ma_chi_tiet = Column(String(20), primary_key=True, server_default=FetchedValue())
    ma_de_xuat = Column(String(20), ForeignKey("de_xuat_nhap_hang.ma_de_xuat", ondelete="CASCADE"), nullable=False)
    ma_nguyen_lieu = Column(String(20), ForeignKey("nguyen_lieu.ma_nguyen_lieu"), nullable=False)
    ma_ncc = Column(String(20), ForeignKey("nha_cung_cap.ma_ncc"), nullable=True)
    so_luong_de_xuat_kg = Column(Numeric(14, 2), nullable=False)
    don_gia_du_kien = Column(Numeric(15, 2), nullable=True)

    __table_args__ = (UniqueConstraint("ma_de_xuat", "ma_nguyen_lieu", "ma_ncc"),)
