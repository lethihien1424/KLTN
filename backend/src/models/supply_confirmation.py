from uuid import uuid4
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text, func, CheckConstraint
from src.core.database import Base


class SupplyConfirmation(Base):
    """Append-only evidence, scoped to supplier/material and optional forecast."""
    __tablename__ = "xac_nhan_cung_ung"
    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex)
    ma_nguyen_lieu_ncc = Column(String(20), ForeignKey("nguyen_lieu_nha_cung_cap.ma_nguyen_lieu_ncc"), nullable=False, index=True)
    ma_lich_su_du_bao = Column(String(20), ForeignKey("lich_su_du_bao.ma_lich_su_du_bao"), nullable=True)
    so_luong_can_mua = Column(Numeric(14, 2), nullable=False)
    so_luong_xac_nhan = Column(Numeric(14, 2), nullable=False)
    ngay_xac_nhan = Column(DateTime(timezone=True), nullable=False)
    hieu_luc_den = Column(DateTime(timezone=True), nullable=False)
    nguoi_xac_nhan = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=False)
    nguon_xac_nhan = Column(String(50), nullable=False)
    ly_do = Column(String(500), nullable=False)
    ghi_chu = Column(Text)
    thoi_gian = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    __table_args__ = (CheckConstraint("so_luong_can_mua > 0 AND so_luong_xac_nhan >= 0 AND hieu_luc_den > ngay_xac_nhan"),)
