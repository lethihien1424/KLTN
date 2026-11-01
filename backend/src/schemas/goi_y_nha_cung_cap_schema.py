from decimal import Decimal

from pydantic import BaseModel, field_serializer


class GoiYNhaCungCapItemResponse(BaseModel):
    giai_thich_xep_hang: dict | None = None
    ma_ncc: str
    ten_ncc: str
    don_gia: Decimal
    ma_nguyen_lieu_ncc: str
    trang_thai_cung_ung: str
    xac_nhan: dict | None
    do_day_du_kpi: Decimal
    diem_xep_hang: Decimal
    nguon_diem: str
    lead_time_ngay: int
    diem_ncc: Decimal | None
    ty_le_giao_dung_han_thuc_te: Decimal | None
    ty_le_giao_du_thuc_te: Decimal | None
    du_kha_nang_cung_cap: bool

    @field_serializer("don_gia")
    def serialize_amount(self, value: Decimal):
        return format(value, ".2f")

    @field_serializer(
        "diem_ncc", "ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te"
    )
    def serialize_score(self, value: Decimal | None):
        return None if value is None else format(value, ".2f")


class GoiYNhaCungCapResponse(BaseModel):
    chinh_sach_xep_hang: dict | None = None
    tinh_luc: str | None = None
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    so_luong_can_mua: Decimal
    nha_cung_cap: list[GoiYNhaCungCapItemResponse]

    @field_serializer("so_luong_can_mua")
    def serialize_quantity(self, value: Decimal):
        return format(value, ".2f")
