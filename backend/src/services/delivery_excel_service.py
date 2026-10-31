"""Historical deliveries are evaluation evidence only; never touch warehouse balances."""
from collections import defaultdict
from datetime import datetime
from io import BytesIO
from uuid import uuid4
from decimal import Decimal
from typing import Annotated
from zipfile import BadZipFile
from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter
from pydantic import BaseModel, Field, ValidationError, model_validator
from sqlalchemy import select
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.repositories.nha_cung_cap_repository import NhaCungCapRepository
from src.models.nguyen_lieu_model import NguyenLieu
from src.services.stock_accounting_service import StockAccountingService, local_today
from src.services.bom_excel_service import workbook_bytes, append_text_safe, MAX_BYTES, MAX_ROWS
from src.services.don_mua_service import DonMuaService
from src.services.delivery_pricing_service import receipt_line_amount, receipt_total

COLUMNS = ["ma_don_cu", "ma_ncc", "lan_giao", "ngay_dat", "ngay_du_kien", "ngay_nhan", "ma_nguyen_lieu",
           "so_luong_dat", "so_luong_giao", "so_luong_dat_chat_luong", "so_luong_khong_dat", "so_luong_chap_nhan",
           "hoan_tat", "ly_do", "ghi_chu"]
PRICED_COLUMNS = [*COLUMNS, "don_gia_mua"]

HistoricalQuantity = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)]
HistoricalPrice = Annotated[Decimal, Field(ge=0, max_digits=15, decimal_places=2, allow_inf_nan=False)]


class HistoricalDeliveryLine(BaseModel):
    """Import-only validation: old records may have no quality inspection evidence."""
    so_luong_thuc_nhan: HistoricalQuantity
    so_luong_giao: HistoricalQuantity
    so_luong_dat_chat_luong: HistoricalQuantity | None = None
    so_luong_khong_dat: HistoricalQuantity | None = None
    ly_do_khong_nhan: str | None = Field(default=None, max_length=2000)
    don_gia_mua: HistoricalPrice | None = None

    @model_validator(mode="after")
    def validate_evidence(self):
        if self.so_luong_thuc_nhan > self.so_luong_giao:
            raise ValueError("Số chấp nhận nhập kho không được vượt số giao.")
        good, bad = self.so_luong_dat_chat_luong, self.so_luong_khong_dat
        if (good is None) != (bad is None):
            raise ValueError("Nhập cả số đạt và không đạt, hoặc để trống cả hai nếu chưa có kiểm định.")
        if good is not None:
            if good + bad != self.so_luong_giao:
                raise ValueError("Số đạt + không đạt phải bằng số giao.")
            if self.so_luong_thuc_nhan > good:
                raise ValueError("Số chấp nhận nhập kho không được vượt số đạt chất lượng.")
        return self


class DeliveryExcelService:
    @staticmethod
    def template():
        book = Workbook(); sheet = book.active; sheet.title = "LichSuGiaoHang"; sheet.append(PRICED_COLUMNS)
        sheet.freeze_panes = "A2"
        for cell in sheet[1]: sheet.column_dimensions[cell.column_letter].width = 28
        guide = book.create_sheet("HuongDan")
        for line in ["CHỈ ĐÁNH GIÁ NCC: nhập lịch sử không cộng kho, không tạo đơn mua đang vận hành, không tạo lịch sử kho.",
                     "Template v2: giữ nguyên 16 cột A:P và sheet LichSuGiaoHang. Vẫn hỗ trợ template v1 gồm 15 cột A:O (chưa có giá). File .xlsx tối đa 10 MB/10.000 dòng; không dùng công thức Excel.",
                     "don_gia_mua (P): giá mua quá khứ bằng VND/đơn vị mua hàng, tối đa 15 chữ số và 2 số lẻ, không âm. Đơn vị mua là kg cho nguyên liệu g/kg; các nguyên liệu khác dùng đơn vị danh mục. Để trống nếu chưa có bằng chứng giá; không coi là 0.",
                     "Giá phải thống nhất cho cùng nguyên liệu trong cùng đơn cũ qua các đợt. Thành tiền = số chấp nhận × giá snapshot. Không lấy giá tham khảo hiện tại để điền lịch sử.",
                     "Mỗi dòng một nguyên liệu trong một đợt. Mã đơn cũ không được trùng mã đơn mua thật. Mã đơn/NCC/đợt tối đa 80/20/80 ký tự.",
                     "Nhập đầy đủ cùng danh sách nguyên liệu của đơn ở mọi đợt; nhập 0 nếu nguyên liệu chưa giao trong đợt đó.",
                     "Số lượng theo đơn vị mua hàng: kg cho nguyên liệu kg/g; đơn vị khác theo danh mục. Chấp nhận không vượt số giao.",
                     "Chất lượng: nhập cả số đạt và không đạt từ kiểm định (đạt + không đạt = giao, chấp nhận <= đạt). Nếu chưa có kiểm định, để trống CẢ HAI cột; không suy ra từ số chấp nhận, không tính KPI chất lượng cho dòng đó.",
                     "Tổng chấp nhận theo nguyên liệu không vượt số đặt. Số đặt và ngày đặt/dự kiến phải thống nhất theo đơn.",
                     "Ngày yyyy-mm-dd. hoan_tat chỉ TRUE/FALSE hoặc 1/0; chỉ đợt cuối được TRUE. Đơn chưa chốt vẫn có thể ghi lịch sử một phần.",
                     "Hàng lỗi/không chấp nhận hoặc chốt đơn còn thiếu bắt buộc lý do. Ghi chú tối đa 2000 ký tự.",
                     "Không ghi đè đợt cũ, không thêm đợt sau khi đã chốt. Người xác nhận là tài khoản import hiện tại."]:
            guide.append([line])
        guide.column_dimensions["A"].width = 150
        return workbook_bytes(book)

    @staticmethod
    def parse(content, filename):
        if not filename or not filename.lower().endswith(".xlsx"):
            raise HTTPException(422, "Sai định dạng tệp: cần file .xlsx theo template lịch sử giao hàng.")
        if len(content) > MAX_BYTES:
            raise HTTPException(422, f"File có {len(content):,} byte, vượt giới hạn {MAX_BYTES:,} byte (10 MB).")
        try: book = load_workbook(BytesIO(content), read_only=True, data_only=False)
        except BadZipFile as exc:
            raise HTTPException(422, "Không đọc được file .xlsx: cấu trúc ZIP không hợp lệ hoặc file bị hỏng. Đổi đuôi tệp sang .xlsx không chuyển đổi định dạng.") from exc
        except Exception as exc:
            raise HTTPException(422, f"Không mở được cấu trúc workbook .xlsx ({type(exc).__name__}). Hãy lưu lại bằng Excel dưới định dạng .xlsx.") from exc
        try:
            if "LichSuGiaoHang" not in book.sheetnames:
                raise HTTPException(422, f"Thiếu sheet 'LichSuGiaoHang' (phải đúng tên). Các sheet hiện có: {', '.join(repr(name) for name in book.sheetnames)}.")
            sheet = book["LichSuGiaoHang"]
            # Excel dimensions include styled empty cells and may be stale in third-party files.
            # Stream actual worksheet XML; validate real cells, not the declared used range.
            sheet.reset_dimensions()
            iterator = sheet.iter_rows()
            header = next(iterator, ())
            # A:O stays unchanged. Only an explicit P1 opts into the v2 format.
            columns = PRICED_COLUMNS if len(header) > len(COLUMNS) and header[len(COLUMNS)].value == "don_gia_mua" else COLUMNS
            mismatches = []
            for index, expected in enumerate(COLUMNS):
                cell = header[index] if index < len(header) else None
                actual = cell.value if cell is not None else None
                if actual != expected or cell.data_type in ("f", "e"):
                    mismatches.append(f"{get_column_letter(index + 1)}1: cần '{expected}', nhận {actual!r}")
            if mismatches:
                raise HTTPException(422, "Sai tiêu đề sheet 'LichSuGiaoHang': " + "; ".join(mismatches) + ". Giữ nguyên tên và thứ tự 15 cột A:O.")
            records, errors = [], []
            def check_extra(cells, row):
                extras = [get_column_letter(i + 1) + str(row) for i, cell in enumerate(cells)
                          if i >= len(columns) and cell.value is not None]
                if extras:
                    raise HTTPException(422, f"Sheet 'LichSuGiaoHang' có dữ liệu ngoài {len(columns)} cột A:{get_column_letter(len(columns))} tại {', '.join(extras[:10])}. Xóa dữ liệu cột thừa; ô trống chỉ có định dạng không bị tính là cột thừa.")
            check_extra(header, 1)
            for index, cells in enumerate(iterator, 2):
                check_extra(cells, index)
                values = [cell.value for cell in cells[:len(columns)]]
                values += [None] * (len(columns) - len(values))
                if all(value is None for value in values):
                    continue
                if len(records) >= MAX_ROWS:
                    raise HTTPException(422, f"Sheet 'LichSuGiaoHang' vượt giới hạn {MAX_ROWS:,} dòng dữ liệu: gặp dòng dữ liệu thứ {MAX_ROWS + 1:,} tại dòng Excel {index}. Không tính hàng tiêu đề và các dòng trống.")
                for column, cell in enumerate(cells[:len(columns)]):
                    if cell.data_type in ("f", "e"):
                        message = "Không dùng công thức Excel" if cell.data_type == "f" else f"Ô chứa lỗi Excel {cell.value}"
                        errors.append({"row": index, "message": f"{columns[column]} ({get_column_letter(column + 1)}{index}): {message}."})
                records.append({"row": index, "don_gia_mua": None, **dict(zip(columns, values))})
            return records, errors
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(422, f"Không đọc được dữ liệu sheet 'LichSuGiaoHang' ({type(exc).__name__}). Hãy kiểm tra file .xlsx có bị hỏng không.") from exc
        finally: book.close()

    def validate(self, db, records, initial_errors=(), lock=False):
        from datetime import date
        from decimal import Decimal
        errors, grouped, items = list(initial_errors), {}, []
        invalid_rows = {error["row"] for error in initial_errors}
        suppliers = {}
        for code in sorted({str(r["ma_ncc"] or "").strip() for r in records}):
            suppliers[code] = NhaCungCapRepository.get(db, code, lock=lock)
        for row in records:
            if row["row"] in invalid_rows:
                continue
            try:
                def required(key, maximum):
                    value = str(row[key] or "").strip()
                    if not value or len(value) > maximum: raise ValueError(f"{key} bắt buộc, tối đa {maximum} ký tự.")
                    return value
                external, supplier, delivery = required("ma_don_cu", 80), required("ma_ncc", 20), required("lan_giao", 80)
                if suppliers.get(supplier) is None: raise ValueError("Nhà cung cấp không tồn tại.")
                if db.get(DonMuaNguyenLieu, external) is not None: raise ValueError("Mã đơn cũ trùng đơn mua thật; không nhập để tránh tính trùng.")
                material = db.get(NguyenLieu, required("ma_nguyen_lieu", 20))
                if material is None: raise ValueError("Nguyên liệu không tồn tại.")
                dates = []
                for key in ("ngay_dat", "ngay_du_kien", "ngay_nhan"):
                    value = row[key].date() if isinstance(row[key], datetime) else row[key]
                    try:
                        dates.append(value if isinstance(value, date) else date.fromisoformat(str(value)))
                    except (ValueError, TypeError) as exc:
                        coordinate = f"{get_column_letter(COLUMNS.index(key) + 1)}{row['row']}"
                        raise ValueError(f"{key} ({coordinate}): cần ô ngày Excel hoặc chuỗi yyyy-mm-dd; nhận kiểu {type(value).__name__}.") from exc
                placed, expected, actual = dates
                if expected < placed: raise ValueError("ngay_du_kien: ngày dự kiến không được trước ngay_dat.")
                if actual < placed: raise ValueError("ngay_nhan: ngày nhận không được trước ngay_dat.")
                if actual > local_today(): raise ValueError("ngay_nhan: ngày nhận không được trong tương lai.")
                raw_closed = str(row["hoan_tat"]).strip().lower()
                if raw_closed not in ("true", "false", "1", "0"): raise ValueError(f"hoan_tat (M{row['row']}): cần TRUE/FALSE hoặc 1/0.")
                closed = raw_closed in ("true", "1")
                line = HistoricalDeliveryLine(so_luong_thuc_nhan=row["so_luong_chap_nhan"],
                    so_luong_giao=row["so_luong_giao"], so_luong_dat_chat_luong=row["so_luong_dat_chat_luong"],
                    so_luong_khong_dat=row["so_luong_khong_dat"], ly_do_khong_nhan=str(row["ly_do"] or "").strip() or None,
                    don_gia_mua=row.get("don_gia_mua"))
                from pydantic import TypeAdapter
                from src.schemas.don_mua_schema import Quantity
                try:
                    ordered = TypeAdapter(Quantity).validate_python(row["so_luong_dat"])
                except ValidationError as exc:
                    errors.extend(self._quantity_errors(exc, row["row"], "so_luong_dat"))
                    continue
                if line.so_luong_giao > ordered: raise ValueError("Số giao đợt này vượt số đặt.")
                if line.so_luong_giao > line.so_luong_thuc_nhan and not line.ly_do_khong_nhan:
                    raise ValueError("Hàng lỗi hoặc không nhập toàn bộ phải có lý do.")
                note = str(row["ghi_chu"] or "").strip()
                if len(note) > 2000: raise ValueError("Ghi chú tối đa 2000 ký tự.")
                key = (supplier, external, delivery)
                meta = (placed, expected, actual, closed, note)
                group = grouped.setdefault(key, {"meta": meta, "rows": [], "lines": {}, "line_rows": {}})
                if group["meta"] != meta: raise ValueError("Thông tin ngày/chốt/ghi chú không nhất quán trong cùng đợt.")
                if material.ma_nguyen_lieu in group["lines"]: raise ValueError("Trùng nguyên liệu trong cùng đợt giao.")
                group["lines"][material.ma_nguyen_lieu] = (ordered, line, "kg" if material.don_vi_do_luong.strip().lower() == "g" else material.don_vi_do_luong.strip().lower())
                group["line_rows"][material.ma_nguyen_lieu] = row["row"]
                group["rows"].append(row["row"])
            except ValidationError as exc:
                errors.extend(self._quantity_errors(exc, row["row"]))
            except (ValueError, TypeError) as exc:
                errors.append({"row": row["row"], "message": str(exc)})
        orders = defaultdict(list)
        for key, group in grouped.items(): orders[key[:2]].append((key, group))
        for (supplier, external), groups in orders.items():
            existing = list(db.scalars(select(DeliveryReceipt).where(DeliveryReceipt.ma_ncc == supplier, DeliveryReceipt.ma_don_cu == external)))
            existing_ids = {r.lan_giao_cu for r in existing}
            totals, definitions, previous_date, finished = defaultdict(lambda: Decimal("0")), {}, None, False
            prices = {}
            for header in sorted(existing, key=lambda r: r.ngay_giao_thuc_te):
                previous_date = header.ngay_giao_thuc_te; finished |= header.hoan_tat
                for line in db.scalars(select(DeliveryReceiptLine).where(DeliveryReceiptLine.ma_phieu_nhan == header.ma_phieu_nhan)):
                    definitions[line.ma_nguyen_lieu] = (line.so_luong_dat, header.ngay_dat_hang, header.ngay_du_kien_giao)
                    totals[line.ma_nguyen_lieu] += line.so_luong_nhap_kho
                    if line.don_gia_mua is not None:
                        prices[line.ma_nguyen_lieu] = line.don_gia_mua
            for key, group in sorted(groups, key=lambda pair: (pair[1]["meta"][2], min(pair[1]["rows"]))):
                placed, expected, actual, closed, note = group["meta"]
                messages = []
                if key[2] in existing_ids: messages.append("Đợt lịch sử đã tồn tại; không ghi đè hoặc cộng trùng.")
                if finished: messages.append("Không thêm đợt sau khi đơn đã chốt.")
                if previous_date and actual < previous_date: messages.append("Đợt mới phải từ ngày nhận gần nhất trở đi.")
                if definitions and set(definitions) != set(group["lines"]): messages.append("Danh sách nguyên liệu phải thống nhất giữa các đợt.")
                for code, (ordered, line, unit) in group["lines"].items():
                    if line.don_gia_mua is not None:
                        if code in prices and prices[code] != line.don_gia_mua:
                            row_number = group["line_rows"][code]
                            errors.append({"row": row_number, "message": f"don_gia_mua (P{row_number}): đơn giá của nguyên liệu {code} phải thống nhất trong cùng đơn cũ."})
                        else:
                            prices[code] = line.don_gia_mua
                    definition = (ordered, placed, expected)
                    if code in definitions and definitions[code] != definition: messages.append("Số đặt/ngày đặt/dự kiến khác lịch sử đã khai báo.")
                    definitions[code] = definition
                    if line.so_luong_giao > ordered - totals[code]: messages.append("Số giao vượt phần còn chờ giao.")
                    totals[code] += line.so_luong_thuc_nhan
                    if totals[code] > ordered: messages.append("Tổng chấp nhận vượt số đặt.")
                    if closed and totals[code] < ordered and not line.ly_do_khong_nhan: messages.append("Chốt đơn còn thiếu phải có lý do.")
                if messages:
                    for row_number in group["rows"]: errors.append({"row": row_number, "message": "; ".join(dict.fromkeys(messages))})
                price_lines = [{"ma_nguyen_lieu": code, "so_luong_nhap_kho": str(line.so_luong_thuc_nhan),
                    "don_gia_mua": str(line.don_gia_mua) if line.don_gia_mua is not None else None,
                    "don_vi_don_gia": unit if line.don_gia_mua is not None else None,
                    "thanh_tien": str(receipt_line_amount(line.so_luong_thuc_nhan, line.don_gia_mua)) if line.don_gia_mua is not None else None}
                    for code, (_, line, unit) in group["lines"].items()]
                total = receipt_total(Decimal(line["thanh_tien"]) if line["thanh_tien"] is not None else None for line in price_lines)
                items.append({"code": external, "supplier": supplier, "delivery": key[2], "lines": len(group["lines"]), "date": str(actual), "closed": closed,
                    "chi_tiet": price_lines, "tong_gia_tri_nhap": str(total) if total is not None else None})
                previous_date, finished = actual, closed
        if not records: errors.append({"row": 1, "message": "File không có dữ liệu."})
        return {"valid": not errors, "total_rows": len(records), "items": items, "errors": errors, "imported": 0}, grouped

    @staticmethod
    def _quantity_errors(exc, row, field=None):
        aliases = {"so_luong_thuc_nhan": "so_luong_chap_nhan", "ly_do_khong_nhan": "ly_do"}
        messages = {
            "decimal_parsing": "Cần số hợp lệ (dùng ô số Excel hoặc chuỗi số, dấu chấm phân cách thập phân).",
            "decimal_type": "Cần giá trị số; không dùng ô ngày, TRUE/FALSE hoặc để trống.",
            "finite_number": "Số phải hữu hạn.",
            "greater_than": "Số lượng đặt phải lớn hơn 0.",
            "greater_than_equal": "Số lượng không được âm.",
            "decimal_max_digits": "Số lượng không được vượt 14 chữ số.",
            "decimal_max_places": "Số lượng chỉ được có tối đa 2 chữ số thập phân.",
            "decimal_whole_digits": "Phần nguyên của số lượng không được vượt 12 chữ số.",
            "string_too_long": "Nội dung vượt độ dài cho phép.",
        }
        result = []
        for error in exc.errors():
            name = field or (error["loc"][0] if error["loc"] else None)
            name = aliases.get(name, name)
            prefix = f"{name} ({get_column_letter(PRICED_COLUMNS.index(name) + 1)}{row}): " if name in PRICED_COLUMNS else ""
            message = messages.get(error["type"], error["msg"].removeprefix("Value error, "))
            if name == "don_gia_mua":
                message = {"decimal_max_digits": "Đơn giá tối đa 15 chữ số.", "decimal_whole_digits": "Phần nguyên đơn giá tối đa 13 chữ số.",
                           "greater_than_equal": "Đơn giá không được âm."}.get(error["type"], message)
            result.append({"row": row, "message": prefix + message})
        return result

    def preview(self, db, content, filename):
        rows, errors = self.parse(content, filename)
        return self.validate(db, rows, errors)[0]

    def import_file(self, db, content, filename, confirmed):
        if not confirmed: raise HTTPException(422, "Cần xem trước và xác nhận import lịch sử chỉ để đánh giá NCC.")
        records, errors = self.parse(content, filename)
        with DonMuaService._write(db):
            report, groups = self.validate(db, records, errors, lock=True)
            if not report["valid"]: raise HTTPException(422, report)
            actor = StockAccountingService.actor(db)
            for (supplier, external, delivery), group in groups.items():
                placed, expected, actual, closed, note = group["meta"]
                header = DeliveryReceipt(ma_phieu_nhan=uuid4().hex, request_id=uuid4().hex, ma_ncc=supplier,
                    nguon="LICH_SU", ma_don_cu=external, lan_giao_cu=delivery, ngay_dat_hang=placed,
                    ngay_du_kien_giao=expected, ngay_giao_thuc_te=actual, hoan_tat=closed, nguoi_xac_nhan=actor, ghi_chu=note or None)
                db.add(header); db.flush()
                for code, (ordered, line, unit) in group["lines"].items():
                    db.add(DeliveryReceiptLine(ma_phieu_nhan=header.ma_phieu_nhan, ma_nguyen_lieu=code, don_vi=unit,
                        so_luong_dat=ordered, so_luong_giao=line.so_luong_giao, so_luong_dat_chat_luong=line.so_luong_dat_chat_luong,
                        so_luong_khong_dat=line.so_luong_khong_dat, so_luong_nhap_kho=line.so_luong_thuc_nhan, ly_do=line.ly_do_khong_nhan,
                        don_gia_mua=line.don_gia_mua, don_vi_don_gia=unit if line.don_gia_mua is not None else None))
            db.flush()
            from src.services.nha_cung_cap_service import NhaCungCapService
            for supplier in sorted({key[0] for key in groups}):
                NhaCungCapService().calculate_supplier_score_in_transaction(db, supplier)
            report["imported"] = len(groups)
        return report
