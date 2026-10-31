"""Single transaction boundary is owned by the calling business service."""
from datetime import date, datetime
from decimal import Decimal
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select

from src.models.stock_movement_model import StockMovement
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.repositories.ton_kho_repository import TonKhoRepository


def local_today():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()


class StockAccountingService:
    repository = TonKhoRepository()

    @staticmethod
    def actor(db, user=None):
        actor = getattr(user, "ma_nguoi_dung", None) or db.info.get("audit_actor", {}).get("ma_nguoi_dung")
        if not actor:
            raise HTTPException(401, "Chưa xác định người thực hiện giao dịch kho.")
        return actor

    def lock(self, db, code, required=True):
        # Serialize even when no stock row exists; all inventory writers use this parent lock.
        material = self.repository.material(db, code, lock=True)
        if material is None:
            raise HTTPException(422, f"Nguyên liệu {code} không tồn tại.")
        stock = self.repository.latest_for_receipt(db, code)
        if stock is None and required:
            raise HTTPException(422, f"Nguyên liệu {code} chưa có bản ghi tồn kho. Hãy ghi nhận tồn đầu kỳ.")
        return stock, material

    @staticmethod
    def reason(db, reason_id, note):
        reason = db.scalar(select(LyDo).where(LyDo.id == reason_id).with_for_update(read=True))
        if reason is None or reason.trang_thai != "DANG_SU_DUNG":
            raise HTTPException(422, "Lý do không tồn tại hoặc đã ngừng sử dụng.")
        if not db.scalar(select(LyDoChucNang.id).where(
            LyDoChucNang.ly_do_id == reason_id, LyDoChucNang.chuc_nang == "DIEU_CHINH_TON_KHO")):
            raise HTTPException(422, "Lý do không áp dụng cho điều chỉnh tồn kho.")
        if reason.ten_ly_do.strip().casefold() == "khác" and not (note or "").strip():
            raise HTTPException(422, 'Vui lòng nhập ghi chú khi chọn lý do "Khác".')
        return reason.ten_ly_do

    def record(self, db, stock, before, held_before, kind, reference, reason, note=None, actor=None, recorded=None):
        movement = StockMovement(
            ma_nguyen_lieu=stock.ma_nguyen_lieu, ngay_kiem_ke=recorded or local_today(),
            loai=kind, so_luong=stock.ton_kho_thuc_te - before,
            ton_truoc=before, ton_sau=stock.ton_kho_thuc_te,
            giu_truoc=held_before, giu_sau=stock.so_luong_book,
            tham_chieu=reference, nguoi_thuc_hien=self.actor(db, actor), ly_do=reason, ghi_chu=note,
        )
        db.add(movement)
        db.flush()
        return movement

    def count(self, db, payload, code, recorded, creating=False):
        stock, material = self.lock(db, code, required=False)
        if material.trang_thai != "DANG_SU_DUNG":
            raise HTTPException(422, "Nguyên liệu đã ngừng sử dụng.")
        if recorded > local_today():
            raise HTTPException(422, "Ngày kiểm kê không được ở tương lai.")
        if stock and recorded < stock.ngay_ghi_nhan:
            raise HTTPException(409, "Chỉ ghi nhận/điều chỉnh bản ghi tồn kho mới nhất; không sửa snapshot cũ.")
        if creating and self.repository.get(db, code, recorded):
            raise HTTPException(409, "Bản ghi ngày này đã có; hãy dùng chức năng chỉnh sửa.")
        held = stock.so_luong_book if stock else Decimal("0")
        if payload.so_luong_book is not None and payload.so_luong_book != held:
            raise HTTPException(422, "Không sửa số đã giữ trực tiếp. Hãy dùng giữ/xuất/hủy theo kế hoạch.")
        before = stock.ton_kho_thuc_te if stock else Decimal("0")
        if payload.ton_kho_thuc_te < before and payload.ton_kho_thuc_te < held:
            raise HTTPException(409, "Giảm tồn sẽ thiếu nguyên liệu đang giữ. Hãy đối soát hoặc giải phóng phần giữ trước.")
        reason = self.reason(db, payload.ly_do_id, payload.ghi_chu)
        values = payload.model_dump(exclude={"ma_nguyen_lieu", "ngay_ghi_nhan", "ly_do_id", "ghi_chu", "so_luong_book"})
        values["so_luong_book"] = held
        initial = stock is None
        if stock is None or recorded > stock.ngay_ghi_nhan:
            stock = self.repository.add(db, {**values, "ma_nguyen_lieu": code, "ngay_ghi_nhan": recorded})
        else:
            self.repository.update(db, stock, values)
        self.record(db, stock, before, held, "TON_DAU_KY" if initial else "KIEM_KE", f"{code}/{recorded}",
                    reason, payload.ghi_chu, recorded=getattr(payload, "ngay_ghi_nhan", local_today()))
        return stock, material
