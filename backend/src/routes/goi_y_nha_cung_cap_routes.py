# ##D:\KLTN\KLTN\backend\src\routes\goi_y_nha_cung_cap_routes.py
# from decimal import Decimal

# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session

# from src.controllers.goi_y_nha_cung_cap_controller import GoiYNhaCungCapController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.goi_y_nha_cung_cap_schema import GoiYNhaCungCapResponse


# router = APIRouter(prefix='/goi-y-nha-cung-cap', tags=['Gợi ý nhà cung cấp'])
# controller = GoiYNhaCungCapController()


# @router.get('', response_model=GoiYNhaCungCapResponse, dependencies=[Depends(require_permission('GOI_Y_NHA_CUNG_CAP_VIEW'))])
# def suggest_suppliers(
#     ma_nguyen_lieu: str = Query(min_length=1, max_length=20),
#     so_luong_can_mua: Decimal = Query(
#         gt=0,
#         max_digits=14,
#         decimal_places=2,
#         allow_inf_nan=False,
#     ),
#     db: Session = Depends(get_db),
# ):
#     return controller.suggest(db, ma_nguyen_lieu, so_luong_can_mua)

## D:\KLTN\KLTN\backend\src\routes\goi_y_nha_cung_cap_routes.py
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.goi_y_nha_cung_cap_controller import GoiYNhaCungCapController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.goi_y_nha_cung_cap_schema import GoiYNhaCungCapResponse
from src.services.goi_y_nha_cung_cap_service import GoiYNhaCungCapService
from src.services.supply_confirmation_service import SupplyConfirmationService
from src.schemas.supply_confirmation_schema import SupplyConfirmationInput


router = APIRouter(prefix='/goi-y-nha-cung-cap', tags=['Gợi ý nhà cung cấp'])
controller = GoiYNhaCungCapController()


@router.get('', response_model=GoiYNhaCungCapResponse, dependencies=[Depends(require_permission('goi_y_nha_cung_cap', 'XEM'))])
def suggest_suppliers(
    ma_nguyen_lieu: str = Query(min_length=1, max_length=20),
    ma_lich_su_du_bao: str | None = Query(default=None, min_length=1, max_length=20),
    so_luong_can_mua: Decimal = Query(
        gt=0,
        max_digits=14,
        decimal_places=2,
        allow_inf_nan=False,
    ),
    db: Session = Depends(get_db),
):
    return GoiYNhaCungCapService().suggest(db, ma_nguyen_lieu, so_luong_can_mua, ma_lich_su_du_bao)


@router.post('/xac-nhan', status_code=201)
def confirm_supply(payload: SupplyConfirmationInput, db: Session = Depends(get_db),
                   actor=Depends(require_permission('goi_y_nha_cung_cap', 'XAC_NHAN'))):
    return SupplyConfirmationService().create(db, payload, actor)


@router.get('/{mapping_id}/giai-thich', dependencies=[Depends(require_permission('goi_y_nha_cung_cap', 'XEM'))])
def explain_suggestion(mapping_id: str, ma_nguyen_lieu: str = Query(min_length=1, max_length=20),
    so_luong_can_mua: Decimal = Query(gt=0, max_digits=14, decimal_places=2, allow_inf_nan=False),
    ma_lich_su_du_bao: str | None = Query(default=None, min_length=1, max_length=20), db: Session = Depends(get_db)):
    return GoiYNhaCungCapService().explain(db, mapping_id, ma_nguyen_lieu, so_luong_can_mua, ma_lich_su_du_bao)


@router.get('/xac-nhan/{mapping_id}', dependencies=[Depends(require_permission('goi_y_nha_cung_cap', 'XEM'))])
def confirmation_history(mapping_id: str, ma_lich_su_du_bao: str | None = None, db: Session = Depends(get_db)):
    from sqlalchemy import select
    from src.models.supply_confirmation import SupplyConfirmation
    rows = db.scalars(select(SupplyConfirmation).where(
        SupplyConfirmation.ma_nguyen_lieu_ncc == mapping_id,
        SupplyConfirmation.ma_lich_su_du_bao == ma_lich_su_du_bao,
    ).order_by(SupplyConfirmation.thoi_gian.desc(), SupplyConfirmation.id.desc()).limit(50))
    return [SupplyConfirmationService.response(row) for row in rows]
