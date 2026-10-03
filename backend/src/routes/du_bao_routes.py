###D:\KLTN\KLTN\backend\src\routes\du_bao_routes.py
from fastapi import APIRouter, Depends
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
    LichSuDuBaoResponse,
)
from src.services.lich_su_du_bao_service import (
    LichSuDuBaoService,
)


router = APIRouter(
    prefix="/du-bao",
    tags=["Dự báo"],
)


QUYEN_CHAY_DU_BAO = (
    "ADMIN",
    "QUAN_LY_BAN_HANG",
    "NHAN_VIEN_BAN_HANG",
)

QUYEN_XEM_DU_BAO = (
    "ADMIN",
    "QUAN_LY_BAN_HANG",
    "QUAN_LY_MUA_HANG",
    "NHAN_VIEN_BAN_HANG",
    "NHAN_VIEN_MUA_HANG",
)


@router.post(
    "/nhu-cau",
    response_model=DuBaoResponse,
)
def du_bao_nhu_cau(
    request: DuBaoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*QUYEN_CHAY_DU_BAO)
    ),
):
    return DuBaoController.du_bao_nhu_cau(
        db=db,
        request=request,
        current_user=current_user,
    )


@router.get(
    "/lich-su",
    response_model=list[LichSuDuBaoResponse],
)
def lay_lich_su_du_bao(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*QUYEN_XEM_DU_BAO)
    ),
):
    return LichSuDuBaoService.lay_danh_sach(
        db=db,
    )


@router.get(
    "/moi-nhat",
    response_model=DuBaoResponse | None,
)
def lay_du_bao_moi_nhat(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*QUYEN_XEM_DU_BAO)
    ),
):
    return LichSuDuBaoService.lay_moi_nhat(
        db=db,
    )


@router.get(
    "/lich-su/{ma_lich_su_du_bao}",
    response_model=DuBaoResponse,
)
def lay_chi_tiet_du_bao(
    ma_lich_su_du_bao: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(*QUYEN_XEM_DU_BAO)
    ),
):
    return LichSuDuBaoService.lay_chi_tiet(
        db=db,
        ma_lich_su_du_bao=ma_lich_su_du_bao,
    )