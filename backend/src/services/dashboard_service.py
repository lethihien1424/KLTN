# ###D:\KLTN\KLTN\backend\src\services\dashboard_service.py
# import calendar
# from datetime import date, timedelta
# from decimal import Decimal

# from src.repositories.dashboard_repository import DashboardRepository


# class DashboardService:
#     PROPOSAL_STATUSES = ("CHO_DUYET", "DA_DUYET", "TU_CHOI")
#     ORDER_STATUSES = ("CHUA_DUYET", "DA_DUYET", "TU_CHOI", "DA_NHAN_HANG")

#     def __init__(self):
#         self.repository = DashboardRepository()

#     @staticmethod
#     def _resolve_period_dates(
#         period_type: str,
#         year: int | None = None,
#         month: int | None = None,
#         week: int | None = None,
#     ) -> tuple[date, date, str]:
#         today = date.today()
#         target_year = year or today.year

#         if period_type == "nam":
#             start_date = date(target_year, 1, 1)
#             end_date = date(target_year, 12, 31)
#             period_label = f"Năm {target_year}"
#         elif period_type == "thang":
#             target_month = month or today.month
#             _, last_day = calendar.monthrange(target_year, target_month)
#             start_date = date(target_year, target_month, 1)
#             end_date = date(target_year, target_month, last_day)
#             period_label = f"Tháng {target_month:02d}/{target_year}"
#         elif period_type == "tuan":
#             target_week = week or today.isocalendar()[1]
#             # ISO calendar: Monday is 1, Sunday is 7
#             try:
#                 start_date = date.fromisocalendar(target_year, target_week, 1)
#                 end_date = date.fromisocalendar(target_year, target_week, 7)
#             except ValueError:
#                 start_date = date(target_year, 1, 1)
#                 end_date = start_date + timedelta(days=6)
#             period_label = f"Tuần {target_week:02d} ({start_date.strftime('%d/%m')} - {end_date.strftime('%d/%m/%Y')})"
#         else:
#             # Mặc định tháng hiện tại
#             start_date = date(target_year, today.month, 1)
#             _, last_day = calendar.monthrange(target_year, today.month)
#             end_date = date(target_year, today.month, last_day)
#             period_label = f"Tháng {today.month:02d}/{target_year}"

#         return start_date, end_date, period_label

#     def inventory_alerts(self, db):
#         results = []
#         for stock, material in self.repository.low_stock(db):
#             avail = stock.ton_kho_kha_dung
#             safety = stock.ton_kho_an_toan
#             shortage = max(Decimal("0"), safety - avail)

#             level = "CANH_BAO"
#             if avail <= Decimal("0"):
#                 level = "KHAN_CAP"

#             results.append({
#                 "ma_nguyen_lieu": stock.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": material.ten_nguyen_lieu,
#                 "don_vi_do_luong": material.don_vi_do_luong,
#                 "ngay_ghi_nhan": stock.ngay_ghi_nhan,
#                 "ton_kho_thuc_te": stock.ton_kho_thuc_te,
#                 "so_luong_book": stock.so_luong_book,
#                 "ton_kho_kha_dung": stock.ton_kho_kha_dung,
#                 "ton_kho_an_toan": stock.ton_kho_an_toan,
#                 "so_luong_thieu_an_toan": shortage,
#                 "muc_do_canh_bao": level,
#             })
#         return results

#     def inventory_alerts_detailed(self, db):
#         all_stocks = self.repository.all_inventory_status(db)
#         alert_items = []
#         khan_cap = 0
#         canh_bao = 0
#         an_toan = 0

#         for stock, material in all_stocks:
#             avail = stock.ton_kho_kha_dung
#             safety = stock.ton_kho_an_toan
#             shortage = max(Decimal("0"), safety - avail)

#             if avail <= Decimal("0"):
#                 level = "KHAN_CAP"
#                 khan_cap += 1
#             elif avail < safety:
#                 level = "CANH_BAO"
#                 canh_bao += 1
#             else:
#                 level = "AN_TOAN"
#                 an_toan += 1

#             # Chỉ đưa vào items danh sách cảnh báo hoặc toàn bộ
#             if level in ("KHAN_CAP", "CANH_BAO"):
#                 alert_items.append({
#                     "ma_nguyen_lieu": stock.ma_nguyen_lieu,
#                     "ten_nguyen_lieu": material.ten_nguyen_lieu,
#                     "don_vi_do_luong": material.don_vi_do_luong,
#                     "ngay_ghi_nhan": stock.ngay_ghi_nhan,
#                     "ton_kho_thuc_te": stock.ton_kho_thuc_te,
#                     "so_luong_book": stock.so_luong_book,
#                     "ton_kho_kha_dung": stock.ton_kho_kha_dung,
#                     "ton_kho_an_toan": stock.ton_kho_an_toan,
#                     "so_luong_thieu_an_toan": shortage,
#                     "muc_do_canh_bao": level,
#                 })

#         total = khan_cap + canh_bao + an_toan
#         ty_le_an_toan = round((an_toan / total * 100), 1) if total > 0 else 100.0

#         return {
#             "tong_so_nguyen_lieu": total,
#             "duoi_ton_an_toan": khan_cap + canh_bao,
#             "khan_cap": khan_cap,
#             "canh_bao": canh_bao,
#             "an_toan": an_toan,
#             "ty_le_an_toan": ty_le_an_toan,
#             "items": alert_items,
#         }

#     def overview(self, db):
#         proposals = {status: 0 for status in self.PROPOSAL_STATUSES}
#         proposals.update(self.repository.proposal_counts(db))
#         orders = {status: 0 for status in self.ORDER_STATUSES}
#         orders.update(self.repository.order_counts(db))
#         values = self.repository.purchase_values(db)
#         supplier_count, with_performance = self.repository.active_supplier_counts(db)
#         return {
#             "nguyen_lieu": {
#                 "tong_so": self.repository.active_material_count(db),
#                 "duoi_ton_an_toan": len(self.repository.low_stock(db)),
#             },
#             "de_xuat_nhap_hang": proposals,
#             "don_mua": orders,
#             "mua_hang": {
#                 "gia_tri_da_duyet": values.get("DA_DUYET") or Decimal("0.00"),
#                 "gia_tri_da_nhan_hang": values.get("DA_NHAN_HANG") or Decimal("0.00"),
#             },
#             "nha_cung_cap": {
#                 "tong_so": supplier_count,
#                 "co_du_lieu_hieu_suat_thuc_te": with_performance,
#             },
#         }

#     def supplier_performance(self, db):
#         results = []
#         for supplier in self.repository.active_supplier_performance(db):
#             score = supplier.diem_dieu_kien_thuong_mai
#             rank = "TRUNG_BINH"
#             if score is not None:
#                 if score >= Decimal("80"):
#                     rank = "XUAT_SAC"
#                 elif score >= Decimal("65"):
#                     rank = "TOT"
#                 elif score < Decimal("50"):
#                     rank = "YEU"

#             results.append({
#                 "ma_ncc": supplier.ma_ncc,
#                 "ten_ncc": supplier.ten_ncc,
#                 "diem_ncc": score,
#                 "ty_le_giao_dung_han_thuc_te": supplier.ty_le_giao_dung_han_thuc_te,
#                 "ty_le_giao_du_thuc_te": supplier.ty_le_giao_du_thuc_te,
#                 "xep_loai": rank,
#             })
#         return results

#     # ==================== 1. NGUYÊN LIỆU SỬ DỤNG ====================
#     def material_usage(
#         self,
#         db,
#         period_type: str = "thang",
#         year: int | None = None,
#         month: int | None = None,
#         week: int | None = None,
#     ):
#         start_date, end_date, period_label = self._resolve_period_dates(
#             period_type, year, month, week
#         )
#         raw_materials = self.repository.get_material_usage_by_period(db, start_date, end_date)

#         total_qty = sum(float(item["so_luong"]) for item in raw_materials)
#         items = []
#         for item in raw_materials:
#             qty = float(item["so_luong"])
#             pct = round((qty / total_qty * 100), 2) if total_qty > 0 else 0.0
#             items.append({
#                 "ma_nguyen_lieu": item["ma_nguyen_lieu"],
#                 "ten_nguyen_lieu": item["ten_nguyen_lieu"],
#                 "don_vi_do_luong": item["don_vi_do_luong"],
#                 "so_luong_su_dung": round(qty, 2),
#                 "ty_le_phan_tram": pct,
#             })

#         # Sắp xếp
#         sorted_desc = sorted(items, key=lambda x: x["so_luong_su_dung"], reverse=True)
#         sorted_asc = sorted(items, key=lambda x: x["so_luong_su_dung"])

#         top_used = sorted_desc[:10]
#         least_used = sorted_asc[:10]

#         most_used_item = sorted_desc[0] if sorted_desc and sorted_desc[0]["so_luong_su_dung"] > 0 else None
#         least_used_item = sorted_asc[0] if sorted_asc else None

#         return {
#             "period_type": period_type,
#             "period_label": period_label,
#             "start_date": start_date,
#             "end_date": end_date,
#             "top_used": top_used,
#             "least_used": least_used,
#             "all_materials": sorted_desc,
#             "summary": {
#                 "tong_luong_su_dung": round(total_qty, 2),
#                 "so_loai_nguyen_lieu": len(items),
#                 "nguyen_lieu_dung_nhieu_nhat": most_used_item,
#                 "nguyen_lieu_dung_it_nhat": least_used_item,
#             },
#         }

#     # ==================== 2. SẢN PHẨM TIÊU THỤ ====================
#     def product_consumption(
#         self,
#         db,
#         period_type: str = "thang",
#         year: int | None = None,
#         month: int | None = None,
#         week: int | None = None,
#     ):
#         start_date, end_date, period_label = self._resolve_period_dates(
#             period_type, year, month, week
#         )
#         raw_products = self.repository.get_product_consumption_by_period(db, start_date, end_date)

#         total_qty = sum(int(r.so_luong or 0) for r in raw_products)
#         total_revenue = sum(float(r.doanh_thu or 0) for r in raw_products)
#         total_orders = sum(int(r.so_don or 0) for r in raw_products)

#         items = []
#         for r in raw_products:
#             qty = int(r.so_luong or 0)
#             rev = float(r.doanh_thu or 0)
#             pct = round((qty / total_qty * 100), 2) if total_qty > 0 else 0.0
#             items.append({
#                 "ma_san_pham": r.ma_san_pham,
#                 "ten_san_pham": r.ten_san_pham,
#                 "don_vi_tinh": r.don_vi_tinh,
#                 "so_luong_ban": qty,
#                 "doanh_thu": round(rev, 2),
#                 "so_don_hang": int(r.so_don or 0),
#                 "ty_le_phan_tram": pct,
#             })

#         sorted_desc = sorted(items, key=lambda x: x["so_luong_ban"], reverse=True)
#         sorted_asc = sorted(items, key=lambda x: x["so_luong_ban"])

#         top_products = sorted_desc[:10]
#         least_products = sorted_asc[:10]

#         best_seller = sorted_desc[0] if sorted_desc and sorted_desc[0]["so_luong_ban"] > 0 else None
#         worst_seller = sorted_asc[0] if sorted_asc else None

#         return {
#             "period_type": period_type,
#             "period_label": period_label,
#             "start_date": start_date,
#             "end_date": end_date,
#             "top_products": top_products,
#             "least_products": least_products,
#             "all_products": sorted_desc,
#             "summary": {
#                 "tong_so_luong": total_qty,
#                 "tong_doanh_thu": round(total_revenue, 2),
#                 "tong_don_hang": total_orders,
#                 "so_loai_san_pham": len(items),
#                 "san_pham_ban_chay_nhat": best_seller,
#                 "san_pham_ban_it_nhat": worst_seller,
#             },
#         }

#     # ==================== 3. SO SÁNH PROPHET ====================
#     def prophet_comparison(
#         self,
#         db,
#         from_date: date | None = None,
#         to_date: date | None = None,
#         ma_san_pham: str | None = None,
#     ):
#         today = date.today()
#         # Mặc định so sánh 8 tuần gần đây hoặc 60 ngày
#         start = from_date or (today - timedelta(days=60))
#         end = to_date or today

#         periods, products = self.repository.get_prophet_comparison(db, start, end, ma_san_pham)

#         total_actual = sum(p["thuc_te"] for p in periods)
#         total_prophet = sum(p["du_bao_prophet"] for p in periods)
#         total_diff = total_actual - total_prophet
#         total_pct = round((total_diff / total_actual * 100), 2) if total_actual > 0 else 0.0

#         n = len(periods)
#         if n > 0:
#             mae = sum(abs(p["chenh_lech"]) for p in periods) / n
#             mape = (
#                 sum(abs(p["chenh_lech"]) / max(p["thuc_te"], 1) for p in periods) / n
#             ) * 100
#         else:
#             mae = 0.0
#             mape = 0.0

#         return {
#             "tu_ngay": start,
#             "den_ngay": end,
#             "ma_san_pham": ma_san_pham,
#             "periods": periods,
#             "products": products,
#             "summary": {
#                 "tong_thuc_te": total_actual,
#                 "tong_prophet": total_prophet,
#                 "tong_chenh_lech": total_diff,
#                 "phan_tram_lech_tong": total_pct,
#                 "mae": round(mae, 2),
#                 "mape": round(mape, 2),
#             },
#         }

#     # ==================== 5. TRẠNG THÁI TÀI KHOẢN ====================
#     def account_statistics(self, db):
#         return self.repository.get_account_statistics(db)

#     # ==================== ĐƠN HÀNG (DỮ LIỆU ĐƠN HÀNG) ====================
#     def order_stats(
#         self,
#         db,
#         period_type: str = "thang",
#         year: int | None = None,
#         month: int | None = None,
#         week: int | None = None,
#     ):
#         start_date, end_date, period_label = self._resolve_period_dates(
#             period_type, year, month, week
#         )
#         res = self.repository.get_order_stats_by_period(db, start_date, end_date)
#         return {
#             "period_type": period_type,
#             "period_label": period_label,
#             "start_date": start_date,
#             "end_date": end_date,
#             **res,
#         }

#     # ==================== CÔNG THỨC / BOM ====================
#     def formula_bom_stats(self, db):
#         return self.repository.get_formula_bom_stats(db)

#     # ==================== TỒN KHO & LƯỢNG ĐÃ BOOK ====================
#     def inventory_stock_stats(self, db):
#         return self.repository.get_inventory_stock_stats(db)

#     # ==================== NGUYÊN LIỆU CUNG ỨNG ====================
#     def supplier_materials_stats(self, db):
#         return self.repository.get_supplier_materials_stats(db)

#     # ==================== GỢI Ý NHÀ CUNG CẤP ====================
#     def supplier_suggestion_stats(self, db):
#         return self.repository.get_supplier_suggestion_stats(db)

#     # ==================== NHU CẦU NGUYÊN LIỆU ====================
#     def material_demand_stats(self, db):
#         return self.repository.get_material_demand_stats(db)

#     # ==================== ĐƠN MUA NGUYÊN LIỆU ====================
#     def purchase_order_stats(self, db):
#         return self.repository.get_purchase_order_stats(db)

#     # ==================== CẤU HÌNH & NHẬT KÝ ====================
#     def config_audit_stats(self, db):
#         return self.repository.get_config_audit_stats(db)


import calendar
from datetime import date, timedelta
from decimal import Decimal

from fastapi import HTTPException

from src.repositories.dashboard_repository import (
    DashboardRepository,
)


class DashboardService:
    PROPOSAL_STATUSES = (
        "CHO_DUYET",
        "DA_DUYET",
        "TU_CHOI",
    )

    ORDER_STATUSES = (
        "CHUA_DUYET",
        "DA_DUYET",
        "TU_CHOI",
        "DA_NHAN_HANG",
    )

    def __init__(self):
        self.repository = DashboardRepository()

    @staticmethod
    def _resolve_period_dates(
        period_type: str,
        year: int | None = None,
        month: int | None = None,
        week: int | None = None,
    ) -> tuple[date, date, str]:
        today = date.today()

        target_year = year or (
            today.isocalendar().year
            if period_type == "tuan"
            else today.year
        )

        if period_type == "nam":
            start_date = date(target_year, 1, 1)
            end_date = date(target_year, 12, 31)
            period_label = f"Năm {target_year}"

        elif period_type == "thang":
            target_month = month or today.month

            _, last_day = calendar.monthrange(
                target_year,
                target_month,
            )

            start_date = date(
                target_year,
                target_month,
                1,
            )

            end_date = date(
                target_year,
                target_month,
                last_day,
            )

            period_label = (
                f"Tháng {target_month:02d}/{target_year}"
            )

        elif period_type == "tuan":
            target_week = week or today.isocalendar().week

            try:
                start_date = date.fromisocalendar(
                    target_year,
                    target_week,
                    1,
                )

                end_date = date.fromisocalendar(
                    target_year,
                    target_week,
                    7,
                )

            except ValueError as exc:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Năm {target_year} không có "
                        f"tuần ISO {target_week}."
                    ),
                ) from exc

            period_label = (
                f"Tuần {target_week:02d} "
                f"({start_date:%d/%m} - "
                f"{end_date:%d/%m/%Y})"
            )

        else:
            # Giữ tương thích với cách gọi mặc định cũ.
            _, last_day = calendar.monthrange(
                target_year,
                today.month,
            )

            start_date = date(
                target_year,
                today.month,
                1,
            )

            end_date = date(
                target_year,
                today.month,
                last_day,
            )

            period_label = (
                f"Tháng {today.month:02d}/{target_year}"
            )

        return start_date, end_date, period_label

    def inventory_alerts(self, db):
        results = []

        for stock, material in self.repository.low_stock(db):
            avail = stock.ton_kho_kha_dung
            safety = stock.ton_kho_an_toan

            shortage = max(
                Decimal("0"),
                safety - avail,
            )

            level = (
                "KHAN_CAP"
                if avail <= Decimal("0")
                else "CANH_BAO"
            )

            results.append(
                {
                    "ma_nguyen_lieu": stock.ma_nguyen_lieu,
                    "ten_nguyen_lieu": material.ten_nguyen_lieu,
                    "don_vi_do_luong": material.don_vi_do_luong,
                    "ngay_ghi_nhan": stock.ngay_ghi_nhan,
                    "ton_kho_thuc_te": stock.ton_kho_thuc_te,
                    "so_luong_book": stock.so_luong_book,
                    "ton_kho_kha_dung": stock.ton_kho_kha_dung,
                    "ton_kho_an_toan": stock.ton_kho_an_toan,
                    "so_luong_thieu_an_toan": shortage,
                    "muc_do_canh_bao": level,
                }
            )

        return results

    def inventory_alerts_detailed(self, db):
        all_stocks = self.repository.all_inventory_status(db)

        alert_items = []
        khan_cap = 0
        canh_bao = 0
        an_toan = 0

        for stock, material in all_stocks:
            avail = stock.ton_kho_kha_dung
            safety = stock.ton_kho_an_toan

            shortage = max(
                Decimal("0"),
                safety - avail,
            )

            if avail <= Decimal("0"):
                level = "KHAN_CAP"
                khan_cap += 1

            elif avail < safety:
                level = "CANH_BAO"
                canh_bao += 1

            else:
                level = "AN_TOAN"
                an_toan += 1

            if level in ("KHAN_CAP", "CANH_BAO"):
                alert_items.append(
                    {
                        "ma_nguyen_lieu": stock.ma_nguyen_lieu,
                        "ten_nguyen_lieu": material.ten_nguyen_lieu,
                        "don_vi_do_luong": material.don_vi_do_luong,
                        "ngay_ghi_nhan": stock.ngay_ghi_nhan,
                        "ton_kho_thuc_te": stock.ton_kho_thuc_te,
                        "so_luong_book": stock.so_luong_book,
                        "ton_kho_kha_dung": stock.ton_kho_kha_dung,
                        "ton_kho_an_toan": stock.ton_kho_an_toan,
                        "so_luong_thieu_an_toan": shortage,
                        "muc_do_canh_bao": level,
                    }
                )

        total = khan_cap + canh_bao + an_toan

        ty_le_an_toan = (
            round(an_toan / total * 100, 1)
            if total > 0
            else 100.0
        )

        return {
            "tong_so_nguyen_lieu": total,
            "duoi_ton_an_toan": khan_cap + canh_bao,
            "khan_cap": khan_cap,
            "canh_bao": canh_bao,
            "an_toan": an_toan,
            "ty_le_an_toan": ty_le_an_toan,
            "items": alert_items,
        }

    def overview(self, db):
        proposals = {
            state: 0
            for state in self.PROPOSAL_STATUSES
        }

        proposals.update(
            self.repository.proposal_counts(db)
        )

        orders = {
            state: 0
            for state in self.ORDER_STATUSES
        }

        orders.update(
            self.repository.order_counts(db)
        )

        values = self.repository.purchase_values(db)

        supplier_count, with_performance = (
            self.repository.active_supplier_counts(db)
        )

        return {
            "nguyen_lieu": {
                "tong_so": (
                    self.repository.active_material_count(db)
                ),
                "duoi_ton_an_toan": len(
                    self.repository.low_stock(db)
                ),
            },
            "de_xuat_nhap_hang": proposals,
            "don_mua": orders,
            "mua_hang": {
                "gia_tri_da_duyet": (
                    values.get("DA_DUYET")
                    or Decimal("0.00")
                ),
                "gia_tri_da_nhan_hang": (
                    values.get("DA_NHAN_HANG")
                    or Decimal("0.00")
                ),
            },
            "nha_cung_cap": {
                "tong_so": supplier_count,
                "co_du_lieu_hieu_suat_thuc_te": (
                    with_performance
                ),
            },
        }

    def supplier_performance(self, db):
        from src.services.delivery_kpi_service import DeliveryKpiService

        results = []
        for supplier in self.repository.active_supplier_performance(db):
            score = supplier.diem_dieu_kien_thuong_mai
            rank = "TRUNG_BINH"
            if score is not None:
                if score >= Decimal("80"):
                    rank = "XUAT_SAC"
                elif score >= Decimal("65"):
                    rank = "TOT"
                elif score < Decimal("50"):
                    rank = "YEU"
            metrics = DeliveryKpiService.summarize(db, supplier.ma_ncc)
            results.append({
                "ma_ncc": supplier.ma_ncc,
                "ten_ncc": supplier.ten_ncc,
                "diem_ncc": score,
                "xep_loai": rank,
                **{key: value for key, value in metrics.items() if key in (
                    "ty_le_giao_dung_han_thuc_te", "ty_le_giao_du_thuc_te",
                    "ty_le_chat_luong_dat_thuc_te", "thoi_gian_giao_tb_ngay",
                    "so_don", "so_don_dang_giao", "so_phieu",
                )},
            })
        return results

    # ==================== NGUYÊN LIỆU SỬ DỤNG ====================

    def material_usage(self, db, period_type: str = "thang", year: int | None = None, month: int | None = None, week: int | None = None):
        start_date, end_date, period_label = self._resolve_period_dates(period_type, year, month, week)
        raw_materials = self.repository.get_material_usage_by_period(db, start_date, end_date)
        total_qty = sum(float(item["so_luong"]) for item in raw_materials)
        items = []
        for item in raw_materials:
            qty = float(item["so_luong"])
            items.append({"ma_nguyen_lieu": item["ma_nguyen_lieu"], "ten_nguyen_lieu": item["ten_nguyen_lieu"], "don_vi_do_luong": item["don_vi_do_luong"], "so_luong_su_dung": round(qty, 2), "ty_le_phan_tram": round(qty / total_qty * 100, 2) if total_qty else 0.0})
        descending = sorted(items, key=lambda item: item["so_luong_su_dung"], reverse=True)
        ascending = sorted(items, key=lambda item: item["so_luong_su_dung"])
        most_used = descending[0] if descending and descending[0]["so_luong_su_dung"] > 0 else None
        least_used = ascending[0] if ascending else None
        return {"period_type": period_type, "period_label": period_label, "start_date": start_date, "end_date": end_date, "top_used": descending[:10], "least_used": ascending[:10], "all_materials": descending, "summary": {"tong_luong_su_dung": round(total_qty, 2), "so_loai_nguyen_lieu": len(items), "nguyen_lieu_dung_nhieu_nhat": most_used, "nguyen_lieu_dung_it_nhat": least_used}}

    def product_consumption(self, db, period_type: str = "thang", year: int | None = None, month: int | None = None, week: int | None = None, from_date: date | None = None, to_date: date | None = None):
        if from_date and to_date:
            if from_date > to_date:
                raise HTTPException(status_code=422, detail="Invalid date range.")
            start_date, end_date = from_date, to_date
            period_label = f"{from_date:%d/%m/%Y} - {to_date:%d/%m/%Y}"
            period_type = "khoang"
        else:
            start_date, end_date, period_label = self._resolve_period_dates(period_type, year, month, week)
        raw_products = self.repository.get_product_consumption_by_period(db, start_date, end_date)
        total_qty = sum(int(row.so_luong or 0) for row in raw_products)
        total_revenue = sum(float(row.doanh_thu or 0) for row in raw_products)
        total_orders = self.repository.count_sales_orders(db, start_date, end_date)
        items = []
        for row in raw_products:
            qty = int(row.so_luong or 0)
            revenue = float(row.doanh_thu or 0)
            items.append({"ma_san_pham": row.ma_san_pham, "ten_san_pham": row.ten_san_pham, "don_vi_tinh": row.don_vi_tinh, "so_luong_ban": qty, "doanh_thu": round(revenue, 2), "so_don_hang": int(row.so_don or 0), "ty_le_phan_tram": round(qty / total_qty * 100, 2) if total_qty else 0.0})
        sorted_desc = sorted(items, key=lambda item: item["so_luong_ban"], reverse=True)
        sorted_asc = sorted(items, key=lambda item: item["so_luong_ban"])
        best_seller = sorted_desc[0] if sorted_desc and sorted_desc[0]["so_luong_ban"] > 0 else None
        worst_seller = sorted_asc[0] if sorted_asc else None
        order_usage = self.order_usage(
            db, period_type, year, month, week, start_date, end_date
        )
        return {"period_type": period_type, "period_label": period_label, "start_date": start_date, "end_date": end_date, "top_products": sorted_desc[:10], "least_products": sorted_asc[:10], "all_products": sorted_desc, "formulas": order_usage["formulas"], "materials": order_usage["materials"], "summary": {"tong_so_luong": total_qty, "tong_doanh_thu": round(total_revenue, 2), "tong_don_hang": total_orders, "so_loai_san_pham": len(items), "san_pham_ban_chay_nhat": best_seller, "san_pham_ban_it_nhat": worst_seller}}

    def order_usage(self, db, period_type: str, year: int | None, month: int | None, week: int | None, start_date: date | None = None, end_date: date | None = None):
        if start_date is None or end_date is None:
            start_date, end_date, _ = self._resolve_period_dates(
                period_type, year, month, week
            )
        raw_materials = self.repository.get_material_usage_by_period(
            db, start_date, end_date
        )
        materials = [
            {
                "ma_nguyen_lieu": item["ma_nguyen_lieu"],
                "ten_nguyen_lieu": item["ten_nguyen_lieu"],
                "don_vi_do_luong": item["don_vi_do_luong"],
                "so_luong_su_dung": round(float(item["so_luong"]), 2),
                "ty_le_phan_tram": 0.0,
            }
            for item in raw_materials
        ]
        formulas = []
        for row in self.repository.get_order_formula_usage_by_period(
            db, start_date, end_date
        ):
            sold = int(row.so_luong_san_pham_ban or 0)
            yield_factor = float(row.he_so_thu_hoi or 0)
            formulas.append(
                {
                    "ma_cong_thuc": row.ma_cong_thuc,
                    "ten_cong_thuc": row.ten_cong_thuc,
                    "ten_san_pham": row.ten_san_pham,
                    "so_luong_san_pham_ban": sold,
                    "so_luong_cong_thuc_su_dung": round(
                        sold / yield_factor if yield_factor > 0 else 0,
                        2,
                    ),
                }
            )
        formulas.sort(
            key=lambda item: item["so_luong_cong_thuc_su_dung"],
            reverse=True,
        )
        return {"formulas": formulas, "materials": materials}

    def prophet_comparison(
        self,
        db,
        from_date: date | None = None,
        to_date: date | None = None,
        ma_san_pham: str | None = None,
    ):
        today = date.today()

        start = from_date or (
            today - timedelta(days=60)
        )

        end = to_date or today

        if start > end:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Từ ngày phải nhỏ hơn hoặc bằng "
                    "đến ngày."
                ),
            )

        periods, products = (
            self.repository.get_prophet_comparison(
                db,
                start,
                end,
                ma_san_pham,
            )
        )

        total_actual = sum(
            item["thuc_te"]
            for item in periods
        )

        total_prophet = sum(
            item["du_bao_prophet"]
            for item in periods
        )

        total_diff = total_actual - total_prophet

        total_percentage = (
            round(total_diff / total_actual * 100, 2)
            if total_actual > 0
            else 0.0
        )

        count = len(periods)

        if count > 0:
            mae = sum(
                abs(item["chenh_lech"])
                for item in periods
            ) / count

            # Giữ cách tính hiện tại để tương thích
            # với dữ liệu dashboard đang sử dụng.
            mape = (
                sum(
                    abs(item["chenh_lech"])
                    / max(item["thuc_te"], 1)
                    for item in periods
                )
                / count
                * 100
            )

        else:
            mae = 0.0
            mape = 0.0

        return {
            "tu_ngay": start,
            "den_ngay": end,
            "ma_san_pham": ma_san_pham,
            "periods": periods,
            "products": products,
            "summary": {
                "tong_thuc_te": total_actual,
                "tong_prophet": total_prophet,
                "tong_chenh_lech": total_diff,
                "phan_tram_lech_tong": total_percentage,
                "mae": round(mae, 2),
                "mape": round(mape, 2),
            },
        }

    # ==================== TÀI KHOẢN ====================

    def account_statistics(self, db):
        return self.repository.get_account_statistics(db)

    # ==================== ĐƠN HÀNG BÁN ====================

    def order_stats(
        self,
        db,
        period_type: str = "thang",
        year: int | None = None,
        month: int | None = None,
        week: int | None = None,
    ):
        start_date, end_date, period_label = (
            self._resolve_period_dates(
                period_type,
                year,
                month,
                week,
            )
        )

        result = (
            self.repository.get_order_stats_by_period(
                db,
                start_date,
                end_date,
            )
        )

        return {
            "period_type": period_type,
            "period_label": period_label,
            "start_date": start_date,
            "end_date": end_date,
            **result,
        }

    # ==================== CÔNG THỨC / BOM ====================

    def formula_bom_stats(self, db):
        return self.repository.get_formula_bom_stats(db)

    # ==================== TỒN KHO VÀ LƯỢNG BOOK ====================

    def inventory_stock_stats(self, db):
        return self.repository.get_inventory_stock_stats(db)

    # ==================== NGUYÊN LIỆU CUNG ỨNG ====================

    def supplier_materials_stats(self, db):
        return self.repository.get_supplier_materials_stats(db)

    # ==================== GỢI Ý NHÀ CUNG CẤP ====================

    def supplier_suggestion_stats(self, db):
        return self.repository.get_supplier_suggestion_stats(db)

    # ==================== NHU CẦU NGUYÊN LIỆU ====================

    def material_demand_stats(self, db):
        return self.repository.get_material_demand_stats(db)

    # ==================== ĐƠN MUA NGUYÊN LIỆU ====================

    def purchase_order_stats(self, db):
        return self.repository.get_purchase_order_stats(db)

    # ==================== CẤU HÌNH VÀ NHẬT KÝ ====================

    def config_audit_stats(self, db):
        return self.repository.get_config_audit_stats(db)
