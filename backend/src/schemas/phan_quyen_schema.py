####D:\KLTN\KLTN\backend\src\schemas\phan_quyen_schema.py
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


VaiTro = Literal[
    "ADMIN",
    "QUAN_LY_BAN_HANG",
    "QUAN_LY_MUA_HANG",
    "NHAN_VIEN_BAN_HANG",
    "NHAN_VIEN_MUA_HANG",
]

ThaoTac = Literal[
    "XEM",
    "THEM",
    "SUA",
    "XOA",
    "DUYET",
    "TU_CHOI",
    "CHAY_DU_BAO",
    "NHAP_FILE",
    "XUAT_EXCEL",
]


class ChiTietQuyen(BaseModel):
    chuc_nang: str = Field(
        min_length=1,
        max_length=50,
    )

    thao_tac: ThaoTac


class NhomQuyenRequest(BaseModel):
    ten_quyen: str = Field(
        min_length=1,
        max_length=100,
    )

    dien_giai: str | None = None

    vai_tro: list[VaiTro] = Field(
        default_factory=list,
    )

    chi_tiet: list[ChiTietQuyen] = Field(
        default_factory=list,
    )

    @field_validator("ten_quyen")
    @classmethod
    def validate_ten_quyen(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "Tên quyền không được để trống."
            )

        return value

    @field_validator("dien_giai")
    @classmethod
    def normalize_dien_giai(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return value.strip() or None


class NhomQuyenResponse(BaseModel):
    ma: str
    ten_quyen: str
    dien_giai: str | None

    vai_tro: list[str]
    chi_tiet: list[ChiTietQuyen]

    duoc_xoa: bool

    nguoi_tao: str | None
    nguoi_cap_nhat: str | None

    thoi_gian_tao: datetime
    thoi_gian_cap_nhat: datetime


class VaiTroDanhMuc(BaseModel):
    ma: str
    ten: str


class ThaoTacDanhMuc(BaseModel):
    ma: str
    ten: str


class ChucNangDanhMuc(BaseModel):
    ma: str
    ten: str
    thao_tac: list[str]


class DanhMucPhanQuyenResponse(BaseModel):
    vai_tro: list[VaiTroDanhMuc]
    thao_tac: list[ThaoTacDanhMuc]
    chuc_nang: list[ChucNangDanhMuc]


class QuyenCuaToiResponse(BaseModel):
    ma_nguoi_dung: str
    vai_tro: str
    chi_tiet: list[ChiTietQuyen]