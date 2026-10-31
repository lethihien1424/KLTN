"""One sample per purchase order, with receipt-level evidence retained."""
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP
from sqlalchemy import select
from src.models.delivery_receipt_model import DeliveryReceipt, DeliveryReceiptLine
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.chi_tiet_don_mua import ChiTietDonMua

ZERO = Decimal("0")
ONE = Decimal("1")


def percent(ratio):
    return None if ratio is None else (ratio * 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class DeliveryKpiService:
    @staticmethod
    def summarize(db, supplier_code):
        groups = {}
        rows = db.execute(select(DeliveryReceipt, DeliveryReceiptLine).join(
            DeliveryReceiptLine, DeliveryReceiptLine.ma_phieu_nhan == DeliveryReceipt.ma_phieu_nhan
        ).where(DeliveryReceipt.ma_ncc == supplier_code).order_by(DeliveryReceipt.ngay_giao_thuc_te, DeliveryReceipt.thoi_gian)).all()
        quality_units = defaultdict(lambda: [ZERO, ZERO])
        for header, line in rows:
            key = (header.nguon, header.ma_don_mua or header.ma_don_cu)
            group = groups.setdefault(key, {"ma_don": key[1], "nguon": header.nguon, "ngay_dat": header.ngay_dat_hang,
                "ngay_du_kien": header.ngay_du_kien_giao, "ngay_cuoi": header.ngay_giao_thuc_te,
                "hoan_tat": False, "lines": {}, "phieu": set()})
            group["ngay_cuoi"] = max(group["ngay_cuoi"], header.ngay_giao_thuc_te)
            group["hoan_tat"] |= header.hoan_tat
            group["phieu"].add(header.ma_phieu_nhan)
            item = group["lines"].setdefault(line.ma_nguyen_lieu, {"dat": line.so_luong_dat, "nhap": ZERO, "giao": ZERO, "don_vi": line.don_vi})
            item["nhap"] += line.so_luong_nhap_kho
            item["giao"] += line.so_luong_giao
            if line.so_luong_dat_chat_luong is not None:
                quality_units[line.don_vi][0] += line.so_luong_dat_chat_luong
                quality_units[line.don_vi][1] += line.so_luong_giao
        # Read old actual receipt totals as legacy evidence, never create fake receipts or quality samples.
        legacy_orders = db.scalars(select(DonMuaNguyenLieu).where(
            DonMuaNguyenLieu.ma_ncc == supplier_code, DonMuaNguyenLieu.trang_thai == "DA_NHAN_HANG",
            DonMuaNguyenLieu.ngay_giao_thuc_te.is_not(None)))
        for order in legacy_orders:
            key = ("THUC_TE", order.ma_don_mua)
            if key in groups:
                continue
            lines = list(db.scalars(select(ChiTietDonMua).where(ChiTietDonMua.ma_don_mua == order.ma_don_mua)))
            if not lines or any(line.so_luong_mua <= 0 or not 0 <= line.so_luong_thuc_nhan <= line.so_luong_mua for line in lines):
                continue
            groups[key] = {"ma_don": order.ma_don_mua, "nguon": "DON_CU", "ngay_dat": order.ngay_dat_hang,
                "ngay_du_kien": order.ngay_du_kien_giao, "ngay_cuoi": order.ngay_giao_thuc_te,
                "hoan_tat": True, "phieu": set(), "lines": {line.ma_nguyen_lieu: {"dat": line.so_luong_mua,
                    "nhap": line.so_luong_thuc_nhan, "giao": None, "don_vi": None} for line in lines}}
        closed = [group for group in groups.values() if group["hoan_tat"]]
        def has_delivery(group):
            return any((line["giao"] if line["giao"] is not None else line["nhap"]) > 0 for line in group["lines"].values())
        on_time = sum(has_delivery(group) and group["ngay_cuoi"] <= group["ngay_du_kien"] for group in closed)
        full_ratios = []
        evidence = []
        for group in groups.values():
            # Average line fill ratios, then average orders: never add unlike units or count an order per receipt.
            fill = sum((min(ONE, line["nhap"] / line["dat"]) for line in group["lines"].values()), ZERO) / len(group["lines"])
            full_ratios.append(fill)
            evidence.append({"ma_don": group["ma_don"], "nguon": group["nguon"], "hoan_tat": group["hoan_tat"],
                "ngay_dat_hang": group["ngay_dat"], "ngay_du_kien_giao": group["ngay_du_kien"], "ngay_nhan_cuoi": group["ngay_cuoi"],
                "dung_han": has_delivery(group) and group["ngay_cuoi"] <= group["ngay_du_kien"] if group["hoan_tat"] else None,
                "ty_le_du": percent(fill), "so_dot": len(group["phieu"]), "chi_tiet": [{"ma_nguyen_lieu": code,
                    "so_luong_dat": line["dat"], "so_luong_nhap": line["nhap"], "so_luong_giao": line["giao"], "don_vi": line["don_vi"]}
                    for code, line in group["lines"].items()]})
        quality_ratios = [good / delivered for good, delivered in quality_units.values() if delivered > 0]
        quality = sum(quality_ratios, ZERO) / len(quality_ratios) if quality_ratios else None
        delivered_closed = [group for group in closed if has_delivery(group)]
        lead = sum((Decimal((group["ngay_cuoi"] - group["ngay_dat"]).days) for group in delivered_closed), ZERO) / len(delivered_closed) if delivered_closed else None
        return {"on_time_ratio": Decimal(on_time) / len(closed) if closed else None,
                "full_ratio": sum(full_ratios, ZERO) / len(full_ratios) if full_ratios else None,
                "quality_ratio": quality, "lead_time": lead, "so_don": len(groups), "so_don_da_nhan": len(closed),
                "so_don_dang_giao": len(groups) - len(closed), "so_phieu": len({header.ma_phieu_nhan for header, _ in rows}),
                "ty_le_giao_dung_han_thuc_te": percent(Decimal(on_time) / len(closed)) if closed else None,
                "ty_le_giao_du_thuc_te": percent(sum(full_ratios, ZERO) / len(full_ratios)) if full_ratios else None,
                "ty_le_chat_luong_dat_thuc_te": percent(quality),
                "thoi_gian_giao_tb_ngay": lead.quantize(Decimal("0.01")) if lead is not None else None,
                "chat_luong_theo_don_vi": [{"don_vi": unit, "so_luong_dat": values[0], "so_luong_giao": values[1],
                    "ty_le_dat": percent(values[0] / values[1]) if values[1] else None} for unit, values in quality_units.items()],
                "don_mua": evidence}
