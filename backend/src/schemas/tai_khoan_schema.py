from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


VaiTro = Literal[
    "ADMIN",
    "QUAN_LY_BAN_HANG",
    "QUAN_LY_MUA_HANG",
    "NHAN_VIEN_BAN_HANG",
    "NHAN_VIEN_MUA_HANG",
]

TrangThai = Literal[
    "HOAT_DONG",
    "NGUNG_HOAT_DONG",
]


class TaiKhoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ma_nguoi_dung: str
    ho_ten: str
    vai_tro: str
    trang_thai: str

    nguoi_thao_tac: str | None = None
    email: str | None = None
    so_dien_thoai: str | None = None
    dia_chi: str | None = None

    thoi_gian_tao: datetime | None = None
    thoi_gian_cap_nhat: datetime | None = None


class TaiKhoanCreateRequest(BaseModel):
    # Backend tự sinh mã, không cần nhập ma_nguoi_dung.
    ho_ten: str = Field(min_length=1, max_length=100)
    mat_khau: str = Field(min_length=1, max_length=72)

    vai_tro: VaiTro
    trang_thai: TrangThai = "HOAT_DONG"

    email: str | None = Field(default=None, max_length=100)
    so_dien_thoai: str | None = Field(default=None, max_length=20)
    dia_chi: str | None = Field(default=None, max_length=255)


class TaiKhoanUpdateRequest(BaseModel):
    ho_ten: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    vai_tro: VaiTro | None = None
    trang_thai: TrangThai | None = None

    email: str | None = Field(default=None, max_length=100)
    so_dien_thoai: str | None = Field(default=None, max_length=20)
    dia_chi: str | None = Field(default=None, max_length=255)

    # Không gửi mat_khau thì giữ mật khẩu cũ.
    mat_khau: str | None = Field(
        default=None,
        min_length=1,
        max_length=72,
    )