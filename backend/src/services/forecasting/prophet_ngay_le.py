###D:\KLTN\KLTN\backend\src\services\forecasting\prophet_ngay_le.py
import pandas as pd


class ProphetNgayLe:

    @staticmethod
    def tao_dataframe_ngay_le(
        danh_sach_ngay_le,
    ) -> pd.DataFrame:

        if not danh_sach_ngay_le:
            return pd.DataFrame(
                columns=[
                    "holiday",
                    "ds",
                ]
            )

        du_lieu = []

        for ngay_le in danh_sach_ngay_le:
            cac_ngay = pd.date_range(
                start=ngay_le.ngay_bat_dau,
                end=ngay_le.ngay_ket_thuc,
                freq="D",
            )

            for ngay in cac_ngay:
                dau_tuan = (
                    ngay
                    - pd.Timedelta(
                        days=ngay.weekday()
                    )
                ).normalize()

                du_lieu.append(
                    {
                        "holiday": ngay_le.ten_ngay_le,
                        "ds": dau_tuan,
                    }
                )

        df = pd.DataFrame(du_lieu)

        if df.empty:
            return pd.DataFrame(
                columns=[
                    "holiday",
                    "ds",
                ]
            )

        df = (
            df.drop_duplicates(
                subset=[
                    "holiday",
                    "ds",
                ]
            )
            .sort_values("ds")
            .reset_index(drop=True)
        )

        return df[
            [
                "holiday",
                "ds",
            ]
        ]