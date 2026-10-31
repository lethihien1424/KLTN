"""Excel creates pending direct orders only; never calls approval or inventory services."""
from collections import OrderedDict
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from io import BytesIO
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from sqlalchemy import select, text

from src.models.purchase_excel_import import PurchaseExcelImport
from src.services.bom_excel_service import MAX_BYTES, MAX_ROWS, workbook_bytes, append_text_safe
from src.services.don_mua_service import DonMuaService, line_total

COLUMNS = ["Mã tham chiếu đơn", "Mã nhà cung cấp", "Mã nguyên liệu", "Số lượng mua",
           "Đơn vị tính", "Đơn giá mua", "Ngày dự kiến giao", "Ghi chú"]
EXPORT_COLUMNS = ["Mã đơn mua", "Mã đề xuất liên quan", "Mã nhà cung cấp", "Nhà cung cấp", "Ngày đặt",
                  "Ngày dự kiến giao", "Mã nguyên liệu", "Nguyên liệu", "Đơn vị tính", "Số lượng đặt",
                  "Số lượng đã nhận", "Đơn giá snapshot", "Thành tiền", "Tổng tiền đơn mua", "Trạng thái",
                  "Người tạo", "Nguồn", "Mã tham chiếu đơn", "Ghi chú"]


def today():
    return datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).date()


def normalized(value):
    return str(value).strip() if value is not None else ""


def amount(value, max_value):
    if isinstance(value, bool) or value is None:
        raise ValueError("Phải nhập số lớn hơn 0, tối đa 2 chữ số thập phân.")
    try:
        number = Decimal(str(value).strip())
        if not number.is_finite() or number <= 0 or number > max_value:
            raise ValueError("Giá trị phải lớn hơn 0 và không vượt giới hạn lưu trữ.")
        if number != number.quantize(Decimal("0.01")):
            raise ValueError("Chỉ cho phép tối đa 2 chữ số thập phân.")
        return number
    except InvalidOperation as exc:
        raise ValueError("Giá trị số không hợp lệ.") from exc


def signature(supplier, delivery, lines):
    return (supplier, delivery, tuple(sorted((line["ma_nguyen_lieu"], line["so_luong_mua"], line["don_gia_vnd_kg"]) for line in lines)))


class PurchaseExcelService:
    def __init__(self):
        self.orders = DonMuaService()
        self.repository = self.orders.repository

    @staticmethod
    def sheet(book, title, columns):
        sheet = book.create_sheet(title)
        sheet.append(columns)
        sheet.freeze_panes = "A2"
        sheet.auto_filter.ref = sheet.dimensions
        for cell in sheet[1]:
            sheet.column_dimensions[cell.column_letter].width = 26
        return sheet

    def template(self):
        book = Workbook(); book.remove(book.active)
        self.sheet(book, "DonMua", COLUMNS)
        guide = book.create_sheet("HuongDan")
        for instruction in [
            "Nhập tại sheet DonMua, giữ nguyên 8 cột. Chỉ nhận .xlsx, tối đa 10 MB / 10.000 dòng.",
            "Các dòng chung mã tham chiếu tạo một đơn; mã tham chiếu mới tối đa 80 ký tự, không được dùng lại.",
            "Một đơn chỉ có một NCC, một ngày dự kiến giao và một ghi chú chung (tối đa 2.000 ký tự); lặp lại trên từng dòng.",
            "NCC/nguyên liệu phải tồn tại, còn hoạt động và có quan hệ cung ứng. Không trùng nguyên liệu trong một đơn.",
            "Số lượng và đơn giá > 0, tối đa 2 số lẻ. Đơn vị nhập đúng danh mục nguyên liệu (giá theo đơn vị nhập).",
            "Danh mục g: hệ thống quy đổi số lượng sang kg và giá sang VND/kg. Số lượng phải là bội số 10 g để lưu chính xác 2 số lẻ kg.",
            "Ngày dự kiến giao: ô ngày Excel hoặc YYYY-MM-DD, không trước ngày nhập. Ngày đặt là ngày xác nhận import (giờ Việt Nam).",
            "Đây là đơn mua trực tiếp: CHUA_DUYET, không liên kết đề xuất; cần duyệt như đơn tạo thủ công.",
            "Không tự duyệt/nhận hàng, không cập nhật tồn kho, không tạo phiếu nhận. Người tạo là tài khoản xác nhận.",
            "Chặn mã tham chiếu đã nhập, mã trùng mã đơn hiện tại và đơn cùng NCC/ngày giao/toàn bộ nguyên liệu-số lượng-giá (kể cả đổi mã tham chiếu).",
            "Preview không lưu. Khi xác nhận sẽ kiểm tra lại toàn file; một lỗi thì không lưu bất kỳ đơn nào. Không ghi đè.",
            "Không dùng công thức Excel hoặc ô gộp. Sheet ViDu chỉ minh họa; thay mã NCC/nguyên liệu bằng mã thực tế.",
        ]:
            guide.append([instruction])
        guide.column_dimensions["A"].width = 150
        example = self.sheet(book, "ViDu", COLUMNS)
        for ref, supplier, material in [("EXCEL_001", "NCC_MAU_1", "NL_MAU_1"), ("EXCEL_001", "NCC_MAU_1", "NL_MAU_2"), ("EXCEL_002", "NCC_MAU_2", "NL_MAU_1")]:
            append_text_safe(example, [ref, supplier, material, 10, "kg", 125000, (today() + timedelta(days=7)).isoformat(), "Đơn mua trực tiếp"])
        return workbook_bytes(book)

    def parse(self, content, filename):
        if not filename or not filename.lower().endswith(".xlsx") or len(content) > MAX_BYTES:
            raise HTTPException(422, "Chọn file .xlsx không quá 10 MB theo template Đơn mua.")
        try:
            book = load_workbook(BytesIO(content), read_only=False, data_only=False)
        except Exception as exc:
            raise HTTPException(422, "Không đọc được file Excel .xlsx.") from exc
        try:
            if "DonMua" not in book.sheetnames:
                raise HTTPException(422, "Thiếu sheet DonMua. Vui lòng tải template Đơn mua.")
            sheet = book["DonMua"]
            if sheet.max_row > MAX_ROWS + 1 or sheet.max_column != len(COLUMNS) or [c.value for c in sheet[1]] != COLUMNS:
                raise HTTPException(422, "Sai cấu trúc: cần đúng thứ tự 8 cột: " + ", ".join(COLUMNS) + "; tối đa 10.000 dòng.")
            if sheet.merged_cells.ranges:
                raise HTTPException(422, "Sheet DonMua không được chứa ô gộp.")
            records, errors = [], []
            for row, cells in enumerate(sheet.iter_rows(min_row=2), 2):
                values = [c.value for c in cells]
                if all(not normalized(v) for v in values):
                    continue
                for column, cell in zip(COLUMNS, cells):
                    if cell.data_type in ("f", "e"):
                        errors.append({"row": row, "column": column, "code": normalized(values[0]), "message": "Nhập giá trị; không dùng công thức hoặc ô lỗi Excel."})
                records.append({"row": row, **dict(zip(COLUMNS, values))})
            return records, errors
        finally:
            book.close()

    def validate(self, db, records, initial_errors=(), lock=False):
        errors, items, prepared = list(initial_errors), [], []
        groups = OrderedDict()
        for record in records:
            groups.setdefault(normalized(record[COLUMNS[0]]), []).append(record)
        suppliers = {code: self.repository.supplier(db, code, lock=lock)
                     for code in sorted({normalized(r[COLUMNS[1]]) for r in records})}
        material_codes = sorted({normalized(r[COLUMNS[2]]) for r in records})
        materials = {m.ma_nguyen_lieu: m for m in self.repository.materials(db, material_codes)} if material_codes else {}
        # Read locks keep supplier/material data stable; the import advisory lock
        # serializes duplicate checks across concurrent Excel confirmations.
        existing = set()
        for model, _ in self.repository.list(db):
            if model.ma_ncc in suppliers:
                details = [dict(ma_nguyen_lieu=d.ma_nguyen_lieu, so_luong_mua=d.so_luong_mua, don_gia_vnd_kg=d.don_gia_vnd_kg)
                           for d, _ in self.repository.details(db, model.ma_don_mua)]
                existing.add(signature(model.ma_ncc, model.ngay_du_kien_giao, details))
        references = set(db.scalars(select(PurchaseExcelImport.ma_tham_chieu)))
        seen = set()
        order_date = today()
        for ref, rows in groups.items():
            before = len(errors)

            def error(row, column, message):
                errors.append({"row": row["row"], "column": column, "code": ref, "message": message})

            if not ref or len(ref) > 80:
                error(rows[0], COLUMNS[0], "Mã tham chiếu bắt buộc, tối đa 80 ký tự.")
            if ref in references or self.repository.get(db, ref) is not None:
                error(rows[0], COLUMNS[0], "Mã tham chiếu/đơn mua đã tồn tại; không ghi đè.")
            supplier_code = normalized(rows[0][COLUMNS[1]])
            supplier = suppliers.get(supplier_code)
            if supplier is None or supplier.trang_thai != "DANG_HOAT_DONG":
                for row in rows:
                    error(row, COLUMNS[1], "NCC không tồn tại hoặc đã ngừng hoạt động.")
            mappings = {m.ma_nguyen_lieu for m in self.repository.mappings(db, supplier_code, material_codes)} if supplier else set()
            lines, material_seen, delivery, note = [], set(), None, normalized(rows[0][COLUMNS[7]])
            total = Decimal("0.00")
            if len(note) > 2000:
                error(rows[0], COLUMNS[7], "Ghi chú tối đa 2.000 ký tự.")
            for row in rows:
                if normalized(row[COLUMNS[1]]) != supplier_code:
                    error(row, COLUMNS[1], "Các dòng chung mã tham chiếu phải cùng NCC.")
                if normalized(row[COLUMNS[7]]) != note:
                    error(row, COLUMNS[7], "Ghi chú không nhất quán trong cùng đơn.")
                raw_date = row[COLUMNS[6]]
                try:
                    expected = raw_date.date() if isinstance(raw_date, datetime) else raw_date if isinstance(raw_date, date) else date.fromisoformat(normalized(raw_date))
                    if expected < order_date:
                        raise ValueError("Ngày dự kiến giao không được trước ngày đặt hàng.")
                    if delivery is not None and delivery != expected:
                        raise ValueError("Ngày dự kiến giao không nhất quán trong cùng đơn.")
                    delivery = expected
                except (ValueError, TypeError) as exc:
                    error(row, COLUMNS[6], str(exc) if "Ngày" in str(exc) else "Nhập ngày Excel hoặc YYYY-MM-DD hợp lệ.")
                material_code = normalized(row[COLUMNS[2]])
                material = materials.get(material_code)
                if material_code in material_seen:
                    error(row, COLUMNS[2], "Trùng nguyên liệu trong cùng đơn.")
                material_seen.add(material_code)
                if material is None or material.trang_thai != "DANG_SU_DUNG":
                    error(row, COLUMNS[2], "Nguyên liệu không tồn tại hoặc đã ngừng sử dụng.")
                elif material_code not in mappings:
                    error(row, COLUMNS[2], "NCC không có quan hệ cung ứng nguyên liệu này.")
                unit = normalized(row[COLUMNS[4]]).lower()
                if material and unit != material.don_vi_do_luong.strip().lower():
                    error(row, COLUMNS[4], "Đơn vị phải khớp danh mục: " + material.don_vi_do_luong)
                values = {}
                for column, limit in [(COLUMNS[3], Decimal("999999999999.99")), (COLUMNS[5], Decimal("9999999999999.99"))]:
                    try:
                        values[column] = amount(row[column], limit)
                    except (ValueError, TypeError) as exc:
                        error(row, column, str(exc))
                if len(values) == 2:
                    quantity, price = values[COLUMNS[3]], values[COLUMNS[5]]
                    if material and material.don_vi_do_luong.strip().lower() == "g":
                        quantity /= Decimal(1000); price *= Decimal(1000)
                        if quantity != quantity.quantize(Decimal("0.01")) or quantity <= 0:
                            error(row, COLUMNS[3], "Số lượng g phải là bội số 10 để lưu chính xác theo kg.")
                        if price > Decimal("9999999999999.99"):
                            error(row, COLUMNS[5], "Đơn giá quy đổi VND/kg vượt giới hạn lưu trữ.")
                    total += line_total(quantity, price)
                    lines.append(dict(ma_nguyen_lieu=material_code, so_luong_mua=quantity, don_gia_vnd_kg=price))
                    items.append(dict(row=row["row"], code=ref, supplier=supplier_code, material=material_code,
                                      unit=unit, quantity=str(values[COLUMNS[3]]), price=str(values[COLUMNS[5]]),
                                      total=str(line_total(quantity, price)), delivery=delivery.isoformat() if delivery else "", note=note))
            if total > Decimal("9999999999999999.99"):
                error(rows[0], COLUMNS[5], "Tổng tiền đơn vượt giới hạn numeric(18,2).")
            key = signature(supplier_code, delivery, lines)
            if key in existing or key in seen:
                error(rows[0], COLUMNS[0], "Đơn cùng NCC/ngày giao/nguyên liệu/số lượng/giá đã tồn tại hoặc trùng trong file.")
            seen.add(key)
            if len(errors) == before:
                prepared.append(dict(ref=ref, ma_ncc=supplier_code, ngay_dat_hang=order_date,
                                     ngay_du_kien_giao=delivery, ghi_chu=note, lines=lines, tong_tien=total))
        if not records:
            errors.append({"row": 1, "column": COLUMNS[0], "code": "", "message": "File không có dữ liệu đơn mua."})
        return dict(valid=not errors, total_rows=len(records), total_orders=len(groups), imported=0, items=items, errors=errors), prepared

    def preview(self, db, content, filename):
        return self.validate(db, *self.parse(content, filename))[0]

    def import_file(self, db, content, filename, confirmed, actor):
        if not confirmed:
            raise HTTPException(422, "Cần xem preview và xác nhận import đơn mua.")
        records, errors = self.parse(content, filename)
        with self.orders._write(db):
            if db.bind.dialect.name == "postgresql":
                db.execute(text("SELECT pg_advisory_xact_lock(20261030, 2)"))
            report, prepared = self.validate(db, records, errors, lock=True)
            if not report["valid"]:
                return report
            for order in prepared:
                model = self.repository.create(db, dict(ma_ncc=order["ma_ncc"], ma_de_xuat=None,
                    ngay_dat_hang=order["ngay_dat_hang"], ngay_du_kien_giao=order["ngay_du_kien_giao"],
                    nguoi_tao=actor.ma_nguoi_dung, tong_tien=order["tong_tien"], trang_thai="CHUA_DUYET"))
                self.repository.replace_details(db, model.ma_don_mua, order["lines"])
                db.add(PurchaseExcelImport(ma_tham_chieu=order["ref"], ma_don_mua=model.ma_don_mua, ghi_chu=order["ghi_chu"]))
                db.flush()
            report["imported"] = len(prepared)
        return report

    def export(self, db, **filters):
        # Match the UI's combined search over order code, supplier name and proposal code.
        search = (filters.pop("search", None) or "").lower()
        orders = self.orders.list(db, **{k: v for k, v in filters.items() if v not in (None, "")})
        book = Workbook(); book.remove(book.active)
        sheet = self.sheet(book, "DonMua", EXPORT_COLUMNS)
        for order in orders:
            if search not in f'{order["ma_don_mua"]} {order["ten_ncc"]} {order["ma_de_xuat"] or ""}'.lower():
                continue
            metadata = db.scalar(select(PurchaseExcelImport).where(PurchaseExcelImport.ma_don_mua == order["ma_don_mua"]))
            for detail, material in self.repository.details(db, order["ma_don_mua"]):
                append_text_safe(sheet, [order["ma_don_mua"], order["ma_de_xuat"], order["ma_ncc"], order["ten_ncc"],
                    order["ngay_dat_hang"].isoformat(), order["ngay_du_kien_giao"].isoformat(), detail.ma_nguyen_lieu,
                    material.ten_nguyen_lieu, "kg" if material.don_vi_do_luong.strip().lower() == "g" else material.don_vi_do_luong,
                    detail.so_luong_mua, detail.so_luong_thuc_nhan, detail.don_gia_vnd_kg,
                    line_total(detail.so_luong_mua, detail.don_gia_vnd_kg), order["tong_tien"], order["trang_thai"],
                    order["nguoi_tao"], "EXCEL_TRUC_TIEP" if metadata else "DE_XUAT" if order["ma_de_xuat"] else "TRUC_TIEP",
                    metadata.ma_tham_chieu if metadata else "", metadata.ghi_chu if metadata else ""])
        sheet.auto_filter.ref = sheet.dimensions
        return workbook_bytes(book), f"Danh_sach_don_mua_nguyen_lieu_{today():%Y%m%d}.xlsx"
