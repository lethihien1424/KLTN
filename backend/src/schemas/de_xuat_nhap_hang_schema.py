from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer, model_validator

from src.schemas.don_mua_schema import DonMuaDetailResponse


Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Quantity = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2, allow_inf_nan=False)]
TrangThaiDeXuat = Literal["CHO_DUYET", "DA_DUYET", "TU_CHOI"]
RejectionReason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ChiTietDeXuatInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_nguyen_lieu: Code
    ma_ncc: Code
    so_luong_de_xuat_kg: Quantity


class DeXuatNhapHangCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ghi_chu: str | None = None
    chi_tiet: list[ChiTietDeXuatInput] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_pairs(self):
        pairs = [(row.ma_nguyen_lieu, row.ma_ncc) for row in self.chi_tiet]
        if len(pairs) != len(set(pairs)):
            raise ValueError("Không được trùng nguyên liệu và nhà cung cấp trong đề xuất.")
        return self


class DeXuatNhapHangSummaryResponse(BaseModel):
    ma_de_xuat: str
    ngay_de_xuat_nhap_hang: date
    ngay_tao_de_xuat: datetime
    ghi_chu: str | None
    trang_thai: TrangThaiDeXuat
    nguoi_tao: str | None
    nguoi_duyet: str | None
    thoi_gian_duyet: datetime | None
    ly_do_tu_choi: str | None


class DeXuatTuChoiRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ly_do_tu_choi: RejectionReason


class TaoDonMuaTuDeXuatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_du_kien_giao: date


class TaoDonMuaTuDeXuatResponse(BaseModel):
    ma_de_xuat: str
    don_mua: list[DonMuaDetailResponse]


class ChiTietDeXuatResponse(BaseModel):
    ma_chi_tiet: str
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    ma_ncc: str
    ten_ncc: str
    so_luong_de_xuat_kg: Decimal
    don_gia_du_kien: Decimal

    @field_serializer("so_luong_de_xuat_kg", "don_gia_du_kien")
    def serialize_amount(self, value: Decimal):
        return format(value, ".2f")


class DeXuatNhapHangDetailResponse(DeXuatNhapHangSummaryResponse):
    chi_tiet: list[ChiTietDeXuatResponse]
