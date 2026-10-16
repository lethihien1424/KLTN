####D:\KLTN\KLTN\backend\src\routes\phan_quyen_routes.py
from fastapi import (
    APIRouter,
    Depends,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from src.controllers.phan_quyen_controller import (
    PhanQuyenController,
)
from src.core.database import get_db
from src.dependencies.auth_dependency import get_current_user
from src.dependencies.permission_dependency import (
    require_any_permission,
    require_permission,
)
from src.models.user_model import User
from src.schemas.phan_quyen_schema import (
    DanhMucPhanQuyenResponse,
    NhomQuyenRequest,
    NhomQuyenResponse,
    QuyenCuaToiResponse,
)


router = APIRouter(
    prefix="/phan-quyen",
    tags=["Phân quyền"],
)


# Các đường dẫn cố định phải nằm trước /{ma}.
@router.get(
    "/danh-muc",
    response_model=DanhMucPhanQuyenResponse,
)
def get_catalog(
    current_user: User = Depends(
        require_any_permission(
            ("phan_quyen", "XEM"),
            ("phan_quyen", "THEM"),
            ("phan_quyen", "SUA"),
            ("phan_quyen", "XUAT_EXCEL"),
        )
    ),
) -> DanhMucPhanQuyenResponse:
    return PhanQuyenController.get_catalog()


@router.get(
    "/cua-toi",
    response_model=QuyenCuaToiResponse,
)
def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> QuyenCuaToiResponse:
    return PhanQuyenController.get_my_permissions(
        db=db,
        current_user=current_user,
    )


@router.get(
    "",
    response_model=list[NhomQuyenResponse],
)
def get_groups(
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("phan_quyen", "XEM")
    ),
) -> list[NhomQuyenResponse]:
    return PhanQuyenController.get_all(
        db=db,
        search=search,
    )


@router.get(
    "/{ma}",
    response_model=NhomQuyenResponse,
)
def get_group(
    ma: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("phan_quyen", "XEM")
    ),
) -> NhomQuyenResponse:
    return PhanQuyenController.get_by_id(
        db=db,
        ma=ma,
    )


@router.post(
    "",
    response_model=NhomQuyenResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_group(
    payload: NhomQuyenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("phan_quyen", "THEM")
    ),
) -> NhomQuyenResponse:
    return PhanQuyenController.create(
        db=db,
        payload=payload,
        current_user=current_user,
    )


@router.put(
    "/{ma}",
    response_model=NhomQuyenResponse,
)
def update_group(
    ma: str,
    payload: NhomQuyenRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("phan_quyen", "SUA")
    ),
) -> NhomQuyenResponse:
    return PhanQuyenController.update(
        db=db,
        ma=ma,
        payload=payload,
        current_user=current_user,
    )


@router.delete(
    "/{ma}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
)
def delete_group(
    ma: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("phan_quyen", "XOA")
    ),
) -> Response:
    PhanQuyenController.delete(
        db=db,
        ma=ma,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )