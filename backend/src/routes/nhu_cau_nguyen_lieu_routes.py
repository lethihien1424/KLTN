##D:\KLTN\KLTN\backend\src\routes\nhu_cau_nguyen_lieu_routes.py
# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from src.controllers.nhu_cau_nguyen_lieu_controller import NhuCauNguyenLieuController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.nhu_cau_nguyen_lieu_schema import NhuCauNguyenLieuResponse


# router = APIRouter(prefix='/nhu-cau-nguyen-lieu', tags=['Nhu cầu nguyên liệu'])
# controller = NhuCauNguyenLieuController()


# @router.get('/{ma_lich_su_du_bao}', response_model=NhuCauNguyenLieuResponse, dependencies=[Depends(require_permission('NHU_CAU_NGUYEN_LIEU_VIEW'))])
# def preview_material_demand(ma_lich_su_du_bao: str, db: Session = Depends(get_db)):
#     return controller.preview(db, ma_lich_su_du_bao)

## D:\KLTN\KLTN\backend\src\routes\nhu_cau_nguyen_lieu_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.controllers.nhu_cau_nguyen_lieu_controller import NhuCauNguyenLieuController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.nhu_cau_nguyen_lieu_schema import NhuCauNguyenLieuResponse
from src.schemas.forecast_demand_detail_schema import ForecastDemandDetail
from src.schemas.du_bao_schema import LichSuDuBaoResponse
from src.services.forecast_demand_detail_service import ForecastDemandDetailService
from src.services.lich_su_du_bao_service import LichSuDuBaoService


router = APIRouter(prefix='/nhu-cau-nguyen-lieu', tags=['Nhu cầu nguyên liệu'])
controller = NhuCauNguyenLieuController()


@router.get('/lich-su', response_model=list[LichSuDuBaoResponse], dependencies=[Depends(require_permission('nhu_cau_nguyen_lieu', 'XEM'))])
def material_forecast_history(db: Session = Depends(get_db)):
    return LichSuDuBaoService.lay_danh_sach(db)


@router.get('/{ma_lich_su_du_bao}/chi-tiet', response_model=ForecastDemandDetail, dependencies=[Depends(require_permission('nhu_cau_nguyen_lieu', 'XEM'))])
def material_forecast_detail(ma_lich_su_du_bao: str, db: Session = Depends(get_db)):
    return ForecastDemandDetailService().read(db, ma_lich_su_du_bao)


@router.get('/{ma_lich_su_du_bao}', response_model=NhuCauNguyenLieuResponse, dependencies=[Depends(require_permission('nhu_cau_nguyen_lieu', 'XEM'))])
def preview_material_demand(ma_lich_su_du_bao: str, db: Session = Depends(get_db)):
    return controller.preview(db, ma_lich_su_du_bao)
