from datetime import date, datetime
from io import BytesIO
from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from pydantic import ValidationError
from sqlalchemy import select, or_, func
from src.models.stock_movement_model import StockMovement
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.schemas.ton_kho_schema import TonKhoCreate
from src.services.stock_accounting_service import StockAccountingService, local_today
from src.services.stock_detail_service import filtered_stocks, stock_status
from src.services.ton_kho_service import TonKhoService
from src.services.bom_excel_service import workbook_bytes, append_text_safe, MAX_BYTES, MAX_ROWS

COLUMNS = ["Mã nguyên liệu", "Tồn thực tế", "Mức tồn an toàn", "Mức tồn tối đa", "Ngày kiểm kê", "Lý do", "Ghi chú"]


class StockExcelService:
    accounting = StockAccountingService()

    def template(self, db):
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "TonKho"
        append_text_safe(sheet, COLUMNS)
        guide = workbook.create_sheet("HuongDan")
        for text in ["Giữ nguyên sheet TonKho và 7 cột. Chỉ dùng .xlsx, tối đa 10 MB/10.000 dòng.",
                     "Mỗi nguyên liệu một dòng; số lượng theo đơn vị trong danh mục nguyên liệu; không quy đổi ngầm.",
                     "Tồn thực tế bắt buộc >= 0, tối đa 2 chữ số lẻ. Không nhập đã giữ hoặc tồn khả dụng.",
                     "Mức an toàn/tối đa có thể để trống để giữ cấu hình hiện tại; nguyên liệu chưa có tồn phải nhập cả hai. Tối đa >= an toàn.",
                     "Ngày kiểm kê yyyy-mm-dd, không ở tương lai hoặc trước snapshot mới nhất.",
                     "Lý do dùng mã hoặc tên lý do đang sử dụng, áp dụng Điều chỉnh tồn kho. Khác bắt buộc ghi chú.",
                     "Chỉ ghi nhận tồn đầu kỳ/kiểm kê; không thay thế quy trình nhận hàng đơn mua. Không xóa lịch sử."]:
            guide.append([text])
        reasons = workbook.create_sheet("LyDo")
        reasons.append(["Mã lý do", "Tên lý do"])
        for reason in db.scalars(select(LyDo).join(LyDoChucNang).where(
            LyDo.trang_thai == "DANG_SU_DUNG", LyDoChucNang.chuc_nang == "DIEU_CHINH_TON_KHO")):
            append_text_safe(reasons, [reason.ma_ly_do, reason.ten_ly_do])
        self.style(sheet)
        guide.column_dimensions["A"].width = 130
        return workbook_bytes(workbook)

    @staticmethod
    def style(sheet):
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = sheet.dimensions
        for cell in sheet[1]:
            sheet.column_dimensions[cell.column_letter].width = 28

    def parse(self, content, filename):
        if not filename or not filename.lower().endswith(".xlsx") or len(content) > MAX_BYTES:
            raise HTTPException(422, "Chọn file .xlsx không quá 10 MB.")
        try:
            workbook = load_workbook(BytesIO(content), read_only=True, data_only=False)
        except Exception as exc:
            raise HTTPException(422, "File Excel không hợp lệ.") from exc
        try:
            if "TonKho" not in workbook.sheetnames:
                raise HTTPException(422, "Thiếu sheet TonKho trong template.")
            sheet = workbook["TonKho"]
            if sheet.max_column != len(COLUMNS) or sheet.max_row > MAX_ROWS + 1:
                raise HTTPException(422, "File cần đúng 7 cột và tối đa 10.000 dòng.")
            if [c.value for c in next(sheet.iter_rows(max_row=1))] != COLUMNS:
                raise HTTPException(422, "Tên hoặc thứ tự cột không đúng template.")
            records, errors = [], []
            for number, cells in enumerate(sheet.iter_rows(min_row=2), 2):
                values = [c.value for c in cells]
                if all(v is None for v in values):
                    continue
                code = str(values[0] or "").strip()
                if any(c.data_type == "f" for c in cells):
                    errors.append({"row": number, "code": code, "message": "Không nhập công thức Excel."})
                records.append({"row": number, "code": code, "values": values})
            return records, errors
        finally:
            workbook.close()

    def validate(self, db, records, errors, lock=False):
        errors, items, prepared, seen = list(errors), [], [], set()
        for record in sorted(records, key=lambda r: r["code"]):
            code, values = record["code"], record["values"]
            try:
                if code in seen:
                    raise HTTPException(422, "Trùng mã nguyên liệu trong file; không tự động gộp.")
                seen.add(code)
                if lock:
                    stock, material = self.accounting.lock(db, code, required=False)
                else:
                    material = self.accounting.repository.material(db, code)
                    history = self.accounting.repository.history(db, code)
                    stock = history[0][0] if history else None
                if material is None or material.trang_thai != "DANG_SU_DUNG":
                    raise HTTPException(422, "Nguyên liệu không tồn tại hoặc đã ngừng sử dụng.")
                raw_reason = str(values[5] or "").strip()
                reasons = list(db.scalars(select(LyDo).join(LyDoChucNang).where(
                    LyDo.trang_thai == "DANG_SU_DUNG", LyDoChucNang.chuc_nang == "DIEU_CHINH_TON_KHO",
                    or_(LyDo.ma_ly_do == raw_reason, LyDo.ten_ly_do == raw_reason))))
                if len(reasons) != 1:
                    raise HTTPException(422, "Lý do thiếu, không hợp lệ hoặc trùng tên; hãy dùng mã lý do.")
                recorded = values[4].date() if isinstance(values[4], datetime) else values[4]
                payload = TonKhoCreate(ma_nguyen_lieu=code, ton_kho_thuc_te=values[1],
                    ton_kho_an_toan=values[2] if values[2] is not None else (stock.ton_kho_an_toan if stock else None),
                    ton_kho_toi_da=values[3] if values[3] is not None else (stock.ton_kho_toi_da if stock else None),
                    ngay_ghi_nhan=recorded, trang_thai=stock.trang_thai if stock else "DANG_SU_DUNG",
                    ly_do_id=reasons[0].id, ghi_chu=str(values[6]) if values[6] is not None else None)
                self.accounting.reason(db, payload.ly_do_id, payload.ghi_chu)
                if payload.ngay_ghi_nhan > local_today() or (stock and payload.ngay_ghi_nhan < stock.ngay_ghi_nhan):
                    raise HTTPException(422, "Ngày kiểm kê tương lai hoặc trước bản ghi tồn kho mới nhất.")
                if stock and payload.ton_kho_thuc_te < stock.ton_kho_thuc_te and payload.ton_kho_thuc_te < stock.so_luong_book:
                    raise HTTPException(409, "Giảm tồn sẽ thiếu nguyên liệu đang giữ.")
                items.append({"row": record["row"], "code": code, "name": material.ten_nguyen_lieu,
                              "unit": material.don_vi_do_luong, "before": str(stock.ton_kho_thuc_te if stock else 0),
                              "after": str(payload.ton_kho_thuc_te), "date": str(payload.ngay_ghi_nhan)})
                prepared.append(payload)
            except (HTTPException, ValidationError, ValueError, TypeError) as exc:
                message = str(exc.detail) if isinstance(exc, HTTPException) else str(exc)
                errors.append({"row": record["row"], "code": code, "message": message})
        if not records:
            errors.append({"row": 1, "code": "", "message": "File không có dữ liệu."})
        return {"valid": not errors, "total_rows": len(records), "items": sorted(items, key=lambda r: r["row"]),
                "errors": sorted(errors, key=lambda r: r["row"]), "imported": 0}, prepared

    def preview(self, db, content, filename):
        records, errors = self.parse(content, filename)
        return self.validate(db, records, errors)[0]

    def import_file(self, db, content, filename, confirmed):
        if not confirmed:
            raise HTTPException(422, "Cần xem trước và xác nhận nhập tồn kho.")
        records, errors = self.parse(content, filename)
        with TonKhoService._write(db):
            report, prepared = self.validate(db, records, errors, lock=True)
            if not report["valid"]:
                raise HTTPException(422, report)
            for payload in prepared:
                self.accounting.count(db, payload, payload.ma_nguyen_lieu, payload.ngay_ghi_nhan)
            report["imported"] = len(prepared)
        return report

    def export(self, db, **filters):
        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "TonKho"
        sheet.append(["Mã nguyên liệu", "Tên nguyên liệu", "Đơn vị", "Tồn thực tế", "Đã giữ", "Tồn khả dụng",
                      "Tồn an toàn", "Tồn tối đa", "Tình trạng", "Ngày cập nhật gần nhất"])
        labels = {"TON_AM": "Tồn khả dụng âm", "CAN_NHAP": "Cần bổ sung", "BINH_THUONG": "Bình thường"}
        updated = dict(db.execute(select(StockMovement.ma_nguyen_lieu, func.max(StockMovement.thoi_gian))
                                  .group_by(StockMovement.ma_nguyen_lieu)).all())
        for row in filtered_stocks(db, **filters):
            append_text_safe(sheet, [row[k] for k in ("ma_nguyen_lieu", "ten_nguyen_lieu", "don_vi_do_luong",
                             "ton_kho_thuc_te", "so_luong_book", "ton_kho_kha_dung", "ton_kho_an_toan", "ton_kho_toi_da")]
                             + [labels[stock_status(row)], updated.get(row["ma_nguyen_lieu"], row["ngay_ghi_nhan"]).isoformat()])
        self.style(sheet)
        return workbook_bytes(workbook)
