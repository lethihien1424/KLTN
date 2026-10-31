## D:\KLTN\KLTN\backend\src\routes\ton_kho_routes.py
from datetime import date

from fastapi import APIRouter, Depends, Query, File, UploadFile, Form
from fastapi.responses import Response
from fastapi.encoders import jsonable_encoder
from decimal import Decimal
from sqlalchemy.orm import Session

from src.controllers.ton_kho_controller import TonKhoController
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.models.user_model import User
from src.schemas.ton_kho_schema import TonKhoCreate, TonKhoResponse, TonKhoUpdate
from src.services.stock_excel_service import StockExcelService, MAX_BYTES
from src.services.stock_detail_service import stock_detail, production_plans
from src.services.stock_production_service import StockProductionService, IssueRequest


router = APIRouter(prefix='/ton-kho-nguyen-lieu', tags=['Tồn kho nguyên liệu'])

controller = TonKhoController()


def excel_response(content, filename):
    return Response(content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get('/excel/template', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'NHAP_FILE'))])
def template(db: Session = Depends(get_db)):
    return excel_response(StockExcelService().template(db), "Template_ton_kho.xlsx")


@router.get('/excel/export', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'XUAT_EXCEL'))])
def export(search: str = "", muc_ton: str = "", ngay_ghi_nhan: date | None = None, db: Session = Depends(get_db)):
    from src.services.stock_accounting_service import local_today
    return excel_response(StockExcelService().export(db, search=search, muc_ton=muc_ton, ngay_ghi_nhan=ngay_ghi_nhan),
                          f"Ton_kho_nguyen_lieu_{local_today():%Y%m%d}.xlsx")


@router.post('/excel/preview', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'NHAP_FILE')),
                                             Depends(require_permission('ton_kho_nguyen_lieu', 'SUA'))])
async def preview(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return StockExcelService().preview(db, await file.read(MAX_BYTES + 1), file.filename)


@router.post('/excel/import', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'NHAP_FILE')),
                                            Depends(require_permission('ton_kho_nguyen_lieu', 'SUA'))])
async def import_excel(file: UploadFile = File(...), confirmed: bool = Form(False), db: Session = Depends(get_db)):
    return StockExcelService().import_file(db, await file.read(MAX_BYTES + 1), file.filename, confirmed)


@router.get('/san-xuat/ke-hoach', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'XEM'))])
def plans(db: Session = Depends(get_db)):
    return jsonable_encoder(production_plans(db), custom_encoder={Decimal: str})


@router.post('/san-xuat/{code}/giu', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'SUA'))])
def reserve(code: str, db: Session = Depends(get_db)):
    return StockProductionService().reserve(db, code)


@router.post('/san-xuat/{code}/xuat', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'SUA'))])
def issue(code: str, payload: IssueRequest, db: Session = Depends(get_db)):
    return StockProductionService().issue(db, code, payload)


@router.post('/san-xuat/{code}/huy', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'SUA'))])
def cancel(code: str, db: Session = Depends(get_db)):
    return StockProductionService().cancel(db, code)


@router.get('/{ma_nguyen_lieu}/chi-tiet', dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'XEM'))])
def detail_current(ma_nguyen_lieu: str, db: Session = Depends(get_db)):
    return jsonable_encoder(stock_detail(db, ma_nguyen_lieu), custom_encoder={Decimal: str})


@router.get('', response_model=list[TonKhoResponse], dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'XEM'))])
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


@router.get('/{ma_nguyen_lieu}', response_model=list[TonKhoResponse], dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'XEM'))])
def history_ton_kho(ma_nguyen_lieu: str, db: Session = Depends(get_db)):
    return controller.history(db, ma_nguyen_lieu)


@router.get('/{ma_nguyen_lieu}/{ngay_ghi_nhan}', response_model=TonKhoResponse, dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'XEM'))])
def detail_ton_kho(ma_nguyen_lieu: str, ngay_ghi_nhan: date, db: Session = Depends(get_db)):
    return controller.detail(db, ma_nguyen_lieu, ngay_ghi_nhan)


@router.post('', response_model=TonKhoResponse, status_code=201, dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'THEM'))])
def create_ton_kho(payload: TonKhoCreate, db: Session = Depends(get_db),
                   user: User = Depends(require_permission('ton_kho_nguyen_lieu', 'THEM'))):
    # Creating another dated snapshot adjusts an existing balance.
    from src.services.stock_accounting_service import StockAccountingService
    current, _ = StockAccountingService().lock(db, payload.ma_nguyen_lieu, required=False)
    if current is not None:
        require_permission('ton_kho_nguyen_lieu', 'SUA')(db=db, current_user=user)
    return controller.create(db, payload)


@router.put('/{ma_nguyen_lieu}/{ngay_ghi_nhan}', response_model=TonKhoResponse, dependencies=[Depends(require_permission('ton_kho_nguyen_lieu', 'SUA'))])
def update_ton_kho(
    ma_nguyen_lieu: str, ngay_ghi_nhan: date,
    payload: TonKhoUpdate, db: Session = Depends(get_db),
):
    return controller.update(db, ma_nguyen_lieu, ngay_ghi_nhan, payload)

# from datetime import date

# from fastapi import APIRouter, Depends, Query
# from sqlalchemy.orm import Session

# from src.controllers.ton_kho_controller import TonKhoController
# from src.core.database import get_db
# from src.dependencies.permission_dependency import require_permission
# from src.schemas.ton_kho_schema import TonKhoCreate, TonKhoResponse, TonKhoUpdate


# router = APIRouter(prefix='/ton-kho-nguyen-lieu', tags=['Tồn kho nguyên liệu'])

# controller = TonKhoController()


# @router.get('', response_model=list[TonKhoResponse], dependencies=[Depends(require_permission('TON_KHO_VIEW'))])
# def list_ton_kho(
#     search: str | None = Query(default=None),
#     trang_thai: str | None = Query(default=None, min_length=1, max_length=30),
#     ngay_ghi_nhan: date | None = Query(default=None),
#     latest_only: bool = Query(default=False),
#     db: Session = Depends(get_db),
# ):
#     return controller.list(
#         db, search=search, trang_thai=trang_thai,
#         ngay_ghi_nhan=ngay_ghi_nhan, latest_only=latest_only,
#     )


# @router.get('/{ma_nguyen_lieu}', response_model=list[TonKhoResponse], dependencies=[Depends(require_permission('TON_KHO_HISTORY_VIEW'))])
# def history_ton_kho(ma_nguyen_lieu: str, db: Session = Depends(get_db)):
#     return controller.history(db, ma_nguyen_lieu)


# @router.get('/{ma_nguyen_lieu}/{ngay_ghi_nhan}', response_model=TonKhoResponse, dependencies=[Depends(require_permission('TON_KHO_VIEW'))])
# def detail_ton_kho(ma_nguyen_lieu: str, ngay_ghi_nhan: date, db: Session = Depends(get_db)):
#     return controller.detail(db, ma_nguyen_lieu, ngay_ghi_nhan)


# @router.post('', response_model=TonKhoResponse, status_code=201, dependencies=[Depends(require_permission('TON_KHO_CREATE'))])
# def create_ton_kho(payload: TonKhoCreate, db: Session = Depends(get_db)):
#     return controller.create(db, payload)


# @router.put('/{ma_nguyen_lieu}/{ngay_ghi_nhan}', response_model=TonKhoResponse, dependencies=[Depends(require_permission('TON_KHO_UPDATE'))])
# def update_ton_kho(
#     ma_nguyen_lieu: str, ngay_ghi_nhan: date,
#     payload: TonKhoUpdate, db: Session = Depends(get_db),
# ):
#     return controller.update(db, ma_nguyen_lieu, ngay_ghi_nhan, payload)
