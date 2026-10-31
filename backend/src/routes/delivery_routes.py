from decimal import Decimal
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import Response
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.nha_cung_cap_model import NhaCungCap
from src.services.delivery_service import DeliveryService
from src.services.delivery_kpi_service import DeliveryKpiService
from src.services.delivery_excel_service import DeliveryExcelService, MAX_BYTES
from src.services.delivery_history_service import DeliveryHistoryService
from src.services.delivery_price_update_service import DeliveryPriceUpdateService

router = APIRouter(tags=["Lịch sử giao nguyên liệu"])


def history_filters(search: str = "", ngay_nhan_tu: date | None = None, ngay_nhan_den: date | None = None,
                    ma_ncc: str = "", ma_nguyen_lieu: str = "", ma_don_mua: str = "", ma_phieu_nhap: str = ""):
    return dict(search=search, ngay_nhan_tu=ngay_nhan_tu, ngay_nhan_den=ngay_nhan_den,
                ma_ncc=ma_ncc, ma_nguyen_lieu=ma_nguyen_lieu, ma_don_mua=ma_don_mua, ma_phieu_nhap=ma_phieu_nhap)


@router.get('/giao-nguyen-lieu/lich-su', dependencies=[Depends(require_permission('don_mua_nguyen_lieu', 'XEM'))])
def all_history(filters: dict = Depends(history_filters), db: Session = Depends(get_db)):
    return jsonable_encoder(DeliveryHistoryService.read(db, **filters), custom_encoder={Decimal: str})


@router.get('/giao-nguyen-lieu/lich-su/phieu/{code}', dependencies=[Depends(require_permission('don_mua_nguyen_lieu', 'XEM'))])
def receipt_detail(code: str, db: Session = Depends(get_db)):
    return jsonable_encoder(DeliveryHistoryService.detail(db, code), custom_encoder={Decimal: str})


@router.get('/giao-nguyen-lieu/lich-su/excel/export', dependencies=[
    Depends(require_permission('don_mua_nguyen_lieu', 'XEM')),
    Depends(require_permission('don_mua_nguyen_lieu', 'XUAT_EXCEL')),
])
def export_history(filters: dict = Depends(history_filters), db: Session = Depends(get_db)):
    return Response(DeliveryHistoryService.export(db, **filters),
                    media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={"Content-Disposition": 'attachment; filename="Lich_su_nhap_nguyen_lieu.xlsx"'})


@router.get('/don-mua-nguyen-lieu/{code}/lich-su-nhan-hang', dependencies=[Depends(require_permission('don_mua_nguyen_lieu', 'XEM'))])
def history(code: str, db: Session = Depends(get_db)):
    if db.get(DonMuaNguyenLieu, code) is None: raise HTTPException(404, "Không tìm thấy đơn mua.")
    return jsonable_encoder(DeliveryService.history(db, order_code=code), custom_encoder={Decimal: str})


@router.get('/nha-cung-cap/{code}/hieu-suat-chi-tiet', dependencies=[Depends(require_permission('hieu_suat_nha_cung_cap', 'XEM'))])
def performance_detail(code: str, db: Session = Depends(get_db)):
    supplier = db.get(NhaCungCap, code)
    if supplier is None: raise HTTPException(404, "Không tìm thấy nhà cung cấp.")
    metrics = DeliveryKpiService.summarize(db, code)
    metrics["lich_su_giao"] = DeliveryService.history(db, supplier_code=code)
    from src.services.nha_cung_cap_service import NhaCungCapService
    service = NhaCungCapService()
    minimum, maximum = service.repository.global_lead_time_range(db)
    metrics["diem_ncc"] = supplier.diem_dieu_kien_thuong_mai
    metrics["nguon_tieu_chi"] = {"chat_luong": "THUC_TE" if metrics["quality_ratio"] is not None else "CAU_HINH",
        "dung_han": "THUC_TE" if metrics["on_time_ratio"] is not None else "CAU_HINH",
        "giao_du": "THUC_TE" if metrics["full_ratio"] is not None else "CAU_HINH",
        "lead_time": "THUC_TE" if metrics["lead_time"] is not None else "CAU_HINH", "kha_dung_ncc": "CAU_HINH"}
    metrics["thanh_phan_diem"] = [{"ma_nguyen_lieu": mapping.ma_nguyen_lieu,
        "diem": service.mapping_score(mapping, minimum, maximum, metrics["on_time_ratio"], metrics["full_ratio"], metrics["quality_ratio"], metrics["lead_time"])}
        for mapping in service.repository.mappings(db, code)]
    return jsonable_encoder(metrics, custom_encoder={Decimal: str})


@router.get('/giao-nguyen-lieu/lich-su/excel/template', dependencies=[Depends(require_permission('don_mua_nguyen_lieu', 'NHAP_FILE'))])
def template():
    return Response(DeliveryExcelService.template(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={"Content-Disposition": 'attachment; filename="Template_lich_su_giao_hang.xlsx"'})


IMPORT_RIGHTS = [Depends(require_permission('don_mua_nguyen_lieu', 'NHAP_FILE')), Depends(require_permission('nha_cung_cap', 'TINH_DIEM'))]


@router.post('/giao-nguyen-lieu/lich-su/excel/preview', dependencies=IMPORT_RIGHTS)
async def preview(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return DeliveryExcelService().preview(db, await file.read(MAX_BYTES + 1), file.filename)


@router.post('/giao-nguyen-lieu/lich-su/excel/import', dependencies=IMPORT_RIGHTS)
async def import_history(file: UploadFile = File(...), confirmed: bool = Form(False), db: Session = Depends(get_db)):
    return DeliveryExcelService().import_file(db, await file.read(MAX_BYTES + 1), file.filename, confirmed)


PRICE_UPDATE_RIGHTS = [Depends(require_permission('don_mua_nguyen_lieu', op)) for op in ('XEM', 'NHAP_FILE', 'SUA')]


@router.get('/giao-nguyen-lieu/lich-su/excel/prices/template', dependencies=PRICE_UPDATE_RIGHTS)
def price_update_template(filters: dict = Depends(history_filters), db: Session = Depends(get_db)):
    return Response(DeliveryPriceUpdateService.template(db, **filters),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename="Template_cap_nhat_gia_phieu_nhap.xlsx"'})


@router.post('/giao-nguyen-lieu/lich-su/excel/prices/preview', dependencies=PRICE_UPDATE_RIGHTS)
async def price_update_preview(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return DeliveryPriceUpdateService().preview(db, await file.read(MAX_BYTES + 1), file.filename)


@router.post('/giao-nguyen-lieu/lich-su/excel/prices/apply', dependencies=PRICE_UPDATE_RIGHTS)
async def price_update_apply(file: UploadFile = File(...), confirmed: bool = Form(False),
                             preview_token: str = Form(''), reason: str = Form(''), db: Session = Depends(get_db)):
    return DeliveryPriceUpdateService().apply(db, await file.read(MAX_BYTES + 1), file.filename, confirmed, preview_token, reason)
