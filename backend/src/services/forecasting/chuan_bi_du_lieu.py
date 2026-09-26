##### backend/src/services/forecasting/chuan_bi_du_lieu.py
from datetime import date

import numpy as np
import pandas as pd


class ChuanBiDuLieu:
    @staticmethod
    def tao_du_lieu_theo_tuan(
        du_lieu: list[dict],
        ngay_chay: date,
    ) -> pd.DataFrame:
        if not du_lieu:
            raise ValueError(
                "Không có dữ liệu tiêu thụ đã giao trong quá khứ."
            )

        df = pd.DataFrame(du_lieu)

        if not {"ngay", "so_luong"}.issubset(df.columns):
            raise ValueError(
                "Dữ liệu phải có ngay và so_luong."
            )

        df["ngay"] = pd.to_datetime(
            df["ngay"],
            errors="coerce",
        )
        df["so_luong"] = pd.to_numeric(
            df["so_luong"],
            errors="coerce",
        )

        if (
            df["ngay"].isna().any()
            or not np.isfinite(df["so_luong"]).all()
        ):
            raise ValueError(
                "Ngày hoặc số lượng lịch sử không hợp lệ."
            )

        if (df["so_luong"] <= 0).any():
            raise ValueError(
                "Số lượng từng đơn đã giao phải lớn hơn 0."
            )

        ngay_chay_ts = pd.Timestamp(
            ngay_chay
        ).normalize()
        dau_tuan_hien_tai = (
            ngay_chay_ts
            - pd.Timedelta(days=ngay_chay_ts.weekday())
        )

        # Bỏ toàn bộ tuần đang diễn ra.
        df = df.loc[
            df["ngay"] < dau_tuan_hien_tai
        ].copy()

        if df.empty:
            raise ValueError(
                "Không có tuần hoàn chỉnh để huấn luyện."
            )

        # Mỗi ngày được gắn với Thứ Hai của tuần đó.
        df["ds"] = (
            df["ngay"]
            - pd.to_timedelta(
                df["ngay"].dt.weekday,
                unit="D",
            )
        ).dt.normalize()

        weekly = (
            df.groupby("ds", as_index=False)
            .agg(y=("so_luong", "sum"))
            .sort_values("ds")
        )

        tuan_truoc = (
            dau_tuan_hien_tai
            - pd.Timedelta(weeks=1)
        )

        if weekly["ds"].max() != tuan_truoc:
            raise ValueError(
                "Thiếu dữ liệu đã giao của tuần hoàn chỉnh "
                "gần nhất; hãy xác nhận dữ liệu trước khi dự báo."
            )

        tat_ca_tuan = pd.date_range(
            weekly["ds"].min(),
            weekly["ds"].max(),
            freq="7D",
        )
        tuan_thieu = tat_ca_tuan.difference(
            pd.DatetimeIndex(weekly["ds"])
        )

        if len(tuan_thieu):
            raise ValueError(
                f"Thiếu dữ liệu tuần {tuan_thieu[0].date()}; "
                "cần xác nhận tuần 0 đơn hoặc bổ sung dữ liệu."
            )

        weekly["y"] = weekly["y"].astype(float)
        return weekly[["ds", "y"]]