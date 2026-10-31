from sqlalchemy import Column, ForeignKey, String, Text
from src.core.database import Base


class PurchaseExcelImport(Base):
    """Source metadata only; imported orders use the normal approval workflow."""
    __tablename__ = "purchase_excel_import"

    ma_tham_chieu = Column(String(80), primary_key=True)
    ma_don_mua = Column(String(20), ForeignKey("don_mua_nguyen_lieu.ma_don_mua"), nullable=False, unique=True)
    ghi_chu = Column(Text, nullable=False, server_default="")
