from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.cong_thuc_controller import CongThucController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.cong_thuc_schema import (
    CongThucCreate, CongThucUpdate, CongThucStatusUpdate,
    CongThucResponse, CongThucDetailResponse, TrangThaiCongThuc,
)


router = APIRouter(prefix='/cong-thuc', tags=['Công thức / BOM'])

controller = CongThucController()


@router.get('', response_model=list[CongThucResponse], dependencies=[Depends(require_permission('CONG_THUC_VIEW'))])
def list_cong_thuc(
    search: str | None = Query(default=None),
    ma_san_pham: str | None = Query(default=None),
    trang_thai: TrangThaiCongThuc | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(db, search, ma_san_pham, trang_thai)


@router.get('/{ma_cong_thuc}', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('CONG_THUC_VIEW'))])
def detail_cong_thuc(ma_cong_thuc: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_cong_thuc)


@router.post('', response_model=CongThucDetailResponse, status_code=201, dependencies=[Depends(require_permission('CONG_THUC_CREATE'))])
def create_cong_thuc(payload: CongThucCreate, db: Session = Depends(get_db)):
    return controller.create(db, payload)


@router.put('/{ma_cong_thuc}', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('CONG_THUC_UPDATE'))])
def update_cong_thuc(ma_cong_thuc: str, payload: CongThucUpdate, db: Session = Depends(get_db)):
    return controller.update(db, ma_cong_thuc, payload)


@router.patch('/{ma_cong_thuc}/trang-thai', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('CONG_THUC_CHANGE_STATUS'))])
def status_cong_thuc(ma_cong_thuc: str, payload: CongThucStatusUpdate, actor=Depends(require_permission("CONG_THUC_CHANGE_STATUS")), db: Session = Depends(get_db)):
    return controller.update_status(db, ma_cong_thuc, payload, actor.ma_nguoi_dung)
