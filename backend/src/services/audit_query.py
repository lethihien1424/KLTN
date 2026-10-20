##D:\KLTN\KLTN\backend\src\services\audit_query.py
import json
from src.services.activity_audit import safe_key


def audit_response(log, current_name=None):
    try:
        description = json.loads(log.mo_ta or '{}')
        if not isinstance(description, dict):
            description = {}
    except (ValueError, TypeError):
        description = {}
    before = log.du_lieu_truoc or description.get('du_lieu_truoc', {})
    after = log.du_lieu_sau or description.get('du_lieu_sau', {})
    if not before and not after and 'trang_thai_cu' in description:
        before = {'trang_thai': description['trang_thai_cu']}
        after = {'trang_thai': description.get('trang_thai_moi')}
    keys = sorted(k for k in set(before) | set(after) if safe_key(k) and before.get(k) != after.get(k))
    return {
        'ma_nhat_ky': log.ma_nhat_ky, 'thoi_gian': log.thoi_gian,
        'ma_nguoi_dung': log.ma_nguoi_dung or description.get('nguoi_thao_tac', {}).get('ma_nguoi_dung'),
        'ho_ten': log.ten_nguoi_thao_tac or description.get('nguoi_thao_tac', {}).get('ho_ten') or current_name,
        'module': log.module or description.get('module'),
        'chuc_nang': log.chuc_nang or description.get('chuc_nang'),
        'hanh_dong': log.hanh_dong, 'ma_doi_tuong': log.ma_doi_tuong or description.get('doi_tuong'),
        'ket_qua': log.ket_qua,
        'du_lieu_truoc': {k: before.get(k) for k in keys},
        'du_lieu_sau': {k: after.get(k) for k in keys},
        # Keep structured, non-sensitive reason snapshots compatible with old clients.
        'mo_ta': json.dumps({k: description[k] for k in ('doi_tuong', 'trang_thai_cu', 'trang_thai_moi', 'ly_do_id', 'ly_do', 'ghi_chu') if k in description}, ensure_ascii=False),
    }


BUSINESS_MODULES = ('Nguyên liệu', 'Nhà cung cấp', 'Mua hàng', 'Duyệt kế hoạch mua hàng')

def list_audit(db, search='', module='', hanh_dong='', nguoi_thao_tac='', tu_ngay=None, den_ngay=None, page=1, page_size=10, scope=None):
    from datetime import datetime, time, timedelta
    from sqlalchemy import select, func, or_
    from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
    from fastapi import HTTPException
    from zoneinfo import ZoneInfo
    from src.models.user_model import User
    if tu_ngay and den_ngay and tu_ngay > den_ngay:
        raise HTTPException(422, 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.')
    query = select(NhatKyHoatDong, User.ho_ten).outerjoin(User, User.ma_nguoi_dung == NhatKyHoatDong.ma_nguoi_dung).where(NhatKyHoatDong.ket_qua == 'THANH_CONG', NhatKyHoatDong.module.in_(BUSINESS_MODULES))
    if scope:
        functions, code = scope
        escaped = code.replace('/', '//').replace('%', '/%').replace('_', '/_')
        query = query.where(NhatKyHoatDong.chuc_nang.in_(functions), or_(NhatKyHoatDong.ma_doi_tuong == code, NhatKyHoatDong.ma_doi_tuong.like(escaped + '//%', escape='/')))
    actor_scope = query
    if search.strip():
        term = '%' + search.strip().replace('/', '//').replace('%', '/%').replace('_', '/_') + '%'
        query = query.where(or_(NhatKyHoatDong.ma_doi_tuong.ilike(term, escape='/'),
                              NhatKyHoatDong.ma_nguoi_dung.ilike(term, escape='/'),
                              NhatKyHoatDong.ten_nguoi_thao_tac.ilike(term, escape='/'), User.ho_ten.ilike(term, escape='/')))
    if module:
        query = query.where(NhatKyHoatDong.module == module)
    if hanh_dong:
        query = query.where(NhatKyHoatDong.hanh_dong == hanh_dong)
    if nguoi_thao_tac:
        query = query.where(NhatKyHoatDong.ma_nguoi_dung == nguoi_thao_tac)
    tz = ZoneInfo('Asia/Ho_Chi_Minh')
    if tu_ngay:
        query = query.where(NhatKyHoatDong.thoi_gian >= datetime.combine(tu_ngay, time.min, tzinfo=tz))
    if den_ngay:
        query = query.where(NhatKyHoatDong.thoi_gian < datetime.combine(den_ngay + timedelta(days=1), time.min, tzinfo=tz))
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.execute(query.order_by(NhatKyHoatDong.thoi_gian.desc(), NhatKyHoatDong.ma_nhat_ky.desc()).offset((page-1)*page_size).limit(page_size))
    actors = db.execute(actor_scope.with_only_columns(NhatKyHoatDong.ma_nguoi_dung,
        func.max(func.coalesce(NhatKyHoatDong.ten_nguoi_thao_tac, User.ho_ten)), maintain_column_froms=True)
        .where(NhatKyHoatDong.ma_nguoi_dung.is_not(None)).group_by(NhatKyHoatDong.ma_nguoi_dung)
        .order_by(NhatKyHoatDong.ma_nguoi_dung)).all()
    return {'items': [audit_response(log, name) for log, name in rows], 'total': total, 'page': page, 'page_size': page_size,
            'actors': [{'ma_nguoi_dung': code, 'ho_ten': name} for code, name in actors]}
