from sqlalchemy import Column, FetchedValue, ForeignKey, Numeric, String

from src.core.database import Base


class ChiTietLichSuDuBao(Base):
    __tablename__ = "chi_tiet_lich_su_du_bao"

    ma_chi_tiet = Column(String(20), primary_key=True, server_default=FetchedValue())
    ma_lich_su_du_bao = Column(String(20), ForeignKey("lich_su_du_bao.ma_lich_su_du_bao"), nullable=False)
    ma_san_pham = Column(String(20), ForeignKey("san_pham.ma_san_pham"), nullable=False)
    ma_nguyen_lieu = Column(String(20), ForeignKey("nguyen_lieu.ma_nguyen_lieu"), nullable=True)
    so_luong_du_bao_kg = Column(Numeric(14, 2), nullable=False)
    mae = Column(Numeric(14, 4), nullable=True)
    rmse = Column(Numeric(14, 4), nullable=True)
    wape = Column(Numeric(10, 6), nullable=True)
    smape = Column(Numeric(10, 6), nullable=True)
