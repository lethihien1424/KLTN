####D:\KLTN\KLTN\backend\src\services\danh_sach_ban_hang_service.py
from sqlalchemy.orm import Session

from src.repositories.danh_sach_ban_hang_repository import (
    DanhSachBanHangRepository,
)
from src.schemas.danh_sach_ban_hang_schema import (
    DanhSachBanHangResponse,
    DongBanHangResponse,
)


class DanhSachBanHangService:
    @staticmethod
    def get_list(
        db: Session,
        search: str | None,
        trang_thai: str | None,
        page: int,
        page_size: int,
    ) -> DanhSachBanHangResponse:
        items, total = DanhSachBanHangRepository.get_list(
            db=db,
            search=search,
            trang_thai=trang_thai,
            page=page,
            page_size=page_size,
        )

        return DanhSachBanHangResponse(
            items=[
                DongBanHangResponse.model_validate(item)
                for item in items
            ],
            total=total,
            page=page,
            page_size=page_size,
        )