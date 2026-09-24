####D:\KLTN\KLTN\backend\src\services\forecasting\danh_gia_sai_so.py
import numpy as np


class DanhGiaSaiSo:
    """
    Tính các chỉ số đánh giá sai số dự báo.
    """

    @staticmethod
    def _chuan_hoa(
        thuc_te,
        du_bao,
    ) -> tuple[np.ndarray, np.ndarray]:
        actual = np.asarray(
            thuc_te,
            dtype=float,
        )

        forecast = np.asarray(
            du_bao,
            dtype=float,
        )

        if actual.ndim != 1:
            actual = actual.reshape(-1)

        if forecast.ndim != 1:
            forecast = forecast.reshape(-1)

        if len(actual) == 0:
            raise ValueError(
                "Không có dữ liệu thực tế để đánh giá."
            )

        if len(actual) != len(forecast):
            raise ValueError(
                "Số lượng giá trị thực tế và dự báo "
                "phải bằng nhau."
            )

        if (
            np.isnan(actual).any()
            or np.isnan(forecast).any()
        ):
            raise ValueError(
                "Dữ liệu đánh giá có giá trị NaN."
            )

        return actual, forecast

    @staticmethod
    def mae(
        thuc_te,
        du_bao,
    ) -> float:
        actual, forecast = (
            DanhGiaSaiSo._chuan_hoa(
                thuc_te,
                du_bao,
            )
        )

        return float(
            np.mean(
                np.abs(
                    actual - forecast
                )
            )
        )

    @staticmethod
    def rmse(
        thuc_te,
        du_bao,
    ) -> float:
        actual, forecast = (
            DanhGiaSaiSo._chuan_hoa(
                thuc_te,
                du_bao,
            )
        )

        return float(
            np.sqrt(
                np.mean(
                    (
                        actual
                        - forecast
                    )
                    ** 2
                )
            )
        )

    @staticmethod
    def wape(
        thuc_te,
        du_bao,
    ) -> float | None:
        actual, forecast = (
            DanhGiaSaiSo._chuan_hoa(
                thuc_te,
                du_bao,
            )
        )

        mau_so = np.sum(
            np.abs(actual)
        )

        if mau_so == 0:
            return None

        return float(
            (
                np.sum(
                    np.abs(
                        actual - forecast
                    )
                )
                / mau_so
            )
            * 100
        )

    @staticmethod
    def smape(
        thuc_te,
        du_bao,
    ) -> float:
        actual, forecast = (
            DanhGiaSaiSo._chuan_hoa(
                thuc_te,
                du_bao,
            )
        )

        mau_so = (
            np.abs(actual)
            + np.abs(forecast)
        )

        ty_le = np.divide(
            2
            * np.abs(
                actual - forecast
            ),
            mau_so,
            out=np.zeros_like(
                actual,
                dtype=float,
            ),
            where=mau_so != 0,
        )

        return float(
            np.mean(ty_le)
            * 100
        )

    @staticmethod
    def tinh_tat_ca(
        thuc_te,
        du_bao,
    ) -> dict:
        """
        Tính toàn bộ chỉ số đánh giá.
        """

        return {
            "mae": DanhGiaSaiSo.mae(
                thuc_te,
                du_bao,
            ),
            "rmse": DanhGiaSaiSo.rmse(
                thuc_te,
                du_bao,
            ),
            "wape": DanhGiaSaiSo.wape(
                thuc_te,
                du_bao,
            ),
            "smape": DanhGiaSaiSo.smape(
                thuc_te,
                du_bao,
            ),
        }