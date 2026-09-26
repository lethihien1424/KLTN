# ##D:\KLTN\KLTN\backend\src\services\forecasting\backtesting.py
# import numpy as np
# import pandas as pd

# from src.services.forecasting.danh_gia_sai_so import DanhGiaSaiSo
# from src.services.forecasting.prophet_co_ban import ProphetCoBan
# from src.services.forecasting.seasonal_naive import SeasonalNaive


# class Backtesting:
#     """Expanding-window backtesting theo tuần."""

#     SO_TUAN_TRAIN_TOI_THIEU = SeasonalNaive.CHU_KY

#     @staticmethod
#     def tinh_so_fold_phu_hop(
#         df: pd.DataFrame,
#         horizon: int,
#         so_fold_toi_da: int = 3,
#         so_tuan_train_toi_thieu: int = SO_TUAN_TRAIN_TOI_THIEU,
#     ) -> int:
#         Backtesting._kiem_tra_horizon(horizon)

#         if so_fold_toi_da <= 0:
#             raise ValueError("Số fold tối đa phải lớn hơn 0.")

#         if so_tuan_train_toi_thieu < SeasonalNaive.CHU_KY:
#             raise ValueError(
#                 f"Số tuần train tối thiểu không được nhỏ hơn "
#                 f"{SeasonalNaive.CHU_KY}."
#             )

#         so_tuan_co_the_test = len(df) - so_tuan_train_toi_thieu

#         if so_tuan_co_the_test < horizon:
#             return 0

#         so_fold_co_the = so_tuan_co_the_test // horizon

#         return min(so_fold_toi_da, so_fold_co_the)

#     @staticmethod
#     def danh_gia_prophet(
#         df: pd.DataFrame,
#         holidays: pd.DataFrame | None,
#         horizon: int,
#         so_fold: int,
#     ) -> dict:
#         Backtesting._kiem_tra_du_lieu(df, horizon, so_fold)

#         du_bao_tat_ca = []
#         thuc_te_tat_ca = []
#         chi_tiet_backtest = []

#         vi_tri_test_dau = len(df) - horizon * so_fold

#         for fold in range(so_fold):
#             train_end = vi_tri_test_dau + fold * horizon
#             test_end = train_end + horizon

#             train = (
#                 df.iloc[:train_end]
#                 .copy()
#                 .reset_index(drop=True)
#             )
#             test = (
#                 df.iloc[train_end:test_end]
#                 .copy()
#                 .reset_index(drop=True)
#             )

#             ngay_bat_dau_du_bao = (
#                 pd.Timestamp(train["ds"].max())
#                 + pd.Timedelta(weeks=1)
#             )

#             model = ProphetCoBan.huan_luyen(
#                 df=train,
#                 holidays=holidays,
#             )

#             forecast = ProphetCoBan.du_bao(
#                 model=model,
#                 ngay_bat_dau_du_bao=ngay_bat_dau_du_bao,
#                 so_tuan_du_bao=horizon,
#             )

#             Backtesting._kiem_tra_ngay_test(
#                 test=test,
#                 forecast=forecast,
#             )

#             thuc_te = test["y"].to_numpy(dtype=float)
#             du_bao = (
#                 forecast["yhat"]
#                 .clip(lower=0)
#                 .to_numpy(dtype=float)
#             )

#             Backtesting._them_chi_tiet(
#                 chi_tiet=chi_tiet_backtest,
#                 fold=fold,
#                 test=test,
#                 thuc_te=thuc_te,
#                 du_bao=du_bao,
#             )

#             thuc_te_tat_ca.extend(thuc_te.tolist())
#             du_bao_tat_ca.extend(du_bao.tolist())

#         chi_so = DanhGiaSaiSo.tinh_tat_ca(
#             thuc_te=thuc_te_tat_ca,
#             du_bao=du_bao_tat_ca,
#         )

#         return {
#             "mo_hinh": "PROPHET",
#             "horizon": horizon,
#             "so_fold": so_fold,
#             "so_diem_danh_gia": len(thuc_te_tat_ca),
#             "chu_ky": None,
#             **chi_so,
#             "chi_tiet": chi_tiet_backtest,
#         }

#     @staticmethod
#     def danh_gia_seasonal_naive(
#         df: pd.DataFrame,
#         horizon: int,
#         so_fold: int,
#         chu_ky: int = SeasonalNaive.CHU_KY,
#     ) -> dict:
#         Backtesting._kiem_tra_du_lieu(df, horizon, so_fold)

#         if chu_ky != SeasonalNaive.CHU_KY:
#             raise ValueError(
#                 f"Chu kỳ Seasonal Naive phải là "
#                 f"{SeasonalNaive.CHU_KY} tuần."
#             )

#         du_bao_tat_ca = []
#         thuc_te_tat_ca = []
#         chi_tiet_backtest = []

#         vi_tri_test_dau = len(df) - horizon * so_fold

#         for fold in range(so_fold):
#             train_end = vi_tri_test_dau + fold * horizon
#             test_end = train_end + horizon

#             train = (
#                 df.iloc[:train_end]
#                 .copy()
#                 .reset_index(drop=True)
#             )
#             test = (
#                 df.iloc[train_end:test_end]
#                 .copy()
#                 .reset_index(drop=True)
#             )

#             du_bao = SeasonalNaive.du_bao(
#                 df=train,
#                 so_tuan_du_bao=horizon,
#                 chu_ky=chu_ky,
#             )

#             thuc_te = test["y"].to_numpy(dtype=float)

#             if len(thuc_te) != len(du_bao):
#                 raise ValueError(
#                     "Số điểm thực tế và dự báo "
#                     "Seasonal Naive không khớp."
#                 )

#             Backtesting._them_chi_tiet(
#                 chi_tiet=chi_tiet_backtest,
#                 fold=fold,
#                 test=test,
#                 thuc_te=thuc_te,
#                 du_bao=du_bao,
#             )

#             thuc_te_tat_ca.extend(thuc_te.tolist())
#             du_bao_tat_ca.extend(du_bao.tolist())

#         chi_so = DanhGiaSaiSo.tinh_tat_ca(
#             thuc_te=thuc_te_tat_ca,
#             du_bao=du_bao_tat_ca,
#         )

#         return {
#             "mo_hinh": "SEASONAL_NAIVE",
#             "horizon": horizon,
#             "chu_ky": chu_ky,
#             "so_fold": so_fold,
#             "so_diem_danh_gia": len(thuc_te_tat_ca),
#             **chi_so,
#             "chi_tiet": chi_tiet_backtest,
#         }

#     @staticmethod
#     def co_the_danh_gia_seasonal_naive(
#         df: pd.DataFrame,
#         horizon: int,
#         chu_ky: int = SeasonalNaive.CHU_KY,
#         so_fold: int = 1,
#     ) -> bool:
#         if horizon not in (4, 8) or so_fold <= 0:
#             return False

#         so_tuan_train_fold_dau = len(df) - horizon * so_fold
#         return so_tuan_train_fold_dau >= chu_ky

#     @staticmethod
#     def _them_chi_tiet(
#         chi_tiet: list[dict],
#         fold: int,
#         test: pd.DataFrame,
#         thuc_te: np.ndarray,
#         du_bao: np.ndarray,
#     ) -> None:
#         if len(thuc_te) != len(du_bao):
#             raise ValueError(
#                 "Số điểm thực tế và dự báo không khớp."
#             )

#         for i in range(len(test)):
#             ngay_test = pd.Timestamp(
#                 test.iloc[i]["ds"]
#             ).normalize()

#             gia_tri_thuc_te = float(thuc_te[i])
#             gia_tri_du_bao = float(du_bao[i])

#             chi_tiet.append({
#                 "fold": fold + 1,
#                 "tu_ngay": ngay_test.date(),
#                 "den_ngay": (
#                     ngay_test + pd.Timedelta(days=6)
#                 ).date(),
#                 "thuc_te": gia_tri_thuc_te,
#                 "du_bao": gia_tri_du_bao,
#                 "sai_so": gia_tri_du_bao - gia_tri_thuc_te,
#                 "sai_so_tuyet_doi": abs(
#                     gia_tri_thuc_te - gia_tri_du_bao
#                 ),
#             })

#     @staticmethod
#     def _kiem_tra_ngay_test(
#         test: pd.DataFrame,
#         forecast: pd.DataFrame,
#     ) -> None:
#         ngay_test = pd.DatetimeIndex(
#             pd.to_datetime(test["ds"]).dt.normalize()
#         )
#         ngay_du_bao = pd.DatetimeIndex(
#             pd.to_datetime(forecast["ds"]).dt.normalize()
#         )

#         if not ngay_du_bao.equals(ngay_test):
#             raise ValueError(
#                 "Backtesting bị lệch tuần giữa dữ liệu thực tế "
#                 "và dữ liệu dự báo."
#             )

#     @staticmethod
#     def _kiem_tra_horizon(horizon: int) -> None:
#         if horizon not in (4, 8):
#             raise ValueError(
#                 "Horizon chỉ được là 4 hoặc 8 tuần."
#             )

#     @staticmethod
#     def _kiem_tra_du_lieu(
#         df: pd.DataFrame,
#         horizon: int,
#         so_fold: int,
#     ) -> None:
#         Backtesting._kiem_tra_horizon(horizon)

#         if df.empty or not {"ds", "y"}.issubset(df.columns):
#             raise ValueError(
#                 "Dữ liệu backtesting phải có cột ds, y "
#                 "và không được rỗng."
#             )

#         if so_fold <= 0:
#             raise ValueError("Số fold phải lớn hơn 0.")

#         ngay = pd.to_datetime(df["ds"], errors="coerce")
#         nhu_cau = pd.to_numeric(
#             df["y"],
#             errors="coerce",
#         ).to_numpy(dtype=float)

#         if ngay.isna().any():
#             raise ValueError(
#                 "Dữ liệu backtesting có ngày không hợp lệ."
#             )

#         if not np.isfinite(nhu_cau).all() or (nhu_cau < 0).any():
#             raise ValueError(
#                 "Nhu cầu phải là số hữu hạn không âm."
#             )

#         if ngay.duplicated().any() or not ngay.is_monotonic_increasing:
#             raise ValueError(
#                 "Dữ liệu tuần phải có ngày duy nhất "
#                 "và được sắp xếp tăng dần."
#             )

#         so_tuan_test = horizon * so_fold
#         so_tuan_train = len(df) - so_tuan_test

#         if so_tuan_train < SeasonalNaive.CHU_KY:
#             raise ValueError(
#                 f"Mỗi fold cần tối thiểu "
#                 f"{SeasonalNaive.CHU_KY} tuần train "
#                 "để đánh giá Seasonal Naive m=52."
#             )
import numpy as np
import pandas as pd

from src.services.forecasting.danh_gia_sai_so import (
    DanhGiaSaiSo,
)
from src.services.forecasting.prophet_co_ban import (
    ProphetCoBan,
)
from src.services.forecasting.seasonal_naive import (
    SeasonalNaive,
)


class Backtesting:
    """
    Expanding-window backtesting.

    Mỗi fold:
    - train bằng dữ liệu quá khứ
    - dự báo horizon tuần tiếp theo
    - so sánh forecast với actual
    """

    # Cùng tập train cho Prophet và Seasonal Naive m=52.
    SO_TUAN_TRAIN_TOI_THIEU = 52

    @staticmethod
    def tinh_so_fold_phu_hop(
        df: pd.DataFrame,
        horizon: int,
        so_fold_toi_da: int = 3,
        so_tuan_train_toi_thieu: int = 52,
    ) -> int:

        if horizon not in (4, 8):
            raise ValueError(
                "Horizon backtesting phải "
                "4 hoặc 8 tuần."
            )

        if so_fold_toi_da <= 0:
            raise ValueError(
                "Số fold tối đa phải lớn hơn 0."
            )

        so_tuan = len(df)

        # Một tuần đang diễn ra nằm giữa train và test.
        so_tuan_co_the_test = so_tuan - so_tuan_train_toi_thieu - 1

        if so_tuan_co_the_test < horizon:
            return 0

        so_fold_co_the = (
            so_tuan_co_the_test
            // horizon
        )

        return min(
            so_fold_toi_da,
            so_fold_co_the,
        )

    @staticmethod
    def danh_gia_prophet(
        df: pd.DataFrame,
        holidays: pd.DataFrame | None,
        horizon: int,
        so_fold: int,
    ) -> dict:

        Backtesting._kiem_tra_du_lieu(
            df=df,
            horizon=horizon,
            so_fold=so_fold,
        )

        du_bao_tat_ca = []
        thuc_te_tat_ca = []

        # Dùng để debug từng điểm backtest.
        chi_tiet_backtest = []

        tong_so_tuan_test = (
            horizon * so_fold
        )

        vi_tri_train_dau = len(df) - tong_so_tuan_test - 1

        for fold in range(so_fold):

            train_end = (
                vi_tri_train_dau
                + fold * horizon
            )

            test_start = train_end + 1
            test_end = test_start + horizon

            train = (
                df.iloc[:train_end]
                .copy()
                .reset_index(drop=True)
            )

            test = (
                df.iloc[
                    test_start:test_end
                ]
                .copy()
                .reset_index(drop=True)
            )

            # Bỏ tuần hiện tại chưa hoàn chỉnh; bắt đầu từ tuần sau.
            ngay_bat_dau_du_bao = (
                pd.Timestamp(
                    train["ds"].max()
                )
                + pd.Timedelta(
                    weeks=2
                )
            )

            model = (
                ProphetCoBan.huan_luyen(
                    df=train,
                    holidays=holidays,
                )
            )

            forecast = (
                ProphetCoBan.du_bao(
                    model=model,
                    ngay_bat_dau_du_bao=(
                        ngay_bat_dau_du_bao
                    ),
                    so_tuan_du_bao=horizon,
                )
            )

            thuc_te = (
                test["y"]
                .to_numpy(
                    dtype=float
                )
            )

            # Prophet có thể cho giá trị âm.
            # Nhu cầu không thể âm nên chặn về 0.
            du_bao = (
                forecast["yhat"]
                .clip(lower=0)
                .to_numpy(
                    dtype=float
                )
            )

            if len(thuc_te) != len(du_bao):
                raise ValueError(
                    "Số điểm thực tế và dự báo "
                    "trong backtesting không khớp."
                )

            # Kiểm tra ngày test và ngày forecast
            # phải khớp tuyệt đối.
            for i in range(len(test)):

                ngay_test = (
                    pd.Timestamp(
                        test.iloc[i]["ds"]
                    )
                    .normalize()
                )

                ngay_forecast = (
                    pd.Timestamp(
                        forecast.iloc[i]["ds"]
                    )
                    .normalize()
                )

                if ngay_test != ngay_forecast:
                    raise ValueError(
                        "Backtesting bị lệch tuần: "
                        f"actual={ngay_test.date()}, "
                        f"forecast={ngay_forecast.date()}."
                    )

                tu_ngay = (
                    ngay_test.date()
                )

                den_ngay = (
                    ngay_test
                    + pd.Timedelta(days=6)
                ).date()

                chi_tiet_backtest.append(
                    {
                        "fold": fold + 1,
                        "tu_ngay": tu_ngay,
                        "den_ngay": den_ngay,
                        "thuc_te": float(
                            thuc_te[i]
                        ),
                        "du_bao": float(
                            du_bao[i]
                        ),
                        "sai_so": float(
                            du_bao[i]
                            - thuc_te[i]
                        ),
                        "sai_so_tuyet_doi": float(
                            abs(
                                thuc_te[i]
                                - du_bao[i]
                            )
                        ),
                    }
                )

            thuc_te_tat_ca.extend(
                thuc_te.tolist()
            )

            du_bao_tat_ca.extend(
                du_bao.tolist()
            )

        chi_so = (
            DanhGiaSaiSo.tinh_tat_ca(
                thuc_te=thuc_te_tat_ca,
                du_bao=du_bao_tat_ca,
            )
        )

        return {
            "mo_hinh": "PROPHET",
            "horizon": horizon,
            "so_fold": so_fold,
            "so_diem_danh_gia": len(
                thuc_te_tat_ca
            ),
            "chu_ky": None,
            **chi_so,
            "chi_tiet": chi_tiet_backtest,
        }

    @staticmethod
    def danh_gia_seasonal_naive(
        df: pd.DataFrame,
        horizon: int,
        chu_ky: int,
        so_fold: int,
    ) -> dict:

        Backtesting._kiem_tra_du_lieu(
            df=df,
            horizon=horizon,
            so_fold=so_fold,
        )

        du_bao_tat_ca = []
        thuc_te_tat_ca = []
        chi_tiet_backtest = []

        tong_so_tuan_test = (
            horizon * so_fold
        )

        vi_tri_train_dau = len(df) - tong_so_tuan_test - 1

        for fold in range(so_fold):

            train_end = (
                vi_tri_train_dau
                + fold * horizon
            )

            test_start = train_end + 1
            test_end = test_start + horizon

            train = (
                df.iloc[:train_end]
                .copy()
                .reset_index(drop=True)
            )

            test = (
                df.iloc[
                    test_start:test_end
                ]
                .copy()
                .reset_index(drop=True)
            )

            if len(train) < chu_ky:
                raise ValueError(
                    "Không đủ dữ liệu train cho "
                    f"Seasonal Naive chu kỳ "
                    f"{chu_ky} tuần."
                )

            du_bao = (
                SeasonalNaive.du_bao(
                    df=train,
                    so_tuan_du_bao=horizon + 1,
                    chu_ky=chu_ky,
                )
            )[1:]

            thuc_te = (
                test["y"]
                .to_numpy(
                    dtype=float
                )
            )

            if len(thuc_te) != len(du_bao):
                raise ValueError(
                    "Số điểm thực tế và dự báo "
                    "Seasonal Naive không khớp."
                )

            for i in range(len(test)):

                ngay_test = (
                    pd.Timestamp(
                        test.iloc[i]["ds"]
                    )
                    .normalize()
                )

                tu_ngay = (
                    ngay_test.date()
                )

                den_ngay = (
                    ngay_test
                    + pd.Timedelta(days=6)
                ).date()

                chi_tiet_backtest.append(
                    {
                        "fold": fold + 1,
                        "tu_ngay": tu_ngay,
                        "den_ngay": den_ngay,
                        "thuc_te": float(
                            thuc_te[i]
                        ),
                        "du_bao": float(
                            du_bao[i]
                        ),
                        "sai_so": float(
                            du_bao[i]
                            - thuc_te[i]
                        ),
                        "sai_so_tuyet_doi": float(
                            abs(
                                thuc_te[i]
                                - du_bao[i]
                            )
                        ),
                    }
                )

            thuc_te_tat_ca.extend(
                thuc_te.tolist()
            )

            du_bao_tat_ca.extend(
                du_bao.tolist()
            )

        chi_so = (
            DanhGiaSaiSo.tinh_tat_ca(
                thuc_te=thuc_te_tat_ca,
                du_bao=du_bao_tat_ca,
            )
        )

        return {
            "mo_hinh": "SEASONAL_NAIVE",
            "horizon": horizon,
            "chu_ky": chu_ky,
            "so_fold": so_fold,
            "so_diem_danh_gia": len(
                thuc_te_tat_ca
            ),
            **chi_so,
            "chi_tiet": chi_tiet_backtest,
        }

    @staticmethod
    def co_the_danh_gia_seasonal_naive(
        df: pd.DataFrame,
        horizon: int,
        chu_ky: int,
        so_fold: int,
    ) -> bool:

        if chu_ky != SeasonalNaive.CHU_KY or horizon not in (4, 8):
            return False

        tong_so_tuan_test = (
            horizon * so_fold
        )

        so_tuan_train_fold_dau = len(df) - tong_so_tuan_test - 1

        return (
            so_tuan_train_fold_dau
            >= chu_ky
        )

    @staticmethod
    def _kiem_tra_du_lieu(
        df: pd.DataFrame,
        horizon: int,
        so_fold: int,
    ) -> None:

        if df.empty:
            raise ValueError(
                "Không có dữ liệu để backtesting."
            )

        if not {
            "ds",
            "y",
        }.issubset(
            df.columns
        ):
            raise ValueError(
                "Dữ liệu backtesting phải "
                "có cột ds và y."
            )

        ds = pd.to_datetime(df["ds"], errors="coerce")
        y = pd.to_numeric(df["y"], errors="coerce").to_numpy(dtype=float)
        if ds.isna().any() or not np.isfinite(y).all() or (y < 0).any():
            raise ValueError("Ngày hoặc nhu cầu tuần không hợp lệ.")
        if (
            not ds.is_monotonic_increasing
            or ds.duplicated().any()
            or (ds.dt.weekday != 0).any()
            or (ds.diff().iloc[1:] != pd.Timedelta(weeks=1)).any()
        ):
            raise ValueError(
                "Các tuần phải liên tục và bắt đầu vào Thứ Hai."
            )

        if horizon not in (4, 8):
            raise ValueError(
                "Horizon backtesting phải "
                "4 hoặc 8 tuần."
            )

        if so_fold <= 0:
            raise ValueError(
                "Số fold phải lớn hơn 0."
            )

        so_tuan_test = (
            horizon * so_fold
        )

        so_tuan_train = len(df) - so_tuan_test - 1

        if (
            so_tuan_train
            < Backtesting.SO_TUAN_TRAIN_TOI_THIEU
        ):
            raise ValueError(
                "Không đủ dữ liệu để thực hiện "
                "expanding-window backtesting."
            )