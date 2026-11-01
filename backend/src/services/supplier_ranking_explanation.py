"""Ranking inputs and their presentation; shared with the suggestion sort."""
from decimal import Decimal

from src.services.supplier_score_explanation import fmt
from src.services.supply_confirmation_service import ENOUGH, UNKNOWN, INSUFFICIENT

PRICE_WEIGHT = Decimal("0.30")
PERFORMANCE_WEIGHT = Decimal("0.70")
STATUS_ORDER = {ENOUGH: 0, UNKNOWN: 1, INSUFFICIENT: 2}
STATUS_NAMES = {ENOUGH: "Đã xác nhận đủ", UNKNOWN: "Chưa xác nhận", INSUFFICIENT: "Đã xác nhận không đủ"}


def ranking_parts(min_price, price, score, coverage):
    price_score = min_price / price * 100 if price > 0 else Decimal("0")
    price_part = price_score * PRICE_WEIGHT
    performance_part = (score or Decimal("0")) * coverage * PERFORMANCE_WEIGHT
    return price_score, price_part, performance_part, price_part + performance_part


def ranking_policy():
    return {
        "trong_so_gia": PRICE_WEIGHT * 100, "trong_so_kpi": PERFORMANCE_WEIGHT * 100,
        "nhom_cung_ung": [STATUS_NAMES[key] for key in STATUS_ORDER],
        "cong_thuc": f'Điểm ưu tiên = Điểm giá × {fmt(PRICE_WEIGHT * 100)}% + Điểm NCC × Độ đầy đủ KPI × {fmt(PERFORMANCE_WEIGHT * 100)}%.',
        "cong_thuc_gia": "Điểm giá = giá dương thấp nhất trong các NCC đang chào nguyên liệu / giá NCC × 100; giá không dương nhận điểm giá 0 theo quy tắc hiện tại.",
        "sap_xep": "Ưu tiên nhóm xác nhận cung ứng trước, sau đó điểm ưu tiên giảm dần; nếu bằng điểm: giá tăng dần, thời gian giao tăng dần, mã NCC tăng dần.",
        "thieu_kpi": "Thiếu Điểm NCC vẫn hiển thị Chưa có KPI; phần KPI không đóng góp điểm xếp hạng. Không dùng tồn kho khai báo làm bằng chứng cung ứng.",
        "lam_tron": "Điểm NCC dùng giá trị đã làm tròn của bộ tính điểm. Điểm ưu tiên được làm tròn 0,01 trước khi sắp xếp. Phép tính chi tiết hiển thị tối đa 6 chữ số thập phân.",
    }


def comparison_reason(higher, lower):
    prefix = f'{higher["ma_ncc"]} (giá {fmt(higher["don_gia"])}) xếp trên {lower["ma_ncc"]} (giá {fmt(lower["don_gia"])}): '
    h_group = STATUS_ORDER.get(higher["trang_thai_cung_ung"], 2)
    l_group = STATUS_ORDER.get(lower["trang_thai_cung_ung"], 2)
    if h_group != l_group:
        return prefix + f'nhóm “{STATUS_NAMES[higher["trang_thai_cung_ung"]]}” được ưu tiên trước nhóm “{STATUS_NAMES[lower["trang_thai_cung_ung"]]}”, trước khi so điểm hoặc giá.'
    if higher["diem_xep_hang"] != lower["diem_xep_hang"]:
        return prefix + f'cùng nhóm cung ứng; tổng điểm ưu tiên {fmt(higher["diem_xep_hang"])} > {fmt(lower["diem_xep_hang"])}. ' + (
            "Giá cao hơn được bù bởi phần KPI thực tế sau khi xét độ đầy đủ dữ liệu." if higher["don_gia"] > lower["don_gia"] > 0 else "So sánh điểm thành phần giá và KPI trong bảng bên dưới.")
    if higher["don_gia"] != lower["don_gia"]:
        return prefix + "cùng nhóm và bằng điểm ưu tiên đã làm tròn; giá thấp hơn thắng tiêu chí phụ."
    if higher["lead_time_ngay"] != lower["lead_time_ngay"]:
        return prefix + f'bằng nhóm, điểm và giá; thời gian giao {higher["lead_time_ngay"]} < {lower["lead_time_ngay"]} ngày.'
    return prefix + "bằng nhóm, điểm, giá và thời gian giao; mã NCC được sắp tăng dần."


def explain_ranking(mapping, material, quantity, forecast, status, confirmation, allocated, now,
                    min_price, score, coverage, price_score, price_part, performance_part, total):
    valid = confirmation is not None and confirmation.ngay_xac_nhan <= now < confirmation.hieu_luc_den
    remaining = confirmation.so_luong_xac_nhan - allocated if confirmation else None
    capacity_formula = (f'{fmt(confirmation.so_luong_xac_nhan)} kg xác nhận − {fmt(allocated)} kg đã phân bổ = {fmt(remaining)} kg; '
                        f'so với {fmt(quantity)} kg cần mua → {STATUS_NAMES[status]}.' if valid else
                        "Chưa có xác nhận mới nhất còn hiệu lực trong phạm vi này; chưa phải cam kết giao hàng.")
    return {
        "diem_gia": price_score, "dong_gop_gia": price_part, "dong_gop_kpi": performance_part,
        "nhom_uu_tien": STATUS_ORDER.get(status, 2), "nhan_nhom": STATUS_NAMES[status],
        "phep_tinh_gia": f'{fmt(min_price)} / {fmt(mapping.don_gia_nguyen_lieu)} × 100 = {fmt(price_score)} điểm giá' if mapping.don_gia_nguyen_lieu > 0 else "Giá không dương: điểm giá = 0.",
        "phep_tinh_dong_gop_gia": f'{fmt(price_score)} × {fmt(PRICE_WEIGHT * 100)}% = {fmt(price_part)} điểm',
        "phep_tinh_dong_gop_kpi": (f'{fmt(score)} × {fmt(coverage * 100)}% × {fmt(PERFORMANCE_WEIGHT * 100)}% = {fmt(performance_part)} điểm' if score is not None else "Chưa có KPI: phần KPI không đóng góp điểm ưu tiên; Điểm NCC vẫn chưa có dữ liệu."),
        "phep_tinh_tong": f'{fmt(price_part)} + {fmt(performance_part)} = {fmt(total)} → làm tròn {fmt(total.quantize(Decimal("0.01")))} điểm ưu tiên',
        "gia": {"ma_nguyen_lieu_ncc": mapping.ma_nguyen_lieu_ncc, "ma_nguyen_lieu": material.ma_nguyen_lieu,
            "don_gia": mapping.don_gia_nguyen_lieu, "gia_thap_nhat": min_price, "don_vi_tien": "VND",
            "don_vi_nguyen_lieu": material.don_vi_do_luong, "don_vi_gia": None, "cap_nhat_luc": None,
            "ghi_chu": "Giá tham khảo từ cấu hình nguyên liệu cung ứng, không phải giá mua thực tế trên đơn/phiếu nhận. Cấu hình hiện không lưu riêng đơn vị giá và thời điểm cập nhật; không suy đoán các trường này từ thời điểm xem."},
        "thoi_gian_giao": {"ma_nguyen_lieu_ncc": mapping.ma_nguyen_lieu_ncc, "lead_time_ngay": mapping.lead_time_ngay,
            "ghi_chu": "Thời gian dự kiến lấy từ cấu hình mapping; không phải số ngày giao thực tế."},
        "cung_ung": {"ma_lich_su_du_bao": forecast, "so_luong_yeu_cau": quantity,
            "so_luong_da_phan_bo": allocated, "so_luong_con_lai": remaining,
            "xac_nhan_con_hieu_luc": valid, "phep_tinh": capacity_formula,
            "ghi_chu": "Dùng bản xác nhận mới nhất trong đúng mapping và lần dự báo; nếu bản mới nhất hết hạn thì chưa xác nhận. Không dùng tồn Milano hoặc tồn NCC khai báo. Xác nhận đủ chỉ quyết định nhóm ưu tiên, không cộng thêm điểm."},
    }
