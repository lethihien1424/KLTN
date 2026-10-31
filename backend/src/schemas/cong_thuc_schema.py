from src.schemas.ly_do_schema import StatusReasonFields
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer, model_validator


TrangThaiCongThuc = Literal["DANG_SU_DUNG", "NGUNG_SU_DUNG"]
Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Ratio = Annotated[Decimal, Field(gt=0, le=1, max_digits=5, decimal_places=4, allow_inf_nan=False)]
Loss = Annotated[Decimal, Field(ge=0, lt=1, max_digits=5, decimal_places=4, allow_inf_nan=False)]


class ChiTietCongThucInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_nguyen_lieu: Code
    ty_le_phoi_tron: Ratio


class CongThucUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ten_cong_thuc: Name
    he_so_thu_hoi: Ratio
    ty_le_hao_hut: Loss
    chi_tiet: list[ChiTietCongThucInput] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_bom(self):
        codes = [row.ma_nguyen_lieu for row in self.chi_tiet]
        if len(codes) != len(set(codes)):
            raise ValueError("Không được trùng nguyên liệu trong một công thức.")
        total = sum((row.ty_le_phoi_tron for row in self.chi_tiet), Decimal("0"))
        if total != Decimal("1.0000"):
            raise ValueError("Tổng tỷ lệ phối trộn phải bằng 1.0000.")
        if self.he_so_thu_hoi + self.ty_le_hao_hut != Decimal("1"):
            raise ValueError("Hệ số thu hồi + tỷ lệ hao hụt phải bằng 100%.")
        return self


class CongThucCreate(CongThucUpdate):
    ma_san_pham: Code
    trang_thai: TrangThaiCongThuc = "DANG_SU_DUNG"


class CongThucStatusUpdate(StatusReasonFields):
    model_config = ConfigDict(extra="forbid")
    trang_thai: TrangThaiCongThuc


class CongThucEditStatus(CongThucStatusUpdate):
    trang_thai_cu: TrangThaiCongThuc


class CongThucEdit(CongThucUpdate):
    thay_doi_trang_thai: CongThucEditStatus | None = None


class CongThucResponse(BaseModel):
    ma_cong_thuc: str
    ten_cong_thuc: str
    ma_san_pham: str
    ten_san_pham: str
    he_so_thu_hoi: Decimal
    ty_le_hao_hut: Decimal
    trang_thai: TrangThaiCongThuc
    thoi_gian_tao: datetime
    thoi_gian_cap_nhat: datetime

    @field_serializer("he_so_thu_hoi", "ty_le_hao_hut")
    def serialize_ratio(self, value: Decimal):
        return format(value, ".4f")


class ChiTietCongThucResponse(BaseModel):
    ma_chi_tiet_cong_thuc: str
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str
    ty_le_phoi_tron: Decimal

    @field_serializer("ty_le_phoi_tron")
    def serialize_ratio(self, value: Decimal):
        return format(value, ".4f")


class SanPhamDinhLuongResponse(BaseModel):
    ma_san_pham: str
    ten_san_pham: str
    khoi_luong: Decimal | None
    don_vi_do_luong: str | None


class DinhLuongLineResponse(BaseModel):
    ma_nguyen_lieu: str
    ty_le_phoi_tron: Decimal
    khoi_luong_kg: Decimal


class DinhLuongResponse(BaseModel):
    khoi_luong_thanh_pham_kg: Decimal
    tong_nguyen_lieu_kg: Decimal
    hao_hut_kg: Decimal
    chi_tiet: list[DinhLuongLineResponse]


class CongThucDetailResponse(CongThucResponse):
    chi_tiet: list[ChiTietCongThucResponse]
    san_pham: SanPhamDinhLuongResponse | None = None
    dinh_luong: DinhLuongResponse | None = None
    loi_dinh_luong: str | None = None
