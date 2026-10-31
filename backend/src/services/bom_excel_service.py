from collections import OrderedDict
from datetime import datetime
from decimal import Decimal, InvalidOperation
from io import BytesIO
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Font
from openpyxl.worksheet.datavalidation import DataValidation
from pydantic import ValidationError

from src.repositories.cong_thuc_repository import CongThucRepository
from src.schemas.cong_thuc_schema import CongThucCreate, ChiTietCongThucInput
from src.services.cong_thuc_service import CongThucService
from src.services.quy_doi_bom_service import QuyDoiBomService


COLUMNS = ["ma_cong_thuc", "ten_cong_thuc", "ma_san_pham", "khoi_luong_thanh_pham_kg",
           "he_so_thu_hoi", "ty_le_hao_hut", "ma_nguyen_lieu", "ty_le_phoi_tron", "trang_thai"]
MAX_ROWS = 10000
MAX_BYTES = 10 * 1024 * 1024


def workbook_bytes(workbook):
    buffer = BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def setup_sheet(workbook, title):
    sheet = workbook.create_sheet(title)
    sheet.append(COLUMNS)
    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = "A1:I1"
    for cell in sheet[1]:
        cell.font = Font(bold=True)
        sheet.column_dimensions[cell.column_letter].width = 29
    return sheet


def append_text_safe(sheet, values):
    sheet.append(values)
    # Codes/names that start with '=' remain literal text when opened in Excel.
    for cell, value in zip(sheet[sheet.max_row], values):
        if isinstance(value, str):
            cell.data_type = "s"


class BomExcelService:
    def __init__(self):
        self.repository = CongThucRepository()
        self.boms = CongThucService()
        self.boms.repository = self.repository

    def template(self):
        workbook = Workbook()
        workbook.remove(workbook.active)
        sheet = setup_sheet(workbook, "BOM")
        choices = DataValidation(type="list", formula1='"DANG_SU_DUNG,NGUNG_SU_DUNG"', allow_blank=False)
        choices.showErrorMessage = True
        sheet.add_data_validation(choices)
        choices.add("I2:I10001")
        guide = workbook.create_sheet("HuongDan")
        instructions = [
            "Nhập dữ liệu tại sheet BOM, giữ nguyên đủ 9 tên cột. Không nhập tại sheet ví dụ.",
            "Mỗi dòng là một nguyên liệu. Lặp lại đầy đủ thông tin công thức trên các dòng chung ma_cong_thuc.",
            "ma_cong_thuc: bắt buộc, tối đa 20 ký tự, là mã mới chưa tồn tại; không ghi đè.",
            "ten_cong_thuc: bắt buộc, tối đa 150 ký tự. Mã sản phẩm/nguyên liệu phải tồn tại và còn hoạt động.",
            "khoi_luong_thanh_pham_kg: có thể để trống; nếu nhập phải đúng khối lượng chuẩn trong danh mục Sản phẩm. Không cập nhật sản phẩm từ file.",
            "Nhập tỷ lệ dạng số 0–1: 85% = 0.85 (hoặc định dạng Excel 85%). Không dùng chuỗi '85%'. Tối đa 4 số lẻ.",
            "0 < he_so_thu_hoi <= 1; 0 <= ty_le_hao_hut < 1; thu hồi + hao hụt = 1.",
            "Mỗi tỷ lệ phối trộn > 0; tổng tỷ lệ theo từng mã công thức bằng 1; không trùng nguyên liệu.",
            "trang_thai: DANG_SU_DUNG hoặc NGUNG_SU_DUNG. Mỗi sản phẩm chỉ có một BOM đang sử dụng.",
            "Ví dụ dùng mã minh họa. Thay bằng mã sản phẩm/nguyên liệu thực tế và mã công thức mới trước khi nhập.",
            "Không dùng công thức Excel hoặc ô gộp trong sheet BOM. Tối đa 10.000 dòng dữ liệu, file 10 MB.",
            "Chọn file để kiểm tra, xem các dòng lỗi và xác nhận Import. Có lỗi thì không lưu bất kỳ công thức nào trong file.",
            "Định lượng: kg đầu vào = kg thành phẩm / thu hồi; kg từng nguyên liệu = đầu vào × phối trộn; không cộng hao hụt lần nữa.",
        ]
        for instruction in instructions:
            guide.append([instruction])
        guide.column_dimensions["A"].width = 150
        example = setup_sheet(workbook, "ViDu")
        for material, ratio in [("NL_ROBUSTA", .85), ("NL_ARABICA", .15)]:
            append_text_safe(example, ["BOM_MAU_001", "Classic 250g", "SP_MAU_001", .25, .85, .15, material, ratio, "DANG_SU_DUNG"])
        return workbook_bytes(workbook)

    def parse(self, content, filename):
        if not filename or not filename.lower().endswith(".xlsx"):
            raise HTTPException(422, "Vui lòng chọn file .xlsx theo template BOM.")
        if len(content) > MAX_BYTES:
            raise HTTPException(422, "File vượt quá 10 MB.")
        try:
            workbook = load_workbook(BytesIO(content), read_only=True, data_only=False)
        except Exception as exc:
            raise HTTPException(422, "Không thể đọc file Excel .xlsx. File có thể bị hỏng hoặc được bảo vệ.") from exc
        try:
            if "BOM" not in workbook.sheetnames:
                raise HTTPException(422, "Thiếu sheet BOM. Vui lòng dùng đúng template.")
            sheet = workbook["BOM"]
            if sheet.max_row > MAX_ROWS + 1 or sheet.max_column != len(COLUMNS):
                raise HTTPException(422, "File không đúng 9 cột template BOM hoặc vượt quá 10.000 dòng.")
            headers = [cell.value for cell in next(sheet.iter_rows(min_row=1, max_row=1))]
            if headers != COLUMNS:
                raise HTTPException(422, "Tên/thứ tự cột không đúng template BOM: " + ", ".join(COLUMNS))
            records, errors = [], []
            for row_number, cells in enumerate(sheet.iter_rows(min_row=2), 2):
                values = [cell.value for cell in cells]
                if all(value is None or (isinstance(value, str) and not value.strip()) for value in values):
                    continue
                if any(cell.data_type == "f" for cell in cells):
                    errors.append({"row": row_number, "code": str(values[0] or ""), "message": "Không dùng công thức Excel; hãy nhập giá trị."})
                    continue
                records.append({"row": row_number, **dict(zip(COLUMNS, values))})
            return records, errors
        finally:
            workbook.close()

    def validate(self, db, records, initial_errors=(), lock=False):
        errors = list(initial_errors)
        grouped = OrderedDict()
        for record in records:
            code = str(record["ma_cong_thuc"] or "").strip()
            if not code or len(code) > 20:
                errors.append({"row": record["row"], "code": code, "message": "Mã công thức bắt buộc và tối đa 20 ký tự."})
            else:
                grouped.setdefault(code, []).append(record)
        # Lock product parents in a fixed order before checking active BOMs or writing.
        products = {}
        for code in sorted({str(row["ma_san_pham"] or "").strip() for row in records}):
            products[code] = self.repository.product(db, code, lock=lock)
        codes = sorted({str(row["ma_nguyen_lieu"] or "").strip() for row in records})
        materials = {row.ma_nguyen_lieu: row for row in self.repository.materials(db, codes, lock=lock)} if codes else {}
        items, prepared, active_products = [], [], set()
        for code, rows in grouped.items():
            def add_error(message, row_numbers=None):
                for number in row_numbers or [row["row"] for row in rows]:
                    errors.append({"row": number, "code": code, "message": message})
            before = len(errors)
            payloads, weights = [], []
            for row in rows:
                try:
                    values = {key: row[key].strip() if isinstance(row[key], str) else row[key]
                              for key in ["ten_cong_thuc", "ma_san_pham", "he_so_thu_hoi", "ty_le_hao_hut", "trang_thai"]}
                    line = ChiTietCongThucInput(ma_nguyen_lieu=str(row["ma_nguyen_lieu"] or "").strip(), ty_le_phoi_tron=row["ty_le_phoi_tron"])
                    payloads.append((values, line))
                    raw = row["khoi_luong_thanh_pham_kg"]
                    weight = None if raw is None or str(raw).strip() == "" else Decimal(str(raw))
                    if weight is not None and (not weight.is_finite() or weight <= 0):
                        raise ValueError("Khối lượng thành phẩm phải là số kg lớn hơn 0.")
                    weights.append(weight)
                except (ValidationError, InvalidOperation, ValueError, TypeError) as exc:
                    message = "; ".join(error["msg"] for error in exc.errors()) if isinstance(exc, ValidationError) else str(exc)
                    add_error(message or "Dữ liệu không hợp lệ.", [row["row"]])
            if len(errors) > before:
                continue
            try:
                payload = CongThucCreate(**payloads[0][0], chi_tiet=[line for _, line in payloads])
            except ValidationError as exc:
                add_error("; ".join(f"{'/'.join(map(str, error['loc']))}: {error['msg']}" for error in exc.errors()))
                continue
            # Compare normalized Decimal/header values, not Excel cell formatting.
            for values, _ in payloads[1:]:
                for key in values:
                    expected = getattr(payload, key)
                    actual = values[key]
                    try:
                        if key in ("he_so_thu_hoi", "ty_le_hao_hut"):
                            actual = Decimal(str(actual))
                        if actual != expected:
                            add_error(f"Thông tin {key} không nhất quán giữa các dòng chung mã công thức.")
                            break
                    except InvalidOperation:
                        add_error(f"Giá trị {key} không hợp lệ.")
            if self.repository.get(db, code) is not None:
                add_error("Mã công thức đã tồn tại. Không ghi đè công thức cũ.")
            product = products.get(payload.ma_san_pham)
            if product is None:
                add_error("Sản phẩm không tồn tại.")
            else:
                try:
                    standard = QuyDoiBomService.product_weight_kg(product)
                    if any(weight is not None and weight != standard for weight in weights):
                        add_error("Khối lượng kg trong file không khớp khối lượng chuẩn của sản phẩm; không cập nhật sản phẩm từ file.")
                except HTTPException as exc:
                    add_error(exc.detail)
                if product.trang_thai != "DANG_KINH_DOANH":
                    add_error("Sản phẩm đã ngừng kinh doanh.")
            for row, (_, line) in zip(rows, payloads):
                material = materials.get(line.ma_nguyen_lieu)
                if material is None or material.trang_thai != "DANG_SU_DUNG":
                    add_error(f"Nguyên liệu {line.ma_nguyen_lieu} không tồn tại hoặc đã ngừng sử dụng.", [row["row"]])
            if payload.trang_thai == "DANG_SU_DUNG":
                if payload.ma_san_pham in active_products or self.repository.active_for_product(db, payload.ma_san_pham):
                    add_error("Sản phẩm đã có BOM đang sử dụng trong hệ thống hoặc trong file.")
                active_products.add(payload.ma_san_pham)
            items.append({"code": code, "name": payload.ten_cong_thuc, "product": payload.ma_san_pham,
                          "lines": len(rows), "rows": [row["row"] for row in rows], "status": payload.trang_thai})
            if len(errors) == before:
                prepared.append((code, payload))
        if not records and not errors:
            errors.append({"row": 2, "code": "", "message": "File chưa có dữ liệu. Điền dữ liệu từ dòng 2 tại sheet BOM."})
        report = {"valid": not errors, "total_rows": len(records) + len(initial_errors), "total_boms": len(grouped),
                  "items": items, "errors": sorted(errors, key=lambda value: value["row"]), "imported": 0}
        return report, prepared

    def preview(self, db, content, filename):
        records, errors = self.parse(content, filename)
        return self.validate(db, records, errors)[0]

    def import_file(self, db, content, filename, confirmed=False):
        if not confirmed:
            raise HTTPException(422, "Vui lòng kiểm tra file và xác nhận Import trước khi lưu.")
        records, errors = self.parse(content, filename)
        report, prepared = self.validate(db, records, errors, lock=True)
        if not report["valid"]:
            db.rollback()
            return report
        with self.boms._write(db):
            for code, payload in prepared:
                # Reuse the same reference/active checks as manual create, under product locks.
                self.boms._validate_references(db, payload.ma_san_pham, payload.chi_tiet, payload.trang_thai)
                self.repository.create(db, {"ma_cong_thuc": code, **payload.model_dump(exclude={"chi_tiet"})})
                self.repository.replace_details(db, code, payload.chi_tiet)
            db.flush()
            report["imported"] = len(prepared)
        return report

    def export(self, db, search=None, ma_san_pham=None, trang_thai=None):
        workbook = Workbook()
        workbook.remove(workbook.active)
        sheet = setup_sheet(workbook, "BOM")
        for bom, _ in self.repository.list(db, search, ma_san_pham, trang_thai):
            product = self.repository.product(db, bom.ma_san_pham)
            try:
                weight = QuyDoiBomService.product_weight_kg(product)
            except HTTPException:
                weight = None
            for line, _ in self.repository.details(db, bom.ma_cong_thuc) or [(None, None)]:
                append_text_safe(sheet, [bom.ma_cong_thuc, bom.ten_cong_thuc, bom.ma_san_pham, weight,
                                        bom.he_so_thu_hoi, bom.ty_le_hao_hut, line.ma_nguyen_lieu if line else "",
                                        line.ty_le_phoi_tron if line else "", bom.trang_thai])
        filename = "Danh_sach_cong_thuc_BOM_" + datetime.now(ZoneInfo("Asia/Ho_Chi_Minh")).strftime("%Y%m%d") + ".xlsx"
        return workbook_bytes(workbook), filename
