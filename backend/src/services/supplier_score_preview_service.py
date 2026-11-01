"""Explain the existing v2 score; previews never write business or audit rows."""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from hashlib import sha256
import json
from uuid import uuid4

from fastapi import HTTPException
from jose import jwt, JWTError
from sqlalchemy import select, text

from src.core.config import settings
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.chi_tiet_don_mua import ChiTietDonMua
from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
from src.models.ly_do_model import LyDo, LyDoChucNang
from src.models.nguyen_lieu_model import NguyenLieu
from src.services.nha_cung_cap_service import NhaCungCapService
from src.services.supplier_scoring import evaluate, score_mapping, WEIGHTS
from src.services.supplier_score_explanation import explain, fmt, mean_formula

POLICY = {
    "version": "supplier-score-v2",
    "weights": {key: str(value * 100) for key, value in WEIGHTS.items()},
    "missing": "Bỏ tiêu chí thiếu dữ liệu khỏi mẫu số trọng số; không thay bằng 0 hoặc tỷ lệ khai báo. Không có KPI/mapping: điểm NULL.",
    "formula": "Điểm mapping = 100 × Σ(w × KPI có dữ liệu) / Σ(w có dữ liệu). Điểm NCC = trung bình điểm mapping; làm tròn HALF_UP đến 0,01.",
    "lead": "L = min(1, thời gian khai báo / thời gian thực tế trung bình); thực tế = 0 ngày: L = 1; thiếu thực tế: L = NULL.",
    "quality": "Q = trung bình tỷ lệ đạt/giao theo từng đơn vị đo, chỉ dùng dòng có kết quả kiểm định.",
    "on_time": "O = số đơn đã chốt, có giao hàng và nhận cuối đúng hạn / số đơn đã chốt.",
    "full": "F = trung bình theo đơn của trung bình min(1, lượng nhập/lượng đặt) từng nguyên liệu; gồm cả đơn còn giao tiếp.",
    "sources": "Chứng từ thực tế, phiếu lịch sử Excel và đơn đã nhận cũ được phân biệt; không dùng tỷ lệ khai báo hoặc tồn NCC demo làm KPI. Thời gian khai báo chỉ là mốc so sánh cho L.",
}
LABELS = {"quality_ratio": "Chất lượng", "on_time_ratio": "Đúng hạn", "full_ratio": "Giao đủ", "lead_time": "Đáp ứng thời gian giao"}


def serial(value):
    return json.loads(json.dumps(value, default=str, ensure_ascii=False))


def fingerprint(value):
    return sha256(json.dumps(serial(value), sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def snapshot_rows(rows):
    return [{column.name: getattr(row, column.name) for column in row.__table__.columns} for row in rows]


class SupplierScorePreviewService:
    def __init__(self):
        self.suppliers = NhaCungCapService()

    def item(self, db, supplier, evaluated=None):
        code = supplier.ma_ncc
        mappings = self.suppliers.repository.mappings(db, code)
        material_names = dict(db.execute(select(NguyenLieu.ma_nguyen_lieu, NguyenLieu.ten_nguyen_lieu).where(
            NguyenLieu.ma_nguyen_lieu.in_([row.ma_nguyen_lieu for row in mappings]))).all())
        score, coverage, metrics = evaluated if evaluated is not None else evaluate(db, code, self.suppliers.repository)
        metrics["don_mua"].sort(key=lambda row: (row["nguon"], row["ma_don"]))
        metrics["chat_luong_theo_don_vi"].sort(key=lambda row: row["don_vi"])
        headers = list(db.scalars(select(DeliveryReceipt).where(DeliveryReceipt.ma_ncc == code).order_by(DeliveryReceipt.ma_phieu_nhan)))
        lines = list(db.scalars(select(DeliveryReceiptLine).join(DeliveryReceipt,
            DeliveryReceipt.ma_phieu_nhan == DeliveryReceiptLine.ma_phieu_nhan).where(DeliveryReceipt.ma_ncc == code).order_by(DeliveryReceiptLine.id)))
        orders = list(db.scalars(select(DonMuaNguyenLieu).where(DonMuaNguyenLieu.ma_ncc == code).order_by(DonMuaNguyenLieu.ma_don_mua)))
        order_lines = list(db.scalars(select(ChiTietDonMua).join(DonMuaNguyenLieu,
            DonMuaNguyenLieu.ma_don_mua == ChiTietDonMua.ma_don_mua).where(DonMuaNguyenLieu.ma_ncc == code).order_by(ChiTietDonMua.ma_chi_tiet_don_mua)))
        quality = [line for line in lines if line.so_luong_dat_chat_luong is not None and line.so_luong_giao > 0]
        lead_samples = sum(row["hoan_tat"] and any(
            (line["so_luong_giao"] if line["so_luong_giao"] is not None else line["so_luong_nhap"]) > 0
            for line in row["chi_tiet"]) for row in metrics["don_mua"])
        sample_counts = {"quality_ratio": len(quality), "on_time_ratio": metrics["so_don_da_nhan"],
                         "full_ratio": metrics["so_don"], "lead_time": lead_samples}
        details = []
        for mapping in mappings:
            mapping_score, mapping_coverage = score_mapping(mapping, metrics)
            lead = metrics["lead_time"]
            values = {key: metrics.get(key) for key in WEIGHTS}
            values["lead_time"] = (min(Decimal(1), Decimal(mapping.lead_time_ngay) / lead) if lead is not None and lead > 0
                                   else Decimal(1) if lead == 0 else None)
            criteria = []
            for key, weight in WEIGHTS.items():
                value = values[key]
                bounded = max(Decimal(0), min(Decimal(1), value)) if value is not None else None
                criteria.append({"key": key, "ten": LABELS[key], "trong_so": weight * 100,
                    "trong_so_ap_dung": weight / mapping_coverage * 100 if value is not None and mapping_coverage else None,
                    "gia_tri": value, "diem": bounded * 100 if bounded is not None else None,
                    "dong_gop": weight * bounded / mapping_coverage * 100 if bounded is not None and mapping_coverage else None,
                    "nguon": "CHUA_DU_DU_LIEU" if value is None else "THUC_TE_VA_KHAI_BAO" if key == "lead_time" else "THUC_TE",
                    "so_mau": sample_counts[key],
                    "giai_thich": explain(key, metrics, mapping, value),
                    "phep_tinh": (f'{fmt(bounded * 100)} × {fmt(weight / mapping_coverage * 100)}% = {fmt(weight * bounded / mapping_coverage * 100)} điểm'
                        if bounded is not None and mapping_coverage else "Chưa có dữ liệu; không tham gia tính điểm."),
                })
            details.append({"ma_nguyen_lieu_ncc": mapping.ma_nguyen_lieu_ncc, "ma_nguyen_lieu": mapping.ma_nguyen_lieu,
                "ten_nguyen_lieu": material_names.get(mapping.ma_nguyen_lieu, mapping.ma_nguyen_lieu),
                "diem": mapping_score, "do_day_du": mapping_coverage * 100, "tieu_chi": criteria,
                "giai_thich_tong": (f'Tổng trọng số hợp lệ = {fmt(mapping_coverage * 100)}%. '
                    f'Trọng số áp dụng = trọng số gốc / {fmt(mapping_coverage * 100)} × 100%. '
                    'Điểm mapping = ' + ' + '.join(fmt(c["dong_gop"]) for c in criteria if c["dong_gop"] is not None)
                    + f' = {fmt(mapping_score)} điểm.' if mapping_coverage else 'Chưa có dữ liệu; mapping không tham gia điểm NCC.'),
                "khai_bao_khong_dung_lam_kpi": {"chat_luong": mapping.ty_le_chat_luong_dat, "dung_han": mapping.ty_le_giao_dung_han, "giao_du": mapping.ty_le_giao_du},
                "lead_time_khai_bao_ngay": mapping.lead_time_ngay, "lead_time_thuc_te_ngay": lead})
        sources = {"mapping": snapshot_rows(mappings), "phieu": snapshot_rows(headers), "chi_tiet": snapshot_rows(lines),
                   "don_mua": snapshot_rows(orders), "chi_tiet_don": snapshot_rows(order_lines)}
        available = [row["diem"] for row in details if row["diem"] is not None]
        aggregation = "Điểm NCC = trung bình điểm các mapping hợp lệ: " + mean_formula(available, sum(available) / len(available) if available else None, " điểm")
        aggregation += f' Làm tròn HALF_UP đến 0,01 = {fmt(score)}.'
        return serial({"ma_ncc": code, "ten_ncc": supplier.ten_ncc, "diem_hien_tai": supplier.diem_dieu_kien_thuong_mai,
            "giai_thich_tong": aggregation,
            "diem_moi": score, "chenh_lech": score - supplier.diem_dieu_kien_thuong_mai if score is not None and supplier.diem_dieu_kien_thuong_mai is not None else None,
            "do_day_du": coverage * 100, "tinh_trang": "CHUA_DU_DU_LIEU" if score is None else "DU_DU_LIEU" if coverage == 1 else "THIEU_MOT_PHAN",
            "so_phieu": metrics["so_phieu"], "so_lan_giao": sum(row["so_dot"] for row in metrics["don_mua"]),
            "so_don": metrics["so_don"], "so_don_da_chot": metrics["so_don_da_nhan"], "so_dong_kiem_dinh_hop_le": len(quality),
            "so_phieu_thuc_te": sum(row.nguon == "THUC_TE" for row in headers), "so_phieu_lich_su": sum(row.nguon == "LICH_SU" for row in headers),
            "so_don_cu": sum(row["nguon"] == "DON_CU" for row in metrics["don_mua"]),
            "mapping": details, "kpi": metrics, "du_lieu_nguon": fingerprint(sources)})

    def report(self, db, code=None):
        suppliers = [self.suppliers.detail(db, code)] if code is not None else self.suppliers.repository.list(db)
        return {"chinh_sach": POLICY, "nha_cung_cap": [self.item(db, row) for row in suppliers]}

    def preview(self, db, actor, code=None):
        report = self.report(db, code)
        now = datetime.now(timezone.utc)
        token = jwt.encode({"purpose": "supplier-score-preview", "actor": actor.ma_nguoi_dung, "scope": code,
            "digest": fingerprint(report), "iat": now, "exp": now + timedelta(minutes=15)}, settings.JWT_SECRET_KEY, algorithm="HS256")
        return {**report, "tinh_luc": now.isoformat(), "preview_token": token}

    def apply(self, db, actor, payload, code=None):
        try:
            try:
                claims = jwt.decode(payload.preview_token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
            except JWTError as exc:
                raise HTTPException(409, "Preview không hợp lệ hoặc đã hết hạn. Vui lòng tính lại Preview.") from exc
            if claims.get("purpose") != "supplier-score-preview" or claims.get("actor") != actor.ma_nguoi_dung or claims.get("scope") != code:
                raise HTTPException(409, "Preview không đúng người thực hiện hoặc phạm vi NCC. Vui lòng tính lại Preview.")
            with self.suppliers._write(db):
                reason_label = payload.ly_do
                if payload.ly_do_id is not None:
                    reason = db.scalar(select(LyDo).where(LyDo.id == payload.ly_do_id).with_for_update())
                    if reason is None or reason.trang_thai != "DANG_SU_DUNG":
                        raise HTTPException(422, "Lý do không tồn tại hoặc đã ngừng sử dụng.")
                    applicable = db.scalar(select(LyDoChucNang.id).where(
                        LyDoChucNang.ly_do_id == reason.id, LyDoChucNang.chuc_nang == "TINH_LAI_DIEM_NCC").with_for_update())
                    if not applicable:
                        raise HTTPException(422, "Lý do không áp dụng cho chức năng tính lại điểm NCC.")
                    if reason.ten_ly_do.strip().casefold() == "khác" and not (payload.ghi_chu or "").strip():
                        raise HTTPException(422, 'Vui lòng nhập ghi chú khi chọn lý do "Khác".')
                    reason_label = reason.ten_ly_do
                # Protect updates AND inserted/deleted evidence during check-and-save.
                # Same ordered table lock for single and batch requests; no schema changes.
                db.execute(text("SET LOCAL lock_timeout = '5s'"))
                db.execute(text("LOCK TABLE nha_cung_cap, nguyen_lieu_nha_cung_cap, don_mua_nguyen_lieu, chi_tiet_don_mua, phieu_nhan_nguyen_lieu, chi_tiet_phieu_nhan_nguyen_lieu IN SHARE ROW EXCLUSIVE MODE"))
                db.expire_all()
                report = self.report(db, code)
                if claims.get("digest") != fingerprint(report):
                    raise HTTPException(409, "Dữ liệu nguồn hoặc điểm hiện tại đã thay đổi từ lúc Preview. Vui lòng tính lại Preview trước khi xác nhận.")
                results = []
                batch = uuid4().hex
                for item in report["nha_cung_cap"]:
                    result = self.suppliers.calculate_supplier_score_in_transaction(db, item["ma_ncc"])
                    results.append(result)
                    before = {"diem_dieu_kien_thuong_mai": item["diem_hien_tai"]}
                    after = serial(result)
                    audit = {"version": 1, "batch": batch, "chinh_sach": POLICY, "preview": item,
                        "preview_luc": datetime.fromtimestamp(claims["iat"], timezone.utc).isoformat(),
                        "nguoi_thao_tac": {"ma_nguoi_dung": actor.ma_nguoi_dung, "ho_ten": actor.ho_ten},
                        "ly_do": reason_label, "ghi_chu": payload.ghi_chu, "du_lieu_truoc": before, "du_lieu_sau": after}
                    db.add(NhatKyHoatDong(ma_nhat_ky="NK" + uuid4().hex[:18], ma_nguoi_dung=actor.ma_nguoi_dung,
                        ten_nguoi_thao_tac=actor.ho_ten, hanh_dong="TINH_LAI_DIEM_NCC", ket_qua="THANH_CONG",
                        module="Nhà cung cấp", chuc_nang="Tính lại điểm nhà cung cấp", ma_doi_tuong=item["ma_ncc"],
                        thoi_gian=datetime.now(timezone.utc), du_lieu_truoc=before, du_lieu_sau=after,
                        mo_ta=json.dumps(audit, ensure_ascii=False)))
                db.flush()
            return results[0] if code is not None else {"so_ncc_da_cap_nhat": len(results), "nha_cung_cap": results}
        except Exception:
            db.rollback()
            raise
