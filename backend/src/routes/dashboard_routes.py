from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.controllers.dashboard_controller import DashboardController
from src.core.database import get_db
from src.dependencies.role_dependency import require_role
from src.schemas.dashboard_schema import (
    DashboardInventoryAlert,
    DashboardOverviewResponse,
    DashboardSupplierPerformance,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
    dependencies=[Depends(require_role("ADMIN", "QUAN_LY"))],
)
controller = DashboardController()


@router.get("/tong-quan", response_model=DashboardOverviewResponse)
def overview(db: Session = Depends(get_db)):
    return controller.overview(db)


@router.get("/canh-bao-ton-kho", response_model=list[DashboardInventoryAlert])
def inventory_alerts(db: Session = Depends(get_db)):
    return controller.inventory_alerts(db)


@router.get("/hieu-suat-nha-cung-cap", response_model=list[DashboardSupplierPerformance])
def supplier_performance(db: Session = Depends(get_db)):
    return controller.supplier_performance(db)
