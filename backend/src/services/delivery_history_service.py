"""Read existing receipts and their warehouse movements without creating history."""
from collections import defaultdict
from decimal import Decimal

from fastapi import HTTPException
from openpyxl import Workbook
from openpyxl.styles import Font
from sqlalchemy import or_, select

from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.stock_movement_model import StockMovement
from src.models.user_model import User
from src.services.bom_excel_service import append_text_safe, workbook_bytes
from src.services.delivery_pricing_service import receipt_total


class DeliveryHistoryService:
    @staticmethod
    def read(db, search="", ngay_nhan_tu=None, ngay_nhan_den=None,
             ma_ncc="", ma_nguyen_lieu="", ma_don_mua="", receipt_code=None, ma_phieu_nhap=""):
        if ngay_nhan_tu and ngay_nhan_den and ngay_nhan_tu > ngay_nhan_den:
            raise HTTPException(422, "Ngày nhận từ không được sau ngày nhận đến.")
        query = select(DeliveryReceipt, NhaCungCap.ten_ncc, User.ho_ten).join(
            NhaCungCap, DeliveryReceipt.ma_ncc == NhaCungCap.ma_ncc
        ).join(User, DeliveryReceipt.nguoi_xac_nhan == User.ma_nguoi_dung)
        if receipt_code is not None:
            query = query.where(or_(DeliveryReceipt.ma_phieu_nhan == receipt_code,
                                    DeliveryReceipt.ma_phieu_nhap == receipt_code))
        if ma_phieu_nhap.strip():
            query = query.where(DeliveryReceipt.ma_phieu_nhap == ma_phieu_nhap.strip())
        if ngay_nhan_tu:
            query = query.where(DeliveryReceipt.ngay_giao_thuc_te >= ngay_nhan_tu)
        if ngay_nhan_den:
            query = query.where(DeliveryReceipt.ngay_giao_thuc_te <= ngay_nhan_den)
        if ma_ncc:
            query = query.where(DeliveryReceipt.ma_ncc == ma_ncc)
        if ma_nguyen_lieu:
            query = query.where(select(DeliveryReceiptLine.id).where(
                DeliveryReceiptLine.ma_phieu_nhan == DeliveryReceipt.ma_phieu_nhan,
                DeliveryReceiptLine.ma_nguyen_lieu == ma_nguyen_lieu,
            ).exists())
        if ma_don_mua.strip():
            query = query.where(or_(DeliveryReceipt.ma_don_mua == ma_don_mua.strip(),
                                    DeliveryReceipt.ma_don_cu == ma_don_mua.strip()))
        if search.strip():
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            def matches(column):
                return column.ilike(f"%{term}%", escape="/")
            material_match = select(DeliveryReceiptLine.id).join(
                NguyenLieu, DeliveryReceiptLine.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu
            ).where(DeliveryReceiptLine.ma_phieu_nhan == DeliveryReceipt.ma_phieu_nhan,
                    or_(matches(NguyenLieu.ma_nguyen_lieu), matches(NguyenLieu.ten_nguyen_lieu))).exists()
            query = query.where(or_(matches(DeliveryReceipt.ma_phieu_nhap), matches(DeliveryReceipt.ma_phieu_nhan), matches(DeliveryReceipt.ma_don_mua),
                                    matches(DeliveryReceipt.ma_don_cu), matches(DeliveryReceipt.ma_ncc),
                                    matches(NhaCungCap.ten_ncc), material_match))
        headers = db.execute(query.order_by(DeliveryReceipt.ngay_giao_thuc_te.desc(),
                                            DeliveryReceipt.thoi_gian.desc(), DeliveryReceipt.ma_phieu_nhan)).all()
        if not headers:
            return []
        # Filter receipts, then load ALL their lines: totals never become partial when filtering a material.
        lines = defaultdict(list)
        rows = db.execute(select(DeliveryReceiptLine, NguyenLieu, StockMovement).join(
            NguyenLieu, DeliveryReceiptLine.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu
        ).outerjoin(StockMovement, DeliveryReceiptLine.ma_giao_dich_kho == StockMovement.id).where(
            DeliveryReceiptLine.ma_phieu_nhan.in_([header.ma_phieu_nhan for header, _, _ in headers])
        ).order_by(DeliveryReceiptLine.ma_nguyen_lieu)).all()
        for line, material, movement in rows:
            lines[line.ma_phieu_nhan].append({
                **{column.name: getattr(line, column.name) for column in DeliveryReceiptLine.__table__.columns},
                "ten_nguyen_lieu": material.ten_nguyen_lieu,
                "don_vi_ton_kho": material.don_vi_do_luong,
                "ton_truoc": movement.ton_truoc if movement else None,
                "ton_sau": movement.ton_sau if movement else None,
            })
        results = []
        for header, supplier, actor in headers:
            items = lines[header.ma_phieu_nhan]
            totals = defaultdict(lambda: Decimal("0"))
            for line in items:
                totals[line["don_vi"]] += line["so_luong_nhap_kho"]
            delivered = any(line["so_luong_giao"] > 0 for line in items)
            results.append({
                **{column.name: getattr(header, column.name) for column in DeliveryReceipt.__table__.columns
                   if column.name not in ("request_id", "request_payload")},
                "ten_ncc": supplier, "ten_nguoi_xac_nhan": actor,
                "so_nguyen_lieu": len(items),
                "tong_thuc_nhan": [{"don_vi": unit, "so_luong": total} for unit, total in sorted(totals.items())],
                "tong_gia_tri_nhap": receipt_total(line["thanh_tien"] for line in items),
                "trang_thai_giao_hang": "DA_CHOT" if header.hoan_tat else "CON_GIAO_TIEP",
                "dung_han": header.ngay_giao_thuc_te <= header.ngay_du_kien_giao if delivered else None,
                "chi_tiet": items,
            })
        return results

    @classmethod
    def detail(cls, db, code):
        rows = cls.read(db, receipt_code=code)
        if not rows:
            raise HTTPException(404, "Không tìm thấy phiếu nhận nguyên liệu.")
        return rows[0]

    @classmethod
    def export(cls, db, **filters):
        book = Workbook()
        sheet = book.active
        sheet.title = "LichSuNhapNguyenLieu"
        sheet.append(["Mã phiếu nhận", "Nguồn", "Mã đơn mua / đơn cũ", "Đợt cũ", "Mã NCC", "Nhà cung cấp",
                      "Ngày đặt", "Ngày dự kiến", "Ngày nhận", "Trạng thái", "Kết quả thời hạn",
                      "Mã nguyên liệu", "Nguyên liệu", "Đơn vị nhận", "Số đặt", "Số giao", "Chấp nhận nhập kho",
                      "Đạt chất lượng", "Không đạt", "Đơn vị tồn kho", "Tồn trước", "Tồn sau",
                      "Lý do", "Ghi chú", "Mã người xác nhận", "Người xác nhận", "Giao dịch kho",
                      "Đơn giá mua (VND)", "Đơn vị đơn giá", "Thành tiền (VND)", "Tổng giá trị nhập (VND)", "ID phiếu nhận (UUID)"])
        for receipt in cls.read(db, **filters):
            for line in receipt["chi_tiet"]:
                append_text_safe(sheet, [receipt["ma_phieu_nhap"],
                    "Quá khứ - không cộng kho" if receipt["nguon"] == "LICH_SU" else "Nhận kho thực tế",
                    receipt["ma_don_mua"] or receipt["ma_don_cu"], receipt["lan_giao_cu"], receipt["ma_ncc"], receipt["ten_ncc"],
                    receipt["ngay_dat_hang"].isoformat(), receipt["ngay_du_kien_giao"].isoformat(), receipt["ngay_giao_thuc_te"].isoformat(),
                    "Đã chốt" if receipt["hoan_tat"] else "Còn giao tiếp",
                    "Chưa có hàng giao" if receipt["dung_han"] is None else "Đúng hạn" if receipt["dung_han"] else "Trễ hạn",
                    line["ma_nguyen_lieu"], line["ten_nguyen_lieu"], line["don_vi"], line["so_luong_dat"], line["so_luong_giao"],
                    line["so_luong_nhap_kho"], line["so_luong_dat_chat_luong"], line["so_luong_khong_dat"],
                    line["don_vi_ton_kho"], line["ton_truoc"], line["ton_sau"], line["ly_do"], receipt["ghi_chu"],
                    receipt["nguoi_xac_nhan"], receipt["ten_nguoi_xac_nhan"], line["ma_giao_dich_kho"],
                    str(line["don_gia_mua"]) if line["don_gia_mua"] is not None else "Chưa có giá",
                    f"VND/{line['don_vi_don_gia']}" if line["don_vi_don_gia"] else "Chưa có giá",
                    str(line["thanh_tien"]) if line["thanh_tien"] is not None else "Chưa có giá",
                    str(receipt["tong_gia_tri_nhap"]) if receipt["tong_gia_tri_nhap"] is not None else "Chưa có giá",
                    receipt["ma_phieu_nhan"]])
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = sheet.dimensions
        for cell in sheet[1]:
            cell.font = Font(bold=True)
            sheet.column_dimensions[cell.column_letter].width = 26
        return workbook_bytes(book)
