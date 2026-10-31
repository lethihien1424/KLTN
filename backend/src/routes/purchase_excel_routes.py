from datetime import date
from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.don_mua_schema import TrangThaiDonMua
from src.services.purchase_excel_service import PurchaseExcelService, MAX_BYTES

router = APIRouter()
service = PurchaseExcelService()
MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
view = Depends(require_permission("don_mua_nguyen_lieu", "XEM"))
create = Depends(require_permission("don_mua_nguyen_lieu", "THEM"))
upload = Depends(require_permission("don_mua_nguyen_lieu", "NHAP_FILE"))


@router.get("/excel/template", dependencies=[view, create, upload])
def template():
    return Response(service.template(), media_type=MIME,
                    headers={"Content-Disposition": 'attachment; filename="Template_don_mua_nguyen_lieu.xlsx"'})


@router.post("/excel/preview", dependencies=[view, create, upload])
async def preview(file: UploadFile = File(...), db: Session = Depends(get_db)):
    return service.preview(db, await file.read(MAX_BYTES + 1), file.filename)


@router.post("/excel/import", dependencies=[view, upload])
async def import_orders(file: UploadFile = File(...), confirmed: bool = Form(False),
                        db: Session = Depends(get_db), actor=create):
    return service.import_file(db, await file.read(MAX_BYTES + 1), file.filename, confirmed, actor)


@router.get("/excel/export", dependencies=[view, Depends(require_permission("don_mua_nguyen_lieu", "XUAT_EXCEL"))])
def export(search: str | None = Query(None), ma_ncc: str | None = Query(None),
           trang_thai: TrangThaiDonMua | None = Query(None), ngay_dat_tu: date | None = Query(None),
           ngay_dat_den: date | None = Query(None), db: Session = Depends(get_db)):
    content, filename = service.export(db, search=search, ma_ncc=ma_ncc, trang_thai=trang_thai,
                                       ngay_dat_tu=ngay_dat_tu, ngay_dat_den=ngay_dat_den)
    return Response(content, media_type=MIME, headers={"Content-Disposition": f'attachment; filename="{filename}"'})
