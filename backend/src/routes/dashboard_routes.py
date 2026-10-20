# ##D:\KLTN\KLTN\backend\src\routes\dashboard_routes.py
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from src.controllers.dashboard_controller import DashboardController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.dashboard_schema import (
#     DashboardInventoryAlert,
#     DashboardOverviewResponse,
#     DashboardSupplierPerformance,
# )


# router = APIRouter(prefix='/dashboard', tags=['Dashboard'])
# controller = DashboardController()


# @router.get('/tong-quan', response_model=DashboardOverviewResponse, dependencies=[Depends(require_permission('DASHBOARD_VIEW'))])
# def overview(db: Session = Depends(get_db)):
#     return controller.overview(db)


# @router.get('/canh-bao-ton-kho', response_model=list[DashboardInventoryAlert], dependencies=[Depends(require_permission('DASHBOARD_VIEW'))])
# def inventory_alerts(db: Session = Depends(get_db)):
#     return controller.inventory_alerts(db)


# @router.get('/hieu-suat-nha-cung-cap', response_model=list[DashboardSupplierPerformance], dependencies=[Depends(require_permission('NHA_CUNG_CAP_PERFORMANCE_VIEW'))])
# def supplier_performance(db: Session = Depends(get_db)):
#     return controller.supplier_performance(db)
##D:\KLTN\KLTN\backend\src\routes\dashboard_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.controllers.dashboard_controller import DashboardController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.dashboard_schema import (
    DashboardInventoryAlert,
    DashboardOverviewResponse,
    DashboardSupplierPerformance,
)


router = APIRouter(prefix='/dashboard', tags=['Dashboard'])
controller = DashboardController()


@router.get('/tong-quan', response_model=DashboardOverviewResponse, dependencies=[Depends(require_permission('dashboard_mua_hang', 'XEM'))])
def overview(db: Session = Depends(get_db)):
    return controller.overview(db)


@router.get('/canh-bao-ton-kho', response_model=list[DashboardInventoryAlert], dependencies=[Depends(require_permission('dashboard_mua_hang', 'XEM'))])
def inventory_alerts(db: Session = Depends(get_db)):
    return controller.inventory_alerts(db)


@router.get('/hieu-suat-nha-cung-cap', response_model=list[DashboardSupplierPerformance], dependencies=[Depends(require_permission('hieu_suat_nha_cung_cap', 'XEM'))])
def supplier_performance(db: Session = Depends(get_db)):
    return controller.supplier_performance(db)
