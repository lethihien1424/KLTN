####D:\KLTN\KLTN\backend\src\controllers\danh_sach_ban_hang_controller.py
from sqlalchemy.orm import Session

from src.schemas.danh_sach_ban_hang_schema import (
    DanhSachBanHangResponse,
)
from src.services.danh_sach_ban_hang_service import (
    DanhSachBanHangService,
)


class DanhSachBanHangController:
    @staticmethod
    def get_list(
        db: Session,
        search: str | None,
        trang_thai: str | None,
        page: int,
        page_size: int,
    ) -> DanhSachBanHangResponse:
        return DanhSachBanHangService.get_list(
            db=db,
            search=search,
            trang_thai=trang_thai,
            page=page,
            page_size=page_size,
        )