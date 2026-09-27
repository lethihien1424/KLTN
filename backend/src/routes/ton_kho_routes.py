from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.ton_kho_controller import TonKhoController
from src.core.database import get_db
from src.dependencies.role_dependency import require_role
from src.schemas.ton_kho_schema import TonKhoCreate, TonKhoResponse, TonKhoUpdate


router = APIRouter(
    prefix="/ton-kho-nguyen-lieu", tags=["Tồn kho nguyên liệu"],
    dependencies=[Depends(require_role("ADMIN", "NHAN_VIEN_KHO"))],
)
controller = TonKhoController()


@router.get("", response_model=list[TonKhoResponse])
def list_ton_kho(
    search: str | None = Query(default=None),
    trang_thai: str | None = Query(default=None, min_length=1, max_length=30),
    ngay_ghi_nhan: date | None = Query(default=None),
    latest_only: bool = Query(default=False),
    db: Session = Depends(get_db),
):
    return controller.list(
        db, search=search, trang_thai=trang_thai,
        ngay_ghi_nhan=ngay_ghi_nhan, latest_only=latest_only,
    )


@router.get("/{ma_nguyen_lieu}", response_model=list[TonKhoResponse])
def history_ton_kho(ma_nguyen_lieu: str, db: Session = Depends(get_db)):
    return controller.history(db, ma_nguyen_lieu)


@router.get("/{ma_nguyen_lieu}/{ngay_ghi_nhan}", response_model=TonKhoResponse)
def detail_ton_kho(ma_nguyen_lieu: str, ngay_ghi_nhan: date, db: Session = Depends(get_db)):
    return controller.detail(db, ma_nguyen_lieu, ngay_ghi_nhan)


@router.post("", response_model=TonKhoResponse, status_code=201)
def create_ton_kho(payload: TonKhoCreate, db: Session = Depends(get_db)):
    return controller.create(db, payload)


@router.put("/{ma_nguyen_lieu}/{ngay_ghi_nhan}", response_model=TonKhoResponse)
def update_ton_kho(
    ma_nguyen_lieu: str, ngay_ghi_nhan: date,
    payload: TonKhoUpdate, db: Session = Depends(get_db),
):
    return controller.update(db, ma_nguyen_lieu, ngay_ghi_nhan, payload)
