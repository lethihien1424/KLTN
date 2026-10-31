"""Excel adapter around the existing supply schema/importer; no Milano inventory writes."""
from io import BytesIO
from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from pydantic import ValidationError
import pandas as pd
from src.schemas.nguyen_lieu_nha_cung_cap_schema import NguyenLieuNhaCungCapCreate
from src.services.nguyen_lieu_nha_cung_cap_service import NguyenLieuNhaCungCapService
from src.services.data_processing.import_service import ImportService
from src.services.bom_excel_service import workbook_bytes, append_text_safe, MAX_BYTES, MAX_ROWS

COLUMNS = ["ma_ncc", "ma_nguyen_lieu", "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat",
           "lead_time_ngay", "ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du"]
EXPORT_COLUMNS = ["ma_nguyen_lieu_ncc", "ma_ncc", "ten_ncc", "ma_nguyen_lieu", "ten_nguyen_lieu", "don_vi_do_luong",
                  "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat", "kha_dung_ncc",
                  "lead_time_ngay", "ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du"]


class SupplyExcelService:
    def __init__(self):
        self.supplies = NguyenLieuNhaCungCapService()

    @staticmethod
    def style(sheet):
        sheet.freeze_panes = "A2"; sheet.auto_filter.ref = sheet.dimensions
        for cell in sheet[1]: sheet.column_dimensions[cell.column_letter].width = 27

    def template(self):
        book = Workbook(); sheet = book.active; sheet.title = "CungUng"; sheet.append(COLUMNS); self.style(sheet)
        guide = book.create_sheet("HuongDan")
        for line in ["Nhập tại sheet CungUng, giữ đủ 10 tên cột. Chỉ dùng .xlsx, tối đa 10 MB/10.000 dòng.",
                     "Mã NCC và nguyên liệu phải tồn tại. Mỗi cặp NCC/nguyên liệu một dòng, chỉ thêm cặp mới; không ghi đè mapping đã có.",
                     "Giá > 0, tối đa 2 chữ số lẻ. Tồn/book/xuất đều là số của NHÀ CUNG CẤP; không phải tồn kho Milano.",
                     "Số lượng >= 0, tối đa 2 chữ số lẻ; book và xuất không vượt tồn NCC. Book/xuất có thể để trống để dùng 0.",
                     "Lead time là số ngày nguyên > 0. Ba tỷ lệ từ 0 đến 1, tối đa 4 số lẻ (ví dụ 95% = 0.95 hoặc ô Excel định dạng 95%).",
                     "Số lượng theo đơn vị nguyên liệu trong danh mục. Preview hiển thị đơn vị; không tự quy đổi hoặc sửa đơn vị từ Excel.",
                     "Không dùng công thức Excel. Xem trước toàn file rồi xác nhận; có lỗi thì không nhập bất kỳ dòng nào.",
                     "Import chỉ tạo dữ liệu cung ứng và tính lại điểm NCC theo cơ chế hiện tại. Không cộng/trừ/book/xuất tồn Milano, không tạo giao dịch kho.",
                     "File xuất dùng báo cáo theo bộ lọc, không phải template import. Cập nhật cặp đã có bằng chức năng Chỉnh sửa hiện tại."]:
            guide.append([line])
        guide.column_dimensions["A"].width = 150
        return workbook_bytes(book)

    def parse(self, content, filename):
        if not filename or not filename.lower().endswith(".xlsx") or len(content) > MAX_BYTES:
            raise HTTPException(422, "Chọn file cung ứng .xlsx không quá 10 MB.")
        try: book = load_workbook(BytesIO(content), read_only=True, data_only=False)
        except Exception as exc: raise HTTPException(422, "Không đọc được file Excel cung ứng.") from exc
        try:
            if "CungUng" not in book.sheetnames: raise HTTPException(422, "Thiếu sheet CungUng. Vui lòng dùng template cung ứng.")
            sheet = book["CungUng"]
            if sheet.max_column != len(COLUMNS) or sheet.max_row > MAX_ROWS + 1 or [c.value for c in next(sheet.iter_rows(max_row=1))] != COLUMNS:
                raise HTTPException(422, "Tên/thứ tự 10 cột không đúng template hoặc vượt 10.000 dòng.")
            records, errors = [], []
            for number, cells in enumerate(sheet.iter_rows(min_row=2), 2):
                values = [c.value for c in cells]
                if all(v is None for v in values): continue
                if any(c.data_type == "f" for c in cells): errors.append({"row": number, "message": "Không dùng công thức Excel."})
                records.append({"row": number, **dict(zip(COLUMNS, values))})
            return records, errors
        finally: book.close()

    def validate(self, db, records, errors=(), supplier_scope=None):
        errors, items, prepared, seen = list(errors), [], [], set()
        for record in records:
            try:
                values = {key: value.strip() if isinstance(value, str) else value for key, value in record.items() if key != "row"}
                for optional in ("so_luong_book", "so_luong_xuat"):
                    if values[optional] in (None, ""): values.pop(optional)
                payload = NguyenLieuNhaCungCapCreate.model_validate(values)
                if payload.lead_time_ngay > 2147483647: raise ValueError("Lead time vượt giới hạn số nguyên của cơ sở dữ liệu.")
                pair = (payload.ma_ncc, payload.ma_nguyen_lieu)
                if pair in seen: raise ValueError("Trùng cặp nhà cung cấp/nguyên liệu trong file.")
                seen.add(pair)
                if supplier_scope and payload.ma_ncc != supplier_scope: raise ValueError("Mã NCC khác bộ lọc nhà cung cấp đang mở.")
                supplier = self.supplies.repository.supplier(db, payload.ma_ncc)
                material = self.supplies.repository.material(db, payload.ma_nguyen_lieu)
                if supplier is None: raise ValueError("Nhà cung cấp không tồn tại.")
                if material is None: raise ValueError("Nguyên liệu không tồn tại.")
                if self.supplies.repository.find_pair(db, *pair) is not None: raise ValueError("Cặp cung ứng đã tồn tại; không ghi đè. Hãy dùng Chỉnh sửa.")
                items.append({"row": record["row"], "ma_ncc": payload.ma_ncc, "ten_ncc": supplier.ten_ncc,
                    "ma_nguyen_lieu": payload.ma_nguyen_lieu, "ten_nguyen_lieu": material.ten_nguyen_lieu,
                    "don_vi": material.don_vi_do_luong, "gia": str(payload.don_gia_nguyen_lieu), "ton_ncc": str(payload.so_luong_ton_kho)})
                prepared.append({**payload.model_dump(), "_row_number": record["row"]})
            except (ValueError, TypeError, ValidationError) as exc:
                message = "; ".join(f"{'/'.join(map(str, e['loc']))}: {e['msg']}" for e in exc.errors()) if isinstance(exc, ValidationError) else str(exc)
                errors.append({"row": record["row"], "message": message})
        if not records: errors.append({"row": 1, "message": "File không có dữ liệu cung ứng."})
        return {"valid": not errors, "total_rows": len(records), "items": items, "errors": errors, "imported": 0}, prepared

    def preview(self, db, content, filename, supplier_scope=None):
        records, errors = self.parse(content, filename)
        return self.validate(db, records, errors, supplier_scope)[0]

    def import_file(self, db, content, filename, confirmed, supplier_scope=None):
        if not confirmed: raise HTTPException(422, "Cần xem trước và xác nhận nhập nguyên liệu cung ứng.")
        records, errors = self.parse(content, filename)
        with self.supplies._write(db):
            self.supplies.supplier_service.lock_for_recalculation(db)
            report, prepared = self.validate(db, records, errors, supplier_scope)
            if not report["valid"]: raise HTTPException(422, report)
            # Reuse the existing import handler, including score recalculation. No stock service is called.
            report["imported"] = ImportService()._import_nguyen_lieu_ncc(pd.DataFrame(prepared), db)
        return report

    def export(self, db, **filters):
        book = Workbook(); sheet = book.active; sheet.title = "CungUng"; sheet.append(EXPORT_COLUMNS)
        for row in self.supplies.list(db, **filters):
            values = {**row, "kha_dung_ncc": row["so_luong_ton_kho"] - row["so_luong_book"]}
            append_text_safe(sheet, [values[key] for key in EXPORT_COLUMNS])
            for index in (13, 14, 15): sheet.cell(sheet.max_row, index).number_format = "0.00%"
        self.style(sheet)
        return workbook_bytes(book)
