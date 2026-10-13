"""Transactional, authenticated audit for ORM business writes.

Snapshots extend the existing audit table; business tables are unchanged.
Only explicitly listed business tables are recorded, never users or credentials.
"""
import json
from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import event, inspect, select
from sqlalchemy.orm import Session

from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong

TABLES = {
    'nguyen_lieu': ('Nguyên liệu', 'Nguyên liệu'),
    'cong_thuc': ('Nguyên liệu', 'Công thức / BOM'),
    'chi_tiet_cong_thuc': ('Nguyên liệu', 'Chi tiết công thức'),
    'ton_kho_nguyen_lieu': ('Nguyên liệu', 'Tồn kho nguyên liệu'),
    'nha_cung_cap': ('Nhà cung cấp', 'Nhà cung cấp'),
    'nguyen_lieu_nha_cung_cap': ('Nhà cung cấp', 'Nguyên liệu cung ứng'),
    'de_xuat_nhap_hang': ('Mua hàng', 'Đề xuất nhập hàng'),
    'chi_tiet_de_xuat_nhap_hang': ('Mua hàng', 'Chi tiết đề xuất'),
    'don_mua_nguyen_lieu': ('Mua hàng', 'Đơn mua nguyên liệu'),
    'chi_tiet_don_mua': ('Mua hàng', 'Chi tiết đơn mua'),
}
SENSITIVE = ('password', 'mat_khau', 'token', 'secret', 'authorization', 'email', 'dien_thoai', 'dia_chi')


def safe_key(key):
    return not any(part in key.lower() for part in SENSITIVE)


def value_json(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    return value


def bind_actor(db, user, request=None):
    """Call only with a server-authenticated user, never a request payload."""
    db.info['audit_actor'] = {'ma_nguoi_dung': user.ma_nguoi_dung, 'ho_ten': user.ho_ten}
    if request is not None:
        db.info['audit_request'] = {'method': request.method, 'path': request.url.path}


def metadata(db, table, action):
    module, function = TABLES[table]
    path = db.info.get('audit_request', {}).get('path', '')
    if path.endswith('/duyet') or path.endswith('/tu-choi'):
        module = 'Duyệt kế hoạch mua hàng'
        action = 'DUYET' if path.endswith('/duyet') else 'TU_CHOI'
    elif path.startswith('/api/imports/'):
        action = 'NHAP_DU_LIEU'
    elif path.endswith('/nhan-hang'):
        action = 'NHAN_HANG'
    return module, function, action


@event.listens_for(Session, 'before_flush')
def capture_before(db, flush_context, instances):
    if not db.info.get('audit_actor') or db.info.get('audit_request', {}).get('method') not in ('POST', 'PUT', 'PATCH', 'DELETE'):
        return
    pending = []
    for obj in set(db.new) | set(db.dirty) | set(db.deleted):
        state = inspect(obj)
        table = state.mapper.local_table
        if table.name not in TABLES:
            continue
        before = None
        if state.identity is not None:
            condition = [col == val for col, val in zip(state.mapper.primary_key, state.identity)]
            row = db.connection().execute(select(table).where(*condition).with_for_update()).mappings().first()
            before = dict(row) if row else None
        pending.append((obj, before, obj in db.deleted))
    db.info['audit_pending'] = pending


@event.listens_for(Session, 'after_flush')
def record_after(db, flush_context):
    actor = db.info.get('audit_actor')
    for obj, before, deleted in db.info.pop('audit_pending', []):
        state = inspect(obj)
        table = state.mapper.local_table
        after = {} if deleted else {col.key: getattr(obj, col.key) for col in table.columns}
        old = before or {}
        keys = sorted(k for k in set(old) | set(after) if safe_key(k)
                      and k not in ('updated_at', 'thoi_gian_cap_nhat') and old.get(k) != after.get(k))
        if not keys:
            continue
        action = 'XOA' if deleted else ('TAO_MOI' if before is None else 'CHINH_SUA')
        if before and 'trang_thai' in keys:
            action = 'CAP_NHAT_TRANG_THAI'
        module, function, action = metadata(db, table.name, action)
        code = '/'.join(str(after.get(col.key, old.get(col.key, ''))) for col in state.mapper.primary_key)
        parent_key = {'chi_tiet_cong_thuc': 'ma_cong_thuc', 'chi_tiet_de_xuat_nhap_hang': 'ma_de_xuat',
                      'chi_tiet_don_mua': 'ma_don_mua'}.get(table.name)
        if parent_key:
            code = str(after.get(parent_key, old.get(parent_key, ''))) + '/' + code
        snapshot = {
            'version': 1, 'module': module, 'chuc_nang': function,
            'hanh_dong': action, 'doi_tuong': code, 'bang': table.name,
            'nguoi_thao_tac': actor,
            'du_lieu_truoc': {k: value_json(old.get(k)) for k in keys},
            'du_lieu_sau': {k: value_json(after.get(k)) for k in keys},
        }
        reason = db.info.get('audit_reason', {}).pop(code, None)
        if reason:
            snapshot.update(reason)
        # Direct insert avoids recursive ORM flushes; uses the business transaction.
        db.connection().execute(NhatKyHoatDong.__table__.insert().values(
            ma_nhat_ky='NK' + uuid4().hex[:18], ma_nguoi_dung=actor['ma_nguoi_dung'],
            hanh_dong=action, ket_qua='THANH_CONG', thoi_gian=datetime.now(timezone.utc),
            module=module, chuc_nang=function, ma_doi_tuong=code, ten_nguoi_thao_tac=actor['ho_ten'],
            du_lieu_truoc=snapshot['du_lieu_truoc'], du_lieu_sau=snapshot['du_lieu_sau'],
            mo_ta=json.dumps(snapshot, ensure_ascii=False),
        ))


@event.listens_for(Session, 'after_rollback')
def discard_pending(db):
    db.info.pop('audit_pending', None)
    db.info.pop('audit_reason', None)

