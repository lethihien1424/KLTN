from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, StringConstraints


TrangThaiNguyenLieu = Literal["DANG_SU_DUNG", "NGUNG_SU_DUNG"]
MaNguyenLieu = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
TenNguyenLieu = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
DonViDoLuong = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]


class NguyenLieuUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ten_nguyen_lieu: TenNguyenLieu
    don_vi_do_luong: DonViDoLuong


class NguyenLieuCreate(NguyenLieuUpdate):
    ma_nguyen_lieu: MaNguyenLieu
    trang_thai: TrangThaiNguyenLieu = "DANG_SU_DUNG"


class NguyenLieuStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    trang_thai: TrangThaiNguyenLieu


class NguyenLieuResponse(NguyenLieuCreate):
    model_config = ConfigDict(from_attributes=True, extra="forbid")
