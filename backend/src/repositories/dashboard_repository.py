# ###D:\KLTN\KLTN\backend\src\repositories\dashboard_repository.py
# from collections import defaultdict
# from datetime import date
# from decimal import Decimal
# from sqlalchemy import and_, desc, func, or_, select

# from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
# from src.models.chi_tiet_don_mua import ChiTietDonMua
# from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
# from src.models.cong_thuc_model import CongThuc
# from src.models.de_xuat_nhap_hang import DeXuatNhapHang
# from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
# from src.models.lich_su_du_bao import LichSuDuBao
# from src.models.lich_su_tieu_thu_model import LichSuTieuThu
# from src.models.nguyen_lieu_model import NguyenLieu
# from src.models.nguyen_lieu_nha_cung_cap_model import NguyenLieuNhaCungCap
# from src.models.nha_cung_cap_model import NhaCungCap
# from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
# from src.models.san_pham_model import SanPham
# from src.models.ton_kho_nguyen_lieu_model import TonKhoNguyenLieu
# from src.models.user_model import User


# class DashboardRepository:
#     @staticmethod
#     def active_material_count(db):
#         return db.scalar(select(func.count()).select_from(NguyenLieu).where(
#             NguyenLieu.trang_thai == "DANG_SU_DUNG"
#         ))

#     @staticmethod
#     def low_stock(db):
#         latest = select(
#             TonKhoNguyenLieu.ma_nguyen_lieu.label("material_code"),
#             func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded_date"),
#         ).group_by(TonKhoNguyenLieu.ma_nguyen_lieu).subquery()
#         return db.execute(
#             select(TonKhoNguyenLieu, NguyenLieu)
#             .join(latest, and_(
#                 TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material_code,
#                 TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded_date,
#             ))
#             .join(NguyenLieu, NguyenLieu.ma_nguyen_lieu == TonKhoNguyenLieu.ma_nguyen_lieu)
#             .where(
#                 NguyenLieu.trang_thai == "DANG_SU_DUNG",
#                 TonKhoNguyenLieu.ton_kho_kha_dung < TonKhoNguyenLieu.ton_kho_an_toan,
#             )
#             .order_by(TonKhoNguyenLieu.ma_nguyen_lieu)
#         ).all()

#     @staticmethod
#     def all_inventory_status(db):
#         latest = select(
#             TonKhoNguyenLieu.ma_nguyen_lieu.label("material_code"),
#             func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded_date"),
#         ).group_by(TonKhoNguyenLieu.ma_nguyen_lieu).subquery()
#         return db.execute(
#             select(TonKhoNguyenLieu, NguyenLieu)
#             .join(latest, and_(
#                 TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material_code,
#                 TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded_date,
#             ))
#             .join(NguyenLieu, NguyenLieu.ma_nguyen_lieu == TonKhoNguyenLieu.ma_nguyen_lieu)
#             .where(NguyenLieu.trang_thai == "DANG_SU_DUNG")
#             .order_by(TonKhoNguyenLieu.ton_kho_kha_dung.asc())
#         ).all()

#     @staticmethod
#     def proposal_counts(db):
#         return dict(db.execute(select(
#             DeXuatNhapHang.trang_thai, func.count()
#         ).group_by(DeXuatNhapHang.trang_thai)).all())

#     @staticmethod
#     def order_counts(db):
#         return dict(db.execute(select(
#             DonMuaNguyenLieu.trang_thai, func.count()
#         ).group_by(DonMuaNguyenLieu.trang_thai)).all())

#     @staticmethod
#     def purchase_values(db):
#         return dict(db.execute(select(
#             DonMuaNguyenLieu.trang_thai,
#             func.sum(DonMuaNguyenLieu.tong_tien),
#         ).where(DonMuaNguyenLieu.trang_thai.in_((
#             "DA_DUYET", "DA_NHAN_HANG"
#         ))).group_by(DonMuaNguyenLieu.trang_thai)).all())

#     @staticmethod
#     def active_supplier_counts(db):
#         return db.execute(select(
#             func.count(),
#             func.count().filter(and_(
#                 NhaCungCap.ty_le_giao_dung_han_thuc_te.is_not(None),
#                 NhaCungCap.ty_le_giao_du_thuc_te.is_not(None),
#             )),
#         ).where(NhaCungCap.trang_thai == "DANG_HOAT_DONG")).one()

#     @staticmethod
#     def active_supplier_performance(db):
#         return list(db.scalars(select(NhaCungCap).where(
#             NhaCungCap.trang_thai == "DANG_HOAT_DONG"
#         ).order_by(NhaCungCap.ma_ncc)))

#     # ==================== NGUYÊN LIỆU SỬ DỤNG ====================
#     @staticmethod
#     def get_material_usage_by_period(db, start_date: date, end_date: date):
#         # 1. Lấy lượng bán của sản phẩm trong kỳ
#         product_sales = db.execute(
#             select(
#                 LichSuTieuThu.ma_san_pham,
#                 func.sum(LichSuTieuThu.so_luong_ban).label("total_sold"),
#             )
#             .where(
#                 and_(
#                     LichSuTieuThu.ngay_ban >= start_date,
#                     LichSuTieuThu.ngay_ban <= end_date,
#                 )
#             )
#             .group_by(LichSuTieuThu.ma_san_pham)
#         ).all()

#         # Fallback nếu kỳ không có dữ liệu bán: kiểm tra toàn bộ lịch sử bán
#         if not product_sales:
#             max_date = db.scalar(select(func.max(LichSuTieuThu.ngay_ban)))
#             if max_date:
#                 # Lấy dữ liệu 30 ngày gần nhất của max_date để không bị trống
#                 product_sales = db.execute(
#                     select(
#                         LichSuTieuThu.ma_san_pham,
#                         func.sum(LichSuTieuThu.so_luong_ban).label("total_sold"),
#                     )
#                     .where(LichSuTieuThu.ngay_ban >= max_date.replace(day=1))
#                     .group_by(LichSuTieuThu.ma_san_pham)
#                 ).all()

#         sold_map = {row.ma_san_pham: Decimal(str(row.total_sold or 0)) for row in product_sales}

#         # 2. Lấy BOM đang sử dụng
#         boms = db.execute(
#             select(CongThuc, ChiTietCongThuc, NguyenLieu)
#             .join(ChiTietCongThuc, ChiTietCongThuc.ma_cong_thuc == CongThuc.ma_cong_thuc)
#             .join(NguyenLieu, NguyenLieu.ma_nguyen_lieu == ChiTietCongThuc.ma_nguyen_lieu)
#             .where(
#                 CongThuc.trang_thai == "DANG_SU_DUNG",
#                 NguyenLieu.trang_thai == "DANG_SU_DUNG",
#             )
#         ).all()

#         material_totals = defaultdict(lambda: {
#             "ma_nguyen_lieu": "",
#             "ten_nguyen_lieu": "",
#             "don_vi_do_luong": "",
#             "so_luong": Decimal("0"),
#         })

#         # Khởi tạo tất cả nguyên liệu active có số lượng 0 để có thể xếp hạng ít nhất
#         all_materials = db.scalars(
#             select(NguyenLieu).where(NguyenLieu.trang_thai == "DANG_SU_DUNG")
#         ).all()
#         for m in all_materials:
#             material_totals[m.ma_nguyen_lieu] = {
#                 "ma_nguyen_lieu": m.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": m.ten_nguyen_lieu,
#                 "don_vi_do_luong": m.don_vi_do_luong,
#                 "so_luong": Decimal("0"),
#             }

#         # Tính lượng tiêu thụ qua công thức BOM
#         for bom, detail, mat in boms:
#             sold_qty = sold_map.get(bom.ma_san_pham, Decimal("0"))
#             if sold_qty > 0:
#                 he_so = bom.he_so_thu_hoi if bom.he_so_thu_hoi and bom.he_so_thu_hoi > 0 else Decimal("1.0")
#                 ty_le = detail.ty_le_phoi_tron if detail.ty_le_phoi_tron else Decimal("1.0")
#                 needed = (sold_qty / he_so) * ty_le
#                 material_totals[mat.ma_nguyen_lieu]["so_luong"] += needed

#         return list(material_totals.values())

#     # ==================== SẢN PHẨM TIÊU THỤ ====================
#     @staticmethod
#     def get_product_consumption_by_period(db, start_date: date, end_date: date):
#         rows = db.execute(
#             select(
#                 SanPham.ma_san_pham,
#                 SanPham.ten_san_pham,
#                 SanPham.don_vi_tinh,
#                 func.coalesce(func.sum(LichSuTieuThu.so_luong_ban), 0).label("so_luong"),
#                 func.coalesce(func.sum(
#                     func.coalesce(LichSuTieuThu.gia_ban_sau_giam, LichSuTieuThu.gia_goc, 0)
#                     * LichSuTieuThu.so_luong_ban
#                 ), 0).label("doanh_thu"),
#                 func.count(func.distinct(LichSuTieuThu.ma_don_hang)).label("so_don"),
#             )
#             .outerjoin(
#                 LichSuTieuThu,
#                 and_(
#                     LichSuTieuThu.ma_san_pham == SanPham.ma_san_pham,
#                     LichSuTieuThu.ngay_ban >= start_date,
#                     LichSuTieuThu.ngay_ban <= end_date,
#                 ),
#             )
#             .where(SanPham.trang_thai == "DANG_BAN")
#             .group_by(SanPham.ma_san_pham, SanPham.ten_san_pham, SanPham.don_vi_tinh)
#             .order_by(desc("so_luong"))
#         ).all()

#         # Fallback nếu kỳ không có dữ liệu bán
#         total_qty = sum(r.so_luong for r in rows)
#         if total_qty == 0:
#             max_date = db.scalar(select(func.max(LichSuTieuThu.ngay_ban)))
#             if max_date:
#                 rows = db.execute(
#                     select(
#                         SanPham.ma_san_pham,
#                         SanPham.ten_san_pham,
#                         SanPham.don_vi_tinh,
#                         func.coalesce(func.sum(LichSuTieuThu.so_luong_ban), 0).label("so_luong"),
#                         func.coalesce(func.sum(
#                             func.coalesce(LichSuTieuThu.gia_ban_sau_giam, LichSuTieuThu.gia_goc, 0)
#                             * LichSuTieuThu.so_luong_ban
#                         ), 0).label("doanh_thu"),
#                         func.count(func.distinct(LichSuTieuThu.ma_don_hang)).label("so_don"),
#                     )
#                     .outerjoin(
#                         LichSuTieuThu,
#                         and_(
#                             LichSuTieuThu.ma_san_pham == SanPham.ma_san_pham,
#                             LichSuTieuThu.ngay_ban >= max_date.replace(day=1),
#                         ),
#                     )
#                     .where(SanPham.trang_thai == "DANG_BAN")
#                     .group_by(SanPham.ma_san_pham, SanPham.ten_san_pham, SanPham.don_vi_tinh)
#                     .order_by(desc("so_luong"))
#                 ).all()

#         return rows

#     # ==================== SO SÁNH PROPHET ====================
#     @staticmethod
#     def get_prophet_comparison(db, from_date: date, to_date: date, ma_san_pham: str | None = None):
#         # 1. Lấy các mốc dự báo
#         forecast_query = select(ChiTietLichSuDuBao).join(
#             LichSuDuBao, LichSuDuBao.ma_lich_su_du_bao == ChiTietLichSuDuBao.ma_lich_su_du_bao
#         ).where(
#             ChiTietLichSuDuBao.tu_ngay >= from_date,
#             ChiTietLichSuDuBao.den_ngay <= to_date,
#         )
#         if ma_san_pham:
#             forecast_query = forecast_query.where(ChiTietLichSuDuBao.ma_san_pham == ma_san_pham)

#         forecast_rows = db.scalars(forecast_query.order_by(ChiTietLichSuDuBao.tu_ngay.asc())).all()

#         # Fallback nếu không có trong khoảng ngày: lấy từ đợt dự báo mới nhất
#         if not forecast_rows:
#             latest_history = db.scalar(
#                 select(LichSuDuBao).order_by(LichSuDuBao.thoi_gian_tao.desc()).limit(1)
#             )
#             if latest_history:
#                 fb_query = select(ChiTietLichSuDuBao).where(
#                     ChiTietLichSuDuBao.ma_lich_su_du_bao == latest_history.ma_lich_su_du_bao
#                 )
#                 if ma_san_pham:
#                     fb_query = fb_query.where(ChiTietLichSuDuBao.ma_san_pham == ma_san_pham)
#                 forecast_rows = db.scalars(fb_query.order_by(ChiTietLichSuDuBao.tu_ngay.asc())).all()

#         # Nhóm theo kỳ (tu_ngay, den_ngay)
#         period_forecasts = defaultdict(lambda: {
#             "du_bao": 0, "can_duoi": 0, "can_tren": 0, "count": 0, "products": set()
#         })
#         product_forecasts = defaultdict(int)

#         for f in forecast_rows:
#             key = (f.tu_ngay, f.den_ngay)
#             period_forecasts[key]["du_bao"] += f.so_luong_du_bao
#             if f.can_duoi is not None:
#                 period_forecasts[key]["can_duoi"] += f.can_duoi
#             if f.can_tren is not None:
#                 period_forecasts[key]["can_tren"] += f.can_tren
#             period_forecasts[key]["products"].add(f.ma_san_pham)
#             product_forecasts[f.ma_san_pham] += f.so_luong_du_bao

#         # 2. Lấy số lượng thực tế từ LichSuTieuThu
#         periods_result = []
#         for (tu, den), fc_data in sorted(period_forecasts.items(), key=lambda x: x[0][0]):
#             sales_q = select(func.coalesce(func.sum(LichSuTieuThu.so_luong_ban), 0)).where(
#                 and_(
#                     LichSuTieuThu.ngay_ban >= tu,
#                     LichSuTieuThu.ngay_ban <= den,
#                 )
#             )
#             if ma_san_pham:
#                 sales_q = sales_q.where(LichSuTieuThu.ma_san_pham == ma_san_pham)
#             elif fc_data["products"]:
#                 sales_q = sales_q.where(LichSuTieuThu.ma_san_pham.in_(fc_data["products"]))

#             actual_sold = int(db.scalar(sales_q) or 0)
#             forecast_val = fc_data["du_bao"]
#             diff = actual_sold - forecast_val
#             pct = round((diff / actual_sold * 100), 2) if actual_sold > 0 else (
#                 -100.0 if forecast_val > 0 else 0.0
#             )

#             eval_status = "KHOP"
#             if diff > 0:
#                 eval_status = "VUOT_DU_BAO"
#             elif diff < 0:
#                 eval_status = "DUOI_DU_BAO"

#             label = f"{tu.strftime('%d/%m')} - {den.strftime('%d/%m/%Y')}"
#             periods_result.append({
#                 "nhan_thoi_gian": label,
#                 "tu_ngay": tu,
#                 "den_ngay": den,
#                 "thuc_te": actual_sold,
#                 "du_bao_prophet": forecast_val,
#                 "can_duoi": fc_data["can_duoi"] if fc_data["can_duoi"] > 0 else None,
#                 "can_tren": fc_data["can_tren"] if fc_data["can_tren"] > 0 else None,
#                 "chenh_lech": diff,
#                 "phan_tram_lech": pct,
#                 "danh_gia": eval_status,
#             })

#         # 3. Thống kê theo sản phẩm
#         products_result = []
#         san_phams = db.scalars(select(SanPham).where(SanPham.trang_thai == "DANG_BAN")).all()
#         sp_map = {sp.ma_san_pham: sp.ten_san_pham for sp in san_phams}

#         for sp_code, fc_qty in product_forecasts.items():
#             actual_q = select(func.coalesce(func.sum(LichSuTieuThu.so_luong_ban), 0)).where(
#                 and_(
#                     LichSuTieuThu.ma_san_pham == sp_code,
#                     LichSuTieuThu.ngay_ban >= from_date,
#                     LichSuTieuThu.ngay_ban <= to_date,
#                 )
#             )
#             act_qty = int(db.scalar(actual_q) or 0)
#             p_diff = act_qty - fc_qty
#             p_pct = round((p_diff / act_qty * 100), 2) if act_qty > 0 else 0.0
#             products_result.append({
#                 "ma_san_pham": sp_code,
#                 "ten_san_pham": sp_map.get(sp_code, sp_code),
#                 "thuc_te": act_qty,
#                 "du_bao_prophet": fc_qty,
#                 "chenh_lech": p_diff,
#                 "phan_tram_lech": p_pct,
#             })

#         return periods_result, products_result

#     # ==================== THỐNG KÊ TÀI KHOẢN ====================
#     @staticmethod
#     def get_account_statistics(db):
#         users = db.scalars(select(User)).all()
#         total = len(users)
#         active = sum(1 for u in users if u.trang_thai == "HOAT_DONG")
#         inactive = total - active

#         roles_count = defaultdict(int)
#         for u in users:
#             roles_count[u.vai_tro] += 1

#         role_labels = {
#             "ADMIN": "Quản trị viên",
#             "QUAN_LY_BAN_HANG": "Quản lý bán hàng",
#             "QUAN_LY_MUA_HANG": "Quản lý mua hàng",
#             "NHAN_VIEN_BAN_HANG": "Nhân viên bán hàng",
#             "NHAN_VIEN_MUA_HANG": "Nhân viên mua hàng",
#         }

#         distribution = []
#         for role, count in sorted(roles_count.items(), key=lambda x: -x[1]):
#             distribution.append({
#                 "vai_tro": role,
#                 "label": role_labels.get(role, role),
#                 "so_luong": count,
#                 "ty_le": round((count / total * 100), 1) if total > 0 else 0.0,
#             })

#         return {
#             "tong_tai_khoan": total,
#             "dang_hoat_dong": active,
#             "ngung_hoat_dong": inactive,
#             "ty_le_hoat_dong": round((active / total * 100), 1) if total > 0 else 0.0,
#             "vai_tro_distribution": distribution,
#         }

#     # ==================== ĐƠN HÀNG (DỮ LIỆU ĐƠN HÀNG) ====================
#     @staticmethod
#     def get_order_stats_by_period(db, start_date: date, end_date: date):
#         rows = db.execute(
#             select(
#                 LichSuTieuThu.ma_don_hang,
#                 LichSuTieuThu.ngay_ban,
#                 func.sum(LichSuTieuThu.so_luong_ban).label("tong_so_luong"),
#                 func.sum(
#                     func.coalesce(LichSuTieuThu.gia_ban_sau_giam, LichSuTieuThu.gia_goc, 0)
#                     * LichSuTieuThu.so_luong_ban
#                 ).label("tong_gia_tri"),
#                 func.count(LichSuTieuThu.ma_san_pham).label("so_mat_hang"),
#             )
#             .where(
#                 and_(
#                     LichSuTieuThu.ngay_ban >= start_date,
#                     LichSuTieuThu.ngay_ban <= end_date,
#                 )
#             )
#             .group_by(LichSuTieuThu.ma_don_hang, LichSuTieuThu.ngay_ban)
#             .order_by(desc("tong_gia_tri"))
#         ).all()

#         # Fallback nếu kỳ không có dữ liệu bán
#         if not rows:
#             max_date = db.scalar(select(func.max(LichSuTieuThu.ngay_ban)))
#             if max_date:
#                 rows = db.execute(
#                     select(
#                         LichSuTieuThu.ma_don_hang,
#                         LichSuTieuThu.ngay_ban,
#                         func.sum(LichSuTieuThu.so_luong_ban).label("tong_so_luong"),
#                         func.sum(
#                             func.coalesce(LichSuTieuThu.gia_ban_sau_giam, LichSuTieuThu.gia_goc, 0)
#                             * LichSuTieuThu.so_luong_ban
#                         ).label("tong_gia_tri"),
#                         func.count(LichSuTieuThu.ma_san_pham).label("so_mat_hang"),
#                     )
#                     .where(LichSuTieuThu.ngay_ban >= max_date.replace(day=1))
#                     .group_by(LichSuTieuThu.ma_don_hang, LichSuTieuThu.ngay_ban)
#                     .order_by(desc("tong_gia_tri"))
#                 ).all()

#         orders_list = []
#         for r in rows:
#             orders_list.append({
#                 "ma_don_hang": r.ma_don_hang,
#                 "ngay_ban": r.ngay_ban,
#                 "tong_so_luong": int(r.tong_so_luong or 0),
#                 "tong_gia_tri": float(r.tong_gia_tri or 0),
#                 "so_mat_hang": int(r.so_mat_hang or 0),
#             })

#         # Timeline gom nhóm theo ngày
#         timeline_dict = defaultdict(lambda: {"so_don_hang": 0, "tong_so_luong": 0, "tong_gia_tri": 0.0})
#         for o in orders_list:
#             if o["ngay_ban"]:
#                 k = o["ngay_ban"].strftime("%d/%m")
#                 timeline_dict[k]["so_don_hang"] += 1
#                 timeline_dict[k]["tong_so_luong"] += o["tong_so_luong"]
#                 timeline_dict[k]["tong_gia_tri"] += o["tong_gia_tri"]

#         timeline = [
#             {"nhan_thoi_gian": k, **v}
#             for k, v in sorted(timeline_dict.items(), key=lambda x: x[0])
#         ]

#         top_orders = sorted(orders_list, key=lambda x: x["tong_gia_tri"], reverse=True)[:10]
#         least_orders = sorted(orders_list, key=lambda x: x["tong_gia_tri"])[:10]

#         tot_orders = len(orders_list)
#         tot_qty = sum(o["tong_so_luong"] for o in orders_list)
#         tot_rev = sum(o["tong_gia_tri"] for o in orders_list)
#         avg_rev = (tot_rev / tot_orders) if tot_orders > 0 else 0.0

#         return {
#             "top_orders": top_orders,
#             "least_orders": least_orders,
#             "timeline": timeline,
#             "summary": {
#                 "tong_so_don_hang": tot_orders,
#                 "tong_so_luong_ban": tot_qty,
#                 "tong_doanh_thu": round(tot_rev, 2),
#                 "gia_tri_trung_binh_don": round(avg_rev, 2),
#                 "don_hang_lon_nhat": top_orders[0] if top_orders else None,
#                 "don_hang_nho_nhat": least_orders[0] if least_orders else None,
#             },
#         }

#     # ==================== CÔNG THỨC / BOM ====================
#     @staticmethod
#     def get_formula_bom_stats(db):
#         total_bom = db.scalar(
#             select(func.count(func.distinct(CongThuc.ma_cong_thuc))).where(CongThuc.trang_thai == "DANG_SU_DUNG")
#         ) or 0

#         all_materials = db.scalars(select(NguyenLieu).where(NguyenLieu.trang_thai == "DANG_SU_DUNG")).all()
#         total_mats = len(all_materials)

#         # Đếm số công thức có mặt nguyên liệu
#         usage_rows = db.execute(
#             select(
#                 NguyenLieu.ma_nguyen_lieu,
#                 NguyenLieu.ten_nguyen_lieu,
#                 NguyenLieu.don_vi_do_luong,
#                 func.count(func.distinct(ChiTietCongThuc.ma_cong_thuc)).label("so_ct"),
#                 func.coalesce(func.avg(ChiTietCongThuc.ty_le_phoi_tron), 0).label("ty_le_tb"),
#             )
#             .join(ChiTietCongThuc, ChiTietCongThuc.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu)
#             .join(CongThuc, and_(CongThuc.ma_cong_thuc == ChiTietCongThuc.ma_cong_thuc, CongThuc.trang_thai == "DANG_SU_DUNG"))
#             .where(NguyenLieu.trang_thai == "DANG_SU_DUNG")
#             .group_by(NguyenLieu.ma_nguyen_lieu, NguyenLieu.ten_nguyen_lieu, NguyenLieu.don_vi_do_luong)
#         ).all()

#         used_map = {
#             r.ma_nguyen_lieu: {
#                 "ma_nguyen_lieu": r.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": r.ten_nguyen_lieu,
#                 "don_vi_do_luong": r.don_vi_do_luong,
#                 "so_cong_thuc_tham_gia": int(r.so_ct),
#                 "ty_le_phoi_tron_tb": round(float(r.ty_le_tb) * 100, 2),
#                 "trang_thai": "DANG_DUNG",
#             }
#             for r in usage_rows
#         }

#         unused_list = []
#         for m in all_materials:
#             if m.ma_nguyen_lieu not in used_map:
#                 unused_list.append({
#                     "ma_nguyen_lieu": m.ma_nguyen_lieu,
#                     "ten_nguyen_lieu": m.ten_nguyen_lieu,
#                     "don_vi_do_luong": m.don_vi_do_luong,
#                     "so_cong_thuc_tham_gia": 0,
#                     "ty_le_phoi_tron_tb": 0.0,
#                     "trang_thai": "CHUA_SU_DUNG",
#                 })

#         used_list = list(used_map.values())
#         sorted_desc = sorted(used_list, key=lambda x: x["so_cong_thuc_tham_gia"], reverse=True)
#         sorted_asc = sorted(used_list, key=lambda x: x["so_cong_thuc_tham_gia"])

#         return {
#             "tong_so_cong_thuc": total_bom,
#             "tong_so_nguyen_lieu": total_mats,
#             "nguyen_lieu_trong_bom": len(used_list),
#             "nguyen_lieu_chua_dung": len(unused_list),
#             "top_materials": sorted_desc[:10],
#             "least_materials": sorted_asc[:10],
#             "unused_materials": unused_list,
#         }

#     # ==================== TỒN KHO & LƯỢNG ĐÃ BOOK ====================
#     @staticmethod
#     def get_inventory_stock_stats(db):
#         latest = select(
#             TonKhoNguyenLieu.ma_nguyen_lieu.label("material_code"),
#             func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded_date"),
#         ).group_by(TonKhoNguyenLieu.ma_nguyen_lieu).subquery()

#         rows = db.execute(
#             select(TonKhoNguyenLieu, NguyenLieu)
#             .join(latest, and_(
#                 TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material_code,
#                 TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded_date,
#             ))
#             .join(NguyenLieu, NguyenLieu.ma_nguyen_lieu == TonKhoNguyenLieu.ma_nguyen_lieu)
#             .where(NguyenLieu.trang_thai == "DANG_SU_DUNG")
#         ).all()

#         items = []
#         alerts = []
#         tot_book = 0.0
#         tot_act = 0.0

#         for stock, mat in rows:
#             act = float(stock.ton_kho_thuc_te or 0)
#             bk = float(stock.so_luong_book or 0)
#             avail = float(stock.ton_kho_kha_dung or 0)
#             safe = float(stock.ton_kho_an_toan or 0)
#             shortage = max(0.0, safe - avail)

#             tot_act += act
#             tot_book += bk

#             lvl = "AN_TOAN"
#             if avail <= 0:
#                 lvl = "KHAN_CAP"
#             elif avail < safe:
#                 lvl = "CANH_BAO"

#             item = {
#                 "ma_nguyen_lieu": mat.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": mat.ten_nguyen_lieu,
#                 "don_vi_do_luong": mat.don_vi_do_luong,
#                 "so_luong_book": bk,
#                 "ton_kho_thuc_te": act,
#                 "ton_kho_kha_dung": avail,
#                 "ton_kho_an_toan": safe,
#                 "so_luong_thieu_an_toan": shortage,
#                 "muc_do_canh_bao": lvl,
#             }
#             items.append(item)
#             if lvl in ("KHAN_CAP", "CANH_BAO"):
#                 alerts.append(item)

#         top_booked = sorted(items, key=lambda x: x["so_luong_book"], reverse=True)[:10]
#         least_booked = sorted(items, key=lambda x: x["so_luong_book"])[:10]

#         top_act = sorted(items, key=lambda x: x["ton_kho_thuc_te"], reverse=True)[:10]
#         least_act = sorted(items, key=lambda x: x["ton_kho_thuc_te"])[:10]

#         return {
#             "tong_nguyen_lieu": len(items),
#             "tong_luong_book": round(tot_book, 2),
#             "tong_ton_thuc_te": round(tot_act, 2),
#             "top_booked": top_booked,
#             "least_booked": least_booked,
#             "top_actual_stock": top_act,
#             "least_actual_stock": least_act,
#             "alerts": alerts,
#         }

#     # ==================== NGUYÊN LIỆU CUNG ỨNG ====================
#     @staticmethod
#     def get_supplier_materials_stats(db):
#         rows = db.execute(
#             select(NguyenLieuNhaCungCap, NguyenLieu, NhaCungCap)
#             .join(NguyenLieu, NguyenLieu.ma_nguyen_lieu == NguyenLieuNhaCungCap.ma_nguyen_lieu)
#             .join(NhaCungCap, NhaCungCap.ma_ncc == NguyenLieuNhaCungCap.ma_ncc)
#             .where(
#                 NguyenLieu.trang_thai == "DANG_SU_DUNG",
#                 NhaCungCap.trang_thai == "DANG_HOAT_DONG",
#             )
#         ).all()

#         details = []
#         mat_map = defaultdict(lambda: {"ten_nguyen_lieu": "", "nccs": set(), "prices": []})

#         for mapping, mat, ncc in rows:
#             price = float(mapping.don_gia_nguyen_lieu or 0)
#             lead = int(mapping.lead_time_ngay or 0)
#             qual = float(mapping.ty_le_chat_luong_dat or 1.0) * 100
#             ontime = float(mapping.ty_le_giao_dung_han or 1.0) * 100
#             full = float(mapping.ty_le_giao_du or 1.0) * 100

#             details.append({
#                 "ma_nguyen_lieu": mat.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": mat.ten_nguyen_lieu,
#                 "ma_ncc": ncc.ma_ncc,
#                 "ten_ncc": ncc.ten_ncc,
#                 "don_gia": price,
#                 "lead_time_ngay": lead,
#                 "ty_le_chat_luong_dat": round(qual, 1),
#                 "ty_le_giao_dung_han": round(ontime, 1),
#                 "ty_le_giao_du": round(full, 1),
#             })

#             mat_map[mat.ma_nguyen_lieu]["ten_nguyen_lieu"] = mat.ten_nguyen_lieu
#             mat_map[mat.ma_nguyen_lieu]["nccs"].add(ncc.ma_ncc)
#             mat_map[mat.ma_nguyen_lieu]["prices"].append(price)

#         summary_by_mat = []
#         for code, info in mat_map.items():
#             summary_by_mat.append({
#                 "ma_nguyen_lieu": code,
#                 "ten_nguyen_lieu": info["ten_nguyen_lieu"],
#                 "so_nha_cung_cap": len(info["nccs"]),
#                 "don_gia_thap_nhat": min(info["prices"]) if info["prices"] else 0.0,
#                 "don_gia_cao_nhat": max(info["prices"]) if info["prices"] else 0.0,
#             })

#         top_supplied = sorted(summary_by_mat, key=lambda x: x["so_nha_cung_cap"], reverse=True)[:10]
#         least_supplied = sorted(summary_by_mat, key=lambda x: x["so_nha_cung_cap"])[:10]

#         highest_price = sorted(details, key=lambda x: x["don_gia"], reverse=True)[:10]
#         lowest_price = sorted(details, key=lambda x: x["don_gia"])[:10]

#         best_qual = sorted(details, key=lambda x: x["ty_le_chat_luong_dat"], reverse=True)[:10]
#         worst_qual = sorted(details, key=lambda x: x["ty_le_chat_luong_dat"])[:10]

#         best_ontime = sorted(details, key=lambda x: x["ty_le_giao_dung_han"], reverse=True)[:10]
#         worst_ontime = sorted(details, key=lambda x: x["ty_le_giao_dung_han"])[:10]

#         return {
#             "top_supplied_materials": top_supplied,
#             "least_supplied_materials": least_supplied,
#             "highest_price_items": highest_price,
#             "lowest_price_items": lowest_price,
#             "best_quality_items": best_qual,
#             "worst_quality_items": worst_qual,
#             "best_ontime_items": best_ontime,
#             "worst_ontime_items": worst_ontime,
#         }

#     # ==================== GỢI Ý NHÀ CUNG CẤP ====================
#     @staticmethod
#     def get_supplier_suggestion_stats(db):
#         suppliers = db.scalars(select(NhaCungCap).where(NhaCungCap.trang_thai == "DANG_HOAT_DONG")).all()
#         mappings = db.scalars(select(NguyenLieuNhaCungCap)).all()

#         mats_by_supplier = defaultdict(set)
#         for m in mappings:
#             mats_by_supplier[m.ma_ncc].add(m.ma_nguyen_lieu)

#         # Mô phỏng tần suất gợi ý dựa trên điểm số thương mại và số lượng nguyên liệu cung ứng
#         result_items = []
#         for s in suppliers:
#             score = float(s.diem_dieu_kien_thuong_mai or 50.0)
#             ontime = float(s.ty_le_giao_dung_han_thuc_te or 0.0)
#             mats_count = len(mats_by_supplier[s.ma_ncc])

#             # Tính điểm gợi ý mô phỏng
#             suggested_rank = int(mats_count * (score / 20.0))
#             status = "DUOC_GOI_Y" if mats_count > 0 and score >= 60 else "IT_GOI_Y" if mats_count > 0 else "KHONG_GOI_Y"

#             result_items.append({
#                 "ma_ncc": s.ma_ncc,
#                 "ten_ncc": s.ten_ncc,
#                 "so_lan_goi_y_top1": suggested_rank,
#                 "so_nguyen_lieu_cung_ung": mats_count,
#                 "diem_ncc": score,
#                 "ty_le_dung_han": ontime,
#                 "trang_thai_goi_y": status,
#             })

#         top_sug = sorted(result_items, key=lambda x: x["so_lan_goi_y_top1"], reverse=True)[:10]
#         least_sug = sorted([x for x in result_items if x["so_nguyen_lieu_cung_ung"] > 0], key=lambda x: x["so_lan_goi_y_top1"])[:10]
#         not_sug = [x for x in result_items if x["so_nguyen_lieu_cung_ung"] == 0 or x["trang_thai_goi_y"] == "KHONG_GOI_Y"]

#         return {
#             "tong_ncc": len(suppliers),
#             "so_ncc_duoc_goi_y": len([x for x in result_items if x["trang_thai_goi_y"] != "KHONG_GOI_Y"]),
#             "so_ncc_khong_goi_y": len(not_sug),
#             "top_suggested": top_sug,
#             "least_suggested": least_sug,
#             "not_suggested": not_sug,
#         }

#     # ==================== NHU CẦU NGUYÊN LIỆU ====================
#     @staticmethod
#     def get_material_demand_stats(db):
#         materials = db.scalars(select(NguyenLieu).where(NguyenLieu.trang_thai == "DANG_SU_DUNG")).all()

#         # Tồn kho mới nhất
#         latest = select(
#             TonKhoNguyenLieu.ma_nguyen_lieu.label("material_code"),
#             func.max(TonKhoNguyenLieu.ngay_ghi_nhan).label("recorded_date"),
#         ).group_by(TonKhoNguyenLieu.ma_nguyen_lieu).subquery()

#         stocks = {
#             s.ma_nguyen_lieu: s
#             for s in db.scalars(
#                 select(TonKhoNguyenLieu).join(latest, and_(
#                     TonKhoNguyenLieu.ma_nguyen_lieu == latest.c.material_code,
#                     TonKhoNguyenLieu.ngay_ghi_nhan == latest.c.recorded_date,
#                 ))
#             ).all()
#         }

#         # Dự báo mới nhất quy đổi
#         forecast_sums = dict(
#             db.execute(
#                 select(
#                     ChiTietLichSuDuBao.ma_nguyen_lieu,
#                     func.sum(func.coalesce(ChiTietLichSuDuBao.so_luong_du_bao_kg, ChiTietLichSuDuBao.so_luong_du_bao, 0)),
#                 )
#                 .where(ChiTietLichSuDuBao.ma_nguyen_lieu.is_not(None))
#                 .group_by(ChiTietLichSuDuBao.ma_nguyen_lieu)
#             ).all()
#         )

#         items = []
#         tot_demand = 0.0
#         tot_need_buy = 0.0

#         for m in materials:
#             stk = stocks.get(m.ma_nguyen_lieu)
#             avail = float(stk.ton_kho_kha_dung or 0) if stk else 0.0
#             safe = float(stk.ton_kho_an_toan or 0) if stk else 0.0

#             fc = float(forecast_sums.get(m.ma_nguyen_lieu) or (safe * 1.5))
#             need_buy = max(0.0, fc + safe - avail)

#             tot_demand += fc
#             tot_need_buy += need_buy

#             items.append({
#                 "ma_nguyen_lieu": m.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": m.ten_nguyen_lieu,
#                 "don_vi_do_luong": m.don_vi_do_luong,
#                 "nhu_cau": round(fc, 2),
#                 "ton_kho_kha_dung": round(avail, 2),
#                 "ton_kho_an_toan": round(safe, 2),
#                 "luong_can_mua": round(need_buy, 2),
#             })

#         sorted_desc = sorted(items, key=lambda x: x["nhu_cau"], reverse=True)
#         sorted_asc = sorted(items, key=lambda x: x["nhu_cau"])

#         return {
#             "tong_nhu_cau": round(tot_demand, 2),
#             "tong_can_mua": round(tot_need_buy, 2),
#             "top_demand": sorted_desc[:10],
#             "least_demand": sorted_asc[:10],
#             "all_demand": sorted_desc,
#         }

#     # ==================== ĐƠN MUA NGUYÊN LIỆU ====================
#     @staticmethod
#     def get_purchase_order_stats(db):
#         rows = db.execute(
#             select(
#                 NguyenLieu.ma_nguyen_lieu,
#                 NguyenLieu.ten_nguyen_lieu,
#                 NguyenLieu.don_vi_do_luong,
#                 func.coalesce(func.sum(ChiTietDonMua.so_luong_mua), 0).label("tong_so_luong"),
#                 func.coalesce(func.sum(ChiTietDonMua.so_luong_mua * ChiTietDonMua.don_gia_vnd_kg), 0).label("tong_tien"),
#                 func.count(func.distinct(ChiTietDonMua.ma_don_mua)).label("so_don"),
#             )
#             .join(ChiTietDonMua, ChiTietDonMua.ma_nguyen_lieu == NguyenLieu.ma_nguyen_lieu)
#             .where(NguyenLieu.trang_thai == "DANG_SU_DUNG")
#             .group_by(NguyenLieu.ma_nguyen_lieu, NguyenLieu.ten_nguyen_lieu, NguyenLieu.don_vi_do_luong)
#             .order_by(desc("tong_so_luong"))
#         ).all()

#         items = []
#         tot_money = 0.0
#         tot_orders = 0

#         for r in rows:
#             qty = float(r.tong_so_luong or 0)
#             money = float(r.tong_tien or 0)
#             orders = int(r.so_don or 0)
#             tot_money += money
#             tot_orders += orders

#             items.append({
#                 "ma_nguyen_lieu": r.ma_nguyen_lieu,
#                 "ten_nguyen_lieu": r.ten_nguyen_lieu,
#                 "don_vi_do_luong": r.don_vi_do_luong,
#                 "so_luong_mua": qty,
#                 "tong_gia_tri": money,
#                 "so_don_mua": orders,
#             })

#         sorted_desc = sorted(items, key=lambda x: x["so_luong_mua"], reverse=True)
#         sorted_asc = sorted(items, key=lambda x: x["so_luong_mua"])

#         return {
#             "tong_gia_tri_mua": round(tot_money, 2),
#             "tong_so_don_mua": tot_orders,
#             "top_purchased": sorted_desc[:10],
#             "least_purchased": sorted_asc[:10],
#             "all_purchased": sorted_desc,
#         }

#     # ==================== CẤU HÌNH & NHẬT KÝ ====================
#     @staticmethod
#     def get_config_audit_stats(db):
#         total_logs = db.scalar(select(func.count(NhatKyHoatDong.ma_nhat_ky))) or 0

#         user_rows = db.execute(
#             select(
#                 func.coalesce(NhatKyHoatDong.ten_nguoi_thao_tac, "Hệ thống").label("user_name"),
#                 func.count().label("cnt"),
#             )
#             .group_by("user_name")
#             .order_by(desc("cnt"))
#             .limit(10)
#         ).all()

#         feat_rows = db.execute(
#             select(
#                 func.coalesce(NhatKyHoatDong.chuc_nang, "Chung").label("feature"),
#                 func.count().label("cnt"),
#             )
#             .group_by("feature")
#             .order_by(desc("cnt"))
#             .limit(10)
#         ).all()

#         success_count = db.scalar(
#             select(func.count(NhatKyHoatDong.ma_nhat_ky)).where(NhatKyHoatDong.ket_qua == "THANH_CONG")
#         ) or 0

#         rate = round((success_count / total_logs * 100), 1) if total_logs > 0 else 100.0

#         return {
#             "tong_nhat_ky": total_logs,
#             "top_users": [{"ten_nguoi_thao_tac": r.user_name, "so_lan": int(r.cnt)} for r in user_rows],
#             "top_features": [{"chuc_nang": r.feature, "so_lan": int(r.cnt)} for r in feat_rows],
#             "ty_le_thanh_cong": rate,
#         }
from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, desc, func, select

from src.models.chi_tiet_cong_thuc_model import ChiTietCongThuc
from src.models.chi_tiet_don_mua import ChiTietDonMua
from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
from src.models.cong_thuc_model import CongThuc
from src.models.de_xuat_nhap_hang import DeXuatNhapHang
from src.models.don_mua_nguyen_lieu import DonMuaNguyenLieu
from src.models.lich_su_du_bao import LichSuDuBao
from src.models.lich_su_tieu_thu_model import LichSuTieuThu
from src.models.nguyen_lieu_model import NguyenLieu
from src.models.nguyen_lieu_nha_cung_cap_model import (
    NguyenLieuNhaCungCap,
)
from src.models.nha_cung_cap_model import NhaCungCap
from src.models.nhat_ky_hoat_dong_model import NhatKyHoatDong
from src.models.san_pham_model import SanPham
from src.models.ton_kho_nguyen_lieu_model import (
    TonKhoNguyenLieu,
)
from src.models.user_model import User


class DashboardRepository:
    @staticmethod
    def _history_time_column():
        if hasattr(LichSuDuBao, "thoi_gian_chay"):
            return LichSuDuBao.thoi_gian_chay

        return LichSuDuBao.thoi_gian_tao

    @staticmethod
    def _successful_history_query():
        query = select(LichSuDuBao)

        if hasattr(LichSuDuBao, "trang_thai"):
            query = query.where(
                LichSuDuBao.trang_thai == "THANH_CONG"
            )

        if hasattr(LichSuDuBao, "cau_hinh_mo_hinh"):
            query = query.where(
                LichSuDuBao.cau_hinh_mo_hinh == "PROPHET"
            )

        return query

    @staticmethod
    def _latest_successful_history(db):
        return db.scalar(
            DashboardRepository._successful_history_query()
            .order_by(
                DashboardRepository._history_time_column().desc(),
                LichSuDuBao.ma_lich_su_du_bao.desc(),
            )
            .limit(1)
        )

    @staticmethod
    def count_sales_orders(
        db,
        start_date: date,
        end_date: date,
    ):
        return int(
            db.scalar(
                select(
                    func.count(
                        func.distinct(
                            LichSuTieuThu.ma_don_hang
                        )
                    )
                )
                .select_from(LichSuTieuThu)
                .join(
                    SanPham,
                    SanPham.ma_san_pham
                    == LichSuTieuThu.ma_san_pham,
                )
                .where(
                    LichSuTieuThu.ngay_ban >= start_date,
                    LichSuTieuThu.ngay_ban <= end_date,
                )
            )
            or 0
        )

    @staticmethod
    def active_material_count(db):
        return db.scalar(
            select(func.count())
            .select_from(NguyenLieu)
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
        )

    @staticmethod
    def low_stock(db):
        latest = (
            select(
                TonKhoNguyenLieu.ma_nguyen_lieu.label(
                    "material_code"
                ),
                func.max(
                    TonKhoNguyenLieu.ngay_ghi_nhan
                ).label("recorded_date"),
            )
            .group_by(
                TonKhoNguyenLieu.ma_nguyen_lieu
            )
            .subquery()
        )

        return db.execute(
            select(TonKhoNguyenLieu, NguyenLieu)
            .join(
                latest,
                and_(
                    TonKhoNguyenLieu.ma_nguyen_lieu
                    == latest.c.material_code,
                    TonKhoNguyenLieu.ngay_ghi_nhan
                    == latest.c.recorded_date,
                ),
            )
            .join(
                NguyenLieu,
                NguyenLieu.ma_nguyen_lieu
                == TonKhoNguyenLieu.ma_nguyen_lieu,
            )
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG",
                TonKhoNguyenLieu.ton_kho_kha_dung
                < TonKhoNguyenLieu.ton_kho_an_toan,
            )
            .order_by(
                TonKhoNguyenLieu.ma_nguyen_lieu
            )
        ).all()

    @staticmethod
    def all_inventory_status(db):
        latest = (
            select(
                TonKhoNguyenLieu.ma_nguyen_lieu.label(
                    "material_code"
                ),
                func.max(
                    TonKhoNguyenLieu.ngay_ghi_nhan
                ).label("recorded_date"),
            )
            .group_by(
                TonKhoNguyenLieu.ma_nguyen_lieu
            )
            .subquery()
        )

        return db.execute(
            select(TonKhoNguyenLieu, NguyenLieu)
            .join(
                latest,
                and_(
                    TonKhoNguyenLieu.ma_nguyen_lieu
                    == latest.c.material_code,
                    TonKhoNguyenLieu.ngay_ghi_nhan
                    == latest.c.recorded_date,
                ),
            )
            .join(
                NguyenLieu,
                NguyenLieu.ma_nguyen_lieu
                == TonKhoNguyenLieu.ma_nguyen_lieu,
            )
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
            .order_by(
                TonKhoNguyenLieu.ton_kho_kha_dung.asc()
            )
        ).all()

    @staticmethod
    def proposal_counts(db):
        return dict(
            db.execute(
                select(
                    DeXuatNhapHang.trang_thai,
                    func.count(),
                )
                .group_by(
                    DeXuatNhapHang.trang_thai
                )
            ).all()
        )

    @staticmethod
    def order_counts(db):
        return dict(
            db.execute(
                select(
                    DonMuaNguyenLieu.trang_thai,
                    func.count(),
                )
                .group_by(
                    DonMuaNguyenLieu.trang_thai
                )
            ).all()
        )

    @staticmethod
    def purchase_values(db):
        return dict(
            db.execute(
                select(
                    DonMuaNguyenLieu.trang_thai,
                    func.sum(
                        DonMuaNguyenLieu.tong_tien
                    ),
                )
                .where(
                    DonMuaNguyenLieu.trang_thai.in_(
                        (
                            "DA_DUYET",
                            "DA_NHAN_HANG",
                        )
                    )
                )
                .group_by(
                    DonMuaNguyenLieu.trang_thai
                )
            ).all()
        )

    @staticmethod
    def active_supplier_counts(db):
        return db.execute(
            select(
                func.count(),
                func.count().filter(
                    and_(
                        NhaCungCap.ty_le_giao_dung_han_thuc_te.is_not(
                            None
                        ),
                        NhaCungCap.ty_le_giao_du_thuc_te.is_not(
                            None
                        ),
                    )
                ),
            )
            .where(
                NhaCungCap.trang_thai == "DANG_HOAT_DONG"
            )
        ).one()

    @staticmethod
    def active_supplier_performance(db):
        return list(
            db.scalars(
                select(NhaCungCap)
                .where(
                    NhaCungCap.trang_thai
                    == "DANG_HOAT_DONG"
                )
                .order_by(
                    NhaCungCap.ma_ncc
                )
            )
        )

    # ==================== NGUYÊN LIỆU SỬ DỤNG ====================

    @staticmethod
    def get_material_usage_by_period(
        db,
        start_date: date,
        end_date: date,
    ):
        product_sales = db.execute(
            select(
                LichSuTieuThu.ma_san_pham,
                func.sum(
                    LichSuTieuThu.so_luong_ban
                ).label("total_sold"),
            )
            .where(
                LichSuTieuThu.ngay_ban >= start_date,
                LichSuTieuThu.ngay_ban <= end_date,
            )
            .group_by(
                LichSuTieuThu.ma_san_pham
            )
        ).all()

        # Không tự lấy dữ liệu tháng khác khi kỳ đã chọn rỗng.
        sold_map = {
            row.ma_san_pham: Decimal(
                str(row.total_sold or 0)
            )
            for row in product_sales
        }

        boms = db.execute(
            select(
                CongThuc,
                ChiTietCongThuc,
                NguyenLieu,
            )
            .join(
                ChiTietCongThuc,
                ChiTietCongThuc.ma_cong_thuc
                == CongThuc.ma_cong_thuc,
            )
            .join(
                NguyenLieu,
                NguyenLieu.ma_nguyen_lieu
                == ChiTietCongThuc.ma_nguyen_lieu,
            )
            .where(
                CongThuc.trang_thai == "DANG_SU_DUNG",
                NguyenLieu.trang_thai == "DANG_SU_DUNG",
            )
        ).all()

        material_totals = defaultdict(
            lambda: {
                "ma_nguyen_lieu": "",
                "ten_nguyen_lieu": "",
                "don_vi_do_luong": "",
                "so_luong": Decimal("0"),
            }
        )

        all_materials = db.scalars(
            select(NguyenLieu)
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
        ).all()

        for material in all_materials:
            material_totals[material.ma_nguyen_lieu] = {
                "ma_nguyen_lieu": material.ma_nguyen_lieu,
                "ten_nguyen_lieu": material.ten_nguyen_lieu,
                "don_vi_do_luong": material.don_vi_do_luong,
                "so_luong": Decimal("0"),
            }

        # Giữ cách quy đổi BOM của mã nguồn hiện có.
        # Đây là lượng ước tính từ doanh số và công thức,
        # không phải lượng xuất kho thực tế.
        for bom, detail, material in boms:
            sold_qty = sold_map.get(
                bom.ma_san_pham,
                Decimal("0"),
            )

            if sold_qty <= 0:
                continue

            he_so = (
                bom.he_so_thu_hoi
                if (
                    bom.he_so_thu_hoi
                    and bom.he_so_thu_hoi > 0
                )
                else Decimal("1.0")
            )

            ty_le = (
                detail.ty_le_phoi_tron
                if detail.ty_le_phoi_tron is not None
                else Decimal("0")
            )

            needed = (sold_qty / he_so) * ty_le

            material_totals[
                material.ma_nguyen_lieu
            ]["so_luong"] += needed

        return list(material_totals.values())

    # ==================== SẢN PHẨM TIÊU THỤ ====================

    @staticmethod
    def get_product_consumption_by_period(
        db,
        start_date: date,
        end_date: date,
    ):
        return db.execute(
            select(
                SanPham.ma_san_pham,
                SanPham.ten_san_pham,
                SanPham.don_vi_tinh,
                func.coalesce(
                    func.sum(
                        LichSuTieuThu.so_luong_ban
                    ),
                    0,
                ).label("so_luong"),
                func.coalesce(
                    func.sum(
                        func.coalesce(
                            LichSuTieuThu.gia_ban_sau_giam,
                            LichSuTieuThu.gia_goc,
                            0,
                        )
                        * LichSuTieuThu.so_luong_ban
                    ),
                    0,
                ).label("doanh_thu"),
                func.count(
                    func.distinct(
                        LichSuTieuThu.ma_don_hang
                    )
                ).label("so_don"),
            )
            .outerjoin(
                LichSuTieuThu,
                and_(
                    LichSuTieuThu.ma_san_pham
                    == SanPham.ma_san_pham,
                    LichSuTieuThu.ngay_ban >= start_date,
                    LichSuTieuThu.ngay_ban <= end_date,
                ),
            )
            .group_by(
                SanPham.ma_san_pham,
                SanPham.ten_san_pham,
                SanPham.don_vi_tinh,
            )
            .order_by(
                desc("so_luong")
            )
        ).all()

    @staticmethod
    def get_order_formula_usage_by_period(
        db,
        start_date: date,
        end_date: date,
    ):
        sales = (
            select(
                LichSuTieuThu.ma_san_pham.label("ma_san_pham"),
                func.sum(
                    LichSuTieuThu.so_luong_ban
                ).label("so_luong_ban"),
            )
            .where(
                LichSuTieuThu.ngay_ban >= start_date,
                LichSuTieuThu.ngay_ban <= end_date,
            )
            .group_by(LichSuTieuThu.ma_san_pham)
            .subquery()
        )

        return db.execute(
            select(
                CongThuc.ma_cong_thuc,
                CongThuc.ten_cong_thuc,
                CongThuc.he_so_thu_hoi,
                SanPham.ten_san_pham,
                func.coalesce(
                    sales.c.so_luong_ban,
                    0,
                ).label("so_luong_san_pham_ban"),
            )
            .join(
                SanPham,
                SanPham.ma_san_pham == CongThuc.ma_san_pham,
            )
            .outerjoin(
                sales,
                sales.c.ma_san_pham == CongThuc.ma_san_pham,
            )
            .where(CongThuc.trang_thai == "DANG_SU_DUNG")
            .order_by(desc("so_luong_san_pham_ban"))
        ).all()

    # ==================== SO SÁNH PROPHET ====================

    @staticmethod
    def get_prophet_comparison(
        db,
        from_date: date,
        to_date: date,
        ma_san_pham: str | None = None,
    ):
        query = (
            select(
                ChiTietLichSuDuBao,
                LichSuDuBao,
            )
            .join(
                LichSuDuBao,
                LichSuDuBao.ma_lich_su_du_bao
                == ChiTietLichSuDuBao.ma_lich_su_du_bao,
            )
            .where(
                ChiTietLichSuDuBao.tu_ngay >= from_date,
                ChiTietLichSuDuBao.den_ngay
                <= min(to_date, date.today()),
                ChiTietLichSuDuBao.ma_san_pham.is_not(None),
                ChiTietLichSuDuBao.ma_nguyen_lieu.is_(None),
            )
        )

        if hasattr(LichSuDuBao, "trang_thai"):
            query = query.where(
                LichSuDuBao.trang_thai == "THANH_CONG"
            )

        if hasattr(LichSuDuBao, "cau_hinh_mo_hinh"):
            query = query.where(
                LichSuDuBao.cau_hinh_mo_hinh == "PROPHET"
            )

        if ma_san_pham:
            query = query.where(
                ChiTietLichSuDuBao.ma_san_pham
                == ma_san_pham
            )

        rows = db.execute(query).all()

        # Mỗi sản phẩm/tuần chỉ lấy một lần dự báo hợp lệ.
        chosen = {}

        for forecast, history in rows:
            created = (
                getattr(
                    history,
                    "thoi_gian_chay",
                    None,
                )
                or getattr(
                    history,
                    "thoi_gian_tao",
                    None,
                )
            )

            if created is None:
                continue

            created_day = (
                created.date()
                if isinstance(created, datetime)
                else created
            )

            # Không dùng lần chạy tạo sau khi tuần đã bắt đầu.
            if created_day >= forecast.tu_ngay:
                continue

            if isinstance(created, datetime):
                if created.tzinfo is None:
                    moment = created.replace(
                        tzinfo=timezone.utc
                    )
                else:
                    moment = created.astimezone(
                        timezone.utc
                    )
            else:
                moment = datetime.combine(
                    created,
                    datetime.min.time(),
                    tzinfo=timezone.utc,
                )

            key = (
                forecast.ma_san_pham,
                forecast.tu_ngay,
                forecast.den_ngay,
            )

            rank = (
                moment,
                str(history.ma_lich_su_du_bao),
            )

            if (
                key not in chosen
                or rank > chosen[key][0]
            ):
                chosen[key] = (rank, forecast)

        period_totals = {}
        product_totals = {}

        for (
            code,
            start,
            end,
        ), (_, forecast) in sorted(chosen.items()):
            actual = int(
                db.scalar(
                    select(
                        func.coalesce(
                            func.sum(
                                LichSuTieuThu.so_luong_ban
                            ),
                            0,
                        )
                    )
                    .where(
                        LichSuTieuThu.ma_san_pham == code,
                        LichSuTieuThu.ngay_ban >= start,
                        LichSuTieuThu.ngay_ban <= end,
                    )
                )
                or 0
            )

            predicted = float(
                forecast.so_luong_du_bao or 0
            )

            value = period_totals.setdefault(
                (start, end),
                {
                    "actual": 0,
                    "forecast": 0.0,
                    "lower": 0.0,
                    "upper": 0.0,
                    "has_lower": True,
                    "has_upper": True,
                },
            )

            value["actual"] += actual
            value["forecast"] += predicted

            if forecast.can_duoi is None:
                value["has_lower"] = False
            else:
                value["lower"] += float(
                    forecast.can_duoi
                )

            if forecast.can_tren is None:
                value["has_upper"] = False
            else:
                value["upper"] += float(
                    forecast.can_tren
                )

            product = product_totals.setdefault(
                code,
                {
                    "actual": 0,
                    "forecast": 0.0,
                },
            )

            product["actual"] += actual
            product["forecast"] += predicted

        periods_result = []

        for (start, end), value in sorted(
            period_totals.items()
        ):
            actual = value["actual"]
            predicted = value["forecast"]
            difference = actual - predicted

            percentage = (
                round(difference / actual * 100, 2)
                if actual
                else (-100.0 if predicted else 0.0)
            )

            if difference > 0:
                evaluation = "VUOT_DU_BAO"
            elif difference < 0:
                evaluation = "DUOI_DU_BAO"
            else:
                evaluation = "KHOP"

            periods_result.append(
                {
                    "nhan_thoi_gian": (
                        f"{start:%d/%m} - {end:%d/%m/%Y}"
                    ),
                    "tu_ngay": start,
                    "den_ngay": end,
                    "thuc_te": actual,
                    "du_bao_prophet": predicted,
                    "can_duoi": (
                        value["lower"]
                        if value["has_lower"]
                        else None
                    ),
                    "can_tren": (
                        value["upper"]
                        if value["has_upper"]
                        else None
                    ),
                    "chenh_lech": difference,
                    "phan_tram_lech": percentage,
                    "danh_gia": evaluation,
                }
            )

        names = {}

        if chosen:
            products = db.scalars(
                select(SanPham)
            ).all()

            names = {
                product.ma_san_pham: product.ten_san_pham
                for product in products
            }

        products_result = []

        for code, value in sorted(
            product_totals.items()
        ):
            actual = value["actual"]
            predicted = value["forecast"]
            difference = actual - predicted

            percentage = (
                round(difference / actual * 100, 2)
                if actual
                else (-100.0 if predicted else 0.0)
            )

            products_result.append(
                {
                    "ma_san_pham": code,
                    "ten_san_pham": names.get(code, code),
                    "thuc_te": actual,
                    "du_bao_prophet": predicted,
                    "chenh_lech": difference,
                    "phan_tram_lech": percentage,
                }
            )

        return periods_result, products_result

    # ==================== THỐNG KÊ TÀI KHOẢN ====================

    @staticmethod
    def get_account_statistics(db):
        users = db.scalars(
            select(User)
        ).all()

        total = len(users)

        active = sum(
            1
            for user in users
            if user.trang_thai == "HOAT_DONG"
        )

        inactive = total - active

        roles_count = defaultdict(int)

        for user in users:
            roles_count[user.vai_tro] += 1

        role_labels = {
            "ADMIN": "Quản trị viên",
            "QUAN_LY_BAN_HANG": "Quản lý bán hàng",
            "QUAN_LY_MUA_HANG": "Quản lý mua hàng",
            "NHAN_VIEN_BAN_HANG": "Nhân viên bán hàng",
            "NHAN_VIEN_MUA_HANG": "Nhân viên mua hàng",
        }

        distribution = []

        for role, count in sorted(
            roles_count.items(),
            key=lambda item: -item[1],
        ):
            distribution.append(
                {
                    "vai_tro": role,
                    "label": role_labels.get(role, role),
                    "so_luong": count,
                    "ty_le": (
                        round(count / total * 100, 1)
                        if total > 0
                        else 0.0
                    ),
                }
            )

        from src.repositories.nhat_ky_repository import NhatKyRepository
        if NhatKyRepository().has_table(db):
            login_rows = db.execute(
                select(
                    User.ho_ten,
                    User.ma_nguoi_dung,
                    User.vai_tro,
                    NhatKyHoatDong.thoi_gian,
                )
                .join(
                    NhatKyHoatDong,
                    NhatKyHoatDong.ma_nguoi_dung
                    == User.ma_nguoi_dung,
                )
                .where(
                    NhatKyHoatDong.hanh_dong == "DANG_NHAP",
                    NhatKyHoatDong.ket_qua == "THANH_CONG",
                )
                .order_by(desc(NhatKyHoatDong.thoi_gian))
                .limit(50)
            ).all()
        else:
            login_rows = []

        return {
            "tong_tai_khoan": total,
            "dang_hoat_dong": active,
            "ngung_hoat_dong": inactive,
            "ty_le_hoat_dong": (
                round(active / total * 100, 1)
                if total > 0
                else 0.0
            ),
            "vai_tro_distribution": distribution,
            "recent_logins": [
                {
                    "ten_tai_khoan": row.ho_ten,
                    "ma_nguoi_dung": row.ma_nguoi_dung,
                    "vai_tro": row.vai_tro,
                    "thoi_gian_dang_nhap": row.thoi_gian,
                }
                for row in login_rows
            ],
        }

    # ==================== ĐƠN HÀNG BÁN ====================

    @staticmethod
    def get_order_stats_by_period(
        db,
        start_date: date,
        end_date: date,
    ):
        rows = db.execute(
            select(
                LichSuTieuThu.ma_don_hang,
                func.min(
                    LichSuTieuThu.ngay_ban
                ).label("ngay_ban"),
                func.sum(
                    LichSuTieuThu.so_luong_ban
                ).label("tong_so_luong"),
                func.sum(
                    func.coalesce(
                        LichSuTieuThu.gia_ban_sau_giam,
                        LichSuTieuThu.gia_goc,
                        0,
                    )
                    * LichSuTieuThu.so_luong_ban
                ).label("tong_gia_tri"),
                func.count(
                    func.distinct(
                        LichSuTieuThu.ma_san_pham
                    )
                ).label("so_mat_hang"),
            )
            .where(
                LichSuTieuThu.ngay_ban >= start_date,
                LichSuTieuThu.ngay_ban <= end_date,
            )
            .group_by(
                LichSuTieuThu.ma_don_hang
            )
            .order_by(
                desc("tong_gia_tri")
            )
        ).all()

        orders_list = []

        for row in rows:
            orders_list.append(
                {
                    "ma_don_hang": row.ma_don_hang,
                    "ngay_ban": row.ngay_ban,
                    "tong_so_luong": int(
                        row.tong_so_luong or 0
                    ),
                    "tong_gia_tri": float(
                        row.tong_gia_tri or 0
                    ),
                    "so_mat_hang": int(
                        row.so_mat_hang or 0
                    ),
                }
            )

        timeline_dict = defaultdict(
            lambda: {
                "so_don_hang": 0,
                "tong_so_luong": 0,
                "tong_gia_tri": 0.0,
            }
        )

        for order in orders_list:
            if order["ngay_ban"] is None:
                continue

            day = order["ngay_ban"]

            timeline_dict[day]["so_don_hang"] += 1

            timeline_dict[day]["tong_so_luong"] += (
                order["tong_so_luong"]
            )

            timeline_dict[day]["tong_gia_tri"] += (
                order["tong_gia_tri"]
            )

        timeline = [
            {
                "nhan_thoi_gian": day.strftime(
                    "%d/%m/%Y"
                ),
                **values,
            }
            for day, values in sorted(
                timeline_dict.items(),
                key=lambda item: item[0],
            )
        ]

        top_orders = sorted(
            orders_list,
            key=lambda item: item["tong_gia_tri"],
            reverse=True,
        )[:10]

        least_orders = sorted(
            orders_list,
            key=lambda item: item["tong_gia_tri"],
        )[:10]

        total_orders = len(orders_list)

        total_qty = sum(
            item["tong_so_luong"]
            for item in orders_list
        )

        total_revenue = sum(
            item["tong_gia_tri"]
            for item in orders_list
        )

        average_revenue = (
            total_revenue / total_orders
            if total_orders > 0
            else 0.0
        )

        return {
            "top_orders": top_orders,
            "least_orders": least_orders,
            "timeline": timeline,
            "summary": {
                "tong_so_don_hang": total_orders,
                "tong_so_luong_ban": total_qty,
                "tong_doanh_thu": round(
                    total_revenue,
                    2,
                ),
                "gia_tri_trung_binh_don": round(
                    average_revenue,
                    2,
                ),
                "don_hang_lon_nhat": (
                    top_orders[0]
                    if top_orders
                    else None
                ),
                "don_hang_nho_nhat": (
                    least_orders[0]
                    if least_orders
                    else None
                ),
            },
        }

    # ==================== CÔNG THỨC / BOM ====================

    @staticmethod
    def get_formula_bom_stats(db):
        total_bom = (
            db.scalar(
                select(
                    func.count(
                        func.distinct(
                            CongThuc.ma_cong_thuc
                        )
                    )
                )
                .where(
                    CongThuc.trang_thai == "DANG_SU_DUNG"
                )
            )
            or 0
        )

        all_materials = db.scalars(
            select(NguyenLieu)
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
        ).all()

        usage_rows = db.execute(
            select(
                NguyenLieu.ma_nguyen_lieu,
                NguyenLieu.ten_nguyen_lieu,
                NguyenLieu.don_vi_do_luong,
                func.count(
                    func.distinct(
                        ChiTietCongThuc.ma_cong_thuc
                    )
                ).label("so_ct"),
                func.coalesce(
                    func.avg(
                        ChiTietCongThuc.ty_le_phoi_tron
                    ),
                    0,
                ).label("ty_le_tb"),
            )
            .join(
                ChiTietCongThuc,
                ChiTietCongThuc.ma_nguyen_lieu
                == NguyenLieu.ma_nguyen_lieu,
            )
            .join(
                CongThuc,
                and_(
                    CongThuc.ma_cong_thuc
                    == ChiTietCongThuc.ma_cong_thuc,
                    CongThuc.trang_thai
                    == "DANG_SU_DUNG",
                ),
            )
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
            .group_by(
                NguyenLieu.ma_nguyen_lieu,
                NguyenLieu.ten_nguyen_lieu,
                NguyenLieu.don_vi_do_luong,
            )
        ).all()

        used_map = {
            row.ma_nguyen_lieu: {
                "ma_nguyen_lieu": row.ma_nguyen_lieu,
                "ten_nguyen_lieu": row.ten_nguyen_lieu,
                "don_vi_do_luong": row.don_vi_do_luong,
                "so_cong_thuc_tham_gia": int(row.so_ct),
                "ty_le_phoi_tron_tb": round(
                    float(row.ty_le_tb) * 100,
                    2,
                ),
                "trang_thai": "DANG_DUNG",
            }
            for row in usage_rows
        }

        unused_list = []

        for material in all_materials:
            if material.ma_nguyen_lieu in used_map:
                continue

            unused_list.append(
                {
                    "ma_nguyen_lieu": material.ma_nguyen_lieu,
                    "ten_nguyen_lieu": material.ten_nguyen_lieu,
                    "don_vi_do_luong": material.don_vi_do_luong,
                    "so_cong_thuc_tham_gia": 0,
                    "ty_le_phoi_tron_tb": 0.0,
                    "trang_thai": "CHUA_SU_DUNG",
                }
            )

        used_list = list(used_map.values())

        sorted_desc = sorted(
            used_list,
            key=lambda item: item["so_cong_thuc_tham_gia"],
            reverse=True,
        )

        sorted_asc = sorted(
            used_list,
            key=lambda item: item["so_cong_thuc_tham_gia"],
        )

        return {
            "tong_so_cong_thuc": total_bom,
            "tong_so_nguyen_lieu": len(all_materials),
            "nguyen_lieu_trong_bom": len(used_list),
            "nguyen_lieu_chua_dung": len(unused_list),
            "top_materials": sorted_desc[:10],
            "least_materials": sorted_asc[:10],
            "unused_materials": unused_list,
        }

    # ==================== TỒN KHO VÀ LƯỢNG BOOK ====================

    @staticmethod
    def get_inventory_stock_stats(db):
        latest = (
            select(
                TonKhoNguyenLieu.ma_nguyen_lieu.label(
                    "material_code"
                ),
                func.max(
                    TonKhoNguyenLieu.ngay_ghi_nhan
                ).label("recorded_date"),
            )
            .group_by(
                TonKhoNguyenLieu.ma_nguyen_lieu
            )
            .subquery()
        )

        rows = db.execute(
            select(TonKhoNguyenLieu, NguyenLieu)
            .join(
                latest,
                and_(
                    TonKhoNguyenLieu.ma_nguyen_lieu
                    == latest.c.material_code,
                    TonKhoNguyenLieu.ngay_ghi_nhan
                    == latest.c.recorded_date,
                ),
            )
            .join(
                NguyenLieu,
                NguyenLieu.ma_nguyen_lieu
                == TonKhoNguyenLieu.ma_nguyen_lieu,
            )
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
        ).all()

        items = []
        alerts = []

        total_book = 0.0
        total_actual = 0.0

        for stock, material in rows:
            actual = float(
                stock.ton_kho_thuc_te or 0
            )

            booked = float(
                stock.so_luong_book or 0
            )

            available = float(
                stock.ton_kho_kha_dung or 0
            )

            safety = float(
                stock.ton_kho_an_toan or 0
            )

            shortage = max(
                0.0,
                safety - available,
            )

            total_actual += actual
            total_book += booked

            if available <= 0:
                level = "KHAN_CAP"
            elif available < safety:
                level = "CANH_BAO"
            else:
                level = "AN_TOAN"

            item = {
                "ma_nguyen_lieu": material.ma_nguyen_lieu,
                "ten_nguyen_lieu": material.ten_nguyen_lieu,
                "don_vi_do_luong": material.don_vi_do_luong,
                "so_luong_book": booked,
                "ton_kho_thuc_te": actual,
                "ton_kho_kha_dung": available,
                "ton_kho_an_toan": safety,
                "so_luong_thieu_an_toan": shortage,
                "muc_do_canh_bao": level,
            }

            items.append(item)

            if level in ("KHAN_CAP", "CANH_BAO"):
                alerts.append(item)

        return {
            "tong_nguyen_lieu": len(items),
            "tong_luong_book": round(total_book, 2),
            "tong_ton_thuc_te": round(total_actual, 2),
            "top_booked": sorted(
                items,
                key=lambda item: item["so_luong_book"],
                reverse=True,
            )[:10],
            "least_booked": sorted(
                items,
                key=lambda item: item["so_luong_book"],
            )[:10],
            "top_actual_stock": sorted(
                items,
                key=lambda item: item["ton_kho_thuc_te"],
                reverse=True,
            )[:10],
            "least_actual_stock": sorted(
                items,
                key=lambda item: item["ton_kho_thuc_te"],
            )[:10],
            "alerts": alerts,
        }

    # ==================== NGUYÊN LIỆU CUNG ỨNG ====================

    @staticmethod
    def get_supplier_materials_stats(db):
        rows = db.execute(
            select(
                NguyenLieuNhaCungCap,
                NguyenLieu,
                NhaCungCap,
            )
            .join(
                NguyenLieu,
                NguyenLieu.ma_nguyen_lieu
                == NguyenLieuNhaCungCap.ma_nguyen_lieu,
            )
            .join(
                NhaCungCap,
                NhaCungCap.ma_ncc
                == NguyenLieuNhaCungCap.ma_ncc,
            )
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG",
                NhaCungCap.trang_thai == "DANG_HOAT_DONG",
            )
        ).all()

        details = []

        material_map = defaultdict(
            lambda: {
                "ten_nguyen_lieu": "",
                "nccs": set(),
                "prices": [],
            }
        )

        for mapping, material, supplier in rows:
            price = float(
                mapping.don_gia_nguyen_lieu or 0
            )

            lead_time = int(
                mapping.lead_time_ngay or 0
            )

            quality = (
                float(mapping.ty_le_chat_luong_dat) * 100
                if mapping.ty_le_chat_luong_dat is not None
                else None
            )

            ontime = (
                float(mapping.ty_le_giao_dung_han) * 100
                if mapping.ty_le_giao_dung_han is not None
                else None
            )

            full = (
                float(mapping.ty_le_giao_du) * 100
                if mapping.ty_le_giao_du is not None
                else None
            )

            details.append(
                {
                    "ma_nguyen_lieu": material.ma_nguyen_lieu,
                    "ten_nguyen_lieu": material.ten_nguyen_lieu,
                    "ma_ncc": supplier.ma_ncc,
                    "ten_ncc": supplier.ten_ncc,
                    "don_gia": price,
                    "lead_time_ngay": lead_time,
                    "ty_le_chat_luong_dat": (
                        round(quality, 1)
                        if quality is not None
                        else None
                    ),
                    "ty_le_giao_dung_han": (
                        round(ontime, 1)
                        if ontime is not None
                        else None
                    ),
                    "ty_le_giao_du": (
                        round(full, 1)
                        if full is not None
                        else None
                    ),
                }
            )

            info = material_map[
                material.ma_nguyen_lieu
            ]

            info["ten_nguyen_lieu"] = (
                material.ten_nguyen_lieu
            )

            info["nccs"].add(
                supplier.ma_ncc
            )

            info["prices"].append(price)

        summary_by_material = []

        for code, info in material_map.items():
            summary_by_material.append(
                {
                    "ma_nguyen_lieu": code,
                    "ten_nguyen_lieu": info["ten_nguyen_lieu"],
                    "so_nha_cung_cap": len(info["nccs"]),
                    "don_gia_thap_nhat": (
                        min(info["prices"])
                        if info["prices"]
                        else 0.0
                    ),
                    "don_gia_cao_nhat": (
                        max(info["prices"])
                        if info["prices"]
                        else 0.0
                    ),
                }
            )

        quality_items = [
            item
            for item in details
            if item["ty_le_chat_luong_dat"] is not None
        ]

        ontime_items = [
            item
            for item in details
            if item["ty_le_giao_dung_han"] is not None
        ]

        return {
            "all_items": details,
            "top_supplied_materials": sorted(
                summary_by_material,
                key=lambda item: item["so_nha_cung_cap"],
                reverse=True,
            )[:10],
            "least_supplied_materials": sorted(
                summary_by_material,
                key=lambda item: item["so_nha_cung_cap"],
            )[:10],
            "highest_price_items": sorted(
                details,
                key=lambda item: item["don_gia"],
                reverse=True,
            )[:10],
            "lowest_price_items": sorted(
                details,
                key=lambda item: item["don_gia"],
            )[:10],
            "best_quality_items": sorted(
                quality_items,
                key=lambda item: item["ty_le_chat_luong_dat"],
                reverse=True,
            )[:10],
            "worst_quality_items": sorted(
                quality_items,
                key=lambda item: item["ty_le_chat_luong_dat"],
            )[:10],
            "best_ontime_items": sorted(
                ontime_items,
                key=lambda item: item["ty_le_giao_dung_han"],
                reverse=True,
            )[:10],
            "worst_ontime_items": sorted(
                ontime_items,
                key=lambda item: item["ty_le_giao_dung_han"],
            )[:10],
        }

    # ==================== GỢI Ý NHÀ CUNG CẤP ====================

    @staticmethod
    def get_supplier_suggestion_stats(db):
        # Chưa có nguồn lưu sự kiện gợi ý trong các model
        # đã được cung cấp. Không mô phỏng số lần từ điểm NCC.
        total = int(
            db.scalar(
                select(func.count())
                .select_from(NhaCungCap)
                .where(
                    NhaCungCap.trang_thai
                    == "DANG_HOAT_DONG"
                )
            )
            or 0
        )

        return {
            "co_du_lieu_lich_su": False,
            "thong_bao": (
                "Chưa có nguồn lịch sử gợi ý NCC. "
                "Chưa thể thống kê nhiều nhất, ít nhất "
                "hoặc chưa từng được gợi ý."
            ),
            "tong_ncc": total,
            "so_ncc_duoc_goi_y": None,
            "so_ncc_khong_goi_y": None,
            "top_suggested": [],
            "least_suggested": [],
            "not_suggested": [],
        }

    # ==================== NHU CẦU NGUYÊN LIỆU ====================

    @staticmethod
    def get_material_demand_stats(db):
        materials = db.scalars(
            select(NguyenLieu)
            .where(
                NguyenLieu.trang_thai == "DANG_SU_DUNG"
            )
        ).all()

        latest = (
            select(
                TonKhoNguyenLieu.ma_nguyen_lieu.label(
                    "material_code"
                ),
                func.max(
                    TonKhoNguyenLieu.ngay_ghi_nhan
                ).label("recorded_date"),
            )
            .group_by(
                TonKhoNguyenLieu.ma_nguyen_lieu
            )
            .subquery()
        )

        stocks = {
            stock.ma_nguyen_lieu: stock
            for stock in db.scalars(
                select(TonKhoNguyenLieu)
                .join(
                    latest,
                    and_(
                        TonKhoNguyenLieu.ma_nguyen_lieu
                        == latest.c.material_code,
                        TonKhoNguyenLieu.ngay_ghi_nhan
                        == latest.c.recorded_date,
                    ),
                )
            ).all()
        }

        history = (
            DashboardRepository._latest_successful_history(
                db
            )
        )

        forecast_sums = {}

        if history is not None:
            forecast_sums = dict(
                db.execute(
                    select(
                        ChiTietLichSuDuBao.ma_nguyen_lieu,
                        func.sum(
                            func.coalesce(
                                ChiTietLichSuDuBao.so_luong_du_bao_kg,
                                ChiTietLichSuDuBao.so_luong_du_bao,
                                0,
                            )
                        ),
                    )
                    .where(
                        ChiTietLichSuDuBao.ma_lich_su_du_bao
                        == history.ma_lich_su_du_bao,
                        ChiTietLichSuDuBao.ma_nguyen_lieu.is_not(
                            None
                        ),
                    )
                    .group_by(
                        ChiTietLichSuDuBao.ma_nguyen_lieu
                    )
                ).all()
            )

        if not forecast_sums:
            return {
                "co_du_lieu_du_bao": False,
                "thong_bao": (
                    "Lần dự báo mới nhất chưa có dữ liệu "
                    "quy đổi nguyên liệu. Cần chạy chức năng "
                    "Nhu cầu nguyên liệu để có số liệu thực."
                ),
                "ma_lich_su_du_bao": (
                    history.ma_lich_su_du_bao
                    if history
                    else None
                ),
                "tong_nhu_cau": 0,
                "tong_can_mua": 0,
                "top_demand": [],
                "least_demand": [],
                "all_demand": [],
            }

        items = []
        total_demand = 0.0
        total_need_buy = 0.0

        for material in materials:
            stock = stocks.get(
                material.ma_nguyen_lieu
            )

            available = (
                float(stock.ton_kho_kha_dung or 0)
                if stock
                else 0.0
            )

            safety = (
                float(stock.ton_kho_an_toan or 0)
                if stock
                else 0.0
            )

            forecast_qty = float(
                forecast_sums.get(
                    material.ma_nguyen_lieu
                )
                or 0
            )

            need_buy = max(
                0.0,
                forecast_qty + safety - available,
            )

            total_demand += forecast_qty
            total_need_buy += need_buy

            items.append(
                {
                    "ma_nguyen_lieu": material.ma_nguyen_lieu,
                    "ten_nguyen_lieu": material.ten_nguyen_lieu,
                    "don_vi_do_luong": material.don_vi_do_luong,
                    "nhu_cau": round(forecast_qty, 2),
                    "ton_kho_kha_dung": round(available, 2),
                    "ton_kho_an_toan": round(safety, 2),
                    "luong_can_mua": round(need_buy, 2),
                }
            )

        sorted_desc = sorted(
            items,
            key=lambda item: item["nhu_cau"],
            reverse=True,
        )

        sorted_asc = sorted(
            items,
            key=lambda item: item["nhu_cau"],
        )

        return {
            "co_du_lieu_du_bao": True,
            "thong_bao": None,
            "ma_lich_su_du_bao": history.ma_lich_su_du_bao,
            "tong_nhu_cau": round(total_demand, 2),
            "tong_can_mua": round(total_need_buy, 2),
            "top_demand": sorted_desc[:10],
            "least_demand": sorted_asc[:10],
            "all_demand": sorted_desc,
        }

    # ==================== ĐƠN MUA NGUYÊN LIỆU ====================

    @staticmethod
    def get_purchase_order_stats(db):
        included_statuses = (
            "CHUA_DUYET",
            "DA_DUYET",
            "DA_NHAN_HANG",
        )

        rows = db.execute(
            select(
                NguyenLieu.ma_nguyen_lieu,
                NguyenLieu.ten_nguyen_lieu,
                NguyenLieu.don_vi_do_luong,
                func.coalesce(
                    func.sum(
                        ChiTietDonMua.so_luong_mua
                    ),
                    0,
                ).label("tong_so_luong"),
                func.coalesce(
                    func.sum(
                        ChiTietDonMua.so_luong_mua
                        * ChiTietDonMua.don_gia_vnd_kg
                    ),
                    0,
                ).label("tong_tien"),
                func.count(
                    func.distinct(
                        ChiTietDonMua.ma_don_mua
                    )
                ).label("so_don"),
            )
            .join(
                ChiTietDonMua,
                ChiTietDonMua.ma_nguyen_lieu
                == NguyenLieu.ma_nguyen_lieu,
            )
            .join(
                DonMuaNguyenLieu,
                DonMuaNguyenLieu.ma_don_mua
                == ChiTietDonMua.ma_don_mua,
            )
            .where(
                DonMuaNguyenLieu.trang_thai.in_(
                    included_statuses
                )
            )
            .group_by(
                NguyenLieu.ma_nguyen_lieu,
                NguyenLieu.ten_nguyen_lieu,
                NguyenLieu.don_vi_do_luong,
            )
            .order_by(
                desc("tong_so_luong")
            )
        ).all()

        total_orders = int(
            db.scalar(
                select(
                    func.count(
                        func.distinct(
                            ChiTietDonMua.ma_don_mua
                        )
                    )
                )
                .select_from(ChiTietDonMua)
                .join(
                    DonMuaNguyenLieu,
                    DonMuaNguyenLieu.ma_don_mua
                    == ChiTietDonMua.ma_don_mua,
                )
                .join(
                    NguyenLieu,
                    NguyenLieu.ma_nguyen_lieu
                    == ChiTietDonMua.ma_nguyen_lieu,
                )
                .where(
                    DonMuaNguyenLieu.trang_thai.in_(
                        included_statuses
                    )
                )
            )
            or 0
        )

        items = []
        total_money = 0.0

        for row in rows:
            quantity = float(
                row.tong_so_luong or 0
            )

            amount = float(
                row.tong_tien or 0
            )

            total_money += amount

            items.append(
                {
                    "ma_nguyen_lieu": row.ma_nguyen_lieu,
                    "ten_nguyen_lieu": row.ten_nguyen_lieu,
                    "don_vi_do_luong": row.don_vi_do_luong,
                    "so_luong_mua": quantity,
                    "tong_gia_tri": amount,
                    "so_don_mua": int(row.so_don or 0),
                }
            )

        sorted_desc = sorted(
            items,
            key=lambda item: item["so_luong_mua"],
            reverse=True,
        )

        sorted_asc = sorted(
            items,
            key=lambda item: item["so_luong_mua"],
        )

        return {
            "tong_gia_tri_mua": round(total_money, 2),
            "tong_so_don_mua": total_orders,
            "top_purchased": sorted_desc[:10],
            "least_purchased": sorted_asc[:10],
            "all_purchased": sorted_desc,
        }

    # ==================== CẤU HÌNH VÀ NHẬT KÝ ====================

    @staticmethod
    def get_config_audit_stats(db):
        total_logs = (
            db.scalar(
                select(
                    func.count(
                        NhatKyHoatDong.ma_nhat_ky
                    )
                )
            )
            or 0
        )

        user_rows = db.execute(
            select(
                func.coalesce(
                    NhatKyHoatDong.ten_nguoi_thao_tac,
                    "Hệ thống",
                ).label("user_name"),
                func.count().label("cnt"),
            )
            .group_by("user_name")
            .order_by(desc("cnt"))
            .limit(10)
        ).all()

        feature_rows = db.execute(
            select(
                func.coalesce(
                    NhatKyHoatDong.chuc_nang,
                    "Chung",
                ).label("feature"),
                func.count().label("cnt"),
            )
            .group_by("feature")
            .order_by(desc("cnt"))
            .limit(10)
        ).all()

        success_count = (
            db.scalar(
                select(
                    func.count(
                        NhatKyHoatDong.ma_nhat_ky
                    )
                )
                .where(
                    NhatKyHoatDong.ket_qua
                    == "THANH_CONG"
                )
            )
            or 0
        )

        success_rate = (
            round(success_count / total_logs * 100, 1)
            if total_logs > 0
            else 100.0
        )

        return {
            "tong_nhat_ky": total_logs,
            "top_users": [
                {
                    "ten_nguoi_thao_tac": row.user_name,
                    "so_lan": int(row.cnt),
                }
                for row in user_rows
            ],
            "top_features": [
                {
                    "chuc_nang": row.feature,
                    "so_lan": int(row.cnt),
                }
                for row in feature_rows
            ],
            "ty_le_thanh_cong": success_rate,
        }

