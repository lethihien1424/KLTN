# ###D:\KLTN\KLTN\backend\src\services\forecasting\du_bao_service.py
import json

from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from zoneinfo import ZoneInfo

import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
from src.models.ctkm_model import ChiTietCTKM, ChuongTrinhKhuyenMai
from src.models.danh_gia_mo_hinh import DanhGiaMoHinh
from src.models.lich_su_du_bao import LichSuDuBao
from src.models.lich_su_tieu_thu_model import LichSuTieuThu

from src.repositories.du_bao_repository import DuBaoRepository
from src.repositories.danh_gia_mo_hinh_repository import (
    DanhGiaMoHinhRepository,
)
from src.repositories.ngay_le_repository import NgayLeRepository
from src.repositories.tieu_thu_repository import TieuThuRepository

from src.schemas.du_bao_schema import DuBaoRequest, DuBaoResponse

from src.services.forecasting.backtesting import Backtesting
from src.services.forecasting.chuan_bi_du_lieu import ChuanBiDuLieu
from src.services.forecasting.prophet_co_ban import ProphetCoBan
from src.services.forecasting.prophet_ngay_le import ProphetNgayLe


TIMEZONE = ZoneInfo("Asia/Ho_Chi_Minh")

TRANG_THAI_DON_HOP_LE = ("DA_GIAO_HANG", "CHO_GIAO_HANG")

# Biến khuyến mãi chỉ được đưa vào Prophet khi lịch sử có đủ
# tuần CÓ và KHÔNG CÓ khuyến mãi để mô hình học được tác động.
MIN_TUAN_KHUYEN_MAI = 3


def _to_date(value) -> date:
    if isinstance(value, datetime):
        return value.date()
    return value


def _fmt_day(value) -> str:
    return pd.Timestamp(value).strftime("%d/%m/%Y")


def _fmt_short(value) -> str:
    return pd.Timestamp(value).strftime("%d/%m")


class DuBaoService:

    @staticmethod
    def get_catalog(db: Session) -> list[dict]:
        return [
            {
                "ma": product.ma_san_pham,
                "ten": product.ten_san_pham,
            }
            for product in DuBaoRepository.lay_san_pham(db)
        ]

    @staticmethod
    def _round_quantity(value: float) -> int:
        return int(
            Decimal(str(max(0.0, float(value)))).quantize(
                Decimal("1"),
                rounding=ROUND_HALF_UP,
            )
        )

    @staticmethod
    def _weight_kg(product) -> Decimal:
        weight = Decimal(str(product.khoi_luong))
        unit = product.don_vi_do_luong.lower()

        if unit == "g":
            weight /= Decimal("1000")
        elif unit != "kg":
            raise ValueError(
                f"{product.ma_san_pham}: "
                "Đơn vị khối lượng phải là g hoặc kg."
            )

        if not weight.is_finite() or weight <= 0:
            raise ValueError(
                f"{product.ma_san_pham}: Khối lượng không hợp lệ."
            )

        return weight

    # ------------------------------------------------------------
    # Dữ liệu: độ mới, khuyến mãi
    # ------------------------------------------------------------

    @staticmethod
    def _ngay_du_lieu_cuoi(
        db: Session,
        ngay_chay: date,
    ) -> date | None:
        value = db.scalar(
            select(func.max(LichSuTieuThu.ngay_ban)).where(
                LichSuTieuThu.trang_thai_don_hang.in_(
                    TRANG_THAI_DON_HOP_LE
                ),
                LichSuTieuThu.ngay_ban.is_not(None),
                LichSuTieuThu.ngay_ban < ngay_chay,
            )
        )

        return _to_date(value) if value is not None else None

    @staticmethod
    def _lay_khuyen_mai(
        db: Session,
        ma_san_pham: set[str],
    ) -> dict[str, list[dict]]:
        rows = db.execute(
            select(
                ChiTietCTKM.ma_san_pham,
                ChuongTrinhKhuyenMai.ten_ctkm,
                ChuongTrinhKhuyenMai.ngay_bat_dau,
                ChuongTrinhKhuyenMai.ngay_ket_thuc,
                ChuongTrinhKhuyenMai.muc_giam_phan_tram,
            )
            .select_from(ChiTietCTKM)
            .join(
                ChuongTrinhKhuyenMai,
                ChuongTrinhKhuyenMai.ma_ctkm
                == ChiTietCTKM.ma_ctkm,
            )
            .where(
                ChiTietCTKM.ma_san_pham.in_(sorted(ma_san_pham)),
                ChuongTrinhKhuyenMai.trang_thai != "HUY",
            )
        ).all()

        result: dict[str, list[dict]] = {}

        for row in rows:
            discount = float(row.muc_giam_phan_tram or 0) / 100.0

            result.setdefault(row.ma_san_pham, []).append({
                "ten": row.ten_ctkm,
                "bat_dau": _to_date(row.ngay_bat_dau),
                "ket_thuc": _to_date(row.ngay_ket_thuc),
                "giam": min(max(discount, 0.0), 1.0),
            })

        return result

    @staticmethod
    def _khuyen_mai_tuan(
        promotions: list[dict],
        week_start: pd.Timestamp,
    ) -> tuple[list[str], float, float]:
        """
        Trả về (tên các CTKM trong tuần, mức giảm tối đa,
        giá trị hồi quy km = giảm giá × số ngày trùng / 7).
        """
        week_begin = week_start.date()
        week_end = (week_start + pd.Timedelta(days=6)).date()

        names: list[str] = []
        max_discount = 0.0
        weighted = 0.0

        for item in promotions:
            overlap_start = max(item["bat_dau"], week_begin)
            overlap_end = min(item["ket_thuc"], week_end)
            days = (overlap_end - overlap_start).days + 1

            if days <= 0:
                continue

            names.append(item["ten"])
            max_discount = max(max_discount, item["giam"])
            weighted = max(weighted, item["giam"] * days / 7.0)

        return (
            list(dict.fromkeys(names)),
            max_discount,
            min(weighted, 1.0),
        )

    # ------------------------------------------------------------
    # Giải thích nguyên nhân thay đổi (từ các thành phần Prophet)
    # ------------------------------------------------------------

    @staticmethod
    def _tao_yeu_to(
        comp: dict,
        ref: dict,
        nhieu: float,
        ten_le: list[str],
        ten_km: list[str],
        km_duoc_hoc: bool,
        co_mua_vu_nam: bool,
    ) -> list[dict]:
        """
        Prophet cộng tính: yhat = xu hướng + ngày lễ + mùa vụ năm
        + khuyến mãi. Chênh lệch giữa hai tuần được tách đúng theo
        từng thành phần. Với tuần đầu, thêm 'biến động ngẫu nhiên'
        vì kỳ trước là số thực tế (= giá trị mô hình + nhiễu).
        """

        def r(value: float) -> float:
            return round(float(value), 2)

        def pick(value: float, up: str, down: str, flat: str) -> str:
            if value > 0.005:
                return up
            if value < -0.005:
                return down
            return flat

        items: list[dict] = []

        d_trend = comp["xu_huong"] - ref["xu_huong"]
        items.append({
            "ten": "Xu hướng nền",
            "so_luong": r(d_trend),
            "dien_giai": pick(
                d_trend,
                "Đường xu hướng của mô hình đang đi lên.",
                "Đường xu hướng của mô hình đang đi xuống.",
                "Xu hướng nền gần như không đổi.",
            ),
        })

        d_holiday = comp["ngay_le"] - ref["ngay_le"]

        if ten_le or abs(d_holiday) > 0.005:
            if ten_le:
                text = (
                    f"Tuần này có {', '.join(ten_le)}; "
                    "mô hình học ảnh hưởng của dịp lễ từ lịch sử."
                )
            else:
                text = (
                    "Tuần đối chiếu có dịp lễ còn tuần này thì không."
                )

            items.append({
                "ten": "Ngày lễ",
                "so_luong": r(d_holiday),
                "dien_giai": text,
            })

        if co_mua_vu_nam:
            d_year = comp["mua_vu_nam"] - ref["mua_vu_nam"]
            items.append({
                "ten": "Mùa vụ theo năm",
                "so_luong": r(d_year),
                "dien_giai": pick(
                    d_year,
                    "Thời điểm này trong năm thường bán tốt hơn.",
                    "Thời điểm này trong năm thường bán chậm hơn.",
                    "Mùa vụ năm gần như không đổi.",
                ),
            })

        if km_duoc_hoc:
            d_promo = comp["khuyen_mai"] - ref["khuyen_mai"]
            items.append({
                "ten": "Khuyến mãi",
                "so_luong": r(d_promo),
                "dien_giai": (
                    (
                        f"Có {', '.join(ten_km)}; hệ số khuyến mãi "
                        "được Prophet học từ lịch sử."
                    )
                    if ten_km
                    else "Không có khuyến mãi trong tuần này."
                ),
            })
        elif ten_km:
            items.append({
                "ten": "Khuyến mãi",
                "so_luong": 0.0,
                "dien_giai": (
                    f"Có {', '.join(ten_km)} nhưng lịch sử khuyến mãi "
                    "chưa đủ để mô hình học tác động, nên chưa tính vào số liệu."
                ),
            })

        if abs(nhieu) > 0.005:
            items.append({
                "ten": "Biến động ngẫu nhiên kỳ trước",
                "so_luong": r(nhieu),
                "dien_giai": pick(
                    nhieu,
                    "Tuần thực tế đối chiếu thấp hơn mức mô hình kỳ vọng.",
                    "Tuần thực tế đối chiếu cao hơn mức mô hình kỳ vọng "
                    "nên tuần này thấp hơn so với số thực tế đó.",
                    "",
                ),
            })

        return items

    # ------------------------------------------------------------
    # So sánh Prophet / Seasonal Naive
    # ------------------------------------------------------------

    @staticmethod
    def _so_sanh_hai_mo_hinh(
        ma_san_pham: str,
        scores: list[dict],
    ) -> dict | None:

        by_name = {
            item["mo_hinh"]: item
            for item in scores
        }

        prophet = by_name.get("PROPHET")
        naive = by_name.get("SEASONAL_NAIVE")

        if prophet is None or naive is None:
            return None

        p_mae = float(prophet["mae"])
        n_mae = float(naive["mae"])

        if p_mae < n_mae:
            winner = "PROPHET"
        elif n_mae < p_mae:
            winner = "SEASONAL_NAIVE"
        else:
            winner = "TUONG_DUONG"

        improvement = (
            (n_mae - p_mae) / n_mae * 100
            if n_mae > 0
            else None
        )

        return {
            "ma_san_pham": ma_san_pham,
            "prophet_mae": p_mae,
            "seasonal_naive_mae": n_mae,
            "prophet_rmse": prophet["rmse"],
            "seasonal_naive_rmse": naive["rmse"],
            "prophet_smape": prophet["smape"],
            "seasonal_naive_smape": naive["smape"],
            "prophet_wape": prophet["wape"],
            "seasonal_naive_wape": naive["wape"],
            "mo_hinh_tot_hon_theo_mae": winner,
            "chenh_lech_mae": round(p_mae - n_mae, 4),
            "ty_le_cai_thien_mae": (
                round(improvement, 4)
                if improvement is not None
                else None
            ),
            "dien_giai": (
                "So sánh trên cùng các tuần kiểm thử "
                "trong quá khứ. MAE thấp hơn nghĩa là "
                "sai số tuyệt đối trung bình thấp hơn."
            ),
        }

    # ------------------------------------------------------------
    # Chạy dự báo
    # ------------------------------------------------------------

    @staticmethod
    def du_bao_nhu_cau(
        db: Session,
        request: DuBaoRequest,
        nguoi_thuc_hien: str,
        ngay_chay: date | None = None,
    ) -> DuBaoResponse:

        if ngay_chay is None:
            ngay_chay = datetime.now(TIMEZONE).date()

        horizon = request.so_tuan_du_bao

        today = pd.Timestamp(ngay_chay).normalize()

        current_monday = (
            today - pd.Timedelta(days=today.weekday())
        )

        last_complete_monday = (
            current_monday - pd.Timedelta(weeks=1)
        )

        # Luôn bắt đầu từ thứ Hai tuần kế tiếp.
        forecast_start = current_monday + pd.Timedelta(weeks=1)

        forecast_dates = pd.date_range(
            start=forecast_start,
            periods=horizon,
            freq="W-MON",
        )

        all_products = DuBaoRepository.lay_san_pham(db)

        if not all_products:
            raise ValueError(
                "Không có sản phẩm đang kinh doanh."
            )

        if request.ma_san_pham is None:
            products = all_products
        else:
            products = DuBaoRepository.lay_san_pham(
                db=db,
                ma_san_pham=request.ma_san_pham,
            )

        if not products:
            raise ValueError(
                "Vui lòng chọn ít nhất một sản phẩm."
            )

        selected_ids = {
            product.ma_san_pham
            for product in products
        }

        all_ids = {
            product.ma_san_pham
            for product in all_products
        }

        if selected_ids == all_ids:
            kieu_du_bao = "TAT_CA_SAN_PHAM"
        elif len(products) == 1:
            kieu_du_bao = "MOT_SAN_PHAM"
        else:
            kieu_du_bao = "NHIEU_SAN_PHAM"

        valid_dates = {
            item.date()
            for item in forecast_dates
        }

        for plan in request.khuyen_mai:
            if (
                plan.ma_san_pham not in selected_ids
                or plan.tu_ngay not in valid_dates
            ):
                raise ValueError(
                    "Khuyến mãi phải thuộc sản phẩm đã chọn "
                    "và tuần nằm trong kỳ dự báo."
                )

        # Tính động theo ngày chạy; không cố định ngày trong .env.
        # MAX(ngay_ban) chỉ là tuần cuối CÓ PHÁT SINH đơn, KHÔNG chứng
        # minh các ngày/tuần còn lại đã được import đầy đủ.
        last_data_date = DuBaoService._ngay_du_lieu_cuoi(db, ngay_chay)
        if last_data_date is None:
            raise ValueError("Chưa có dữ liệu bán hàng để dự báo.")
        last_data_ts = pd.Timestamp(last_data_date).normalize()
        last_observed_monday = last_data_ts - pd.Timedelta(
            days=last_data_ts.weekday()
        )
        # Giới hạn tại tuần đã kết thúc và có phát sinh dữ liệu.
        # Với tuần không bán hàng, cần thêm metadata xác nhận import
        # trước khi được coi là tuần y=0; chưa có metadata thì không
        # tự khẳng định tuần đó đã nhập đầy đủ.
        cutoff = min(last_complete_monday, last_observed_monday)
        data_is_stale = cutoff < last_complete_monday
        so_tuan_dem = int((forecast_start - cutoff).days // 7) - 1
        reference_type = (
            "THUC_TE_GAN_NHAT" if data_is_stale else "THUC_TE_TUAN_TRUOC"
        )

        promotions_by_product = DuBaoService._lay_khuyen_mai(
            db, selected_ids
        )

        planned = {
            (plan.ma_san_pham, plan.tu_ngay): plan
            for plan in request.khuyen_mai
        }

        holiday_rows = NgayLeRepository.get_tat_ca_ngay_le(db)

        holidays = ProphetNgayLe.tao_dataframe_ngay_le(
            holiday_rows
        )

        results = []
        evaluations = []
        comparisons = []

        train_start_dates = []
        train_end_dates = []

        skipped: list[str] = []
        short_history_products: list[str] = []
        unlearned_promo_products: list[str] = []

        for product in products:

            product_id = product.ma_san_pham
            product_promotions = promotions_by_product.get(
                product_id, []
            )

            history = TieuThuRepository.get_nhu_cau_qua_khu(
                db=db,
                ma_san_pham=product_id,
                ngay_chay=ngay_chay,
            )

            try:
                weekly = ChuanBiDuLieu.tao_du_lieu_theo_tuan(
                    du_lieu=history,
                    ngay_chay=ngay_chay,
                    tuan_cuoi=cutoff,
                )

                # Biến khuyến mãi theo tuần (lịch sử + kỳ dự báo).
                km_by_week: dict[pd.Timestamp, float] = {}

                for week_start in list(weekly["ds"]) + list(
                    forecast_dates
                ):
                    _, _, weighted = DuBaoService._khuyen_mai_tuan(
                        product_promotions, week_start
                    )
                    km_by_week[week_start] = weighted

                for plan in request.khuyen_mai:
                    if plan.ma_san_pham != product_id:
                        continue

                    key = pd.Timestamp(plan.tu_ngay)
                    km_by_week[key] = max(
                        km_by_week.get(key, 0.0),
                        float(plan.muc_giam_gia),
                    )

                weekly = weekly.copy()
                weekly["km"] = (
                    weekly["ds"]
                    .map(km_by_week)
                    .fillna(0.0)
                    .astype(float)
                )

                promo_weeks = int((weekly["km"] > 0).sum())
                normal_weeks = len(weekly) - promo_weeks

                use_promotion = (
                    promo_weeks >= MIN_TUAN_KHUYEN_MAI
                    and normal_weeks >= MIN_TUAN_KHUYEN_MAI
                )

                scores, fold_configurations = (
                    Backtesting.danh_gia_hai_mo_hinh(
                        df=weekly,
                        holidays=holidays,
                        horizon=horizon,
                        so_fold_toi_da=4,
                        dung_khuyen_mai=use_promotion,
                        so_tuan_dem=so_tuan_dem,
                    )
                )

                configuration = Backtesting.chon_cau_hinh(
                    df=weekly,
                    holidays=holidays,
                    horizon=horizon,
                    dung_khuyen_mai=use_promotion,
                    so_tuan_dem=so_tuan_dem,
                )

                model = ProphetCoBan.huan_luyen(
                    df=weekly,
                    holidays=holidays,
                    cau_hinh=configuration,
                    co_khoang=True,
                )

                forecast = ProphetCoBan.du_bao(
                    model=model,
                    ngay_bat_dau_du_bao=forecast_start,
                    so_tuan_du_bao=horizon,
                    khuyen_mai=km_by_week,
                )

                reference_row = ProphetCoBan.du_bao_tai_ngay(
                    model,
                    [cutoff],
                    khuyen_mai=km_by_week,
                ).iloc[0]

            except (ValueError, RuntimeError) as exc:
                skipped.append(
                    f"{product_id} — {product.ten_san_pham}: {exc}"
                )
                continue

            km_used = ProphetCoBan.co_hoi_quy_km(model)
            yearly_used = ProphetCoBan.co_mua_vu_nam(model)

            train_start_dates.append(weekly["ds"].min().date())
            train_end_dates.append(
                (cutoff + pd.Timedelta(days=6)).date()
            )

            for score in scores:
                evaluations.append({
                    **score,
                    "ma_san_pham": product_id,
                })

            comparison = DuBaoService._so_sanh_hai_mo_hinh(
                product_id,
                scores,
            )

            if comparison is not None:
                comparisons.append(comparison)

            actual_by_date = {
                pd.Timestamp(row["ds"]): float(row["y"])
                for _, row in weekly.iterrows()
            }

            weight_kg = DuBaoService._weight_kg(product)

            week_results = []
            product_warnings = []

            if len(weekly) < 104:
                short_history_products.append(product_id)

            # Thành phần mô hình của tuần đối chiếu (đã có dữ liệu).
            reference_components = ProphetCoBan.thanh_phan(
                reference_row
            )
            reference_fitted = float(reference_row["yhat"])
            reference_actual = actual_by_date.get(cutoff)

            previous_forecast_quantity = None
            previous_components = reference_components
            has_unlearned_promo = False

            for index, (_, row) in enumerate(
                forecast.iterrows()
            ):

                start = pd.Timestamp(row["ds"])

                quantity = DuBaoService._round_quantity(
                    row["yhat"]
                )

                lower = min(
                    quantity,
                    DuBaoService._round_quantity(
                        row["yhat_lower"]
                    ),
                )

                upper = max(
                    quantity,
                    DuBaoService._round_quantity(
                        row["yhat_upper"]
                    ),
                )

                if max(quantity, lower, upper) > 2147483647:
                    raise ValueError(
                        f"{product_id}: Dự báo vượt giới hạn INTEGER."
                    )

                quantity_kg = (
                    weight_kg * quantity
                ).quantize(
                    Decimal("0.01"),
                    rounding=ROUND_HALF_UP,
                )

                if quantity_kg > Decimal("999999999999.99"):
                    raise ValueError(
                        f"{product_id}: Khối lượng dự báo "
                        "vượt giới hạn lưu trữ."
                    )

                components = ProphetCoBan.thanh_phan(row)

                # Tuần 1: đối chiếu với tuần thực tế gần nhất có dữ liệu
                # (đúng tuần liền trước nếu dữ liệu đã cập nhật).
                if index == 0:
                    if reference_actual is not None:
                        previous_quantity = reference_actual
                        previous_type = reference_type
                        previous_from = cutoff.date()
                        reference_for_factors = reference_components
                        residual = reference_fitted - reference_actual
                    else:
                        previous_quantity = None
                        previous_type = "CHUA_CO_DU_LIEU"
                        previous_from = None
                        reference_for_factors = None
                        residual = 0.0

                # Tuần 2 trở đi: so với dự báo của tuần liền trước.
                else:
                    previous_quantity = previous_forecast_quantity
                    previous_type = "DU_BAO_TUAN_TRUOC"
                    previous_from = None
                    reference_for_factors = previous_components
                    residual = 0.0

                difference = (
                    quantity - previous_quantity
                    if previous_quantity is not None
                    else None
                )

                percent_change = (
                    difference / previous_quantity * 100
                    if (
                        difference is not None
                        and previous_quantity > 0
                    )
                    else None
                )

                holiday_names = [
                    item.ten_ngay_le
                    for item in holiday_rows
                    if (
                        item.ngay_bat_dau
                        <= (
                            start + pd.Timedelta(days=6)
                        ).date()
                        and item.ngay_ket_thuc
                        >= start.date()
                    )
                ]

                promo_names, promo_discount, _ = (
                    DuBaoService._khuyen_mai_tuan(
                        product_promotions, start
                    )
                )

                plan = planned.get((product_id, start.date()))

                if plan is not None:
                    promo_names = list(dict.fromkeys(
                        promo_names + [plan.chuong_trinh_km]
                    ))
                    promo_discount = max(
                        promo_discount,
                        float(plan.muc_giam_gia),
                    )

                if promo_names and not km_used:
                    has_unlearned_promo = True

                factors = (
                    DuBaoService._tao_yeu_to(
                        comp=components,
                        ref=reference_for_factors,
                        nhieu=residual,
                        ten_le=holiday_names,
                        ten_km=promo_names,
                        km_duoc_hoc=km_used,
                        co_mua_vu_nam=yearly_used,
                    )
                    if reference_for_factors is not None
                    else []
                )

                # Seasonal Naive (chu kỳ 52 tuần) = thực tế
                # cùng tuần năm trước.
                same_period = actual_by_date.get(
                    start - pd.Timedelta(weeks=52)
                )

                week_results.append({
                    "tu_ngay": start.date(),
                    "den_ngay": (
                        start + pd.Timedelta(days=6)
                    ).date(),
                    "so_luong_du_bao": quantity,
                    "can_duoi": lower,
                    "can_tren": upper,
                    "ky_truoc": previous_quantity,
                    "loai_ky_truoc": previous_type,
                    "ky_truoc_tu_ngay": previous_from,
                    "chenh_lech": difference,
                    "ty_le_thay_doi": percent_change,
                    "cung_ky": same_period,
                    "ngay_le": holiday_names,
                    "chuong_trinh_km": (
                        ", ".join(promo_names)
                        if promo_names
                        else None
                    ),
                    "muc_giam_gia": min(
                        max(promo_discount, 0.0), 1.0
                    ),
                    "so_luong_du_bao_kg": float(quantity_kg),
                    "yeu_to": factors,
                })

                previous_forecast_quantity = quantity
                previous_components = components

            if has_unlearned_promo:
                unlearned_promo_products.append(product_id)
                product_warnings.append(
                    "Có khuyến mãi trong kỳ dự báo nhưng lịch sử "
                    "khuyến mãi của sản phẩm chưa đủ "
                    f"(cần ≥ {MIN_TUAN_KHUYEN_MAI} tuần có và "
                    f"≥ {MIN_TUAN_KHUYEN_MAI} tuần không có khuyến mãi) "
                    "để mô hình học tác động."
                )

            total = sum(
                week["so_luong_du_bao"]
                for week in week_results
            )

            # Tổng kỳ trước = N tuần thực tế kết thúc ở tuần đối chiếu.
            comparison_end = cutoff
            comparison_start = comparison_end - pd.Timedelta(
                weeks=horizon - 1
            )

            previous_weeks = weekly.loc[
                (weekly["ds"] >= comparison_start)
                & (weekly["ds"] <= comparison_end)
            ]

            has_full_comparison = len(previous_weeks) == horizon

            previous_total = (
                float(previous_weeks["y"].sum())
                if has_full_comparison
                else None
            )

            total_difference = (
                total - previous_total
                if previous_total is not None
                else None
            )

            total_percent = (
                total_difference / previous_total * 100
                if (
                    total_difference is not None
                    and previous_total > 0
                )
                else None
            )

            if previous_total is not None:
                range_text = (
                    f"{horizon} tuần thực tế "
                    f"{'liền trước' if not data_is_stale else 'gần nhất có dữ liệu'} "
                    f"({_fmt_short(comparison_start)} – "
                    f"{_fmt_short(comparison_end + pd.Timedelta(days=6))})"
                )

            if total_difference is None:
                description = (
                    "Chưa đủ dữ liệu thực tế của giai đoạn "
                    "liền trước để so sánh tổng kỳ."
                )
            elif total_difference > 0:
                description = (
                    f"Dự kiến tăng {total_difference:g} sản phẩm "
                    f"so với {range_text}."
                )
            elif total_difference < 0:
                description = (
                    f"Dự kiến giảm {abs(total_difference):g} sản phẩm "
                    f"so với {range_text}."
                )
            else:
                description = (
                    f"Tổng nhu cầu dự báo bằng {range_text}."
                )

            results.append({
                "ma_san_pham": product_id,
                "ten_san_pham": product.ten_san_pham,
                "ket_qua": week_results,
                "tong_du_bao": total,
                "tong_ky_truoc": previous_total,
                "loai_tong_ky_truoc": (
                    reference_type
                    if previous_total is not None
                    else ""
                ),
                "tong_ky_truoc_tu_ngay": (
                    comparison_start.date()
                    if previous_total is not None
                    else None
                ),
                "tong_ky_truoc_den_ngay": (
                    (comparison_end + pd.Timedelta(days=6)).date()
                    if previous_total is not None
                    else None
                ),
                "chenh_lech": total_difference,
                "ty_le_thay_doi": total_percent,
                "phan_loai": "Bình thường",
                "dien_giai": description,
                "yeu_to": [],
                "cau_hinh": {
                    **configuration,
                    "cau_hinh_cac_fold": fold_configurations,
                    "khuyen_mai_duoc_hoc": km_used,
                    "mua_vu_nam_duoc_bat": yearly_used,
                },
                "canh_bao": product_warnings,
            })

        if not results:
            raise ValueError(
                "Không sản phẩm nào đủ dữ liệu để dự báo. "
                + " | ".join(skipped)
            )

        # Phân nhóm tương đối theo nhu cầu dự báo
        # trong tập sản phẩm được người dùng chọn.
        average_total = (
            sum(item["tong_du_bao"] for item in results)
            / len(results)
        )

        if len(results) > 1 and average_total > 0:
            for item in results:
                if item["tong_du_bao"] > average_total * 1.1:
                    item["phan_loai"] = "Bán chạy"
                elif item["tong_du_bao"] < average_total * 0.9:
                    item["phan_loai"] = "Bán chậm"

        # ---- Lưu ý chung (gom một lần, không lặp ở từng sản phẩm) ----
        global_warnings: list[str] = []

        if data_is_stale:
            global_warnings.append(
                f"Dữ liệu bán hàng mới nhất đến {_fmt_day(last_data_ts)}, "
                "trong khi tuần hoàn chỉnh gần nhất là "
                f"{_fmt_short(last_complete_monday)} – "
                f"{_fmt_short(last_complete_monday + pd.Timedelta(days=6))}. "
                "Kỳ trước được lấy từ tuần thực tế gần nhất có dữ liệu "
                f"({_fmt_short(cutoff)} – "
                f"{_fmt_short(cutoff + pd.Timedelta(days=6))}). "
                "Hãy cập nhật dữ liệu bán hàng để kết quả sát thực tế hơn."
            )

        if short_history_products:
            global_warnings.append(
                f"{len(short_history_products)} sản phẩm có lịch sử "
                "dưới 2 năm "
                f"({', '.join(short_history_products)}), nên Prophet "
                "chưa bật mùa vụ năm; dự báo chủ yếu dựa vào xu hướng "
                "và ngày lễ nên có thể khá phẳng."
            )

        if unlearned_promo_products:
            global_warnings.append(
                "Khuyến mãi chỉ được hiển thị, chưa đưa vào mô hình cho: "
                f"{', '.join(unlearned_promo_products)} "
                "(lịch sử khuyến mãi chưa đủ)."
            )

        if skipped:
            global_warnings.append(
                "Bỏ qua sản phẩm không đủ dữ liệu: "
                + " | ".join(skipped)
            )

        run_time = datetime.now(TIMEZONE)

        run = DuBaoRepository.tao_lich_su(
            db,
            LichSuDuBao(
                ngay_bat_dau_huan_luyen=min(
                    train_start_dates
                ),
                ngay_ket_thuc_huan_luyen=max(
                    train_end_dates
                ),
                so_tuan_du_bao=horizon,
                cau_hinh_mo_hinh="PROPHET",
                thoi_gian_chay=run_time,
                tham_so={},
                trang_thai="THANH_CONG",
                nguoi_thuc_hien=nguoi_thuc_hien,
            ),
        )

        response = DuBaoResponse(
            ma_lich_su_du_bao=run.ma_lich_su_du_bao,
            ngay_chay=ngay_chay,
            so_tuan_du_bao=horizon,
            thoi_gian_chay=run_time,
            tong_san_pham=len(results),
            ngay_bat_dau_huan_luyen=min(
                train_start_dates
            ),
            ngay_ket_thuc_huan_luyen=max(
                train_end_dates
            ),
            ngay_du_lieu_cuoi=last_data_ts.date(),
            danh_gia_mo_hinh=evaluations,
            ket_qua=results,
            so_sanh_mo_hinh=comparisons,
            canh_bao=global_warnings,
            ghi_chu_danh_gia=(
                "Prophet và Seasonal Naive (chu kỳ 52 tuần) được "
                "đánh giá trên cùng các giai đoạn kiểm thử quá khứ. "
                "MAE, RMSE, WAPE và sMAPE càng thấp thì sai số càng nhỏ. "
                "Dự báo tương lai được tạo bằng Prophet."
            ),
        )

        DuBaoRepository.cap_nhat_tham_so(
            run,
            {
                "version": 6,
                "tan_suat": "TUAN",
                "kieu_du_bao": kieu_du_bao,
                "so_san_pham": len(results),
                "ma_san_pham_duoc_chon": sorted(selected_ids),
                "seasonal_naive_chu_ky": 52,
                "ngay_du_lieu_cuoi": last_data_ts.date().isoformat(),
                "xac_nhan_nhap_du_lieu": "CHUA_CO_METADATA_IMPORT",
                "so_tuan_dem_backtesting": so_tuan_dem,
                "tuan_doi_chieu": cutoff.date().isoformat(),
                "ngay_bat_dau_du_bao": (
                    forecast_start.date().isoformat()
                ),
                "request": json.loads(
                    request.model_dump_json()
                ),
                "snapshot": json.loads(
                    response.model_dump_json()
                ),
            },
        )

        for score in evaluations:
            DanhGiaMoHinhRepository.tao_danh_gia(
                db,
                DanhGiaMoHinh(
                    ma_lich_su_du_bao=(
                        run.ma_lich_su_du_bao
                    ),
                    **{
                        key: score[key]
                        for key in (
                            "ma_san_pham",
                            "mo_hinh",
                            "horizon",
                            "so_fold",
                            "so_diem_danh_gia",
                            "chu_ky",
                            "mae",
                            "rmse",
                            "wape",
                            "smape",
                        )
                    },
                ),
            )

        for product in results:
            for week in product["ket_qua"]:
                DuBaoRepository.tao_chi_tiet(
                    db,
                    ChiTietLichSuDuBao(
                        ma_lich_su_du_bao=(
                            run.ma_lich_su_du_bao
                        ),
                        ma_san_pham=(
                            product["ma_san_pham"]
                        ),
                        ma_nguyen_lieu=None,
                        tu_ngay=week["tu_ngay"],
                        den_ngay=week["den_ngay"],
                        so_luong_du_bao=(
                            week["so_luong_du_bao"]
                        ),
                        can_duoi=week["can_duoi"],
                        can_tren=week["can_tren"],
                        so_luong_du_bao_kg=Decimal(
                            str(week["so_luong_du_bao_kg"])
                        ),
                    ),
                )

        # Flush để phát hiện lỗi ràng buộc trước commit.
        # Transaction rollback do tầng gọi quản lý nếu có lỗi.
        db.flush()
        db.commit()

        return response