from sqlalchemy import Column, Date, DateTime, FetchedValue, ForeignKey, Numeric, String, Text, UniqueConstraint

from src.core.database import Base


class DonMuaNguyenLieu(Base):
    __tablename__ = "don_mua_nguyen_lieu"

    ma_don_mua = Column(String(20), primary_key=True, server_default=FetchedValue())
    ma_ncc = Column(String(20), ForeignKey("nha_cung_cap.ma_ncc"), nullable=False)
    # The existing database owns the FK to the proposal module (not mapped yet).
    ma_de_xuat = Column(String(20), nullable=True)
    nguoi_tao = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=False)
    ngay_dat_hang = Column(Date, nullable=False)
    ngay_du_kien_giao = Column(Date, nullable=False)
    ngay_giao_thuc_te = Column(Date, nullable=True)
    tong_tien = Column(Numeric(18, 2), nullable=False, server_default="0")
    trang_thai = Column(String(30), nullable=False, server_default="CHUA_DUYET")
    nguoi_duyet = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=True)
    thoi_gian_duyet = Column(DateTime(timezone=True), nullable=True)
    ly_do_tu_choi = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint("ma_de_xuat", "ma_ncc", name="uq_don_mua_de_xuat_ncc"),
    )
