from datetime import date, datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer, model_validator


Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Quantity = Annotated[Decimal, Field(gt=0, max_digits=14, decimal_places=2, allow_inf_nan=False)]
TrangThaiDonMua = Literal["CHUA_DUYET", "DA_DUYET", "TU_CHOI", "DA_NHAN_HANG"]
RejectionReason = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class ChiTietDonMuaInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_nguyen_lieu: Code
    so_luong_mua: Quantity


class DonMuaCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_ncc: Code
    ngay_dat_hang: date
    ngay_du_kien_giao: date
    chi_tiet: list[ChiTietDonMuaInput] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_order(self):
        if self.ngay_du_kien_giao < self.ngay_dat_hang:
            raise ValueError("Ngày dự kiến giao phải từ ngày đặt hàng trở đi.")
        codes = [item.ma_nguyen_lieu for item in self.chi_tiet]
        if len(codes) != len(set(codes)):
            raise ValueError("Không được trùng nguyên liệu trong đơn mua.")
        return self


class DonMuaUpdate(DonMuaCreate):
    pass


class DonMuaTuChoiRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ly_do_tu_choi: RejectionReason


class ChiTietNhanHangInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_chi_tiet_don_mua: Code
    so_luong_thuc_nhan: Annotated[
        Decimal, Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)
    ]
    ly_do_khong_nhan: str | None = None


class DonMuaNhanHangRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ngay_giao_thuc_te: date
    chi_tiet: list[ChiTietNhanHangInput] = Field(min_length=1)

    @model_validator(mode="after")
    def unique_details(self):
        codes = [row.ma_chi_tiet_don_mua for row in self.chi_tiet]
        if len(codes) != len(set(codes)):
            raise ValueError("Không được trùng chi tiết đơn mua.")
        return self


class DonMuaResponse(BaseModel):
    ma_don_mua: str
    ma_ncc: str
    ten_ncc: str
    ma_de_xuat: str | None
    nguoi_tao: str
    ngay_dat_hang: date
    ngay_du_kien_giao: date
    ngay_giao_thuc_te: date | None
    tong_tien: Decimal
    trang_thai: TrangThaiDonMua
    nguoi_duyet: str | None
    thoi_gian_duyet: datetime | None
    ly_do_tu_choi: str | None

    @field_serializer("tong_tien")
    def serialize_money(self, value: Decimal):
        return format(value, ".2f")


class ChiTietDonMuaResponse(BaseModel):
    ma_chi_tiet_don_mua: str
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str
    so_luong_mua: Decimal
    don_gia_vnd_kg: Decimal
    thanh_tien: Decimal
    so_luong_thuc_nhan: Decimal
    ly_do_khong_nhan: str | None

    @field_serializer("so_luong_mua", "don_gia_vnd_kg", "thanh_tien", "so_luong_thuc_nhan")
    def serialize_amount(self, value: Decimal):
        return format(value, ".2f")


class DonMuaDetailResponse(DonMuaResponse):
    chi_tiet: list[ChiTietDonMuaResponse]
