### D:\KLTN\KLTN\backend\src\services\forecasting\prophet_co_ban.py
import pandas as pd
from prophet import Prophet


class ProphetCoBan:

    @staticmethod
    def tao_mo_hinh(
        holidays: pd.DataFrame | None = None,
    ) -> Prophet:

        if (
            holidays is not None
            and holidays.empty
        ):
            holidays = None

        return Prophet(
            holidays=holidays,
            daily_seasonality=False,
            weekly_seasonality=False,
            yearly_seasonality=False,
        )

    @staticmethod
    def huan_luyen(
        df: pd.DataFrame,
        holidays: pd.DataFrame | None = None,
    ) -> Prophet:

        if df.empty:
            raise ValueError(
                "Không có dữ liệu để huấn luyện Prophet."
            )

        if not {
            "ds",
            "y",
        }.issubset(df.columns):
            raise ValueError(
                "Dữ liệu Prophet phải có ds và y."
            )

        if len(df) < 8:
            raise ValueError(
                "Cần tối thiểu 8 tuần dữ liệu."
            )

        model = ProphetCoBan.tao_mo_hinh(
            holidays=holidays,
        )

        model.fit(
            df[
                [
                    "ds",
                    "y",
                ]
            ]
        )

        return model

    @staticmethod
    def du_bao(
        model: Prophet,
        ngay_bat_dau_du_bao,
        so_tuan_du_bao: int,
    ) -> pd.DataFrame:

        if not 4 <= so_tuan_du_bao <= 8:
            raise ValueError(
                "Số tuần dự báo phải từ 4 đến 8."
            )

        ngay_bat_dau = pd.Timestamp(
            ngay_bat_dau_du_bao
        ).normalize()

        if ngay_bat_dau.weekday() != 0:
            raise ValueError(
                "Ngày bắt đầu dự báo phải là Thứ Hai."
            )

        future = pd.DataFrame(
            {
                "ds": pd.date_range(
                    start=ngay_bat_dau,
                    periods=so_tuan_du_bao,
                    freq="7D",
                )
            }
        )

        forecast = model.predict(future)

        return forecast[
            [
                "ds",
                "yhat",
                "yhat_lower",
                "yhat_upper",
            ]
        ].copy()