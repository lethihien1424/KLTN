from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.nha_cung_cap_controller import NhaCungCapController
from src.core.database import get_db
from src.dependencies.role_dependency import require_role
from src.schemas.nha_cung_cap_schema import (
    NhaCungCapCreate,
    NhaCungCapResponse,
    NhaCungCapScoreBatchResponse,
    NhaCungCapScoreResponse,
    NhaCungCapStatusUpdate,
    NhaCungCapUpdate,
    SupplierStatus,
)


router = APIRouter(
    prefix="/nha-cung-cap",
    tags=["Nhà cung cấp"],
    dependencies=[Depends(require_role("ADMIN", "NHAN_VIEN_MUA_HANG", "QUAN_LY"))],
)
controller = NhaCungCapController()


@router.post("/tinh-diem", response_model=NhaCungCapScoreBatchResponse)
def calculate_all_supplier_scores(db: Session = Depends(get_db)):
    return controller.calculate_all_scores(db)


@router.post("/{ma_ncc}/tinh-diem", response_model=NhaCungCapScoreResponse)
def calculate_supplier_score(ma_ncc: str, db: Session = Depends(get_db)):
    return controller.calculate_score(db, ma_ncc)


@router.get("", response_model=list[NhaCungCapResponse])
def list_nha_cung_cap(
    search: str | None = Query(default=None),
    trang_thai: SupplierStatus | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(db, search=search, trang_thai=trang_thai)


@router.get("/{ma_ncc}", response_model=NhaCungCapResponse)
def detail_nha_cung_cap(ma_ncc: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_ncc)


@router.post("", response_model=NhaCungCapResponse, status_code=201)
def create_nha_cung_cap(payload: NhaCungCapCreate, db: Session = Depends(get_db)):
    return controller.create(db, payload)


@router.put("/{ma_ncc}", response_model=NhaCungCapResponse)
def update_nha_cung_cap(
    ma_ncc: str, payload: NhaCungCapUpdate, db: Session = Depends(get_db)
):
    return controller.update(db, ma_ncc, payload)


@router.patch("/{ma_ncc}/trang-thai", response_model=NhaCungCapResponse)
def update_nha_cung_cap_status(
    ma_ncc: str, payload: NhaCungCapStatusUpdate, db: Session = Depends(get_db)
):
    return controller.update_status(db, ma_ncc, payload)
