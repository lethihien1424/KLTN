###D:\KLTN\KLTN\backend\src\routes\du_bao_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.dependencies.permission_dependency import (
    require_permission,
)
from src.models.user_model import User
from src.controllers.du_bao_controller import DuBaoController
from src.schemas.du_bao_schema import (
    DuBaoRequest,
    DuBaoResponse,
    LichSuDuBaoResponse,
)
from src.services.forecasting.du_bao_service import (
    DuBaoService,
)
from src.services.lich_su_du_bao_service import (
    LichSuDuBaoService,
)


router = APIRouter(
    prefix="/du-bao",
    tags=["Dự báo"],
)


@router.get("/san-pham")
def get_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("du_bao_nhu_cau", "XEM")
    ),
):
    return DuBaoService.get_catalog(db)


@router.post(
    "/nhu-cau",
    response_model=DuBaoResponse,
)
def forecast(
    request: DuBaoRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(
            "du_bao_nhu_cau",
            "CHAY_DU_BAO",
        )
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
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("lich_su_du_bao", "XEM")
    ),
):
    return LichSuDuBaoService.lay_danh_sach(db)


@router.get(
    "/moi-nhat",
    response_model=DuBaoResponse | None,
)
def latest(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("du_bao_nhu_cau", "XEM")
    ),
):
    return LichSuDuBaoService.lay_moi_nhat(db)


@router.get(
    "/lich-su/{ma_lich_su_du_bao}",
    response_model=DuBaoResponse,
)
def detail(
    ma_lich_su_du_bao: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission("lich_su_du_bao", "XEM")
    ),
):
    return LichSuDuBaoService.lay_chi_tiet(
        db,
        ma_lich_su_du_bao,
    )