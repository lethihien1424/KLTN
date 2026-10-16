# ##D:\KLTN\KLTN\backend\src\services\forecasting\backtesting.py
import math

import numpy as np
import pandas as pd

from src.services.forecasting.prophet_co_ban import (
    TEN_HOI_QUY_KM,
    ProphetCoBan,
)
from src.services.forecasting.seasonal_naive import (
    SeasonalNaive,
)


class Backtesting:
    MIN_TRAIN_WEEKS = 8
    SEASONAL_PERIOD = 52

    @staticmethod
    def _validate(
        df: pd.DataFrame,
        horizon: int,
        so_tuan_dem: int = 1,
    ) -> pd.DataFrame:
        if not isinstance(so_tuan_dem, int) or so_tuan_dem < 0:
            raise ValueError("Số tuần đệm phải là số nguyên không âm.")
        if not isinstance(horizon, int) or not 1 <= horizon <= 8:
            raise ValueError(
                "Horizon phải là số nguyên từ 1 đến 8."
            )

        if not {"ds", "y"}.issubset(df.columns):
            raise ValueError(
                "Dữ liệu kiểm thử cần có ds và y."
            )

        columns = ["ds", "y"]

        if TEN_HOI_QUY_KM in df.columns:
            columns.append(TEN_HOI_QUY_KM)

        data = df[columns].copy()
        data["ds"] = pd.to_datetime(data["ds"])
        data["y"] = pd.to_numeric(data["y"], errors="raise")

        if TEN_HOI_QUY_KM in data.columns:
            data[TEN_HOI_QUY_KM] = (
                pd.to_numeric(
                    data[TEN_HOI_QUY_KM], errors="raise"
                )
                .fillna(0.0)
                .clip(0.0, 1.0)
            )

        data = data.sort_values("ds").reset_index(drop=True)

        if (
            data["ds"].duplicated().any()
            or data["y"].isna().any()
            or not np.isfinite(data["y"].to_numpy()).all()
            or (data["y"] < 0).any()
        ):
            raise ValueError(
                "Dữ liệu backtesting không hợp lệ."
            )

        if len(data) < Backtesting.MIN_TRAIN_WEEKS + so_tuan_dem + horizon:
            raise ValueError(
                "Không đủ dữ liệu cho huấn luyện và kiểm thử."
            )

        expected = pd.date_range(
            start=data["ds"].iloc[0],
            periods=len(data),
            freq="W-MON",
        )

        if not data["ds"].equals(pd.Series(expected)):
            raise ValueError(
                "Dữ liệu phải liên tục theo tuần thứ Hai."
            )

        return data

    @staticmethod
    def _hoi_quy(frame: pd.DataFrame) -> pd.Series | None:
        if TEN_HOI_QUY_KM not in frame.columns:
            return None

        return pd.Series(
            frame[TEN_HOI_QUY_KM].to_numpy(dtype=float),
            index=pd.DatetimeIndex(frame["ds"]),
        )

    @staticmethod
    def _folds(
        n: int,
        horizon: int,
        so_fold_toi_da: int,
        min_train: int,
        so_tuan_dem: int = 1,
    ) -> list[int]:
        if so_fold_toi_da < 1:
            raise ValueError("Số fold phải lớn hơn 0.")

        origins = []

        # Các khoảng test không chồng lấn nhau.
        for fold_index in range(so_fold_toi_da):
            train_end = n - horizon * (fold_index + 1) - so_tuan_dem

            if train_end < min_train:
                break

            origins.append(train_end)

        return sorted(origins)

    @staticmethod
    def _metrics(
        actual,
        predicted,
    ) -> dict:
        y = np.asarray(actual, dtype=float)
        yhat = np.asarray(predicted, dtype=float)

        if y.shape != yhat.shape or y.size == 0:
            raise ValueError(
                "Dữ liệu thực tế và dự báo không khớp."
            )

        if (
            not np.isfinite(y).all()
            or not np.isfinite(yhat).all()
        ):
            raise ValueError(
                "Chỉ số đánh giá chứa giá trị không hợp lệ."
            )

        errors = y - yhat
        absolute_errors = np.abs(errors)

        mae = float(np.mean(absolute_errors))
        rmse = float(np.sqrt(np.mean(errors ** 2)))

        denominator_wape = float(np.sum(np.abs(y)))

        wape = (
            float(
                np.sum(absolute_errors)
                / denominator_wape
                * 100
            )
            if denominator_wape > 0
            else None
        )

        denominator_smape = np.abs(y) + np.abs(yhat)

        # Quy ước: thực tế và dự báo cùng bằng 0 -> sai số 0.
        smape_terms = np.divide(
            2.0 * absolute_errors,
            denominator_smape,
            out=np.zeros_like(absolute_errors),
            where=denominator_smape > 0,
        )

        smape = float(np.mean(smape_terms) * 100)

        return {
            "mae": mae,
            "rmse": rmse,
            "wape": wape,
            "smape": smape,
        }

    @staticmethod
    def _candidate_configs(
        train_length: int,
        dung_khuyen_mai: bool = False,
    ) -> list[dict]:
        candidates = []

        yearly_options = (
            [False, True] if train_length >= 104 else [False]
        )

        for yearly in yearly_options:
            for changepoint in (0.05, 0.1):
                candidates.append({
                    "changepoint_prior_scale": changepoint,
                    "seasonality_prior_scale": 10.0,
                    "holidays_prior_scale": 10.0,
                    "yearly_seasonality": yearly,
                    "khuyen_mai": bool(dung_khuyen_mai),
                })

        return candidates

    @staticmethod
    def chon_cau_hinh(
        df: pd.DataFrame,
        holidays: pd.DataFrame | None,
        horizon: int,
        dung_khuyen_mai: bool = False,
        so_tuan_dem: int = 1,
    ) -> dict:
        """
        Chọn cấu hình bằng validation ở cuối phần dữ liệu truyền vào.

        Khi được gọi trong outer backtest, hàm này chỉ nhìn thấy
        outer training set, tránh dùng dữ liệu outer test để chọn
        cấu hình.
        """
        data = Backtesting._validate(df, horizon, so_tuan_dem)

        candidates = Backtesting._candidate_configs(
            len(data), dung_khuyen_mai
        )

        validation_weeks = horizon
        train_end = len(data) - validation_weeks - so_tuan_dem

        if train_end < Backtesting.MIN_TRAIN_WEEKS:
            return candidates[0]

        train = data.iloc[:train_end].copy()
        validation = data.iloc[train_end + so_tuan_dem:].copy()

        best_config = None
        best_mae = math.inf

        for config in candidates:
            if (
                config["yearly_seasonality"]
                and len(train) < 104
            ):
                continue

            try:
                model = ProphetCoBan.huan_luyen(
                    df=train,
                    holidays=holidays,
                    cau_hinh=config,
                    co_khoang=False,
                )

                result = ProphetCoBan.du_bao_tai_ngay(
                    model,
                    validation["ds"],
                    khuyen_mai=Backtesting._hoi_quy(validation),
                )

                predictions = np.maximum(
                    result["yhat"].to_numpy(dtype=float),
                    0.0,
                )

                score = Backtesting._metrics(
                    validation["y"].to_numpy(),
                    predictions,
                )["mae"]

                if score < best_mae:
                    best_mae = score
                    best_config = dict(config)

            except (ValueError, RuntimeError):
                continue

        if best_config is None:
            raise ValueError(
                "Không thể huấn luyện cấu hình Prophet hợp lệ."
            )

        return best_config

    @staticmethod
    def danh_gia_hai_mo_hinh(
        df: pd.DataFrame,
        holidays: pd.DataFrame | None,
        horizon: int,
        so_fold_toi_da: int = 4,
        dung_khuyen_mai: bool = False,
        so_tuan_dem: int = 1,
    ) -> tuple[list[dict], list[dict]]:
        """
        So sánh Prophet và Seasonal Naive trên cùng các fold.

        Seasonal Naive dùng chu kỳ 52 tuần nên mỗi fold phải có
        tối thiểu 52 tuần train. Nếu dữ liệu không đủ, không tạo
        chỉ số giả.
        """
        data = Backtesting._validate(df, horizon, so_tuan_dem)

        origins = Backtesting._folds(
            n=len(data),
            horizon=horizon,
            so_fold_toi_da=so_fold_toi_da,
            min_train=max(
                Backtesting.MIN_TRAIN_WEEKS,
                Backtesting.SEASONAL_PERIOD,
            ),
            so_tuan_dem=so_tuan_dem,
        )

        if not origins:
            raise ValueError(
                "Không đủ dữ liệu để so sánh Prophet "
                "với Seasonal Naive chu kỳ 52 tuần. "
                f"Cần tối thiểu {52 + so_tuan_dem + horizon} tuần "
                "lịch sử hoàn chỉnh."
            )

        predictions_by_model = {
            "PROPHET": [],
            "SEASONAL_NAIVE": [],
        }

        actual_by_model = {
            "PROPHET": [],
            "SEASONAL_NAIVE": [],
        }

        fold_configs = []

        for fold_number, train_end in enumerate(
            origins, start=1
        ):
            train = data.iloc[:train_end].copy()

            test = data.iloc[
                train_end + so_tuan_dem:
                train_end + so_tuan_dem + horizon
            ].copy()

            actual = test["y"].to_numpy(dtype=float)

            config = Backtesting.chon_cau_hinh(
                df=train,
                holidays=holidays,
                horizon=horizon,
                dung_khuyen_mai=dung_khuyen_mai,
                so_tuan_dem=so_tuan_dem,
            )

            prophet_model = ProphetCoBan.huan_luyen(
                df=train,
                holidays=holidays,
                cau_hinh=config,
                co_khoang=False,
            )

            prophet_result = ProphetCoBan.du_bao_tai_ngay(
                prophet_model,
                test["ds"],
                khuyen_mai=Backtesting._hoi_quy(test),
            )

            prophet_prediction = np.maximum(
                prophet_result["yhat"].to_numpy(dtype=float),
                0.0,
            )

            naive_prediction = SeasonalNaive.du_bao(
                df=train[["ds", "y"]],
                so_tuan_du_bao=horizon + so_tuan_dem,
                chu_ky=Backtesting.SEASONAL_PERIOD,
            )[-horizon:]

            predictions_by_model["PROPHET"].extend(
                prophet_prediction.tolist()
            )
            predictions_by_model["SEASONAL_NAIVE"].extend(
                naive_prediction.tolist()
            )

            for model_name in predictions_by_model:
                actual_by_model[model_name].extend(
                    actual.tolist()
                )

            fold_configs.append({
                "so_tuan_dem": so_tuan_dem,
                "fold": fold_number,
                "tu_ngay": test["ds"].iloc[0].date().isoformat(),
                "den_ngay": (
                    test["ds"].iloc[-1]
                    + pd.Timedelta(days=6)
                ).date().isoformat(),
                "so_tuan_train": len(train),
                "cau_hinh_prophet": config,
            })

        scores = []

        for model_name in (
            "PROPHET",
            "SEASONAL_NAIVE",
        ):
            metrics = Backtesting._metrics(
                actual_by_model[model_name],
                predictions_by_model[model_name],
            )

            scores.append({
                "mo_hinh": model_name,
                "horizon": horizon,
                "so_fold": len(origins),
                "so_diem_danh_gia": len(
                    actual_by_model[model_name]
                ),
                "chu_ky": (
                    Backtesting.SEASONAL_PERIOD
                    if model_name == "SEASONAL_NAIVE"
                    else None
                ),
                "mae": round(metrics["mae"], 4),
                "rmse": round(metrics["rmse"], 4),
                "wape": (
                    round(metrics["wape"], 4)
                    if metrics["wape"] is not None
                    else None
                ),
                "smape": round(metrics["smape"], 4),
            })

        return scores, fold_configs