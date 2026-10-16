####D:\KLTN\KLTN\backend\src\services\forecasting\danh_gia_sai_so.py
import numpy as np


class DanhGiaSaiSo:

    @staticmethod
    def _chuan_hoa(
        thuc_te,
        du_bao,
    ) -> tuple[np.ndarray, np.ndarray]:

        actual = np.asarray(
            thuc_te,
            dtype=float,
        ).reshape(-1)

        predicted = np.asarray(
            du_bao,
            dtype=float,
        ).reshape(-1)

        if len(actual) == 0:
            raise ValueError(
                "Không có dữ liệu thực tế để đánh giá."
            )

        if len(actual) != len(predicted):
            raise ValueError(
                "Số điểm thực tế và dự báo phải bằng nhau."
            )

        if (
            not np.isfinite(actual).all()
            or not np.isfinite(predicted).all()
        ):
            raise ValueError(
                "Dữ liệu đánh giá phải là số hữu hạn."
            )

        if (actual < 0).any():
            raise ValueError(
                "Nhu cầu thực tế không được âm."
            )

        return actual, predicted

    @staticmethod
    def tinh_tat_ca(
        thuc_te,
        du_bao,
    ) -> dict:

        actual, predicted = (
            DanhGiaSaiSo._chuan_hoa(
                thuc_te,
                du_bao,
            )
        )

        error = actual - predicted
        absolute_error = np.abs(error)

        mae = float(
            np.mean(absolute_error)
        )

        rmse = float(
            np.sqrt(
                np.mean(error ** 2)
            )
        )

        actual_total = float(
            np.sum(np.abs(actual))
        )

        wape = (
            float(
                np.sum(absolute_error)
                / actual_total
                * 100
            )
            if actual_total > 0
            else None
        )

        denominator = (
            np.abs(actual)
            + np.abs(predicted)
        )

        smape_values = np.divide(
            200 * absolute_error,
            denominator,
            out=np.zeros_like(
                absolute_error,
                dtype=float,
            ),
            where=denominator > 0,
        )

        smape = float(
            np.mean(smape_values)
        )

        return {
            "mae": mae,
            "rmse": rmse,
            "wape": wape,
            "smape": smape,
        }

    @staticmethod
    def mae(
        thuc_te,
        du_bao,
    ) -> float:
        return DanhGiaSaiSo.tinh_tat_ca(
            thuc_te,
            du_bao,
        )["mae"]

    @staticmethod
    def rmse(
        thuc_te,
        du_bao,
    ) -> float:
        return DanhGiaSaiSo.tinh_tat_ca(
            thuc_te,
            du_bao,
        )["rmse"]

    @staticmethod
    def wape(
        thuc_te,
        du_bao,
    ) -> float | None:
        return DanhGiaSaiSo.tinh_tat_ca(
            thuc_te,
            du_bao,
        )["wape"]

    @staticmethod
    def smape(
        thuc_te,
        du_bao,
    ) -> float:
        return DanhGiaSaiSo.tinh_tat_ca(
            thuc_te,
            du_bao,
        )["smape"]