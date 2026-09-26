from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer, model_validator


Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Price = Annotated[Decimal, Field(gt=0, max_digits=15, decimal_places=2, allow_inf_nan=False)]
Quantity = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)]
Ratio = Annotated[Decimal, Field(ge=0, le=1, max_digits=5, decimal_places=4, allow_inf_nan=False)]


class SupplyValues(BaseModel):
    model_config = ConfigDict(extra="forbid")

    don_gia_nguyen_lieu: Price
    so_luong_ton_kho: Quantity
    so_luong_book: Quantity = Decimal("0")
    so_luong_xuat: Quantity = Decimal("0")
    lead_time_ngay: int = Field(gt=0)
    ty_le_chat_luong_dat: Ratio
    ty_le_giao_dung_han: Ratio
    ty_le_giao_du: Ratio

    @model_validator(mode="after")
    def validate_quantities(self):
        if self.so_luong_book > self.so_luong_ton_kho:
            raise ValueError("Số lượng book không được lớn hơn số lượng tồn kho NCC.")
        if self.so_luong_xuat > self.so_luong_ton_kho:
            raise ValueError("Số lượng xuất không được lớn hơn số lượng tồn kho NCC.")
        return self


class NguyenLieuNhaCungCapCreate(SupplyValues):
    ma_ncc: Code
    ma_nguyen_lieu: Code


class NguyenLieuNhaCungCapUpdate(SupplyValues):
    pass


class NguyenLieuNhaCungCapResponse(BaseModel):
    ma_nguyen_lieu_ncc: str
    ma_ncc: str
    ten_ncc: str
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str
    don_gia_nguyen_lieu: Decimal
    so_luong_ton_kho: Decimal
    so_luong_book: Decimal
    so_luong_xuat: Decimal
    lead_time_ngay: int
    ty_le_chat_luong_dat: Decimal
    ty_le_giao_dung_han: Decimal
    ty_le_giao_du: Decimal

    @field_serializer(
        "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat"
    )
    def serialize_amount(self, value: Decimal):
        return format(value, ".2f")

    @field_serializer("ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du")
    def serialize_ratio(self, value: Decimal):
        return format(value, ".4f")
