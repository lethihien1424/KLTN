# ##D:\KLTN\KLTN\backend\src\routes\cong_thuc_routes.py
# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session

# from src.controllers.cong_thuc_controller import CongThucController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.cong_thuc_schema import (
#     CongThucCreate, CongThucUpdate, CongThucStatusUpdate,
#     CongThucResponse, CongThucDetailResponse, TrangThaiCongThuc,
# )


# router = APIRouter(prefix='/cong-thuc', tags=['Công thức / BOM'])

# controller = CongThucController()


# @router.get('', response_model=list[CongThucResponse], dependencies=[Depends(require_permission('CONG_THUC_VIEW'))])
# def list_cong_thuc(
#     search: str | None = Query(default=None),
#     ma_san_pham: str | None = Query(default=None),
#     trang_thai: TrangThaiCongThuc | None = Query(default=None),
#     db: Session = Depends(get_db),
# ):
#     return controller.list(db, search, ma_san_pham, trang_thai)


# @router.get('/{ma_cong_thuc}', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('CONG_THUC_VIEW'))])
# def detail_cong_thuc(ma_cong_thuc: str, db: Session = Depends(get_db)):
#     return controller.detail(db, ma_cong_thuc)


# @router.post('', response_model=CongThucDetailResponse, status_code=201, dependencies=[Depends(require_permission('CONG_THUC_CREATE'))])
# def create_cong_thuc(payload: CongThucCreate, db: Session = Depends(get_db)):
#     return controller.create(db, payload)


# @router.put('/{ma_cong_thuc}', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('CONG_THUC_UPDATE'))])
# def update_cong_thuc(ma_cong_thuc: str, payload: CongThucUpdate, db: Session = Depends(get_db)):
#     return controller.update(db, ma_cong_thuc, payload)


# @router.patch('/{ma_cong_thuc}/trang-thai', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('CONG_THUC_CHANGE_STATUS'))])
# def status_cong_thuc(ma_cong_thuc: str, payload: CongThucStatusUpdate, actor=Depends(require_permission("CONG_THUC_CHANGE_STATUS")), db: Session = Depends(get_db)):
#     return controller.update_status(db, ma_cong_thuc, payload, actor.ma_nguoi_dung)
##D:\KLTN\KLTN\backend\src\routes\cong_thuc_routes.py
from fastapi import APIRouter, Depends, Query, File, Form, UploadFile, Response
from src.services.bom_excel_service import BomExcelService, MAX_BYTES
from sqlalchemy.orm import Session

from src.controllers.cong_thuc_controller import CongThucController
from src.schemas.cong_thuc_schema import SanPhamDinhLuongResponse
from src.schemas.cong_thuc_schema import CongThucEdit
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.cong_thuc_schema import (
    CongThucCreate, CongThucUpdate, CongThucStatusUpdate,
    CongThucResponse, CongThucDetailResponse, TrangThaiCongThuc,
)


router = APIRouter(prefix='/cong-thuc', tags=['Công thức / BOM'])

controller = CongThucController()
excel_service = BomExcelService()


@router.get('/excel/template', dependencies=[Depends(require_permission('cong_thuc', 'NHAP_FILE'))])
def bom_template():
    return Response(excel_service.template(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": 'attachment; filename="Template_cong_thuc_BOM.xlsx"'})


@router.post('/excel/preview', dependencies=[Depends(require_permission('cong_thuc', 'NHAP_FILE'))])
async def preview_bom_excel(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return excel_service.preview(db, await file.read(MAX_BYTES + 1), file.filename)


@router.post('/excel/import', dependencies=[Depends(require_permission('cong_thuc', 'NHAP_FILE'))])
async def import_bom_excel(file: UploadFile = File(...), confirmed: bool = Form(False), db: Session = Depends(get_db)):
    return excel_service.import_file(db, await file.read(MAX_BYTES + 1), file.filename, confirmed)


@router.get('/excel/export', dependencies=[Depends(require_permission('cong_thuc', 'XUAT_EXCEL'))])
def export_bom_excel(search: str | None = Query(None), ma_san_pham: str | None = Query(None),
                     trang_thai: TrangThaiCongThuc | None = Query(None), db: Session = Depends(get_db)):
    content, filename = excel_service.export(db, search, ma_san_pham, trang_thai)
    return Response(content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get('', response_model=list[CongThucResponse], dependencies=[Depends(require_permission('cong_thuc', 'XEM'))])
def list_cong_thuc(
    search: str | None = Query(default=None),
    ma_san_pham: str | None = Query(default=None),
    trang_thai: TrangThaiCongThuc | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return controller.list(db, search, ma_san_pham, trang_thai)


@router.get('/san-pham/{ma_san_pham}/dinh-luong', response_model=SanPhamDinhLuongResponse, dependencies=[Depends(require_permission('cong_thuc', 'XEM'))])
def product_quantities(ma_san_pham: str, db: Session = Depends(get_db)):
    return controller.product_info(db, ma_san_pham)


@router.get('/{ma_cong_thuc}', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('cong_thuc', 'XEM'))])
def detail_cong_thuc(ma_cong_thuc: str, db: Session = Depends(get_db)):
    return controller.detail(db, ma_cong_thuc)


@router.post('', response_model=CongThucDetailResponse, status_code=201, dependencies=[Depends(require_permission('cong_thuc', 'THEM'))])
def create_cong_thuc(payload: CongThucCreate, db: Session = Depends(get_db)):
    return controller.create(db, payload)


@router.put('/{ma_cong_thuc}', response_model=CongThucDetailResponse)
def update_cong_thuc(ma_cong_thuc: str, payload: CongThucEdit,
                    actor=Depends(require_permission('cong_thuc', 'SUA')), db: Session = Depends(get_db)):
    if payload.thay_doi_trang_thai is not None:
        require_permission('cong_thuc', 'XAC_NHAN')(db=db, current_user=actor)
    return controller.update(db, ma_cong_thuc, payload, actor.ma_nguoi_dung)


@router.patch('/{ma_cong_thuc}/trang-thai', response_model=CongThucDetailResponse, dependencies=[Depends(require_permission('cong_thuc', 'XAC_NHAN'))])
def status_cong_thuc(ma_cong_thuc: str, payload: CongThucStatusUpdate, actor=Depends(require_permission("cong_thuc", "XAC_NHAN")), db: Session = Depends(get_db)):
    return controller.update_status(db, ma_cong_thuc, payload, actor.ma_nguoi_dung)
