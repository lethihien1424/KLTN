from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class ForecastBomInfo(BaseModel):
    ma_cong_thuc: str
    ten_cong_thuc: str
    khoi_luong_thanh_pham_kg: Decimal
    he_so_thu_hoi: Decimal
    ty_le_hao_hut: Decimal


class ForecastProductInfo(BaseModel):
    ma_san_pham: str
    ten_san_pham: str
    so_luong_du_bao: Decimal
    bom: ForecastBomInfo | None
    loi_bom: str | None


class MaterialCalculation(BaseModel):
    ma_san_pham: str
    ma_cong_thuc: str
    so_luong_du_bao: Decimal
    khoi_luong_thanh_pham_kg: Decimal
    he_so_thu_hoi: Decimal
    ty_le_phoi_tron: Decimal
    kg_moi_san_pham: Decimal
    nhu_cau_kg: Decimal


class ForecastMaterialInfo(BaseModel):
    ma_nguyen_lieu: str
    ten_nguyen_lieu: str
    nhu_cau_du_bao_kg: Decimal
    cach_tinh: list[MaterialCalculation]


class ForecastDemandDetail(BaseModel):
    ma_lich_su_du_bao: str
    thoi_gian_chay: datetime
    so_tuan_du_bao: int
    trang_thai: str | None
    tu_ngay: date | None
    den_ngay: date | None
    tong_san_pham: int
    san_pham: list[ForecastProductInfo]
    du_bom: bool
    nguyen_lieu: list[ForecastMaterialInfo]
