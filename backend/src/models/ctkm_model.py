
from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
)

from src.core.database import Base


class ChuongTrinhKhuyenMai(Base):
    __tablename__ = "chuong_trinh_khuyen_mai"

    ma_ctkm = Column(String(30), primary_key=True)
    ma_ctkm_goc = Column(String(150), nullable=True)
    ten_ctkm = Column(String(200), nullable=False)
    ngay_bat_dau = Column(Date, nullable=False)
    ngay_ket_thuc = Column(Date, nullable=False)
    so_luong_dat_quy_dinh = Column(Integer, nullable=False)
    hinh_thuc_uu_dai = Column(
        String(30),
        nullable=False,
        default="GIAM_PHAN_TRAM",
    )
    muc_giam_phan_tram = Column(
        Numeric(5, 2),
        nullable=False,
    )
    trang_thai = Column(String(30), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "BTRIM(ten_ctkm) <> ''",
            name="ck_ctkm_ten",
        ),
        CheckConstraint(
            "ngay_ket_thuc >= ngay_bat_dau",
            name="ck_ctkm_ngay",
        ),
        CheckConstraint(
            "so_luong_dat_quy_dinh > 0",
            name="ck_ctkm_so_luong",
        ),
        CheckConstraint(
            "hinh_thuc_uu_dai = 'GIAM_PHAN_TRAM'",
            name="ck_ctkm_hinh_thuc",
        ),
        CheckConstraint(
            "muc_giam_phan_tram > 0 "
            "AND muc_giam_phan_tram <= 100",
            name="ck_ctkm_muc_giam",
        ),
        CheckConstraint(
            "trang_thai IN ("
            "'SAP_DIEN_RA', 'DANG_DIEN_RA', "
            "'KET_THUC', 'HUY')",
            name="ck_ctkm_trang_thai",
        ),
    )


class ChiTietCTKM(Base):
    __tablename__ = "chi_tiet_ctkm"

    ma_ctkm = Column(
        String(30),
        ForeignKey(
            "chuong_trinh_khuyen_mai.ma_ctkm",
            onupdate="CASCADE",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    ma_san_pham = Column(
        String(20),
        ForeignKey(
            "san_pham.ma_san_pham",
            onupdate="CASCADE",
        ),
        primary_key=True,
    )
