import numpy as np
import pandas as pd


class SeasonalNaive:
    """
    Seasonal Naive dùng làm baseline.

    Công thức:

        y_hat(t) = y(t - chu_ky)

    Với dữ liệu tuần và mùa vụ năm:

        chu_ky = 52

    chu_ky không phải horizon.
    """

    @staticmethod
    def du_bao(
        df: pd.DataFrame,
        so_tuan_du_bao: int,
        chu_ky: int,
    ) -> np.ndarray:

        if df.empty:
            raise ValueError(
                "Không có dữ liệu cho Seasonal Naive."
            )

        if "y" not in df.columns:
            raise ValueError(
                "Dữ liệu Seasonal Naive "
                "phải có cột y."
            )

        if so_tuan_du_bao <= 0:
            raise ValueError(
                "Số tuần dự báo phải lớn hơn 0."
            )

        if chu_ky <= 0:
            raise ValueError(
                "Chu kỳ mùa vụ phải lớn hơn 0."
            )

        if len(df) < chu_ky:
            raise ValueError(
                "Không đủ dữ liệu cho chu kỳ "
                f"mùa vụ {chu_ky} tuần."
            )

        y = (
            pd.to_numeric(
                df["y"],
                errors="coerce",
            )
            .to_numpy(
                dtype=float
            )
        )

        if np.isnan(y).any():
            raise ValueError(
                "Dữ liệu y có giá trị không hợp lệ."
            )

        if (y < 0).any():
            raise ValueError(
                "Dữ liệu nhu cầu không được âm."
            )

        mau_mua_vu = y[-chu_ky:]

        ket_qua = []

        for i in range(
            so_tuan_du_bao
        ):
            vi_tri = (
                i % chu_ky
            )

            ket_qua.append(
                mau_mua_vu[vi_tri]
            )

        return np.asarray(
            ket_qua,
            dtype=float,
        )