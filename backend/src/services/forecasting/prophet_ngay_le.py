###D:\KLTN\KLTN\backend\src\services\forecasting\prophet_ngay_le.py

import pandas as pd


class ProphetNgayLe:
    @staticmethod
    def tao_dataframe_ngay_le(
        danh_sach_ngay_le,
    ) -> pd.DataFrame:
        """
        Chuyển ngày lễ có khoảng bắt đầu/kết thúc
        thành các tuần thứ Hai có ngày lễ.

        Prophet được huấn luyện với một quan sát mỗi tuần,
        nên ds của holiday phải khớp với ds của dữ liệu tuần.
        """
        records = set()

        for item in danh_sach_ngay_le or []:
            if isinstance(item, dict):
                ten = item.get("ten_ngay_le")
                bat_dau = item.get("ngay_bat_dau")
                ket_thuc = item.get("ngay_ket_thuc")
            else:
                ten = getattr(item, "ten_ngay_le", None)
                bat_dau = getattr(item, "ngay_bat_dau", None)
                ket_thuc = getattr(item, "ngay_ket_thuc", None)

            if not ten or bat_dau is None or ket_thuc is None:
                continue

            bat_dau = pd.Timestamp(bat_dau).normalize()
            ket_thuc = pd.Timestamp(ket_thuc).normalize()

            if ket_thuc < bat_dau:
                raise ValueError(
                    f"Ngày lễ '{ten}' có khoảng ngày không hợp lệ."
                )

            dau_tuan = (
                bat_dau
                - pd.Timedelta(days=bat_dau.weekday())
            )

            cuoi_tuan = (
                ket_thuc
                - pd.Timedelta(days=ket_thuc.weekday())
            )

            for ngay in pd.date_range(
                dau_tuan,
                cuoi_tuan,
                freq="W-MON",
            ):
                records.add((str(ten), ngay))

        if not records:
            return pd.DataFrame({
                "holiday": pd.Series(dtype="str"),
                "ds": pd.Series(dtype="datetime64[ns]"),
            })

        return (
            pd.DataFrame(
                [
                    {"holiday": ten, "ds": ngay}
                    for ten, ngay in records
                ]
            )
            .sort_values(["ds", "holiday"])
            .reset_index(drop=True)
        )
