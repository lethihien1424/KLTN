### D:\KLTN\KLTN\backend\src\schemas\du_bao_schema.py
from datetime import date, datetime
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class KhuyenMaiDuBaoRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    ma_san_pham: str = Field(
        min_length=1,
        max_length=20,
    )
    tu_ngay: date
    muc_giam_gia: float = Field(ge=0, le=1)
    chuong_trinh_km: str = Field(
        min_length=1,
        max_length=150,
    )

    @field_validator("tu_ngay")
    @classmethod
    def validate_monday(cls, value: date) -> date:
        if value.weekday() != 0:
            raise ValueError(
                "Tuần khuyến mãi phải bắt đầu vào Thứ Hai."
            )
        return value


class DuBaoRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )

    so_tuan_du_bao: int = Field(
        default=4,
        strict=True,
        ge=1,
        le=8,
    )

    ma_san_pham: list[str] | None = Field(
        default=None,
        min_length=1,
    )

    khuyen_mai: list[KhuyenMaiDuBaoRequest] = Field(
        default_factory=list,
        max_length=1000,
    )

    @field_validator("ma_san_pham")
    @classmethod
    def normalize_products(
        cls,
        value: list[str] | None,
    ) -> list[str] | None:

        if value is None:
            return None

        normalized = []
        seen = set()

        for product_id in value:
            if not isinstance(product_id, str):
                raise ValueError(
                    "Mã sản phẩm phải là chuỗi."
                )

            product_id = product_id.strip()

            if not product_id:
                raise ValueError(
                    "Mã sản phẩm không được để trống."
                )

            if len(product_id) > 20:
                raise ValueError(
                    "Mã sản phẩm không được vượt quá 20 ký tự."
                )

            if product_id in seen:
                raise ValueError(
                    f"Mã sản phẩm {product_id} bị trùng."
                )

            seen.add(product_id)
            normalized.append(product_id)

        return normalized

    @model_validator(mode="after")
    def validate_duplicates(self):

        keys = [
            (item.ma_san_pham, item.tu_ngay)
            for item in self.khuyen_mai
        ]

        if len(keys) != len(set(keys)):
            raise ValueError(
                "Một sản phẩm không được có hai lịch "
                "khuyến mãi trong cùng tuần."
            )

        return self


class YeuToDuBaoResponse(BaseModel):
    ten: str
    so_luong: float = 0
    dien_giai: str = ""


class ChiTietDuBaoResponse(BaseModel):
    tu_ngay: date
    den_ngay: date

    so_luong_du_bao: int = Field(ge=0)
    can_duoi: int = Field(ge=0)
    can_tren: int = Field(ge=0)

    ky_truoc: float | None = None

    loai_ky_truoc: Literal[
        "THUC_TE_TUAN_TRUOC",
        "THUC_TE_GAN_NHAT",
        "DU_BAO_TUAN_TRUOC",
        "CHUA_CO_DU_LIEU",
    ] = "CHUA_CO_DU_LIEU"

    # Thứ Hai của tuần thực tế được dùng làm kỳ trước
    # (chỉ có khi loai_ky_truoc là THUC_TE_*).
    ky_truoc_tu_ngay: date | None = None

    chenh_lech: float | None = None
    ty_le_thay_doi: float | None = None

    # Seasonal Naive 52 tuần: dự báo = thực tế cùng tuần năm trước.
    cung_ky: float | None = None

    ngay_le: list[str] = Field(
        default_factory=list,
    )

    chuong_trinh_km: str | None = None

    muc_giam_gia: float = Field(
        default=0,
        ge=0,
        le=1,
    )

    so_luong_du_bao_kg: float | None = None

    yeu_to: list[YeuToDuBaoResponse] = Field(
        default_factory=list,
    )

    @model_validator(mode="after")
    def validate_bounds(self):
        if not (
            self.can_duoi
            <= self.so_luong_du_bao
            <= self.can_tren
        ):
            raise ValueError(
                "Cận dự báo phải bao gồm "
                "giá trị dự báo trung tâm."
            )

        return self


class DuBaoSanPhamResponse(BaseModel):
    ma_san_pham: str
    ten_san_pham: str = ""

    ket_qua: list[ChiTietDuBaoResponse]

    tong_du_bao: int = 0
    tong_ky_truoc: float | None = None
    loai_tong_ky_truoc: str = ""
    tong_ky_truoc_tu_ngay: date | None = None
    tong_ky_truoc_den_ngay: date | None = None

    chenh_lech: float | None = None
    ty_le_thay_doi: float | None = None

    phan_loai: str = "Chưa phân loại"
    dien_giai: str = ""

    yeu_to: list[YeuToDuBaoResponse] = Field(
        default_factory=list,
    )

    cau_hinh: dict = Field(
        default_factory=dict,
    )

    canh_bao: list[str] = Field(
        default_factory=list,
    )


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

    horizon: int = Field(ge=1, le=8)
    so_fold: int = Field(ge=1)
    so_diem_danh_gia: int = Field(ge=1)

    chu_ky: int | None = None

    mae: float = Field(ge=0)
    rmse: float = Field(ge=0)

    wape: float | None = Field(
        default=None,
        ge=0,
    )

    smape: float = Field(ge=0)

    chi_tiet: list[ChiTietBacktestResponse] = Field(
        default_factory=list,
    )


class SoSanhMoHinhResponse(BaseModel):
    ma_san_pham: str

    prophet_mae: float
    seasonal_naive_mae: float

    prophet_rmse: float
    seasonal_naive_rmse: float

    prophet_smape: float
    seasonal_naive_smape: float

    prophet_wape: float | None = None
    seasonal_naive_wape: float | None = None

    mo_hinh_tot_hon_theo_mae: str
    chenh_lech_mae: float

    ty_le_cai_thien_mae: float | None = None

    dien_giai: str


class DuBaoResponse(BaseModel):
    ma_lich_su_du_bao: str
    ngay_chay: date

    so_tuan_du_bao: int = Field(ge=1, le=8)
    thoi_gian_chay: datetime
    tong_san_pham: int

    ngay_bat_dau_huan_luyen: date | None = None
    ngay_ket_thuc_huan_luyen: date | None = None

    # Ngày có đơn hàng cuối cùng trong toàn bộ dữ liệu bán hàng.
    ngay_du_lieu_cuoi: date | None = None

    danh_gia_mo_hinh: list[DanhGiaMoHinhResponse]
    ket_qua: list[DuBaoSanPhamResponse]

    so_sanh_mo_hinh: list[
        SoSanhMoHinhResponse
    ] = Field(default_factory=list)

    canh_bao: list[str] = Field(
        default_factory=list,
    )

    ghi_chu_danh_gia: str = ""


class LichSuDuBaoResponse(BaseModel):
    ma_lich_su_du_bao: str
    thoi_gian_chay: datetime

    ngay_bat_dau_huan_luyen: date | None = None
    ngay_ket_thuc_huan_luyen: date | None = None

    so_tuan_du_bao: int

    nguoi_thuc_hien: str | None = None
    ho_ten_nguoi_thuc_hien: str | None = None

    trang_thai: str
    tong_san_pham: int = 0
    kieu_du_bao: str = ""