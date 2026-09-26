from sqlalchemy import Column, Date, DateTime, FetchedValue, Integer, JSON, String, text

from src.core.database import Base


class LichSuDuBao(Base):
    __tablename__ = "lich_su_du_bao"

    ma_lich_su_du_bao = Column(String(20), primary_key=True, server_default=FetchedValue())
    ngay_bat_dau_huan_luyen = Column(Date, nullable=False)
    ngay_ket_thuc_huan_luyen = Column(Date, nullable=False)
    so_tuan_du_bao = Column(Integer, nullable=False)
    cau_hinh_mo_hinh = Column(String(50), nullable=False)
    thoi_gian_chay = Column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    tham_so = Column(JSON, nullable=True)
    trang_thai = Column(String(30), nullable=False)
    nguoi_thuc_hien = Column(String(20), nullable=True)
    thoi_gian_tao = Column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
