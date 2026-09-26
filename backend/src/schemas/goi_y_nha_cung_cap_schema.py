from decimal import Decimal

from pydantic import BaseModel, field_serializer


class GoiYNhaCungCapItemResponse(BaseModel):
    ma_ncc: str
    ten_ncc: str
    don_gia: Decimal
    ton_kho_kha_dung_ncc: Decimal
    lead_time_ngay: int
    diem_ncc: Decimal | None
    ty_le_giao_dung_han_thuc_te: Decimal | None
    ty_le_giao_du_thuc_te: Decimal | None
    du_kha_nang_cung_cap: bool

    @field_serializer("don_gia", "ton_kho_kha_dung_ncc")
    def serialize_amount(self, value: Decimal):
        return format(value, ".2f")

    @field_serializer(
        "diem_ncc", "ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te"
    )
    def serialize_score(self, value: Decimal | None):
        return None if value is None else format(value, ".2f")


class GoiYNhaCungCapResponse(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    so_luong_can_mua: Decimal
    nha_cung_cap: list[GoiYNhaCungCapItemResponse]

    @field_serializer("so_luong_can_mua")
    def serialize_quantity(self, value: Decimal):
        return format(value, ".2f")
