from datetime import date

import pandas as pd


class ChuanBiDuLieu:

    @staticmethod
    def tao_du_lieu_theo_tuan(
        du_lieu: list[dict],
        ngay_chay: date,
    ) -> pd.DataFrame:

        if not du_lieu:
            raise ValueError(
                "Không có dữ liệu nhu cầu quá khứ."
            )

        df = pd.DataFrame(du_lieu)

        cot_bat_buoc = {
            "ngay",
            "so_luong",
        }

        if not cot_bat_buoc.issubset(
            df.columns
        ):
            raise ValueError(
                "Dữ liệu phải có cột ngay và so_luong."
            )

        # ==========================================
        # 1. Chuẩn hóa kiểu dữ liệu
        # ==========================================

        df["ngay"] = pd.to_datetime(
            df["ngay"],
            errors="coerce",
        )

        df["so_luong"] = pd.to_numeric(
            df["so_luong"],
            errors="coerce",
        )

        # ==========================================
        # 2. Kiểm tra dữ liệu không hợp lệ
        # ==========================================

        if df["ngay"].isna().any():
            raise ValueError(
                "Dữ liệu có ngày không hợp lệ."
            )

        if df["so_luong"].isna().any():
            raise ValueError(
                "Dữ liệu có số lượng không hợp lệ."
            )

        # Một dòng đơn hàng phải có số lượng > 0.
        # y = 0 chỉ được tạo cho tuần không phát sinh
        # đơn hàng sau khi tổng hợp.
        if (df["so_luong"] <= 0).any():
            raise ValueError(
                "Số lượng của đơn hàng phải lớn hơn 0."
            )

        # ==========================================
        # 3. Xác định tuần hiện tại
        # ==========================================

        ngay_chay_ts = pd.Timestamp(
            ngay_chay
        ).normalize()

        dau_tuan_hien_tai = (
            ngay_chay_ts
            - pd.Timedelta(
                days=ngay_chay_ts.weekday()
            )
        )

        # Chỉ sử dụng các tuần đã hoàn chỉnh.
        #
        # Ví dụ chạy 24/09/2026:
        #
        # 14/09 - 20/09 -> dùng
        # 21/09 - 27/09 -> không dùng
        df = df[
            df["ngay"]
            < dau_tuan_hien_tai
        ].copy()

        if df.empty:
            raise ValueError(
                "Không có tuần hoàn chỉnh "
                "để huấn luyện mô hình."
            )

        # ==========================================
        # 4. Quy ngày về Thứ Hai đầu tuần
        # ==========================================

        df["ds"] = (
            df["ngay"]
            - pd.to_timedelta(
                df["ngay"].dt.weekday,
                unit="D",
            )
        ).dt.normalize()

        # ==========================================
        # 5. Tổng hợp nhu cầu theo tuần
        # ==========================================

        df_tuan = (
            df.groupby(
                "ds",
                as_index=False,
            )
            .agg(
                y=(
                    "so_luong",
                    "sum",
                )
            )
            .sort_values("ds")
            .reset_index(drop=True)
        )

        # ==========================================
        # 6. Bổ sung tuần không phát sinh nhu cầu
        # ==========================================

        tat_ca_tuan = pd.date_range(
            start=df_tuan["ds"].min(),
            end=df_tuan["ds"].max(),
            freq="7D",
        )

        df_tuan = (
            df_tuan
            .set_index("ds")
            .reindex(tat_ca_tuan)
            .fillna(
                {
                    "y": 0,
                }
            )
            .rename_axis("ds")
            .reset_index()
        )

        df_tuan["y"] = (
            df_tuan["y"]
            .astype(float)
        )

        return df_tuan[
            [
                "ds",
                "y",
            ]
        ]