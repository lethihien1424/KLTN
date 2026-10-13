from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.controllers.nhu_cau_nguyen_lieu_controller import NhuCauNguyenLieuController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.nhu_cau_nguyen_lieu_schema import NhuCauNguyenLieuResponse


router = APIRouter(prefix='/nhu-cau-nguyen-lieu', tags=['Nhu cầu nguyên liệu'])
controller = NhuCauNguyenLieuController()


@router.get('/{ma_lich_su_du_bao}', response_model=NhuCauNguyenLieuResponse, dependencies=[Depends(require_permission('NHU_CAU_NGUYEN_LIEU_VIEW'))])
def preview_material_demand(ma_lich_su_du_bao: str, db: Session = Depends(get_db)):
    return controller.preview(db, ma_lich_su_du_bao)
