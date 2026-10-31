from uuid import uuid4

from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, CheckConstraint, JSON, func
from src.core.database import Base


class StockMovement(Base):
    __tablename__ = "giao_dich_ton_kho"
    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex)
    ma_nguyen_lieu = Column(String(20), ForeignKey("nguyen_lieu.ma_nguyen_lieu"), nullable=False, index=True)
    thoi_gian = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ngay_kiem_ke = Column(Date, nullable=False)
    loai = Column(String(30), nullable=False)
    so_luong = Column(Numeric(14, 2), nullable=False)
    ton_truoc = Column(Numeric(14, 2), nullable=False)
    ton_sau = Column(Numeric(14, 2), nullable=False)
    giu_truoc = Column(Numeric(14, 2), nullable=False)
    giu_sau = Column(Numeric(14, 2), nullable=False)
    tham_chieu = Column(String(100))
    nguoi_thuc_hien = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=False)
    ly_do = Column(String(250), nullable=False)
    ghi_chu = Column(String(2000))
    __table_args__ = (
        CheckConstraint("ton_sau >= 0 AND giu_sau >= 0"),
        CheckConstraint("so_luong = ton_sau - ton_truoc"),
    )


class StockReservation(Base):
    __tablename__ = "giu_nguyen_lieu_san_xuat"
    ma_ke_hoach = Column(String(20), ForeignKey("ke_hoach_san_xuat.ma_ke_hoach"), primary_key=True)
    ma_nguyen_lieu = Column(String(20), ForeignKey("nguyen_lieu.ma_nguyen_lieu"), primary_key=True)
    ma_cong_thuc = Column(String(20), nullable=False)
    so_luong_ke_hoach = Column(Numeric(14, 2), nullable=False)
    so_luong_giu = Column(Numeric(14, 2), nullable=False)
    so_luong_xuat = Column(Numeric(14, 2), nullable=False, default=0)
    da_huy = Column(String(1), nullable=False, default="N")
    __table_args__ = (CheckConstraint("so_luong_giu >= 0 AND so_luong_xuat >= 0 AND so_luong_xuat <= so_luong_giu"),)


class StockOperation(Base):
    __tablename__ = "phieu_xuat_nguyen_lieu"
    id = Column(String(64), primary_key=True)
    ma_ke_hoach = Column(String(20), ForeignKey("ke_hoach_san_xuat.ma_ke_hoach"), nullable=False)
    payload = Column(JSON, nullable=False)
