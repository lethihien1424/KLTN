from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class DuBaoRequest(BaseModel):
    so_tuan_du_bao: Literal[4, 8] = Field(
        ...,
        description="Số tuần dự báo: 4 hoặc 8.",
    )


class ChiTietDuBaoResponse(BaseModel):
    tu_ngay: date
    den_ngay: date
    so_luong_du_bao: int
    can_duoi: int
    can_tren: int


class DuBaoSanPhamResponse(BaseModel):
    ma_san_pham: str
    ket_qua: list[ChiTietDuBaoResponse]


class ChiTietBacktestResponse(BaseModel):
    fold: int
    tu_ngay: date
    den_ngay: date
    thuc_te: float
    du_bao: float
    sai_so: float
    sai_so_tuyet_doi: float


class DanhGiaMoHinhResponse(BaseModel):
    ma_san_pham: str
    mo_hinh: str
    horizon: int
    so_fold: int
    so_diem_danh_gia: int
    chu_ky: int | None = None
    mae: float
    rmse: float
    wape: float | None = None
    smape: float

    chi_tiet: list[ChiTietBacktestResponse] = Field(
        default_factory=list,
    )


class DuBaoResponse(BaseModel):
    ma_lich_su_du_bao: str
    ngay_chay: date
    so_tuan_du_bao: Literal[4, 8]
    thoi_gian_chay: datetime
    tong_san_pham: int
    danh_gia_mo_hinh: list[DanhGiaMoHinhResponse]
    ket_qua: list[DuBaoSanPhamResponse]


class LichSuDuBaoResponse(BaseModel):
    ma_lich_su_du_bao: str
    thoi_gian_chay: datetime
    ngay_bat_dau_huan_luyen: date | None = None
    ngay_ket_thuc_huan_luyen: date | None = None
    so_tuan_du_bao: Literal[4, 8]
    nguoi_thuc_hien: str | None = None
    ho_ten_nguoi_thuc_hien: str | None = None
    trang_thai: str