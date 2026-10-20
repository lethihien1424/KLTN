##D:\KLTN\KLTN\backend\src\models\ly_do_model.py
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, text
from src.core.database import Base


class LyDo(Base):
    __tablename__ = "ly_do"
    id = Column(String(40), primary_key=True)
    ma_ly_do = Column(String(40), unique=True, nullable=False)
    ten_ly_do = Column(String(250), nullable=False)
    ghi_chu = Column(Text)
    trang_thai = Column(String(30), nullable=False, server_default="DANG_SU_DUNG")
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    created_by = Column(String(20), ForeignKey("users.ma_nguoi_dung", ondelete="SET NULL"))
    updated_by = Column(String(20), ForeignKey("users.ma_nguoi_dung", ondelete="SET NULL"))
    __table_args__ = (CheckConstraint("trang_thai IN ('DANG_SU_DUNG','NGUNG_SU_DUNG')"),)


class LyDoChucNang(Base):
    __tablename__ = "ly_do_chuc_nang"
    id = Column(String(40), primary_key=True)
    ly_do_id = Column(String(40), ForeignKey("ly_do.id", ondelete="CASCADE"), nullable=False)
    chuc_nang = Column(String(60), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), nullable=False)
    __table_args__ = (UniqueConstraint("ly_do_id", "chuc_nang"), CheckConstraint("chuc_nang IN ('DOI_TRANG_THAI_NGUYEN_LIEU','DOI_TRANG_THAI_CONG_THUC','DOI_TRANG_THAI_NHA_CUNG_CAP')"))
