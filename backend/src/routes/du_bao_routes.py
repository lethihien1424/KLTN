###D:\KLTN\KLTN\backend\src\routes\du_bao_routes.py
from fastapi import (
    APIRouter,
    Depends,
)
from sqlalchemy.orm import Session

from src.controllers.du_bao_controller import (
    DuBaoController,
)
from src.core.database import get_db
from src.dependencies.role_dependency import (
    require_role,
)
from src.models.user_model import User
from src.schemas.du_bao_schema import (
    DuBaoRequest,
    DuBaoResponse,
)


router = APIRouter(
    prefix="/du-bao",
    tags=["Dự báo"],
)


@router.post(
    "/nhu-cau",
    response_model=DuBaoResponse,
)
def du_bao_nhu_cau(
    request: DuBaoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(
            "ADMIN",
            "QUAN_LY",
            "GIAM_SAT_BAN_HANG",
            "NHAN_VIEN_KE_HOACH_SAN_XUAT",
        )
    ),
):
    return DuBaoController.du_bao_nhu_cau(
        db=db,
        request=request,
        current_user=current_user,
    )