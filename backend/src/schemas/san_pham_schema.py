### D:\KLTN\KLTN\backend\src\schemas\san_pham_schema.py
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


ProductStatus = Literal[
    "DANG_KINH_DOANH",
    "NGUNG_BAN",
]


class SanPhamRequest(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    ten_san_pham: str = Field(
        min_length=1,
        max_length=150,
    )

    # API và DB lưu kg.
    # Frontend nhập gam và chuyển sang kg trước khi gửi.
    khoi_luong: Decimal = Field(
        gt=0,
        max_digits=10,
        decimal_places=3,
    )

    don_vi_do_luong: Literal["kg"] = "kg"

    nhom_san_pham: str | None = Field(
        default=None,
        max_length=100,
    )

    trang_thai: ProductStatus = "DANG_KINH_DOANH"

    # Bắt buộc gửi giá; không tự mặc định bằng 0.
    don_gia: Decimal = Field(
        ge=0,
        max_digits=15,
        decimal_places=2,
    )

    don_vi_tien_te: Literal["VND"] = "VND"

    @field_validator("nhom_san_pham")
    @classmethod
    def normalize_group(
        cls,
        value: str | None,
    ) -> str | None:
        return value or None


class SanPhamResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    ma_san_pham: str
    ten_san_pham: str

    khoi_luong: Decimal
    don_vi_do_luong: str

    nhom_san_pham: str | None
    trang_thai: ProductStatus

    don_gia: Decimal
    don_vi_tien_te: str

    thoi_gian_tao: datetime
    thoi_gian_cap_nhat: datetime


class SanPhamListResponse(BaseModel):
    items: list[SanPhamResponse]
    total: int
    page: int
    page_size: int