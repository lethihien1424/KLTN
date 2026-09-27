from sqlalchemy import Column, Date, DateTime, FetchedValue, ForeignKey, String, Text, text

from src.core.database import Base


class DeXuatNhapHang(Base):
    __tablename__ = "de_xuat_nhap_hang"

    ma_de_xuat = Column(String(20), primary_key=True, server_default=FetchedValue())
    ngay_de_xuat_nhap_hang = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    ngay_tao_de_xuat = Column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    ghi_chu = Column(Text, nullable=True)
    trang_thai = Column(String(30), nullable=False, server_default="CHO_DUYET")
    nguoi_tao = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=True)
    nguoi_duyet = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=True)
    thoi_gian_duyet = Column(DateTime(timezone=True), nullable=True)
    ly_do_tu_choi = Column(Text, nullable=True)
