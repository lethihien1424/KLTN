from datetime import date
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer, model_validator


Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Status = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=30)]
Quantity = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)]


class TonKhoValues(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ton_kho_thuc_te: Quantity
    so_luong_book: Quantity
    ton_kho_an_toan: Quantity
    ton_kho_toi_da: Quantity
    trang_thai: Status

    @model_validator(mode="after")
    def validate_limits(self):
        if self.ton_kho_toi_da < self.ton_kho_an_toan:
            raise ValueError("Tồn kho tối đa phải lớn hơn hoặc bằng tồn kho an toàn.")
        return self


class TonKhoCreate(TonKhoValues):
    ma_nguyen_lieu: Code
    ngay_ghi_nhan: date


class TonKhoUpdate(TonKhoValues):
    pass


class TonKhoResponse(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str
    ngay_ghi_nhan: date
    ton_kho_thuc_te: Decimal
    so_luong_book: Decimal
    ton_kho_kha_dung: Decimal
    ton_kho_an_toan: Decimal
    ton_kho_toi_da: Decimal
    trang_thai: str

    @field_serializer(
        "ton_kho_thuc_te", "so_luong_book", "ton_kho_kha_dung",
        "ton_kho_an_toan", "ton_kho_toi_da",
    )
    def serialize_quantity(self, value: Decimal):
        return format(value, ".2f")
