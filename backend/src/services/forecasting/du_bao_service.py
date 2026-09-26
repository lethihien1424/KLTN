# ###D:\KLTN\KLTN\backend\src\services\forecasting\du_bao_service.py
# from datetime import date, datetime
# from math import isfinite
# from zoneinfo import ZoneInfo

# import pandas as pd
# from sqlalchemy.orm import Session

# from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
# from src.models.danh_gia_mo_hinh import DanhGiaMoHinh
# from src.models.lich_su_du_bao import LichSuDuBao
# from src.repositories.danh_gia_mo_hinh_repository import DanhGiaMoHinhRepository
# from src.repositories.du_bao_repository import DuBaoRepository
# from src.repositories.ngay_le_repository import NgayLeRepository
# from src.repositories.san_pham_repository import SanPhamRepository
# from src.repositories.tieu_thu_repository import TieuThuRepository
# from src.services.forecasting.backtesting import Backtesting
# from src.services.forecasting.chuan_bi_du_lieu import ChuanBiDuLieu
# from src.services.forecasting.prophet_co_ban import ProphetCoBan
# from src.services.forecasting.prophet_ngay_le import ProphetNgayLe
# from src.services.forecasting.seasonal_naive import SeasonalNaive


# MUI_GIO_VIET_NAM = ZoneInfo("Asia/Ho_Chi_Minh")


# class DuBaoService:
#     SO_FOLD_TOI_DA = 4

#     @staticmethod
#     def du_bao_nhu_cau(
#         db: Session,
#         so_tuan_du_bao: int,
#         nguoi_thuc_hien: str,
#         ngay_chay: date | None = None,
#     ) -> dict:
#         if ngay_chay is None:
#             ngay_chay = datetime.now(MUI_GIO_VIET_NAM).date()

#         if not isinstance(so_tuan_du_bao, int) or not 4 <= so_tuan_du_bao <= 8:
#             raise ValueError("Số tuần dự báo phải từ 4 đến 8.")

#         san_pham_list = SanPhamRepository.get_san_pham_dang_kinh_doanh(
#             db=db
#         )
#         if not san_pham_list:
#             raise ValueError(
#                 "Không có sản phẩm đang kinh doanh để dự báo."
#             )

#         monday = pd.Timestamp(ngay_chay).normalize()
#         monday -= pd.Timedelta(days=monday.weekday())
#         forecast_start = monday + pd.Timedelta(weeks=1)
#         forecast_end = (
#             forecast_start
#             + pd.Timedelta(weeks=so_tuan_du_bao)
#             - pd.Timedelta(days=1)
#         )

#         prepared = []
#         first_train_day = None
#         last_train_day = None

#         for product in san_pham_list:
#             product_id = product.ma_san_pham
#             history = TieuThuRepository.get_nhu_cau_qua_khu(
#                 db=db,
#                 ma_san_pham=product_id,
#                 ngay_chay=ngay_chay,
#             )

#             try:
#                 weekly = ChuanBiDuLieu.tao_du_lieu_theo_tuan(
#                     du_lieu=history,
#                     ngay_chay=ngay_chay,
#                 )
#             except ValueError as exc:
#                 raise ValueError(
#                     f"Sản phẩm {product_id}: {exc}"
#                 ) from exc

#             fold_count = Backtesting.tinh_so_fold_phu_hop(
#                 df=weekly,
#                 horizon=so_tuan_du_bao,
#                 so_fold_toi_da=DuBaoService.SO_FOLD_TOI_DA,
#                 so_tuan_train_toi_thieu=(
#                     Backtesting.SO_TUAN_TRAIN_TOI_THIEU
#                 ),
#             )
#             if fold_count < 1:
#                 minimum = (
#                     Backtesting.SO_TUAN_TRAIN_TOI_THIEU
#                     + so_tuan_du_bao
#                 )
#                 raise ValueError(
#                     f"Sản phẩm {product_id} cần ít nhất "
#                     f"{minimum} tuần hoàn chỉnh để có một "
#                     "fold backtesting."
#                 )

#             first_day = pd.Timestamp(
#                 weekly["ds"].min()
#             ).date()
#             last_day = (
#                 pd.Timestamp(weekly["ds"].max())
#                 + pd.Timedelta(days=6)
#             ).date()

#             first_train_day = (
#                 min(first_train_day, first_day)
#                 if first_train_day
#                 else first_day
#             )
#             last_train_day = (
#                 max(last_train_day, last_day)
#                 if last_train_day
#                 else last_day
#             )
#             prepared.append(
#                 (product_id, weekly, fold_count)
#             )

#         holiday_rows = NgayLeRepository.get_ngay_le_trong_khoang(
#             db=db,
#             tu_ngay=first_train_day,
#             den_ngay=forecast_end.date(),
#         )
#         holidays = ProphetNgayLe.tao_dataframe_ngay_le(
#             holiday_rows
#         )

#         evaluations = []
#         forecast_results = []

#         for product_id, weekly, fold_count in prepared:
#             # Cùng dữ liệu, cùng horizon và cùng tuần test.
#             try:
#                 prophet_score = Backtesting.danh_gia_prophet(
#                     df=weekly,
#                     holidays=holidays,
#                     horizon=so_tuan_du_bao,
#                     so_fold=fold_count,
#                 )
#                 naive_score = Backtesting.danh_gia_seasonal_naive(
#                     df=weekly,
#                     horizon=so_tuan_du_bao,
#                     so_fold=fold_count,
#                 )

#                 prophet_model = ProphetCoBan.huan_luyen(
#                     df=weekly,
#                     holidays=holidays,
#                 )
#                 forecast = ProphetCoBan.du_bao(
#                     model=prophet_model,
#                     ngay_bat_dau_du_bao=forecast_start,
#                     so_tuan_du_bao=so_tuan_du_bao,
#                 )
#             except Exception as exc:
#                 raise ValueError(
#                     f"Dự báo/đánh giá sản phẩm "
#                     f"{product_id}: {exc}"
#                 ) from exc

#             prophet_score["ma_san_pham"] = product_id
#             naive_score["ma_san_pham"] = product_id
#             evaluations.extend(
#                 (prophet_score, naive_score)
#             )

#             expected_dates = pd.date_range(
#                 forecast_start,
#                 periods=so_tuan_du_bao,
#                 freq="7D",
#             )
#             if (
#                 len(forecast) != so_tuan_du_bao
#                 or not pd.DatetimeIndex(
#                     forecast["ds"]
#                 ).equals(expected_dates)
#             ):
#                 raise ValueError(
#                     f"Sản phẩm {product_id}: "
#                     "các tuần dự báo không khớp."
#                 )

#             weeks = []
#             for _, row in forecast.iterrows():
#                 start = pd.Timestamp(row["ds"])
#                 raw = [
#                     float(row[key])
#                     for key in (
#                         "yhat",
#                         "yhat_lower",
#                         "yhat_upper",
#                     )
#                 ]
#                 if not all(isfinite(value) for value in raw):
#                     raise ValueError(
#                         f"Sản phẩm {product_id}: "
#                         "kết quả Prophet không hữu hạn."
#                     )

#                 yhat, lower, upper = (
#                     max(0.0, value)
#                     for value in raw
#                 )
#                 lower = min(lower, yhat)
#                 upper = max(upper, yhat)

#                 weeks.append(
#                     {
#                         "tu_ngay": start.date(),
#                         "den_ngay": (
#                             start
#                             + pd.Timedelta(days=6)
#                         ).date(),
#                         "so_luong_du_bao": round(yhat),
#                         "can_duoi": round(lower),
#                         "can_tren": round(upper),
#                     }
#                 )

#             forecast_results.append(
#                 {
#                     "ma_san_pham": product_id,
#                     "ket_qua": weeks,
#                 }
#             )

#         run_time = datetime.now(MUI_GIO_VIET_NAM)

#         try:
#             run = LichSuDuBao(
#                 ngay_bat_dau_huan_luyen=first_train_day,
#                 ngay_ket_thuc_huan_luyen=last_train_day,
#                 so_tuan_du_bao=so_tuan_du_bao,
#                 cau_hinh_mo_hinh="PROPHET",
#                 thoi_gian_chay=run_time,
#                 tham_so={
#                     "daily_seasonality": False,
#                     "weekly_seasonality": False,
#                     "yearly_seasonality": False,
#                     "tan_suat": "TUAN",
#                     "kieu_du_bao": "TAT_CA_SAN_PHAM",
#                     "so_san_pham": len(san_pham_list),
#                     "backtesting": True,
#                     "so_fold_toi_da": (
#                         DuBaoService.SO_FOLD_TOI_DA
#                     ),
#                     "seasonal_naive_chu_ky": (
#                         SeasonalNaive.CHU_KY
#                     ),
#                 },
#                 trang_thai="THANH_CONG",
#                 nguoi_thuc_hien=nguoi_thuc_hien,
#             )
#             DuBaoRepository.tao_lich_su(
#                 db=db,
#                 lich_su=run,
#             )

#             for item in evaluations:
#                 score = DanhGiaMoHinh(
#                     ma_lich_su_du_bao=(
#                         run.ma_lich_su_du_bao
#                     ),
#                     ma_san_pham=item["ma_san_pham"],
#                     mo_hinh=item["mo_hinh"],
#                     horizon=item["horizon"],
#                     so_fold=item["so_fold"],
#                     so_diem_danh_gia=(
#                         item["so_diem_danh_gia"]
#                     ),
#                     chu_ky=item["chu_ky"],
#                     mae=item["mae"],
#                     rmse=item["rmse"],
#                     wape=item["wape"],
#                     smape=item["smape"],
#                 )
#                 DanhGiaMoHinhRepository.tao_danh_gia(
#                     db=db,
#                     danh_gia=score,
#                 )

#             for product in forecast_results:
#                 for week in product["ket_qua"]:
#                     detail = ChiTietLichSuDuBao(
#                         ma_lich_su_du_bao=(
#                             run.ma_lich_su_du_bao
#                         ),
#                         ma_san_pham=(
#                             product["ma_san_pham"]
#                         ),
#                         ma_nguyen_lieu=None,
#                         so_luong_du_bao_kg=None,
#                         **week,
#                     )
#                     DuBaoRepository.tao_chi_tiet(
#                         db=db,
#                         chi_tiet=detail,
#                     )

#             db.commit()
#         except Exception:
#             db.rollback()
#             raise

#         return {
#             "ma_lich_su_du_bao": (
#                 run.ma_lich_su_du_bao
#             ),
#             "ngay_chay": ngay_chay,
#             "so_tuan_du_bao": so_tuan_du_bao,
#             "thoi_gian_chay": run_time,
#             "tong_san_pham": len(
#                 forecast_results
#             ),
#             "danh_gia_mo_hinh": evaluations,
#             "ket_qua": forecast_results,
#         }
from datetime import date, datetime
from math import isfinite
from zoneinfo import ZoneInfo

import pandas as pd
from sqlalchemy.orm import Session

from src.models.chi_tiet_lich_su_du_bao import ChiTietLichSuDuBao
from src.models.danh_gia_mo_hinh import DanhGiaMoHinh
from src.models.lich_su_du_bao import LichSuDuBao
from src.repositories.danh_gia_mo_hinh_repository import DanhGiaMoHinhRepository
from src.repositories.du_bao_repository import DuBaoRepository
from src.repositories.ngay_le_repository import NgayLeRepository
from src.repositories.san_pham_repository import SanPhamRepository
from src.repositories.tieu_thu_repository import TieuThuRepository
from src.services.forecasting.backtesting import Backtesting
from src.services.forecasting.chuan_bi_du_lieu import ChuanBiDuLieu
from src.services.forecasting.prophet_co_ban import ProphetCoBan
from src.services.forecasting.prophet_ngay_le import ProphetNgayLe
from src.services.forecasting.seasonal_naive import SeasonalNaive


MUI_GIO_VIET_NAM = ZoneInfo("Asia/Ho_Chi_Minh")


class DuBaoService:
    SO_FOLD_TOI_DA = 4

    @staticmethod
    def du_bao_nhu_cau(
        db: Session,
        so_tuan_du_bao: int,
        nguoi_thuc_hien: str,
        ngay_chay: date | None = None,
    ) -> dict:
        if ngay_chay is None:
            ngay_chay = datetime.now(MUI_GIO_VIET_NAM).date()

        if so_tuan_du_bao not in (4, 8):
            raise ValueError("Số tuần dự báo phải là 4 hoặc 8.")

        san_pham_list = SanPhamRepository.get_san_pham_dang_kinh_doanh(
            db=db
        )
        if not san_pham_list:
            raise ValueError(
                "Không có sản phẩm đang kinh doanh để dự báo."
            )

        monday = pd.Timestamp(ngay_chay).normalize()
        monday -= pd.Timedelta(days=monday.weekday())
        forecast_start = monday + pd.Timedelta(weeks=1)
        forecast_end = (
            forecast_start
            + pd.Timedelta(weeks=so_tuan_du_bao)
            - pd.Timedelta(days=1)
        )

        prepared = []
        first_train_day = None
        last_train_day = None

        for product in san_pham_list:
            product_id = product.ma_san_pham
            history = TieuThuRepository.get_nhu_cau_qua_khu(
                db=db,
                ma_san_pham=product_id,
                ngay_chay=ngay_chay,
            )

            try:
                weekly = ChuanBiDuLieu.tao_du_lieu_theo_tuan(
                    du_lieu=history,
                    ngay_chay=ngay_chay,
                )
            except ValueError as exc:
                raise ValueError(
                    f"Sản phẩm {product_id}: {exc}"
                ) from exc

            fold_count = Backtesting.tinh_so_fold_phu_hop(
                df=weekly,
                horizon=so_tuan_du_bao,
                so_fold_toi_da=DuBaoService.SO_FOLD_TOI_DA,
                so_tuan_train_toi_thieu=(
                    Backtesting.SO_TUAN_TRAIN_TOI_THIEU
                ),
            )
            if fold_count < 1:
                minimum = (
                    Backtesting.SO_TUAN_TRAIN_TOI_THIEU
                    + so_tuan_du_bao + 1
                )
                raise ValueError(
                    f"Sản phẩm {product_id} cần ít nhất "
                    f"{minimum} tuần hoàn chỉnh để có một "
                    "fold backtesting."
                )

            first_day = pd.Timestamp(
                weekly["ds"].min()
            ).date()
            last_day = (
                pd.Timestamp(weekly["ds"].max())
                + pd.Timedelta(days=6)
            ).date()

            first_train_day = (
                min(first_train_day, first_day)
                if first_train_day
                else first_day
            )
            last_train_day = (
                max(last_train_day, last_day)
                if last_train_day
                else last_day
            )
            prepared.append(
                (product_id, weekly, fold_count)
            )

        holiday_rows = NgayLeRepository.get_ngay_le_trong_khoang(
            db=db,
            tu_ngay=first_train_day,
            den_ngay=forecast_end.date(),
        )
        holidays = ProphetNgayLe.tao_dataframe_ngay_le(
            holiday_rows
        )

        evaluations = []
        forecast_results = []

        for product_id, weekly, fold_count in prepared:
            # Cùng dữ liệu, cùng horizon và cùng tuần test.
            try:
                prophet_score = Backtesting.danh_gia_prophet(
                    df=weekly,
                    holidays=holidays,
                    horizon=so_tuan_du_bao,
                    so_fold=fold_count,
                )
                naive_score = Backtesting.danh_gia_seasonal_naive(
                    df=weekly,
                    horizon=so_tuan_du_bao,
                    chu_ky=SeasonalNaive.CHU_KY,
                    so_fold=fold_count,
                )

                prophet_model = ProphetCoBan.huan_luyen(
                    df=weekly,
                    holidays=holidays,
                )
                forecast = ProphetCoBan.du_bao(
                    model=prophet_model,
                    ngay_bat_dau_du_bao=forecast_start,
                    so_tuan_du_bao=so_tuan_du_bao,
                )
            except Exception as exc:
                raise ValueError(
                    f"Dự báo/đánh giá sản phẩm "
                    f"{product_id}: {exc}"
                ) from exc

            prophet_score["ma_san_pham"] = product_id
            naive_score["ma_san_pham"] = product_id
            evaluations.extend(
                (prophet_score, naive_score)
            )

            expected_dates = pd.date_range(
                forecast_start,
                periods=so_tuan_du_bao,
                freq="7D",
            )
            if (
                len(forecast) != so_tuan_du_bao
                or not pd.DatetimeIndex(
                    forecast["ds"]
                ).equals(expected_dates)
            ):
                raise ValueError(
                    f"Sản phẩm {product_id}: "
                    "các tuần dự báo không khớp."
                )

            weeks = []
            for _, row in forecast.iterrows():
                start = pd.Timestamp(row["ds"])
                raw = [
                    float(row[key])
                    for key in (
                        "yhat",
                        "yhat_lower",
                        "yhat_upper",
                    )
                ]
                if not all(isfinite(value) for value in raw):
                    raise ValueError(
                        f"Sản phẩm {product_id}: "
                        "kết quả Prophet không hữu hạn."
                    )

                yhat, lower, upper = (
                    max(0.0, value)
                    for value in raw
                )
                lower = min(lower, yhat)
                upper = max(upper, yhat)

                weeks.append(
                    {
                        "tu_ngay": start.date(),
                        "den_ngay": (
                            start
                            + pd.Timedelta(days=6)
                        ).date(),
                        "so_luong_du_bao": round(yhat),
                        "can_duoi": round(lower),
                        "can_tren": round(upper),
                    }
                )

            forecast_results.append(
                {
                    "ma_san_pham": product_id,
                    "ket_qua": weeks,
                }
            )

        run_time = datetime.now(MUI_GIO_VIET_NAM)

        try:
            run = LichSuDuBao(
                ngay_bat_dau_huan_luyen=first_train_day,
                ngay_ket_thuc_huan_luyen=last_train_day,
                so_tuan_du_bao=so_tuan_du_bao,
                cau_hinh_mo_hinh="PROPHET",
                thoi_gian_chay=run_time,
                tham_so={
                    "daily_seasonality": False,
                    "weekly_seasonality": False,
                    "yearly_seasonality": False,
                    "tan_suat": "TUAN",
                    "kieu_du_bao": "TAT_CA_SAN_PHAM",
                    "so_san_pham": len(san_pham_list),
                    "backtesting": True,
                    "so_fold_toi_da": (
                        DuBaoService.SO_FOLD_TOI_DA
                    ),
                    "seasonal_naive_chu_ky": (
                        SeasonalNaive.CHU_KY
                    ),
                },
                trang_thai="THANH_CONG",
                nguoi_thuc_hien=nguoi_thuc_hien,
            )
            DuBaoRepository.tao_lich_su(
                db=db,
                lich_su=run,
            )

            for item in evaluations:
                score = DanhGiaMoHinh(
                    ma_lich_su_du_bao=(
                        run.ma_lich_su_du_bao
                    ),
                    ma_san_pham=item["ma_san_pham"],
                    mo_hinh=item["mo_hinh"],
                    horizon=item["horizon"],
                    so_fold=item["so_fold"],
                    so_diem_danh_gia=(
                        item["so_diem_danh_gia"]
                    ),
                    chu_ky=item["chu_ky"],
                    mae=item["mae"],
                    rmse=item["rmse"],
                    wape=item["wape"],
                    smape=item["smape"],
                )
                DanhGiaMoHinhRepository.tao_danh_gia(
                    db=db,
                    danh_gia=score,
                )

            for product in forecast_results:
                for week in product["ket_qua"]:
                    detail = ChiTietLichSuDuBao(
                        ma_lich_su_du_bao=(
                            run.ma_lich_su_du_bao
                        ),
                        ma_san_pham=(
                            product["ma_san_pham"]
                        ),
                        ma_nguyen_lieu=None,
                        so_luong_du_bao_kg=None,
                        **week,
                    )
                    DuBaoRepository.tao_chi_tiet(
                        db=db,
                        chi_tiet=detail,
                    )

            db.commit()
        except Exception:
            db.rollback()
            raise

        return {
            "ma_lich_su_du_bao": (
                run.ma_lich_su_du_bao
            ),
            "ngay_chay": ngay_chay,
            "so_tuan_du_bao": so_tuan_du_bao,
            "thoi_gian_chay": run_time,
            "tong_san_pham": len(
                forecast_results
            ),
            "danh_gia_mo_hinh": evaluations,
            "ket_qua": forecast_results,
        }