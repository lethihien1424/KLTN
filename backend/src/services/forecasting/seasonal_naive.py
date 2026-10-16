# ### backend/src/services/forecasting/seasonal_naive.py

import numpy as np
import pandas as pd


class SeasonalNaive:
    @staticmethod
    def du_bao(
        df: pd.DataFrame,
        so_tuan_du_bao: int,
        chu_ky: int = 52,
    ) -> np.ndarray:
        """
        Seasonal Naive:
            y_hat[T+h] = y[T+h-m]

        T: vị trí cuối cùng của dữ liệu huấn luyện.
        h: số bước dự báo kể từ T.
        m: chu kỳ mùa vụ (mặc định 52 tuần).

        Hàm cho phép dự báo nhiều bước để hỗ trợ
        tuần đệm giữa dữ liệu huấn luyện và kỳ dự báo.

        Giới hạn 260 bước là giới hạn kỹ thuật,
        không phải số tuần dự báo người dùng được chọn.
        """
        if (
            isinstance(so_tuan_du_bao, bool)
            or not isinstance(so_tuan_du_bao, int)
            or not 1 <= so_tuan_du_bao <= 260
        ):
            raise ValueError(
                "Số bước Seasonal Naive phải từ 1 đến 260."
            )

        if (
            isinstance(chu_ky, bool)
            or not isinstance(chu_ky, int)
            or chu_ky < 1
        ):
            raise ValueError(
                "Chu kỳ Seasonal Naive phải là số nguyên dương."
            )

        if not isinstance(df, pd.DataFrame):
            raise ValueError(
                "Dữ liệu đầu vào phải là DataFrame."
            )

        if "y" not in df.columns:
            raise ValueError("Thiếu cột y.")

        values = pd.to_numeric(
            df["y"],
            errors="raise",
        ).to_numpy(dtype=float)

        if len(values) < chu_ky:
            raise ValueError(
                f"Seasonal Naive chu kỳ {chu_ky} tuần "
                f"cần ít nhất {chu_ky} tuần lịch sử."
            )

        if not np.isfinite(values).all():
            raise ValueError(
                "Dữ liệu lịch sử chứa giá trị không hợp lệ."
            )

        if (values < 0).any():
            raise ValueError(
                "Số lượng bán không được âm."
            )

        history = list(values)
        forecasts = []

        for _ in range(so_tuan_du_bao):
            prediction = float(history[-chu_ky])
            forecasts.append(prediction)
            history.append(prediction)

        return np.asarray(forecasts, dtype=float)
