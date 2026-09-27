from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer


SupplierName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)
]
SupplierStatus = Literal["DANG_HOAT_DONG", "NGUNG_HOAT_DONG"]
CommercialScore = Annotated[
    Decimal, Field(ge=0, le=100, max_digits=5, decimal_places=2, allow_inf_nan=False)
]


class NhaCungCapCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten_ncc: SupplierName
    trang_thai: SupplierStatus = "DANG_HOAT_DONG"


class NhaCungCapUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten_ncc: SupplierName


class NhaCungCapStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    trang_thai: SupplierStatus


class NhaCungCapResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ma_ncc: str
    ten_ncc: str
    trang_thai: str
    diem_dieu_kien_thuong_mai: Decimal | None
    ty_le_giao_dung_han_thuc_te: Decimal | None
    ty_le_giao_du_thuc_te: Decimal | None

    @field_serializer("diem_dieu_kien_thuong_mai")
    def serialize_score(self, value: Decimal | None):
        return None if value is None else format(value, ".2f")

    @field_serializer("ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te")
    def serialize_delivery_metric(self, value: Decimal | None):
        return None if value is None else format(value, ".2f")


class NhaCungCapScoreResponse(BaseModel):
    ma_ncc: str
    diem_dieu_kien_thuong_mai: Decimal
    ty_le_giao_dung_han_thuc_te: Decimal | None
    ty_le_giao_du_thuc_te: Decimal | None
    so_don_da_nhan: int

    @field_serializer("diem_dieu_kien_thuong_mai")
    def serialize_score(self, value: Decimal):
        return format(value, ".2f")

    @field_serializer("ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te")
    def serialize_delivery_metric(self, value: Decimal | None):
        return None if value is None else format(value, ".2f")


class NhaCungCapScoreBatchResponse(BaseModel):
    so_ncc_da_cap_nhat: int
    nha_cung_cap: list[NhaCungCapScoreResponse]
