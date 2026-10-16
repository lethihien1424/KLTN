###D:\KLTN\KLTN\backend\src\schemas\du_lieu_ban_hang_schema.py
from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal
from zoneinfo import ZoneInfo

from pydantic import BaseModel, ConfigDict, Field, model_validator

TrangThaiDonHang = Literal["CHO_GIAO_HANG", "DA_GIAO_HANG"]


class DuLieuBanHangCreateRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    ma_don_hang: str = Field(min_length=1, max_length=50)
    ma_san_pham: str = Field(min_length=1, max_length=20)
    ngay_ban: date
    ngay_giao_hang: date | None = None
    so_luong: int = Field(strict=True, gt=0, le=2147483647)
    trang_thai_don_hang: TrangThaiDonHang = "CHO_GIAO_HANG"
    gia_goc: Decimal | None = Field(default=None, ge=0, max_digits=15, decimal_places=2)
    muc_giam_gia: Decimal = Field(default=Decimal("0"), ge=0, le=1, max_digits=5, decimal_places=4)
    gia_ban_sau_giam: Decimal | None = Field(default=None, ge=0, max_digits=15, decimal_places=2)
    co_khuyen_mai: bool = False
    chuong_trinh_km: str | None = Field(default=None, max_length=150)
    ma_ctkm: str | None = Field(default=None, max_length=30)
    kenh_ban_hang: str | None = Field(default=None, max_length=50)
    ma_ngay_le: str | None = Field(default=None, max_length=20)

    @model_validator(mode="after")
    def validate_business_rules(self):
        for name in ("chuong_trinh_km", "ma_ctkm", "kenh_ban_hang", "ma_ngay_le"):
            if getattr(self, name) == "":
                setattr(self, name, None)

        if not self.co_khuyen_mai and (
            self.muc_giam_gia != 0
            or self.chuong_trinh_km is not None
            or self.ma_ctkm is not None
        ):
            raise ValueError("Đơn không có khuyến mãi thì mức giảm phải bằng 0 và không được gắn CTKM.")

        today = datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()
        if self.trang_thai_don_hang == "CHO_GIAO_HANG":
            if self.ngay_giao_hang is not None:
                raise ValueError("Đơn chờ giao chưa có ngày giao thực tế.")
        else:
            if self.ngay_ban > today:
                raise ValueError("Đơn đã giao không được có ngày bán tương lai.")
            if self.ngay_giao_hang is not None:
                if self.ngay_giao_hang < self.ngay_ban:
                    raise ValueError("Ngày giao không được trước ngày bán.")
                if self.ngay_giao_hang > today:
                    raise ValueError("Ngày giao thực tế không được ở tương lai.")

        if self.gia_goc is None and self.gia_ban_sau_giam is not None:
            raise ValueError("Phải có giá gốc để kiểm tra giá sau giảm.")
        if self.gia_goc is not None:
            expected = (
                self.gia_goc * (Decimal("1") - self.muc_giam_gia)
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if self.gia_ban_sau_giam is not None and self.gia_ban_sau_giam != expected:
                raise ValueError(f"Giá bán sau giảm phải bằng {expected}.")
            self.gia_ban_sau_giam = expected
        return self


class DuLieuBanHangCreateResponse(BaseModel):
    ma: str
    bang_luu: Literal["lich_su_tieu_thu"]
    ma_don_hang: str
    ma_san_pham: str
    ten_san_pham: str
    ngay_ban: date
    ngay_giao_hang: date | None
    so_luong: int
    trang_thai_don_hang: TrangThaiDonHang
    trang_thai_san_xuat: str
    gia_goc: Decimal | None
    muc_giam_gia: Decimal
    gia_ban_sau_giam: Decimal | None
    thanh_tien: Decimal | None
    co_khuyen_mai: bool
    chuong_trinh_km: str | None
    ma_ctkm: str | None
    kenh_ban_hang: str | None
    ma_ngay_le: str | None


class SanPhamBanHangOption(BaseModel):
    ma: str
    ten: str
    don_gia: Decimal
    don_vi_tien_te: str


class NgayLeBanHangOption(BaseModel):
    ma: str
    ten: str


class DanhMucBanHangResponse(BaseModel):
    san_pham: list[SanPhamBanHangOption]
    ngay_le: list[NgayLeBanHangOption]
