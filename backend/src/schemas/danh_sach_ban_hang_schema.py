###D:\KLTN\KLTN\backend\src\schemas\danh_sach_ban_hang_schema.py
from pydantic import BaseModel

from src.schemas.du_lieu_ban_hang_schema import (
    DuLieuBanHangCreateResponse,
)


class DongBanHangResponse(DuLieuBanHangCreateResponse):
    pass


class DanhSachBanHangResponse(BaseModel):
    items: list[DongBanHangResponse]
    total: int
    page: int
    page_size: int