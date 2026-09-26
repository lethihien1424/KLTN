from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_serializer


class DashboardMaterialSummary(BaseModel):
    tong_so: int
    duoi_ton_an_toan: int


class DashboardPurchaseValues(BaseModel):
    gia_tri_da_duyet: Decimal
    gia_tri_da_nhan_hang: Decimal

    @field_serializer("gia_tri_da_duyet", "gia_tri_da_nhan_hang")
    def serialize_money(self, value: Decimal):
        return format(value, ".2f")


class DashboardSupplierSummary(BaseModel):
    tong_so: int
    co_du_lieu_hieu_suat_thuc_te: int


class DashboardOverviewResponse(BaseModel):
    nguyen_lieu: DashboardMaterialSummary
    de_xuat_nhap_hang: dict[str, int]
    don_mua: dict[str, int]
    mua_hang: DashboardPurchaseValues
    nha_cung_cap: DashboardSupplierSummary


class DashboardInventoryAlert(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    don_vi_do_luong: str
    ngay_ghi_nhan: date
    ton_kho_thuc_te: Decimal
    so_luong_book: Decimal
    ton_kho_kha_dung: Decimal
    ton_kho_an_toan: Decimal
    so_luong_thieu_an_toan: Decimal

    @field_serializer(
        "ton_kho_thuc_te", "so_luong_book", "ton_kho_kha_dung",
        "ton_kho_an_toan", "so_luong_thieu_an_toan",
    )
    def serialize_quantity(self, value: Decimal):
        return format(value, ".2f")


class DashboardSupplierPerformance(BaseModel):
    ma_ncc: str
    ten_ncc: str
    diem_ncc: Decimal | None
    ty_le_giao_dung_han_thuc_te: Decimal | None
    ty_le_giao_du_thuc_te: Decimal | None

    @field_serializer(
        "diem_ncc", "ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te"
    )
    def serialize_score(self, value: Decimal | None):
        return None if value is None else format(value, ".2f")
