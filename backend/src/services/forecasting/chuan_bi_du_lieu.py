##### backend/src/services/forecasting/chuan_bi_du_lieu.py
from datetime import date
from typing import Any

import numpy as np
import pandas as pd


class ChuanBiDuLieu:
    @staticmethod
    def _lay_gia_tri(row: Any, *names: str):
        for name in names:
            value = row.get(name) if isinstance(row, dict) else getattr(row, name, None)
            if value is not None and not pd.isna(value):
                return value
        return None

    @staticmethod
    def tao_du_lieu_theo_tuan(
        du_lieu,
        ngay_chay: date,
        tuan_cuoi=None,
    ) -> pd.DataFrame:
        """Tổng hợp nhu cầu theo tuần thứ Hai–Chủ nhật.

        tuan_cuoi là tuần đã kết thúc và có dữ liệu quan sát.
        Chưa có metadata import để chứng minh mọi tuần đều đầy đủ;
        các tuần trống ở giữa tạm coi bằng 0 và phải kiểm chứng.
        """
        if ngay_chay is None:
            raise ValueError("Thiếu ngày chạy dự báo.")
        if tuan_cuoi is None:
            raise ValueError("Thiếu tuần dữ liệu cuối.")

        today = pd.Timestamp(ngay_chay).normalize()
        current_monday = today - pd.Timedelta(days=today.weekday())
        last_complete = current_monday - pd.Timedelta(weeks=1)
        cutoff = pd.Timestamp(tuan_cuoi).normalize()
        if cutoff.weekday() != 0:
            raise ValueError("tuan_cuoi phải là thứ Hai.")
        if cutoff > last_complete:
            raise ValueError("Không được huấn luyện bằng tuần chưa kết thúc.")

        rows = du_lieu.to_dict("records") if isinstance(du_lieu, pd.DataFrame) else list(du_lieu or [])
        records = []
        for row in rows:
            status = ChuanBiDuLieu._lay_gia_tri(row, "trang_thai_don_hang")
            if status not in ("DA_GIAO_HANG", "CHO_GIAO_HANG"):
                continue
            day = ChuanBiDuLieu._lay_gia_tri(row, "ngay_ban")
            quantity = ChuanBiDuLieu._lay_gia_tri(row, "so_luong", "so_luong_ban")
            if day is None or quantity is None:
                raise ValueError("Đơn hợp lệ thiếu ngày bán hoặc số lượng.")
            try:
                day = pd.Timestamp(day).normalize()
                quantity = float(quantity)
            except (ValueError, TypeError, OverflowError) as exc:
                raise ValueError("Ngày bán hoặc số lượng không hợp lệ.") from exc
            if pd.isna(day) or not np.isfinite(quantity) or quantity < 0:
                raise ValueError("Dữ liệu nhu cầu không hợp lệ.")
            monday = day - pd.Timedelta(days=day.weekday())
            if monday <= cutoff:
                records.append({"ds": monday, "y": quantity})

        if not records:
            raise ValueError("Không có đơn hàng hợp lệ trong phạm vi dữ liệu đã xác nhận.")

        df = pd.DataFrame(records).groupby("ds", as_index=False)["y"].sum().sort_values("ds")
        weeks = pd.date_range(start=df["ds"].min(), end=cutoff, freq="W-MON")
        df = df.set_index("ds").reindex(weeks, fill_value=0).rename_axis("ds").reset_index()
        df["y"] = df["y"].astype(float)
        if len(df) < 8:
            raise ValueError("Cần tối thiểu 8 tuần lịch sử để huấn luyện Prophet.")
        if (df["y"] > 0).sum() < 2:
            raise ValueError("Cần tối thiểu hai tuần có nhu cầu phát sinh.")
        return df[["ds", "y"]]
