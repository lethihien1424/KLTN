from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.don_mua_controller import DonMuaController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.models.user_model import User
from src.schemas.don_mua_schema import (
    DonMuaCreate, DonMuaUpdate, DonMuaResponse, DonMuaDetailResponse,
    DonMuaTuChoiRequest, TrangThaiDonMua,
    DonMuaNhanHangRequest,
)


router = APIRouter(prefix='/don-mua-nguyen-lieu', tags=['Đơn mua nguyên liệu'])
controller = DonMuaController()
receipt_router = APIRouter(prefix='/don-mua-nguyen-lieu', tags=['Đơn mua nguyên liệu'])


@router.get('', response_model=list[DonMuaResponse], dependencies=[Depends(require_permission('DON_MUA_VIEW'))])
def list_orders(
    search: str | None = Query(default=None),
    ma_ncc: str | None = Query(default=None),
    trang_thai: TrangThaiDonMua | None = Query(default=None),
    ngay_dat_tu: date | None = Query(default=None),
    ngay_dat_den: date | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(db, search=search, ma_ncc=ma_ncc, trang_thai=trang_thai,
                           ngay_dat_tu=ngay_dat_tu, ngay_dat_den=ngay_dat_den)


@router.get('/{ma_don_mua}', response_model=DonMuaDetailResponse, dependencies=[Depends(require_permission('DON_MUA_VIEW'))])
def detail_order(ma_don_mua: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_don_mua)


@router.post('', response_model=DonMuaDetailResponse, status_code=201, dependencies=[Depends(require_permission('DON_MUA_CREATE'))])
def create_order(
    payload: DonMuaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DON_MUA_CREATE")),
):
    return controller.create(db, payload, current_user)


@router.put('/{ma_don_mua}', response_model=DonMuaDetailResponse, dependencies=[Depends(require_permission('DON_MUA_UPDATE'))])
def update_order(ma_don_mua: str, payload: DonMuaUpdate, db: Session = Depends(get_db)):
    return controller.update(db, ma_don_mua, payload)


@router.patch('/{ma_don_mua}/duyet', response_model=DonMuaDetailResponse, dependencies=[Depends(require_permission('DON_MUA_APPROVE'))])
def approve_order(
    ma_don_mua: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DON_MUA_APPROVE")),
):
    return controller.approve(db, ma_don_mua, current_user)


@router.patch('/{ma_don_mua}/tu-choi', response_model=DonMuaDetailResponse, dependencies=[Depends(require_permission('DON_MUA_REJECT'))])
def reject_order(
    ma_don_mua: str,
    payload: DonMuaTuChoiRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DON_MUA_REJECT")),
):
    return controller.reject(db, ma_don_mua, payload, current_user)


@receipt_router.patch('/{ma_don_mua}/nhan-hang', response_model=DonMuaDetailResponse, dependencies=[Depends(require_permission('DON_MUA_RECEIVE'))])
def receive_order(
    ma_don_mua: str,
    payload: DonMuaNhanHangRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DON_MUA_RECEIVE")),
):
    return controller.receive(db, ma_don_mua, payload)
