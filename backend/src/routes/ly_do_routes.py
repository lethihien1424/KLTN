from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission, get_authorization
from src.services.authorization_service import AuthorizationService
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.schemas.ly_do_schema import ReasonWrite, ReasonStatusWrite, FunctionCode, ReasonStatus
from src.services.ly_do_service import reason_response, write_reason

router = APIRouter(tags=['Cấu hình lý do'])


@router.get('/ly-do')
def reasons(search: str = '', chuc_nang: FunctionCode | None = None, trang_thai: ReasonStatus | None = None,
            page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
            db: Session = Depends(get_db), user=Depends(require_permission('VIEW_REASON_CONFIG'))):
    query = select(LyDo)
    if search.strip():
        term = search.strip().replace('/', '//').replace('%', '/%').replace('_', '/_')
        query = query.where(LyDo.ten_ly_do.ilike('%' + term + '%', escape='/'))
    if trang_thai:
        query = query.where(LyDo.trang_thai == trang_thai)
    if chuc_nang:
        query = query.where(LyDo.id.in_(select(LyDoChucNang.ly_do_id).where(LyDoChucNang.chuc_nang == chuc_nang)))
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(query.order_by(LyDo.created_at.desc(), LyDo.id).offset((page-1)*page_size).limit(page_size))
    return {'items': [reason_response(db, row) for row in rows], 'total': total, 'page': page, 'page_size': page_size}


@router.get('/ly-do/ap-dung')
def applicable(chuc_nang: FunctionCode, db: Session = Depends(get_db), context=Depends(get_authorization)):
    permission = {'DOI_TRANG_THAI_NGUYEN_LIEU': 'NGUYEN_LIEU_CHANGE_STATUS', 'DOI_TRANG_THAI_CONG_THUC': 'CONG_THUC_CHANGE_STATUS', 'DOI_TRANG_THAI_NHA_CUNG_CAP': 'NHA_CUNG_CAP_CHANGE_STATUS'}[chuc_nang]
    AuthorizationService.check(context, permission)
    rows = db.scalars(select(LyDo).join(LyDoChucNang, LyDo.id == LyDoChucNang.ly_do_id).where(LyDo.trang_thai == 'DANG_SU_DUNG', LyDoChucNang.chuc_nang == chuc_nang).order_by(LyDo.ten_ly_do))
    return [reason_response(db, row) for row in rows]


@router.post('/ly-do', status_code=201)
def create(payload: ReasonWrite, db: Session = Depends(get_db), user=Depends(require_permission('CREATE_REASON_CONFIG'))):
    return write_reason(db, payload, user.ma_nguoi_dung)


@router.put('/ly-do/{code}')
def update(code: str, payload: ReasonWrite, db: Session = Depends(get_db), user=Depends(require_permission('UPDATE_REASON_CONFIG')), context=Depends(get_authorization)):
    # Status grants remain separate even when editing all fields.
    model = db.get(LyDo, code)
    if model and model.trang_thai != payload.trang_thai:
        AuthorizationService.check(context, 'CHANGE_REASON_CONFIG_STATUS')
    return write_reason(db, payload, user.ma_nguoi_dung, code, 'CHANGE_REASON_CONFIG_STATUS' in context.permissions)


@router.patch('/ly-do/{code}/trang-thai')
def change_status(code: str, payload: ReasonStatusWrite, db: Session = Depends(get_db), user=Depends(require_permission('CHANGE_REASON_CONFIG_STATUS'))):
    from fastapi import HTTPException
    model = db.scalar(select(LyDo).where(LyDo.id == code).with_for_update())
    if model is None:
        raise HTTPException(404, 'Không tìm thấy lý do.')
    model.trang_thai = payload.trang_thai
    model.updated_at = datetime.now(timezone.utc)
    model.updated_by = user.ma_nguoi_dung
    db.flush()
    result = reason_response(db, model)
    db.commit()
    return result


@router.get('/nhat-ky-hoat-dong')
def audit(search: str = '', module: str = '', hanh_dong: str = '', nguoi_thao_tac: str = '',
          tu_ngay: date | None = None, den_ngay: date | None = None,
          page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
          db: Session = Depends(get_db), user=Depends(require_permission('VIEW_AUDIT_LOG'))):
    from src.services.audit_query import list_audit
    return list_audit(db, search, module, hanh_dong, nguoi_thao_tac, tu_ngay, den_ngay, page, page_size)


HISTORY_SCOPES = {
    'nguyen-lieu': ('NGUYEN_LIEU_VIEW', ('Nguyên liệu',)),
    'nha-cung-cap': ('NHA_CUNG_CAP_VIEW', ('Nhà cung cấp',)),
    'cong-thuc': ('CONG_THUC_VIEW', ('Công thức / BOM', 'Chi tiết công thức')),
    'ton-kho-nguyen-lieu': ('TON_KHO_VIEW', ('Tồn kho nguyên liệu',)),
    'nguyen-lieu-nha-cung-cap': ('NGUYEN_LIEU_NCC_VIEW', ('Nguyên liệu cung ứng',)),
    'de-xuat-nhap-hang': ('DE_XUAT_NHAP_HANG_VIEW', ('Đề xuất nhập hàng', 'Chi tiết đề xuất')),
    'don-mua-nguyen-lieu': ('DON_MUA_VIEW', ('Đơn mua nguyên liệu', 'Chi tiết đơn mua')),
}


@router.get('/nhat-ky-hoat-dong/doi-tuong/{entity}/{code:path}')
def object_history(entity: str, code: str, search: str = '', module: str = '', hanh_dong: str = '',
                   nguoi_thao_tac: str = '', tu_ngay: date | None = None, den_ngay: date | None = None,
                   page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
                   db: Session = Depends(get_db), context=Depends(get_authorization)):
    from fastapi import HTTPException
    from src.services.audit_query import list_audit
    scope = HISTORY_SCOPES.get(entity)
    if not scope:
        raise HTTPException(404, 'Không tìm thấy chức năng lịch sử.')
    permission, functions = scope
    if 'VIEW_AUDIT_LOG' not in context.permissions:
        AuthorizationService.check(context, permission)
    return list_audit(db, search, module, hanh_dong, nguoi_thao_tac, tu_ngay, den_ngay, page, page_size, (functions, code))
