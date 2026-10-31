from decimal import Decimal
from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy import select
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.user_model import User
from src.repositories.nha_cung_cap_repository import NhaCungCapRepository
from src.services.stock_accounting_service import StockAccountingService, local_today


class DeliveryService:
    def receive(self, owner, db, code, payload):
        # Same lock order as scoring/import: supplier -> order -> material parents -> stocks.
        initial = owner._get(db, code)
        supplier_code = initial.ma_ncc
        NhaCungCapRepository.get(db, supplier_code, lock=True)
        order = owner._get(db, code, lock=True)
        if order.ma_ncc != supplier_code:
            raise HTTPException(409, "Đơn vừa đổi nhà cung cấp; vui lòng tải lại trước khi nhận.")
        if payload.request_id:
            previous = db.scalar(select(DeliveryReceipt).where(DeliveryReceipt.request_id == payload.request_id))
            if previous:
                if previous.ma_don_mua != code or previous.request_payload != payload.model_dump(mode="json"):
                    raise HTTPException(409, "Mã yêu cầu nhận hàng đã dùng với nội dung khác.")
                return owner._detail(db, order)
        if order.trang_thai != "DA_DUYET":
            raise HTTPException(409, "Chỉ được nhận hàng cho đơn mua DA_DUYET còn mở.")
        if not order.ngay_dat_hang <= payload.ngay_giao_thuc_te <= local_today():
            raise HTTPException(422, "Ngày nhận phải từ ngày đặt hàng đến hôm nay.")
        old_receipts = list(db.scalars(select(DeliveryReceipt).where(DeliveryReceipt.ma_don_mua == code)))
        if old_receipts and payload.ngay_giao_thuc_te < max(row.ngay_giao_thuc_te for row in old_receipts):
            raise HTTPException(422, "Ngày nhận đợt mới không được trước đợt đã xác nhận.")
        details = owner.repository.receipt_details(db, code)
        requested = {row.ma_chi_tiet_don_mua: row for row in payload.chi_tiet}
        if set(requested) != {row.ma_chi_tiet_don_mua for row in details}:
            raise HTTPException(422, "Phải cung cấp đúng và đủ chi tiết của đơn mua (nhập 0 nếu chưa giao trong đợt này).")
        validated = []
        for detail in details:
            item = requested[detail.ma_chi_tiet_don_mua]
            remaining = detail.so_luong_mua - detail.so_luong_thuc_nhan
            delivered = item.so_luong_giao if item.so_luong_giao is not None else item.so_luong_thuc_nhan
            if delivered > remaining or item.so_luong_thuc_nhan > remaining:
                raise HTTPException(422, "Số giao/nhập đợt này không được vượt số lượng còn chờ của đơn.")
            reason = (item.ly_do_khong_nhan or "").strip()
            if (delivered > item.so_luong_thuc_nhan or (payload.hoan_tat and item.so_luong_thuc_nhan < remaining)) and not reason:
                raise HTTPException(422, "Nhận thiếu, hàng lỗi hoặc không chấp nhận toàn bộ hàng giao phải có lý do.")
            validated.append((detail, item, delivered, reason))
        if not payload.hoan_tat and not any(delivered > 0 for _, _, delivered, _ in validated):
            raise HTTPException(422, "Đợt nhận còn mở phải có hàng giao thực tế.")
        accounting = StockAccountingService()
        stocks = {material: accounting.lock(db, material) for material in sorted({d.ma_nguyen_lieu for d in details})}
        receipt = DeliveryReceipt(ma_phieu_nhan=uuid4().hex, request_id=payload.request_id or uuid4().hex,
            request_payload=payload.model_dump(mode="json"), ma_don_mua=code, ma_ncc=order.ma_ncc,
            nguon="THUC_TE", ngay_dat_hang=order.ngay_dat_hang, ngay_du_kien_giao=order.ngay_du_kien_giao,
            ngay_giao_thuc_te=payload.ngay_giao_thuc_te, hoan_tat=payload.hoan_tat,
            nguoi_xac_nhan=accounting.actor(db), ghi_chu=payload.ghi_chu)
        db.add(receipt); db.flush()
        for detail, item, delivered, reason in validated:
            stock, material = stocks[detail.ma_nguyen_lieu]
            accepted = item.so_luong_thuc_nhan
            before, held = stock.ton_kho_thuc_te, stock.so_luong_book
            owner.repository.update_receipt_detail(db, detail, detail.so_luong_thuc_nhan + accepted, reason or detail.ly_do_khong_nhan)
            scale = Decimal("1000") if material.don_vi_do_luong.strip().lower() == "g" else Decimal("1")
            owner.stock_repository.add_received_quantity(db, stock, accepted * scale)
            movement = accounting.record(db, stock, before, held, "NHAP", code, "Nhận hàng đơn mua",
                f"Phiếu nhận {receipt.ma_phieu_nhap}. {reason} {payload.ghi_chu or ''}".strip()[:2000], recorded=payload.ngay_giao_thuc_te)
            db.add(DeliveryReceiptLine(ma_phieu_nhan=receipt.ma_phieu_nhan, ma_chi_tiet_don_mua=detail.ma_chi_tiet_don_mua,
                ma_nguyen_lieu=detail.ma_nguyen_lieu, don_vi="kg" if material.don_vi_do_luong.strip().lower() == "g" else material.don_vi_do_luong.strip().lower(),
                so_luong_dat=detail.so_luong_mua, so_luong_giao=delivered, so_luong_dat_chat_luong=item.so_luong_dat_chat_luong,
                so_luong_khong_dat=item.so_luong_khong_dat, so_luong_nhap_kho=accepted,
                don_gia_mua=detail.don_gia_vnd_kg,
                don_vi_don_gia="kg" if material.don_vi_do_luong.strip().lower() == "g" else material.don_vi_do_luong.strip().lower(),
                ly_do=reason or None, ma_giao_dich_kho=movement.id))
        complete = payload.hoan_tat or all(row.so_luong_thuc_nhan >= row.so_luong_mua for row in details)
        receipt.hoan_tat = complete
        order.trang_thai = "DA_NHAN_HANG" if complete else "DA_DUYET"
        order.ngay_giao_thuc_te = payload.ngay_giao_thuc_te if complete else None
        db.flush()
        from src.services.nha_cung_cap_service import NhaCungCapService
        NhaCungCapService().calculate_supplier_score_in_transaction(db, order.ma_ncc)
        return owner._detail(db, order)

    @staticmethod
    def history(db, order_code=None, supplier_code=None):
        query = select(DeliveryReceipt, DeliveryReceiptLine, NguyenLieu.ten_nguyen_lieu, User.ho_ten).join(
            DeliveryReceiptLine, DeliveryReceiptLine.ma_phieu_nhan == DeliveryReceipt.ma_phieu_nhan
        ).join(NguyenLieu, DeliveryReceiptLine.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu).join(
            User, DeliveryReceipt.nguoi_xac_nhan == User.ma_nguoi_dung)
        if order_code is not None:
            query = query.where(DeliveryReceipt.ma_don_mua == order_code)
        if supplier_code is not None:
            query = query.where(DeliveryReceipt.ma_ncc == supplier_code)
        return [{**{column.name: getattr(header, column.name) for column in DeliveryReceipt.__table__.columns if column.name != "request_payload"},
                 "chi_tiet_id": line.id, **{column.name: getattr(line, column.name) for column in DeliveryReceiptLine.__table__.columns if column.name not in ("id", "ma_phieu_nhan")},
                 "ten_nguyen_lieu": name, "ten_nguoi_xac_nhan": actor,
                 "dung_han": header.ngay_giao_thuc_te <= header.ngay_du_kien_giao}
                for header, line, name, actor in db.execute(query.order_by(DeliveryReceipt.ngay_giao_thuc_te.desc(), DeliveryReceipt.thoi_gian.desc(), DeliveryReceiptLine.ma_nguyen_lieu))]
