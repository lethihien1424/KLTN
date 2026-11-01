"""Presentation of evidence emitted by DeliveryKpiService, without a second KPI engine."""
from decimal import Decimal


def fmt(value):
    if value is None:
        return "Chưa có dữ liệu"
    return format(Decimal(value).quantize(Decimal("0.000001")), "f").rstrip("0").rstrip(".").replace(".", ",") or "0"


def pct(value):
    return fmt(value * 100) if value is not None else "Chưa có dữ liệu"


def mean_formula(values, result, suffix="%"):
    return ("(" + " + ".join(fmt(value) for value in values) + f") / {len(values)} = {fmt(result)}{suffix}"
            if values else "Chưa có dữ liệu; không tham gia tính điểm.")


def explain(key, metrics, mapping, value):
    rows = []
    inspection_summary = None
    orders = metrics["don_mua"]
    receipts = {row["ma_phieu_nhan"]: {"ma_phieu_nhan": row["ma_phieu_nhan"], "ma_phieu_nhap": row["ma_phieu_nhap"]}
                for row in metrics["chat_luong_chung_tu"]}

    def order_row(order, content):
        return {"tieu_de": order["ma_don"], "ma_don": order["ma_don"], "nguon": order["nguon"],
                "phieu": [receipts[code] for code in order["phieu"]], "noi_dung": content}

    if key == "quality_ratio":
        for line in metrics["chat_luong_chung_tu"]:
            rows.append({"tieu_de": f'{line["ma_phieu_nhap"]} · {line["ma_nguyen_lieu"]}',
                "ma_don": line["ma_don"], "nguon": line["nguon"], "phieu": [receipts[line["ma_phieu_nhan"]]],
                "noi_dung": [f'Số lượng giao: {fmt(line["so_luong_giao"])} {line["don_vi"]}.',
                    f'Số lượng đạt: {fmt(line["so_luong_dat"])} {line["don_vi"]}; không đạt: {fmt(line["so_luong_khong_dat"])} {line["don_vi"]}.',
                    f'Tỷ lệ của riêng chứng từ (dòng nguyên liệu) = {fmt(line["so_luong_dat"])} / {fmt(line["so_luong_giao"])} × 100 = {pct(line["ty_le"])}%.'
                    if line["ty_le"] is not None else 'Không có kiểm định hoặc lượng giao bằng 0: không có tỷ lệ riêng cho dòng này.']})
        units = metrics["chat_luong_theo_don_vi"]
        unit_totals = []
        for unit in units:
            inspected = [line for line in metrics["chat_luong_chung_tu"]
                         if line["don_vi"] == unit["don_vi"] and line["so_luong_dat"] is not None]
            ratio = unit["so_luong_dat"] / unit["so_luong_giao"] if unit["so_luong_giao"] > 0 else None
            unit_totals.append({"don_vi": unit["don_vi"], "so_luong_giao": unit["so_luong_giao"],
                "so_luong_dat": unit["so_luong_dat"],
                "so_luong_khong_dat": sum((line["so_luong_khong_dat"] for line in inspected), Decimal(0)),
                "so_dong_hop_le": sum(line["so_luong_giao"] > 0 for line in inspected),
                "phep_tinh": (f'{fmt(unit["so_luong_dat"])} / {fmt(unit["so_luong_giao"])} × 100 = {pct(ratio)}%'
                    if ratio is not None else "Chưa có dữ liệu: tổng lượng giao bằng 0; đơn vị này không tham gia KPI."),
                "chuoi_du_lieu": (f'{fmt(unit["so_luong_giao"])} {unit["don_vi"]} giao → '
                    f'{fmt(unit["so_luong_dat"])} {unit["don_vi"]} đạt → {pct(ratio)}% chất lượng' if ratio is not None else None)})
        inspection_summary = {"theo_don_vi": unit_totals,
            "so_dong_hop_le": sum(unit["so_dong_hop_le"] for unit in unit_totals),
            "so_dong_chua_kiem_dinh": sum(line["so_luong_dat"] is None for line in metrics["chat_luong_chung_tu"])}
        for unit in units:
            rows.append({"tieu_de": f'Tổng hợp đơn vị {unit["don_vi"]}', "noi_dung": [
                f'Σ đạt / Σ giao của các dòng có kiểm định = {fmt(unit["so_luong_dat"])} / {fmt(unit["so_luong_giao"])} × 100 = '
                + (pct(unit["so_luong_dat"] / unit["so_luong_giao"]) + "%" if unit["so_luong_giao"] > 0 else "Chưa có dữ liệu")], "phieu": []})
        summary = "KPI chất lượng = trung bình tỷ lệ theo đơn vị đo: " + mean_formula(
            [unit["so_luong_dat"] / unit["so_luong_giao"] * 100 for unit in units if unit["so_luong_giao"] > 0],
            value * 100 if value is not None else None)
        note = "Không cộng các đơn vị khác nhau. Backend cộng cả dòng giao 0 có kiểm định vào nhóm đơn vị; nhóm có tổng giao 0 không tham gia KPI."
    elif key == "on_time_ratio":
        for order in orders:
            result = ("Đúng hạn" if order["dung_han"] else "Trễ hạn" if order["co_giao_hang"] else "Không có hàng giao: không đạt đúng hạn") if order["hoan_tat"] else "Còn giao tiếp: không tham gia KPI đúng hạn"
            rows.append(order_row(order, [f'Dự kiến giao: {order["ngay_du_kien_giao"]}; giao cuối: {order["ngay_nhan_cuoi"]}.', result]))
        closed = [order for order in orders if order["hoan_tat"]]
        summary = (f'KPI đúng hạn = {sum(bool(order["dung_han"]) for order in closed)} đơn đúng hạn / {len(closed)} đơn đã chốt × 100 = {pct(value)}%.'
                   if closed else "Chưa có dữ liệu; không tham gia tính điểm.")
        note = "Mỗi đơn chỉ là một mẫu dù nhận nhiều đợt. Mẫu số gồm tất cả đơn đã chốt; tử số yêu cầu có giao hàng và ngày giao cuối không sau ngày dự kiến."
    elif key == "full_ratio":
        for order in orders:
            content = [f'{line["ma_nguyen_lieu"]} ({line["don_vi"] or "đơn vị không lưu ở đơn cũ"}): đặt {fmt(line["so_luong_dat"])}; chấp nhận nhập kho {fmt(line["so_luong_nhap"])}. '
                       f'min(1, {fmt(line["so_luong_nhap"])} / {fmt(line["so_luong_dat"])}) × 100 = {pct(line["ty_le_du"])}%.' for line in order["chi_tiet"]]
            for line in metrics["chat_luong_chung_tu"]:
                if line["ma_phieu_nhan"] in order["phieu"]:
                    content.append(f'{line["ma_phieu_nhap"]} · {line["ma_nguyen_lieu"]}: lượng đặt lưu trên phiếu {fmt(line["so_luong_dat_hang"])} {line["don_vi"]}; '
                        f'chấp nhận nhập kho đợt này {fmt(line["so_luong_nhap"])} {line["don_vi"]}.')
            content.append("Tỷ lệ theo đơn = " + mean_formula([line["ty_le_du"] * 100 for line in order["chi_tiet"]], order["ty_le_du_chinh_xac"] * 100))
            rows.append(order_row(order, content))
        summary = "KPI giao đủ = trung bình các đơn: " + mean_formula([order["ty_le_du_chinh_xac"] * 100 for order in orders], value * 100 if value is not None else None)
        note = "Cộng lượng nhập qua các đợt theo nguyên liệu, giữ lượng đặt từ dòng đầu của nhóm đơn như backend hiện tại. Trung bình các nguyên liệu trong đơn rồi trung bình các đơn, gồm cả đơn còn giao tiếp."
    else:
        eligible = [order for order in orders if order["hoan_tat"] and order["co_giao_hang"]]
        for order in orders:
            rows.append(order_row(order, [f'Ngày đặt: {order["ngay_dat_hang"]}; nhận cuối: {order["ngay_nhan_cuoi"]}.',
                f'Thời gian thực tế = ngày nhận cuối − ngày đặt = {order["thoi_gian_thuc_te_ngay"]} ngày.',
                "Tham gia thời gian giao trung bình." if order in eligible else "Không tham gia: đơn chưa chốt hoặc chưa giao hàng."]))
        actual = metrics["lead_time"]
        summary = "Thời gian thực tế trung bình = " + mean_formula([Decimal(order["thoi_gian_thuc_te_ngay"]) for order in eligible], actual, " ngày")
        summary += f' Thời gian khai báo của mapping {mapping.ma_nguyen_lieu_ncc} = {mapping.lead_time_ngay} ngày. '
        summary += (f'KPI = min(1, {mapping.lead_time_ngay} / {fmt(actual)}) × 100 = {pct(value)}%.' if actual is not None and actual > 0 else
                    "Thực tế bằng 0 ngày: KPI = 100%." if actual == 0 else "Chưa có dữ liệu; không tham gia tính điểm.")
        note = "So sánh lead time khai báo với trung bình ngày giao thực tế; không lấy trung bình điểm thời gian của từng đơn."
    short = {
        "quality_ratio": "KPI chất lượng = trung bình (Σ đạt / Σ giao) theo đơn vị đo × 100",
        "on_time_ratio": "KPI đúng hạn = số đơn đúng hạn / số đơn đã chốt × 100",
        "full_ratio": "KPI giao đủ = trung bình theo đơn của trung bình min(1, nhập kho / đặt) từng nguyên liệu × 100",
        "lead_time": "KPI thời gian giao = min(1, ngày khai báo / ngày thực tế trung bình) × 100",
    }[key]
    short += f' = {pct(value)}%.' if value is not None else ": Chưa có dữ liệu; không tham gia tính điểm."
    result = {"cong_thuc_ngan": short, "tom_tat": summary, "ghi_chu": note, "dong": rows}
    if inspection_summary is not None:
        result["tong_hop_kiem_dinh"] = inspection_summary
    return result
