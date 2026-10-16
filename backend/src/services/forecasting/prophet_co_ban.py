### D:\KLTN\KLTN\backend\src\services\forecasting\prophet_co_ban.py
import logging

import numpy as np
import pandas as pd
from prophet import Prophet

logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
logging.getLogger("prophet").setLevel(logging.WARNING)

TEN_HOI_QUY_KM = "km"
TEN_MUA_VU_NAM = "nam"


class ProphetCoBan:
    @staticmethod
    def tao_mo_hinh(holidays: pd.DataFrame | None = None,
                    cau_hinh: dict | None = None, co_khoang: bool = True) -> Prophet:
        config = cau_hinh or {}
        changepoint = float(config.get("changepoint_prior_scale", 0.05))
        seasonality = float(config.get("seasonality_prior_scale", 10.0))
        holiday_prior = float(config.get("holidays_prior_scale", 10.0))
        km_prior = float(config.get("km_prior_scale", 10.0))
        if not all(np.isfinite(x) and x > 0 for x in (changepoint, seasonality, holiday_prior, km_prior)):
            raise ValueError("Các prior_scale phải là số hữu hạn và lớn hơn 0.")
        holiday_df = None
        if holidays is not None and not holidays.empty:
            holiday_df = holidays[["holiday", "ds"]].copy()
            holiday_df["ds"] = pd.to_datetime(holiday_df["ds"])
            holiday_df = holiday_df.drop_duplicates()

        model = Prophet(
            growth="linear", daily_seasonality=False, weekly_seasonality=False,
            yearly_seasonality=False, seasonality_mode="additive",
            changepoint_prior_scale=changepoint,
            seasonality_prior_scale=seasonality,
            holidays_prior_scale=holiday_prior,
            holidays=holiday_df, interval_width=0.80,
            uncertainty_samples=1000 if co_khoang else 0,
        )
        if bool(config.get("yearly_seasonality", False)):
            model.add_seasonality(name=TEN_MUA_VU_NAM, period=365.25,
                                  fourier_order=5, prior_scale=seasonality)
        if bool(config.get("khuyen_mai", False)):
            model.add_regressor(TEN_HOI_QUY_KM, mode="additive",
                                standardize=False, prior_scale=km_prior)
        return model

    @staticmethod
    def huan_luyen(df: pd.DataFrame, holidays: pd.DataFrame | None = None,
                   cau_hinh: dict | None = None, co_khoang: bool = True) -> Prophet:
        if not {"ds", "y"}.issubset(df.columns):
            raise ValueError("Dữ liệu Prophet phải có ds và y.")
        config = dict(cau_hinh or {})
        train = df[["ds", "y"] + ([TEN_HOI_QUY_KM] if TEN_HOI_QUY_KM in df else [])].copy()
        train["ds"] = pd.to_datetime(train["ds"])
        train["y"] = pd.to_numeric(train["y"], errors="raise")
        train = train.sort_values("ds").reset_index(drop=True)
        if train["ds"].isna().any() or train["ds"].duplicated().any():
            raise ValueError("Ngày huấn luyện không hợp lệ hoặc trùng.")
        if not np.isfinite(train["y"].to_numpy(dtype=float)).all() or (train["y"] < 0).any():
            raise ValueError("Số lượng bán phải là số hữu hạn không âm.")
        if len(train) < 8:
            raise ValueError("Prophet yêu cầu tối thiểu 8 tuần dữ liệu.")
        config["yearly_seasonality"] = bool(config.get("yearly_seasonality", False)) and len(train) >= 104
        use_promotion = bool(config.get("khuyen_mai", False)) and TEN_HOI_QUY_KM in train
        if use_promotion:
            km = pd.to_numeric(train[TEN_HOI_QUY_KM], errors="raise").to_numpy(dtype=float)
            if not np.isfinite(km).all() or ((km < 0) | (km > 1)).any():
                raise ValueError("Biến km phải là số hữu hạn trong khoảng 0–1.")
            use_promotion = len(np.unique(km)) > 1
        config["khuyen_mai"] = use_promotion
        model = ProphetCoBan.tao_mo_hinh(holidays, config, co_khoang)
        columns = ["ds", "y"] + ([TEN_HOI_QUY_KM] if use_promotion else [])
        model.fit(train[columns])
        return model

    @staticmethod
    def co_hoi_quy_km(model: Prophet) -> bool:
        return TEN_HOI_QUY_KM in model.extra_regressors

    @staticmethod
    def co_mua_vu_nam(model: Prophet) -> bool:
        return TEN_MUA_VU_NAM in model.seasonalities

    @staticmethod
    def _tao_tuong_lai(model: Prophet, dates, khuyen_mai=None) -> pd.DataFrame:
        future = pd.DataFrame({"ds": pd.to_datetime(dates)})
        if TEN_HOI_QUY_KM in model.extra_regressors:
            if khuyen_mai is None:
                raise ValueError("Thiếu kịch bản CTKM tương lai cho mô hình có hồi quy km.")
            series = pd.Series(khuyen_mai, dtype=float)
            series.index = pd.to_datetime(series.index)
            if series.index.has_duplicates:
                raise ValueError("Lịch CTKM có tuần bị trùng.")
            values = future["ds"].map(series)
            if values.isna().any():
                raise ValueError("Thiếu giá trị CTKM cho một hoặc nhiều tuần dự báo.")
            values = values.to_numpy(dtype=float)
            if not np.isfinite(values).all() or ((values < 0) | (values > 1)).any():
                raise ValueError("Giá trị CTKM tương lai phải nằm trong 0–1.")
            future[TEN_HOI_QUY_KM] = values
        return future

    @staticmethod
    def du_bao_tai_ngay(model: Prophet, ngay, khuyen_mai=None) -> pd.DataFrame:
        dates = pd.to_datetime(list(ngay))
        if len(dates) == 0:
            return pd.DataFrame()
        return model.predict(ProphetCoBan._tao_tuong_lai(model, dates, khuyen_mai)).reset_index(drop=True)

    @staticmethod
    def du_bao(model: Prophet, ngay_bat_dau_du_bao, so_tuan_du_bao: int,
               khuyen_mai=None) -> pd.DataFrame:
        if not isinstance(so_tuan_du_bao, int) or not 1 <= so_tuan_du_bao <= 8:
            raise ValueError("Số tuần dự báo phải là số nguyên từ 1 đến 8.")
        start = pd.Timestamp(ngay_bat_dau_du_bao).normalize()
        if start.weekday() != 0:
            raise ValueError("Ngày bắt đầu dự báo phải là thứ Hai.")
        dates = pd.date_range(start=start, periods=so_tuan_du_bao, freq="W-MON")
        result = model.predict(ProphetCoBan._tao_tuong_lai(model, dates, khuyen_mai))
        for col in ("yhat", "yhat_lower", "yhat_upper"):
            if col not in result.columns:
                raise ValueError(f"Prophet không trả về cột {col}.")
        return result.reset_index(drop=True)

    @staticmethod
    def thanh_phan(row) -> dict[str, float]:
        def get(name: str) -> float:
            value = row.get(name, 0.0)
            return 0.0 if pd.isna(value) else float(value)
        return {
            "xu_huong": get("trend"), "ngay_le": get("holidays"),
            "mua_vu_nam": get(TEN_MUA_VU_NAM),
            "khuyen_mai": get(TEN_HOI_QUY_KM),
        }
