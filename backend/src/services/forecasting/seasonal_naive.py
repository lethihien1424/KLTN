# ### backend/src/services/forecasting/seasonal_naive.py
# import numpy as np
# import pandas as pd


# class SeasonalNaive:
#     """Dự báo tuần bằng cách lặp lại mẫu nhu cầu của 52 tuần trước."""

#     CHU_KY = 52

#     @staticmethod
#     def du_bao(
#         df: pd.DataFrame,
#         so_tuan_du_bao: int,
#         chu_ky: int = CHU_KY,
#     ) -> np.ndarray:
#         if df.empty or "y" not in df.columns:
#             raise ValueError(
#                 "Seasonal Naive cần dữ liệu tuần có cột y."
#             )

#         if (
#             not isinstance(so_tuan_du_bao, int)
#             or so_tuan_du_bao <= 0
#         ):
#             raise ValueError(
#                 "Số tuần dự báo phải là số nguyên dương."
#             )

#         if not isinstance(chu_ky, int) or chu_ky <= 0:
#             raise ValueError(
#                 "Chu kỳ phải là số nguyên dương."
#             )

#         nhu_cau = pd.to_numeric(
#             df["y"],
#             errors="coerce",
#         ).to_numpy(dtype=float)

#         if not np.isfinite(nhu_cau).all():
#             raise ValueError(
#                 "Nhu cầu tuần phải là số hữu hạn."
#             )

#         if (nhu_cau < 0).any():
#             raise ValueError(
#                 "Nhu cầu tuần không được âm."
#             )

#         if len(nhu_cau) < chu_ky:
#             raise ValueError(
#                 f"Cần ít nhất {chu_ky} tuần dữ liệu "
#                 "để chạy Seasonal Naive."
#             )

#         # Lấy chu kỳ gần nhất rồi lặp lại đến đủ số tuần dự báo.
#         mau_chu_ky = nhu_cau[-chu_ky:]

#         return np.resize(
#             mau_chu_ky,
#             so_tuan_du_bao,
#         )
import numpy as np
import pandas as pd


class SeasonalNaive:
    """Dự báo tuần bằng nhu cầu cùng tuần của chu kỳ trước."""

    CHU_KY = 52

    @staticmethod
    def du_bao(
        df: pd.DataFrame,
        so_tuan_du_bao: int,
        chu_ky: int = 52,
    ) -> np.ndarray:
        if df.empty or "y" not in df.columns:
            raise ValueError("Seasonal Naive cần dữ liệu tuần có cột y.")
        if chu_ky != SeasonalNaive.CHU_KY:
            raise ValueError("Cấu hình này chỉ hỗ trợ chu kỳ 52 tuần.")

        # Backtest tạo thêm 1 bước cho tuần đang diễn ra rồi bỏ bước đó.
        if not isinstance(so_tuan_du_bao, int) or not 1 <= so_tuan_du_bao <= 9:
            raise ValueError("Số bước Seasonal Naive phải từ 1 đến 9.")

        y = pd.to_numeric(df["y"], errors="coerce").to_numpy(dtype=float)
        if len(y) < chu_ky:
            raise ValueError("Cần ít nhất 52 tuần lịch sử trước kỳ dự báo.")
        if not np.isfinite(y).all() or (y < 0).any():
            raise ValueError("Nhu cầu tuần phải là số hữu hạn không âm.")

        return np.resize(y[-chu_ky:], so_tuan_du_bao)