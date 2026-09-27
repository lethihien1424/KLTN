from decimal import Decimal

from pydantic import BaseModel, field_serializer


class NhuCauNguyenLieuItemResponse(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    nhu_cau_du_bao_kg: Decimal
    ton_kho_kha_dung: Decimal
    ton_kho_an_toan: Decimal
    so_luong_dang_ve: Decimal
    so_luong_thieu_kg: Decimal
    ton_kho_toi_da: Decimal
    so_luong_can_mua_kg: Decimal

    @field_serializer(
        "nhu_cau_du_bao_kg", "ton_kho_kha_dung", "ton_kho_an_toan",
        "so_luong_dang_ve", "so_luong_thieu_kg", "ton_kho_toi_da",
        "so_luong_can_mua_kg",
    )
    def serialize_quantity(self, value: Decimal):
        return format(value, ".2f")


class NhuCauNguyenLieuResponse(BaseModel):
    ma_lich_su_du_bao: str
    chi_tiet: list[NhuCauNguyenLieuItemResponse]
