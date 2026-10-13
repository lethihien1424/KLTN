from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.de_xuat_controller import DeXuatController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.models.user_model import User
from src.schemas.de_xuat_nhap_hang_schema import (
    DeXuatNhapHangCreate,
    DeXuatNhapHangDetailResponse,
    DeXuatNhapHangSummaryResponse,
    DeXuatTuChoiRequest,
    TaoDonMuaTuDeXuatRequest,
    TaoDonMuaTuDeXuatResponse,
    TrangThaiDeXuat,
)


router = APIRouter(prefix='/de-xuat-nhap-hang', tags=['Đề xuất nhập hàng'])
controller = DeXuatController()





@router.get('', response_model=list[DeXuatNhapHangSummaryResponse], dependencies=[Depends(require_permission('DE_XUAT_NHAP_HANG_VIEW'))])
def list_proposals(
    search: str | None = Query(default=None),
    ngay_de_xuat: date | None = Query(default=None),
    trang_thai: TrangThaiDeXuat | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(
        db, search=search, ngay_de_xuat=ngay_de_xuat, trang_thai=trang_thai
    )


@router.get('/{ma_de_xuat}', response_model=DeXuatNhapHangDetailResponse, dependencies=[Depends(require_permission('DE_XUAT_NHAP_HANG_VIEW'))])
def proposal_detail(ma_de_xuat: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_de_xuat)


@router.post('', response_model=DeXuatNhapHangDetailResponse, status_code=201, dependencies=[Depends(require_permission('DE_XUAT_NHAP_HANG_CREATE'))])
def create_proposal(
    payload: DeXuatNhapHangCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DE_XUAT_NHAP_HANG_CREATE")),
):
    return controller.create(db, payload, current_user)


@router.patch('/{ma_de_xuat}/duyet', response_model=DeXuatNhapHangDetailResponse, dependencies=[Depends(require_permission('DE_XUAT_NHAP_HANG_APPROVE'))])
def approve_proposal(
    ma_de_xuat: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DE_XUAT_NHAP_HANG_APPROVE")),
):
    return controller.approve(db, ma_de_xuat, current_user)


@router.patch('/{ma_de_xuat}/tu-choi', response_model=DeXuatNhapHangDetailResponse, dependencies=[Depends(require_permission('DE_XUAT_NHAP_HANG_REJECT'))])
def reject_proposal(
    ma_de_xuat: str,
    payload: DeXuatTuChoiRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DE_XUAT_NHAP_HANG_REJECT")),
):
    return controller.reject(db, ma_de_xuat, payload, current_user)


@router.post('/{ma_de_xuat}/tao-don-mua', response_model=TaoDonMuaTuDeXuatResponse, status_code=201, dependencies=[Depends(require_permission('DON_MUA_CREATE'))])
def generate_purchase_orders(
    ma_de_xuat: str,
    payload: TaoDonMuaTuDeXuatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DON_MUA_CREATE")),
):
    return controller.generate_orders(db, ma_de_xuat, payload, current_user)
