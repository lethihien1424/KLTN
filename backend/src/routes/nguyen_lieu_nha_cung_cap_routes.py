# ##D:\KLTN\KLTN\backend\src\routes\nguyen_lieu_nha_cung_cap_routes.py
# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session

# from src.controllers.nguyen_lieu_nha_cung_cap_controller import NguyenLieuNhaCungCapController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.nguyen_lieu_nha_cung_cap_schema import (
#     NguyenLieuNhaCungCapCreate,
#     NguyenLieuNhaCungCapResponse,
#     NguyenLieuNhaCungCapUpdate,
# )


# router = APIRouter(prefix='/nguyen-lieu-nha-cung-cap', tags=['Nguyên liệu theo nhà cung cấp'])

# controller = NguyenLieuNhaCungCapController()


# @router.get('', response_model=list[NguyenLieuNhaCungCapResponse], dependencies=[Depends(require_permission('NGUYEN_LIEU_NCC_VIEW'))])
# def list_mapping(
#     search: str | None = Query(default=None),
#     ma_ncc: str | None = Query(default=None),
#     ma_nguyen_lieu: str | None = Query(default=None),
#     db: Session = Depends(get_db),
# ):
#     return controller.list(
#         db, search=search, ma_ncc=ma_ncc, ma_nguyen_lieu=ma_nguyen_lieu
#     )


# @router.get('/{ma_nguyen_lieu_ncc}', response_model=NguyenLieuNhaCungCapResponse, dependencies=[Depends(require_permission('NGUYEN_LIEU_NCC_VIEW'))])
# def detail_mapping(ma_nguyen_lieu_ncc: str, db: Session = Depends(get_db)):
#     return controller.detail(db, ma_nguyen_lieu_ncc)


# @router.post('', response_model=NguyenLieuNhaCungCapResponse, status_code=201, dependencies=[Depends(require_permission('NGUYEN_LIEU_NCC_CREATE'))])
# def create_mapping(payload: NguyenLieuNhaCungCapCreate, db: Session = Depends(get_db)):
#     return controller.create(db, payload)


# @router.put('/{ma_nguyen_lieu_ncc}', response_model=NguyenLieuNhaCungCapResponse, dependencies=[Depends(require_permission('NGUYEN_LIEU_NCC_UPDATE'))])
# def update_mapping(
#     ma_nguyen_lieu_ncc: str,
#     payload: NguyenLieuNhaCungCapUpdate,
#     db: Session = Depends(get_db),
# ):
#     return controller.update(db, ma_nguyen_lieu_ncc, payload)

## D:\KLTN\KLTN\backend\src\routes\nguyen_lieu_nha_cung_cap_routes.py
from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from fastapi.responses import Response
from sqlalchemy.orm import Session

from src.controllers.nguyen_lieu_nha_cung_cap_controller import NguyenLieuNhaCungCapController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.nguyen_lieu_nha_cung_cap_schema import (
    NguyenLieuNhaCungCapCreate,
    NguyenLieuNhaCungCapResponse,
    NguyenLieuNhaCungCapUpdate,
)


router = APIRouter(prefix='/nguyen-lieu-nha-cung-cap', tags=['Nguyên liệu theo nhà cung cấp'])

controller = NguyenLieuNhaCungCapController()


@router.get('/excel/template', dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'NHAP_FILE'))])
def excel_template():
    from src.services.supply_excel_service import SupplyExcelService
    return Response(SupplyExcelService().template(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={'Content-Disposition': 'attachment; filename="Template_nguyen_lieu_cung_ung.xlsx"'})


@router.get('/excel/export', dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'XUAT_EXCEL'))])
def excel_export(search: str | None = None, ma_ncc: str | None = None, db: Session = Depends(get_db)):
    from src.services.supply_excel_service import SupplyExcelService
    from src.services.stock_accounting_service import local_today
    return Response(SupplyExcelService().export(db, search=search, ma_ncc=ma_ncc), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={'Content-Disposition': f'attachment; filename="Nguyen_lieu_cung_ung_{local_today():%Y%m%d}.xlsx"'})


@router.post('/excel/preview', dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'NHAP_FILE'))])
async def excel_preview(file: UploadFile = File(...), ma_ncc: str | None = None, db: Session = Depends(get_db)):
    from src.services.supply_excel_service import SupplyExcelService, MAX_BYTES
    return SupplyExcelService().preview(db, await file.read(MAX_BYTES + 1), file.filename, ma_ncc)


@router.post('/excel/import', dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'NHAP_FILE'))])
async def excel_import(file: UploadFile = File(...), confirmed: bool = Form(False), ma_ncc: str | None = None, db: Session = Depends(get_db)):
    from src.services.supply_excel_service import SupplyExcelService, MAX_BYTES
    return SupplyExcelService().import_file(db, await file.read(MAX_BYTES + 1), file.filename, confirmed, ma_ncc)


@router.get('', response_model=list[NguyenLieuNhaCungCapResponse], dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'XEM'))])
def list_mapping(
    search: str | None = Query(default=None),
    ma_ncc: str | None = Query(default=None),
    ma_nguyen_lieu: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(
        db, search=search, ma_ncc=ma_ncc, ma_nguyen_lieu=ma_nguyen_lieu
    )


@router.get('/{ma_nguyen_lieu_ncc}', response_model=NguyenLieuNhaCungCapResponse, dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'XEM'))])
def detail_mapping(ma_nguyen_lieu_ncc: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_nguyen_lieu_ncc)


@router.post('', response_model=NguyenLieuNhaCungCapResponse, status_code=201, dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'THEM'))])
def create_mapping(payload: NguyenLieuNhaCungCapCreate, db: Session = Depends(get_db)):
    return controller.create(db, payload)


@router.put('/{ma_nguyen_lieu_ncc}', response_model=NguyenLieuNhaCungCapResponse, dependencies=[Depends(require_permission('nguyen_lieu_nha_cung_cap', 'SUA'))])
def update_mapping(
    ma_nguyen_lieu_ncc: str,
    payload: NguyenLieuNhaCungCapUpdate,
    db: Session = Depends(get_db),
):
    return controller.update(db, ma_nguyen_lieu_ncc, payload)
