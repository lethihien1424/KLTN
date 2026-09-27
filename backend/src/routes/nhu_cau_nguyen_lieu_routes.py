from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.controllers.nhu_cau_nguyen_lieu_controller import NhuCauNguyenLieuController
from src.core.database import get_db
from src.dependencies.role_dependency import require_role
from src.schemas.nhu_cau_nguyen_lieu_schema import NhuCauNguyenLieuResponse


router = APIRouter(
    prefix="/nhu-cau-nguyen-lieu",
    tags=["Nhu cầu nguyên liệu"],
    dependencies=[Depends(require_role(
        "ADMIN", "NHAN_VIEN_KE_HOACH_SAN_XUAT", "NHAN_VIEN_MUA_HANG",
    ))],
)
controller = NhuCauNguyenLieuController()


@router.get("/{ma_lich_su_du_bao}", response_model=NhuCauNguyenLieuResponse)
def preview_material_demand(ma_lich_su_du_bao: str, db: Session = Depends(get_db)):
    return controller.preview(db, ma_lich_su_du_bao)
