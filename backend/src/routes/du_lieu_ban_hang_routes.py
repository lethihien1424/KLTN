###D:\KLTN\KLTN\backend\src\routes\du_lieu_ban_hang_routes.py
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.controllers.danh_sach_ban_hang_controller import (
    DanhSachBanHangController,
)
from src.controllers.du_lieu_ban_hang_controller import (
    DuLieuBanHangController,
)
from src.core.database import get_db
from src.dependencies.permission_dependency import (
    require_permission,
)
from src.models.user_model import User
from src.schemas.danh_sach_ban_hang_schema import (
    DanhSachBanHangResponse,
)
from src.schemas.du_lieu_ban_hang_schema import (
    DanhMucBanHangResponse,
    DuLieuBanHangCreateRequest,
    DuLieuBanHangCreateResponse,
)


router = APIRouter(
    prefix="/du-lieu-ban-hang",
    tags=["Dữ liệu bán hàng"],
)


@router.get(
    "/danh-muc-them-moi",
    response_model=DanhMucBanHangResponse,
)
def get_create_catalog(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("du_lieu_ban_hang", "XEM")
    ),
) -> DanhMucBanHangResponse:
    return DuLieuBanHangController.get_catalog(db=db)


@router.get(
    "",
    response_model=DanhSachBanHangResponse,
)
def get_sales_data(
    search: str | None = Query(None, max_length=100),
    trang_thai: Literal[
        "CHO_GIAO_HANG",
        "DA_GIAO_HANG",
    ] | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("du_lieu_ban_hang", "XEM")
    ),
) -> DanhSachBanHangResponse:
    return DanhSachBanHangController.get_list(
        db=db,
        search=search,
        trang_thai=trang_thai,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    response_model=DuLieuBanHangCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_sales_data(
    payload: DuLieuBanHangCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("du_lieu_ban_hang", "THEM")
    ),
) -> DuLieuBanHangCreateResponse:
    return DuLieuBanHangController.create(
        db=db,
        payload=payload,
    )


@router.put(
    "/{ma}",
    response_model=DuLieuBanHangCreateResponse,
)
def update_sales_data(
    ma: str,
    payload: DuLieuBanHangCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("du_lieu_ban_hang", "SUA")
    ),
) -> DuLieuBanHangCreateResponse:
    return DuLieuBanHangController.update(
        db=db,
        ma=ma,
        payload=payload,
    )