from uuid import uuid4
from sqlalchemy import Column, String, Numeric, Date, DateTime, Boolean, ForeignKey, CheckConstraint, UniqueConstraint, JSON, Computed, func, Sequence, text
from src.core.database import Base
from src.core.receipt_numbering import SEQUENCE_NAME, NUMBER_DEFAULT

receipt_number_sequence = Sequence(SEQUENCE_NAME, metadata=Base.metadata)


class DeliveryReceipt(Base):
    __tablename__ = "phieu_nhan_nguyen_lieu"
    ma_phieu_nhan = Column(String(32), primary_key=True, default=lambda: uuid4().hex)
    ma_phieu_nhap = Column(String(32), nullable=False, server_default=text(NUMBER_DEFAULT))
    request_id = Column(String(64), unique=True, nullable=False)
    request_payload = Column(JSON)
    ma_don_mua = Column(String(20), ForeignKey("don_mua_nguyen_lieu.ma_don_mua"), index=True)
    ma_ncc = Column(String(20), ForeignKey("nha_cung_cap.ma_ncc"), nullable=False, index=True)
    nguon = Column(String(15), nullable=False, default="THUC_TE")
    ma_don_cu = Column(String(80))
    lan_giao_cu = Column(String(80))
    ngay_dat_hang = Column(Date, nullable=False)
    ngay_du_kien_giao = Column(Date, nullable=False)
    ngay_giao_thuc_te = Column(Date, nullable=False)
    hoan_tat = Column(Boolean, nullable=False, default=True)
    nguoi_xac_nhan = Column(String(20), ForeignKey("users.ma_nguoi_dung"), nullable=False)
    ghi_chu = Column(String(2000))
    thoi_gian = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    __table_args__ = (
        UniqueConstraint("ma_phieu_nhap", name="uq_phieu_nhan_ma_phieu_nhap"),
        CheckConstraint("ma_phieu_nhap ~ '^PN[0-9]{4,}$'", name="ck_phieu_nhan_ma_phieu_nhap"),
        UniqueConstraint("ma_ncc", "ma_don_cu", "lan_giao_cu", name="uq_phieu_nhan_lich_su"),
        CheckConstraint("ngay_du_kien_giao >= ngay_dat_hang AND ngay_giao_thuc_te >= ngay_dat_hang"),
        CheckConstraint("(nguon='THUC_TE' AND ma_don_mua IS NOT NULL AND ma_don_cu IS NULL) OR (nguon='LICH_SU' AND ma_don_mua IS NULL AND ma_don_cu IS NOT NULL AND lan_giao_cu IS NOT NULL)"),
    )


class DeliveryReceiptLine(Base):
    __tablename__ = "chi_tiet_phieu_nhan_nguyen_lieu"
    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex)
    ma_phieu_nhan = Column(String(32), ForeignKey("phieu_nhan_nguyen_lieu.ma_phieu_nhan"), nullable=False, index=True)
    ma_chi_tiet_don_mua = Column(String(20), ForeignKey("chi_tiet_don_mua.ma_chi_tiet_don_mua"))
    ma_nguyen_lieu = Column(String(20), ForeignKey("nguyen_lieu.ma_nguyen_lieu"), nullable=False)
    don_vi = Column(String(20), nullable=False)
    so_luong_dat = Column(Numeric(14, 2), nullable=False)
    so_luong_giao = Column(Numeric(14, 2), nullable=False)
    so_luong_dat_chat_luong = Column(Numeric(14, 2))
    so_luong_khong_dat = Column(Numeric(14, 2))
    so_luong_nhap_kho = Column(Numeric(14, 2), nullable=False)
    don_gia_mua = Column(Numeric(15, 2))
    don_vi_don_gia = Column(String(20))
    thanh_tien = Column(Numeric(30, 4), Computed("so_luong_nhap_kho * don_gia_mua", persisted=True))
    ly_do = Column(String(2000))
    ma_giao_dich_kho = Column(String(32), ForeignKey("giao_dich_ton_kho.id"))
    __table_args__ = (
        UniqueConstraint("ma_phieu_nhan", "ma_nguyen_lieu"),
        CheckConstraint("(don_gia_mua IS NULL AND don_vi_don_gia IS NULL) OR (don_gia_mua IS NOT NULL AND don_gia_mua >= 0 AND don_vi_don_gia IS NOT NULL AND don_vi_don_gia = don_vi)", name="ck_phieu_nhan_gia_snapshot"),
        CheckConstraint("so_luong_dat > 0 AND so_luong_giao >= 0 AND so_luong_nhap_kho >= 0 AND so_luong_nhap_kho <= so_luong_giao"),
        CheckConstraint("(so_luong_dat_chat_luong IS NULL AND so_luong_khong_dat IS NULL) OR (so_luong_dat_chat_luong IS NOT NULL AND so_luong_khong_dat IS NOT NULL AND so_luong_dat_chat_luong >= 0 AND so_luong_khong_dat >= 0 AND so_luong_dat_chat_luong + so_luong_khong_dat = so_luong_giao AND so_luong_nhap_kho <= so_luong_dat_chat_luong)"),
    )
