from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.controllers.nguyen_lieu_nha_cung_cap_controller import NguyenLieuNhaCungCapController
from src.core.database import get_db
from src.dependencies.role_dependency import require_role
from src.schemas.nguyen_lieu_nha_cung_cap_schema import (
    NguyenLieuNhaCungCapCreate,
    NguyenLieuNhaCungCapResponse,
    NguyenLieuNhaCungCapUpdate,
)


router = APIRouter(
    prefix="/nguyen-lieu-nha-cung-cap",
    tags=["Nguyên liệu theo nhà cung cấp"],
    dependencies=[Depends(require_role("ADMIN", "NHAN_VIEN_MUA_HANG", "QUAN_LY"))],
)
controller = NguyenLieuNhaCungCapController()


@router.get("", response_model=list[NguyenLieuNhaCungCapResponse])
def list_mapping(
    search: str | None = Query(default=None),
    ma_ncc: str | None = Query(default=None),
    ma_nguyen_lieu: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(
        db, search=search, ma_ncc=ma_ncc, ma_nguyen_lieu=ma_nguyen_lieu
    )


@router.get("/{ma_nguyen_lieu_ncc}", response_model=NguyenLieuNhaCungCapResponse)
def detail_mapping(ma_nguyen_lieu_ncc: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_nguyen_lieu_ncc)


@router.post("", response_model=NguyenLieuNhaCungCapResponse, status_code=201)
def create_mapping(payload: NguyenLieuNhaCungCapCreate, db: Session = Depends(get_db)):
    return controller.create(db, payload)


@router.put("/{ma_nguyen_lieu_ncc}", response_model=NguyenLieuNhaCungCapResponse)
def update_mapping(
    ma_nguyen_lieu_ncc: str,
    payload: NguyenLieuNhaCungCapUpdate,
    db: Session = Depends(get_db),
):
    return controller.update(db, ma_nguyen_lieu_ncc, payload)
