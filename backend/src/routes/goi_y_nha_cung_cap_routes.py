from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.goi_y_nha_cung_cap_controller import GoiYNhaCungCapController
from src.core.database import get_db
from src.dependencies.role_dependency import require_role
from src.schemas.goi_y_nha_cung_cap_schema import GoiYNhaCungCapResponse


router = APIRouter(
    prefix="/goi-y-nha-cung-cap",
    tags=["Gợi ý nhà cung cấp"],
    dependencies=[Depends(require_role("ADMIN", "NHAN_VIEN_MUA_HANG"))],
)
controller = GoiYNhaCungCapController()


@router.get("", response_model=GoiYNhaCungCapResponse)
def suggest_suppliers(
    ma_nguyen_lieu: str = Query(min_length=1, max_length=20),
    so_luong_can_mua: Decimal = Query(
        gt=0,
        max_digits=14,
        decimal_places=2,
        allow_inf_nan=False,
    ),
    db: Session = Depends(get_db),
):
    return controller.suggest(db, ma_nguyen_lieu, so_luong_can_mua)
