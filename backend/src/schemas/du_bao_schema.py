# ##D:\KLTN\KLTN\backend\src\schemas\du_bao_schema.py
# from datetime import date, datetime

# from pydantic import BaseModel, Field


# # ==========================================
# # REQUEST
# # ==========================================

# class DuBaoRequest(BaseModel):
#     """
#     Người dùng chỉ chọn số tuần cần dự báo.

#     Hệ thống tự động dự báo toàn bộ
#     sản phẩm đang kinh doanh.
#     """

#     so_tuan_du_bao: int = Field(
#         ...,
#         ge=4,
#         le=8,
#         description=(
#             "Số tuần cần dự báo, "
#             "từ 4 đến 8 tuần."
#         ),
#     )


# # ==========================================
# # FORECAST TƯƠNG LAI
# # ==========================================

# class ChiTietDuBaoResponse(BaseModel):
#     """
#     Kết quả dự báo của một sản phẩm
#     trong một tuần tương lai.
#     """

#     tu_ngay: date
#     den_ngay: date

#     so_luong_du_bao: int

#     can_duoi: int
#     can_tren: int


# class DuBaoSanPhamResponse(BaseModel):
#     """
#     Toàn bộ forecast tương lai
#     của một sản phẩm.
#     """

#     ma_san_pham: str

#     ket_qua: list[
#         ChiTietDuBaoResponse
#     ]


# # ==========================================
# # CHI TIẾT BACKTESTING
# #
# # Phần này hiện dùng để debug:
# # actual <-> forecast.
# # ==========================================

# class ChiTietBacktestResponse(BaseModel):
#     """
#     Một điểm kiểm tra trong backtesting.
#     """

#     fold: int

#     tu_ngay: date
#     den_ngay: date

#     thuc_te: float
#     du_bao: float

#     sai_so: float
#     sai_so_tuyet_doi: float


# # ==========================================
# # KẾT QUẢ ĐÁNH GIÁ MÔ HÌNH
# # ==========================================

# class DanhGiaMoHinhResponse(BaseModel):
#     """
#     Kết quả đánh giá một mô hình
#     cho một sản phẩm.

#     Ví dụ:
#     SP0001 + PROPHET + horizon 4.
#     """

#     ma_san_pham: str

#     mo_hinh: str

#     horizon: int

#     so_fold: int

#     so_diem_danh_gia: int

#     # Prophet = None.
#     # Seasonal Naive = 52.
#     chu_ky: int | None = None

#     mae: float
#     rmse: float

#     # Có thể None nếu tổng actual = 0.
#     wape: float | None = None

#     smape: float

#     # Tạm thời trả ra để kiểm tra
#     # từng điểm backtesting.
#     chi_tiet: list[
#         ChiTietBacktestResponse
#     ] = Field(
#         default_factory=list
#     )


# # ==========================================
# # RESPONSE CHÍNH
# # ==========================================

# class DuBaoResponse(BaseModel):
#     """
#     Response của:
#     POST /api/du-bao/nhu-cau
#     """

#     ma_lich_su_du_bao: str

#     ngay_chay: date

#     so_tuan_du_bao: int

#     thoi_gian_chay: datetime

#     tong_san_pham: int

#     # Kết quả backtesting.
#     danh_gia_mo_hinh: list[
#         DanhGiaMoHinhResponse
#     ]

#     # Forecast tương lai.
#     ket_qua: list[
#         DuBaoSanPhamResponse
#     ]

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class DuBaoRequest(BaseModel):
    """Theo tài liệu đề tài: chọn dự báo 4 hoặc 8 tuần."""

    so_tuan_du_bao: Literal[4, 8] = Field(
        ..., description="Số tuần dự báo: 4 hoặc 8."
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
    chu_ky: int | None = None  # Prophet: None; Seasonal Naive: 52.
    mae: float
    rmse: float
    wape: float | None = None
    smape: float
    chi_tiet: list[ChiTietBacktestResponse] = Field(default_factory=list)


class DuBaoResponse(BaseModel):
    ma_lich_su_du_bao: str
    ngay_chay: date
    so_tuan_du_bao: int
    thoi_gian_chay: datetime
    tong_san_pham: int
    danh_gia_mo_hinh: list[DanhGiaMoHinhResponse]
    ket_qua: list[DuBaoSanPhamResponse]