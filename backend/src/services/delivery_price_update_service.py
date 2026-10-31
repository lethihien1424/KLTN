"""Correct receipt price evidence without changing receipts, stock, orders or KPIs."""
from collections import defaultdict
from decimal import Decimal
from hashlib import sha256
import hmac
from io import BytesIO
import json
from uuid import uuid4

from fastapi import HTTPException
from openpyxl import Workbook, load_workbook
from openpyxl.utils import get_column_letter
from pydantic import TypeAdapter, ValidationError
from sqlalchemy import select, or_

from src.core.config import settings
from src.models.chi_tiet_don_mua import ChiTietDonMua
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
from src.repositories.nha_cung_cap_repository import NhaCungCapRepository
from src.services.bom_excel_service import MAX_BYTES, MAX_ROWS, append_text_safe, workbook_bytes
from src.services.delivery_excel_service import HistoricalPrice, HistoricalQuantity
from src.services.delivery_history_service import DeliveryHistoryService
from src.services.delivery_pricing_service import receipt_line_amount
from src.services.don_mua_service import DonMuaService

COLUMNS = ['ma_phieu_nhan', 'ma_nguyen_lieu', 'don_gia_mua', 'don_vi_don_gia', 'ly_do']
DETAILED_COLUMNS = ['Mã phiếu nhận', 'Mã đơn cũ', 'Đợt giao', 'Mã NCC', 'Mã nguyên liệu', 'Tên nguyên liệu',
                    'Số lượng nhập kho', 'Đơn vị', 'Đơn giá mua (VND)', 'Đơn vị đơn giá', 'Thành tiền (VND)', 'Ghi chú']


def decimal_text(value):
    return format(value, 'f') if value is not None else None


class DeliveryPriceUpdateService:
    @staticmethod
    def template(db=None, **filters):
        book = Workbook(); sheet = book.active; sheet.title = 'CapNhatGia'; sheet.append(COLUMNS)
        if db is not None:
            for receipt in DeliveryHistoryService.read(db, **filters):
                for line in receipt['chi_tiet']:
                    append_text_safe(sheet, [receipt['ma_phieu_nhap'], line['ma_nguyen_lieu'], decimal_text(line['don_gia_mua']), line['don_vi'], None])
        sheet.freeze_panes = 'A2'
        for cell in sheet[1]:
            sheet.column_dimensions[cell.column_letter].width = 35
        guide = book.create_sheet('HuongDan')
        for note in [
            'CẬP NHẬT GIÁ PHIẾU ĐÃ TỒN TẠI, KHÔNG NHẬP THÊM PHIẾU. Sheet CapNhatGia v1, giữ nguyên 5 cột A:E.',
            'Cột ma_phieu_nhan nhận mã nghiệp vụ PNxxxx hoặc UUID nội bộ từ file cũ; kết hợp ma_nguyen_lieu để định danh chính xác. Không được trùng cặp, kể cả dùng PN và UUID của cùng phiếu.',
            'don_gia_mua: VND/đơn vị mua, bắt buộc, không âm, tối đa 15 chữ số và 2 số lẻ. 0 là giá hợp lệ; để trống không xóa giá.',
            'don_vi_don_gia: đơn vị của dòng phiếu (kg, l...) hoặc VND/kg, VND/l. Không chuyển đổi số lượng hoặc đơn vị.',
            'Thành tiền do hệ thống tính bằng số chấp nhận đang lưu × đơn giá mới; không thêm cột/công thức vào mẫu chính thức.',
            'ly_do: lý do riêng từng dòng (không bắt buộc); khi xác nhận phải nhập lý do chung của lần cập nhật.',
            'Cùng đơn cũ/NCC/nguyên liệu phải thống nhất giá giữa các đợt có giá. Khi sửa giá, chọn đủ các đợt liên quan.',
            'Phiếu từ đơn mua thực tế chỉ được bổ sung giá khớp snapshot chi tiết đơn mua, không sửa giá đơn đã duyệt.',
            'Tải mẫu theo bộ lọc để lấy mã hiện có. Chỉ điền giá mua có chứng từ; không dùng giá minh họa hoặc giá tham khảo hiện tại.',
        ]:
            guide.append([note])
        guide.column_dimensions['A'].width = 150
        return workbook_bytes(book)

    @staticmethod
    def parse(content, filename):
        if not filename or not filename.lower().endswith('.xlsx'):
            raise HTTPException(422, 'Cập nhật giá cần file .xlsx với sheet CapNhatGia.')
        if len(content) > MAX_BYTES:
            raise HTTPException(422, 'File cập nhật giá vượt giới hạn 10 MB.')
        try:
            book = load_workbook(BytesIO(content), read_only=True, data_only=False)
        except Exception as exc:
            raise HTTPException(422, 'Không mở được workbook .xlsx cập nhật giá; hãy kiểm tra file có bị hỏng không.') from exc
        try:
            if 'CapNhatGia' not in book.sheetnames:
                raise HTTPException(422, "Thiếu sheet 'CapNhatGia'. Đây là cập nhật giá phiếu cũ, không phải Import LichSuGiaoHang.")
            sheet = book['CapNhatGia']; sheet.reset_dimensions(); iterator = sheet.iter_rows()
            header = next(iterator, ())
            names = [cell.value for cell in header]
            while names and names[-1] is None:
                names.pop()
            detailed = names == DETAILED_COLUMNS
            columns = DETAILED_COLUMNS if detailed else COLUMNS
            if names != columns or any(cell.data_type in ('f', 'e') for cell in header[:len(columns)]):
                raise HTTPException(422, 'Sai tiêu đề CapNhatGia. Dùng template chính thức: ' + ', '.join(COLUMNS) + '. Cũng hỗ trợ đủ 12 cột của file cập nhật giá chi tiết.')
            records, errors = [], []
            indexes = {'ma_phieu_nhan': 0, 'ma_nguyen_lieu': 4, 'don_gia_mua': 8, 'don_vi_don_gia': 9, 'ly_do': 11} if detailed else {name: i for i, name in enumerate(COLUMNS)}
            for number, cells in enumerate(iterator, 2):
                values = [cell.value for cell in cells]
                if not any(value is not None for value in values):
                    continue
                if len(records) >= MAX_ROWS:
                    raise HTTPException(422, f'File cập nhật giá vượt 10.000 dòng dữ liệu tại dòng Excel {number}.')
                extras = [f'{get_column_letter(i+1)}{number}' for i, value in enumerate(values) if i >= len(columns) and value is not None]
                if extras:
                    raise HTTPException(422, 'Dữ liệu ngoài cột template tại ' + ', '.join(extras[:10]))
                values += [None] * (len(columns) - len(values))
                for index, cell in enumerate(cells[:len(columns)]):
                    # In the supplied 12-column workbook K is display-only. Never
                    # evaluate or trust its cached amount; recompute from the DB.
                    if detailed and index == 10:
                        continue
                    if cell.data_type in ('f', 'e'):
                        errors.append({'row': number, 'message': f'{columns[index]} ({get_column_letter(index+1)}{number}): không dùng công thức hoặc ô lỗi Excel.'})
                record = {'row': number, **{key: values[index] for key, index in indexes.items()},
                          'price_cell': f'{get_column_letter(indexes["don_gia_mua"]+1)}{number}'}
                if detailed:
                    record['context'] = dict(zip(('ma_don_cu','lan_giao_cu','ma_ncc','so_luong_nhap_kho','don_vi'), (values[1],values[2],values[3],values[6],values[7])))
                    record['source_note'] = record.pop('ly_do')
                    record['ly_do'] = None
                records.append(record)
            return records, errors
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(422, 'Không đọc được dữ liệu sheet CapNhatGia.') from exc
        finally:
            book.close()

    def validate(self, db, content, filename, lock=False):
        records, errors = self.parse(content, filename)
        invalid = {error['row'] for error in errors}
        ids = sorted({str(row['ma_phieu_nhan'] or '').strip() for row in records})
        headers = {alias: h for h in db.scalars(select(DeliveryReceipt).where(or_(
            DeliveryReceipt.ma_phieu_nhan.in_(ids), DeliveryReceipt.ma_phieu_nhap.in_(ids))))
            for alias in (h.ma_phieu_nhan, h.ma_phieu_nhap)}
        suppliers = sorted({h.ma_ncc for h in headers.values()})
        if lock:
            # Match the receive/import lock order, also serializing price consistency checks.
            for supplier in suppliers:
                NhaCungCapRepository.get(db, supplier, lock=True)
        query = select(DeliveryReceiptLine, DeliveryReceipt).join(DeliveryReceipt,
            DeliveryReceipt.ma_phieu_nhan == DeliveryReceiptLine.ma_phieu_nhan).where(DeliveryReceipt.ma_ncc.in_(suppliers)).order_by(DeliveryReceiptLine.id)
        if lock:
            query = query.with_for_update(of=DeliveryReceiptLine).execution_options(populate_existing=True)
        peers = list(db.execute(query))
        targets = {(line.ma_phieu_nhan, line.ma_nguyen_lieu): (line, header) for line, header in peers}
        items, changes, seen = [], {}, {}
        for row in records:
            number = row['row']
            if number in invalid:
                continue
            try:
                key = (str(row['ma_phieu_nhan'] or '').strip(), str(row['ma_nguyen_lieu'] or '').strip())
                if not key[0] or len(key[0]) > 32 or not key[1] or len(key[1]) > 20:
                    raise ValueError('Mã phiếu nhận và mã nguyên liệu bắt buộc, tối đa 32/20 ký tự.')
                header = headers.get(key[0])
                if header is not None:
                    key = (header.ma_phieu_nhan, key[1])
                if key in seen:
                    raise ValueError(f'Trùng mã phiếu nhận/nguyên liệu với dòng {seen[key]}.')
                seen[key] = number
                if key not in targets:
                    raise ValueError(f'Không tồn tại chi tiết phiếu nhận {key[0]} / nguyên liệu {key[1]}.')
                line, header = targets[key]
                try:
                    price = TypeAdapter(HistoricalPrice).validate_python(row['don_gia_mua']).quantize(Decimal('0.01'))
                except (ValidationError, TypeError, ValueError) as exc:
                    raise ValueError(f'don_gia_mua ({row["price_cell"]}): cần Decimal hữu hạn, không âm, tối đa 15 chữ số/2 số thập phân; không để trống.') from exc
                unit = str(row['don_vi_don_gia'] or '').strip().lower()
                if unit.startswith('vnd/'):
                    unit = unit[4:].strip()
                if unit != line.don_vi:
                    raise ValueError(f'Đơn vị đơn giá phải là {line.don_vi} hoặc VND/{line.don_vi}; không đổi đơn vị/số lượng.')
                if row.get('context'):
                    context = row['context']
                    for name in ('ma_don_cu','lan_giao_cu','ma_ncc'):
                        if str(context[name] or '').strip() != str(getattr(header, name) or ''):
                            raise ValueError(f'{name}: thông tin trong file khác phiếu đang lưu.')
                    if TypeAdapter(HistoricalQuantity).validate_python(context['so_luong_nhap_kho']) != line.so_luong_nhap_kho or str(context['don_vi'] or '').strip() != line.don_vi:
                        raise ValueError('Số lượng nhập kho/đơn vị trong file khác phiếu đang lưu; tải lại template.')
                if header.nguon == 'THUC_TE':
                    order_line = db.get(ChiTietDonMua, line.ma_chi_tiet_don_mua) if line.ma_chi_tiet_don_mua else None
                    if order_line is None or price != order_line.don_gia_vnd_kg:
                        raise ValueError('Phiếu nhận thực tế phải khớp giá snapshot chi tiết đơn mua; không sửa giá đơn đã duyệt.')
                note = str(row.get('ly_do') or '').strip()
                if len(note) > 2000:
                    raise ValueError('Lý do từng dòng tối đa 2000 ký tự.')
                item = {'row': number, 'ma_phieu_nhan': key[0], 'ma_phieu_nhap': header.ma_phieu_nhap, 'ma_nguyen_lieu': key[1], 'so_luong_nhap_kho': decimal_text(line.so_luong_nhap_kho),
                    'don_gia_cu': decimal_text(line.don_gia_mua), 'don_vi_cu': line.don_vi_don_gia, 'thanh_tien_cu': decimal_text(line.thanh_tien),
                    'don_gia_moi': decimal_text(price), 'don_vi_moi': unit, 'thanh_tien_moi': decimal_text(receipt_line_amount(line.so_luong_nhap_kho, price)),
                    'ly_do': note or None, 'source_note': str(row.get('source_note') or '') or None,
                    'changed': line.don_gia_mua != price or line.don_vi_don_gia != unit}
                items.append(item); changes[line.id] = (line, header, price, unit, item)
            except (ValueError, TypeError, ValidationError) as exc:
                errors.append({'row': number, 'message': str(exc)})
        prices = defaultdict(set)
        for line, header in peers:
            price = changes[line.id][2] if line.id in changes else line.don_gia_mua
            if price is not None and header.nguon == 'LICH_SU':
                prices[(header.ma_ncc, header.ma_don_cu, line.ma_nguyen_lieu)].add(price)
        for _, header, _, _, item in changes.values():
            if len(prices[(header.ma_ncc, header.ma_don_cu, item['ma_nguyen_lieu'])]) > 1:
                errors.append({'row': item['row'], 'message': 'Đơn giá phải thống nhất cho cùng đơn cũ/NCC/nguyên liệu. Cần cập nhật đủ các đợt liên quan.'})
        if not records:
            errors.append({'row': 1, 'message': 'File không có dòng cập nhật giá.'})
        report = {'valid': not errors, 'total_rows': len(records), 'updated': 0, 'items': items, 'errors': errors}
        # A confirmation binds to this exact file and all previewed current values.
        # A later edit makes it stale; the user must inspect a fresh preview.
        state = json.dumps({'file': sha256(content).hexdigest(), 'items': items}, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
        report['preview_token'] = hmac.new(settings.JWT_SECRET_KEY.encode(), state.encode(), sha256).hexdigest() if report['valid'] else None
        return report, changes

    def preview(self, db, content, filename):
        return self.validate(db, content, filename)[0]

    @staticmethod
    def audit(db, line, item, actor, reason, filename, batch):
        before = {'don_gia_mua': item['don_gia_cu'], 'don_vi_don_gia': item['don_vi_cu'], 'thanh_tien': item['thanh_tien_cu']}
        after = {'don_gia_mua': decimal_text(line.don_gia_mua), 'don_vi_don_gia': line.don_vi_don_gia, 'thanh_tien': decimal_text(line.thanh_tien)}
        details = {'version': 1, 'batch': batch, 'ma_phieu_nhan': line.ma_phieu_nhan, 'ma_nguyen_lieu': line.ma_nguyen_lieu,
                   'ly_do': reason, 'ly_do_dong': item['ly_do'], 'ghi_chu_file': item['source_note'], 'file': filename,
                   'nguoi_thao_tac': actor, 'du_lieu_truoc': before, 'du_lieu_sau': after}
        db.add(NhatKyHoatDong(ma_nhat_ky='NK' + uuid4().hex[:18], ma_nguoi_dung=actor['ma_nguoi_dung'],
            ten_nguoi_thao_tac=actor.get('ho_ten'), hanh_dong='CAP_NHAT_GIA_NHAP', ket_qua='THANH_CONG',
            module='Mua hàng', chuc_nang='Lịch sử nhập nguyên liệu', ma_doi_tuong=f'{line.ma_phieu_nhan}/{line.ma_nguyen_lieu}',
            du_lieu_truoc=before, du_lieu_sau=after, mo_ta=json.dumps(details, ensure_ascii=False)))

    def apply(self, db, content, filename, confirmed, preview_token, reason):
        if not confirmed:
            raise HTTPException(422, 'Cần xem trước và xác nhận cập nhật giá phiếu đã tồn tại.')
        reason = (reason or '').strip()
        if not reason or len(reason) > 2000:
            raise HTTPException(422, 'Lý do cập nhật giá bắt buộc, tối đa 2000 ký tự.')
        with DonMuaService._write(db):
            report, changes = self.validate(db, content, filename, lock=True)
            if not report['valid']:
                raise HTTPException(422, report)
            if not preview_token or not hmac.compare_digest(report['preview_token'].encode(), preview_token.encode()):
                raise HTTPException(409, 'Preview đã thay đổi hoặc chưa được xác nhận. Hãy xem lại giá hiện tại trước khi cập nhật.')
            actor = db.info.get('audit_actor')
            if not actor or not actor.get('ma_nguoi_dung'):
                raise HTTPException(401, 'Chưa xác định người cập nhật giá.')
            batch = uuid4().hex
            for line, _, price, unit, item in changes.values():
                if not item['changed']:
                    continue
                line.don_gia_mua, line.don_vi_don_gia = price, unit
                db.flush(); db.refresh(line, ['thanh_tien'])
                self.audit(db, line, item, actor, reason, filename, batch)
                report['updated'] += 1
            db.flush()
            report['batch'] = batch
        return report
