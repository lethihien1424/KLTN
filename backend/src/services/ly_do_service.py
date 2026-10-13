import json
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy import select, delete
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong


def reason_response(db, reason):
    return {key: getattr(reason, key) for key in ('id', 'ma_ly_do', 'ten_ly_do', 'ghi_chu', 'trang_thai', 'created_at', 'updated_at', 'created_by', 'updated_by')} | {
        'chuc_nang_ap_dung': list(db.scalars(select(LyDoChucNang.chuc_nang).where(LyDoChucNang.ly_do_id == reason.id)))
    }


def record_status_change(db, model, payload, actor, function, code):
    # Lock the reason until the status change and audit snapshot commit together.
    reason = db.scalar(select(LyDo).where(LyDo.id == payload.ly_do_id).with_for_update())
    if reason is None or reason.trang_thai != 'DANG_SU_DUNG':
        raise HTTPException(422, 'Lý do không tồn tại hoặc đã ngừng sử dụng.')
    applicable = db.scalar(select(LyDoChucNang.id).where(LyDoChucNang.ly_do_id == reason.id, LyDoChucNang.chuc_nang == function))
    if not applicable:
        raise HTTPException(422, 'Lý do không áp dụng cho chức năng này.')
    note = (payload.ghi_chu or '').strip()
    if reason.ten_ly_do.strip().casefold() == 'khác' and not note:
        raise HTTPException(422, 'Vui lòng nhập ghi chú khi chọn lý do "Khác".')
    if not actor:
        raise HTTPException(401, 'Chưa xác định người thực hiện.')
    snapshot = {'doi_tuong': code, 'trang_thai_cu': model.trang_thai, 'trang_thai_moi': payload.trang_thai,
                'ly_do_id': reason.id, 'ly_do': reason.ten_ly_do, 'ghi_chu': note or None}
    if db.info.get('audit_actor'):
        db.info.setdefault('audit_reason', {})[code] = snapshot
    else:
        db.add(NhatKyHoatDong(ma_nhat_ky='NK' + uuid4().hex[:18], ma_nguoi_dung=actor,
                             hanh_dong=function, ket_qua='THANH_CONG', mo_ta=json.dumps(snapshot, ensure_ascii=False)))


def write_reason(db, payload, actor, code=None, can_change_status=False):
    try:
        model = db.scalar(select(LyDo).where(LyDo.id == code).with_for_update()) if code else None
        if code and model is None:
            raise HTTPException(404, 'Không tìm thấy lý do.')
        if model is not None and model.trang_thai != payload.trang_thai and not can_change_status:
            raise HTTPException(403, 'Bạn chưa có quyền đổi trạng thái lý do.')
        if model is None:
            code = 'LD' + uuid4().hex[:18]
            model = LyDo(id=code, ma_ly_do=code, created_by=actor)
            db.add(model)
        model.ten_ly_do = payload.ten_ly_do
        model.ghi_chu = payload.ghi_chu
        model.trang_thai = payload.trang_thai
        model.updated_by = actor
        model.updated_at = datetime.now(timezone.utc)
        db.flush()
        db.execute(delete(LyDoChucNang).where(LyDoChucNang.ly_do_id == model.id))
        for function in set(payload.chuc_nang_ap_dung):
            db.add(LyDoChucNang(id=uuid4().hex, ly_do_id=model.id, chuc_nang=function))
        db.flush()
        result = reason_response(db, model)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise
