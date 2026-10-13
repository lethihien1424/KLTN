#### D:\KLTN\KLTN\backend\src\routes\tai_khoan_routes.py
from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from src.controllers.tai_khoan_controller import (
    TaiKhoanController,
)
from src.core.database import get_db
from src.models.user_model import User
from src.dependencies.permission_dependency import require_permission
from src.schemas.tai_khoan_schema import (
    TaiKhoanCreateRequest,
    TaiKhoanResponse,
    TaiKhoanUpdateRequest,
)


router = APIRouter(
    prefix="/users",
    tags=["User Management"],
)


@router.get(
    "",
    response_model=list[TaiKhoanResponse],
)
def get_users(
    search: str | None = Query(None),
    vai_tro: str | None = Query(None),
    trang_thai: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("USER_VIEW")
    ),
):
    return TaiKhoanController.get_all(
        db=db,
        search=search,
        vai_tro=vai_tro,
        trang_thai=trang_thai,
    )


@router.get(
    "/{ma_nguoi_dung}",
    response_model=TaiKhoanResponse,
)
def get_user_by_id(
    ma_nguoi_dung: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("USER_VIEW")
    ),
):
    return TaiKhoanController.get_by_id(
        db=db,
        ma_nguoi_dung=ma_nguoi_dung,
    )


@router.post(
    "",
    response_model=TaiKhoanResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_user(
    payload: TaiKhoanCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("USER_CREATE", "USER_ASSIGN_ROLE")
    ),
):
    return TaiKhoanController.create(
        db=db,
        payload=payload,
        creator=current_user,
    )


@router.put(
    "/{ma_nguoi_dung}",
    response_model=TaiKhoanResponse,
)
def update_user(
    ma_nguoi_dung: str,
    payload: TaiKhoanUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("USER_UPDATE")
    ),
):
    return TaiKhoanController.update(
        db=db,
        ma_nguoi_dung=ma_nguoi_dung,
        payload=payload,
        modifier=current_user,
    )


@router.delete(
    "/{ma_nguoi_dung}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_user(
    ma_nguoi_dung: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("USER_DELETE")
    ),
):
    TaiKhoanController.delete(
        db=db,
        ma_nguoi_dung=ma_nguoi_dung,
        remover=current_user,
    )
