import pandas as pd

from src.services.forecasting.danh_gia_sai_so import (
    DanhGiaSaiSo,
)
from src.services.forecasting.prophet_co_ban import (
    ProphetCoBan,
)
from src.services.forecasting.seasonal_naive import (
    SeasonalNaive,
)


class Backtesting:
    """
    Expanding-window backtesting.

    Mỗi fold:
    - train bằng dữ liệu quá khứ
    - dự báo horizon tuần tiếp theo
    - so sánh forecast với actual
    """

    SO_TUAN_TRAIN_TOI_THIEU = 8

    @staticmethod
    def tinh_so_fold_phu_hop(
        df: pd.DataFrame,
        horizon: int,
        so_fold_toi_da: int = 3,
        so_tuan_train_toi_thieu: int = 8,
    ) -> int:

        if horizon < 4 or horizon > 8:
            raise ValueError(
                "Horizon backtesting phải "
                "từ 4 đến 8 tuần."
            )

        if so_fold_toi_da <= 0:
            raise ValueError(
                "Số fold tối đa phải lớn hơn 0."
            )

        so_tuan = len(df)

        so_tuan_co_the_test = (
            so_tuan
            - so_tuan_train_toi_thieu
        )

        if so_tuan_co_the_test < horizon:
            return 0

        so_fold_co_the = (
            so_tuan_co_the_test
            // horizon
        )

        return min(
            so_fold_toi_da,
            so_fold_co_the,
        )

    @staticmethod
    def danh_gia_prophet(
        df: pd.DataFrame,
        holidays: pd.DataFrame | None,
        horizon: int,
        so_fold: int,
    ) -> dict:

        Backtesting._kiem_tra_du_lieu(
            df=df,
            horizon=horizon,
            so_fold=so_fold,
        )

        du_bao_tat_ca = []
        thuc_te_tat_ca = []

        # Dùng để debug từng điểm backtest.
        chi_tiet_backtest = []

        tong_so_tuan_test = (
            horizon * so_fold
        )

        vi_tri_train_dau = (
            len(df)
            - tong_so_tuan_test
        )

        for fold in range(so_fold):

            train_end = (
                vi_tri_train_dau
                + fold * horizon
            )

            test_end = (
                train_end
                + horizon
            )

            train = (
                df.iloc[:train_end]
                .copy()
                .reset_index(drop=True)
            )

            test = (
                df.iloc[
                    train_end:test_end
                ]
                .copy()
                .reset_index(drop=True)
            )

            # Tuần đầu tiên cần forecast phải là
            # tuần ngay sau tuần cuối của train.
            ngay_bat_dau_du_bao = (
                pd.Timestamp(
                    train["ds"].max()
                )
                + pd.Timedelta(
                    weeks=1
                )
            )

            model = (
                ProphetCoBan.huan_luyen(
                    df=train,
                    holidays=holidays,
                )
            )

            forecast = (
                ProphetCoBan.du_bao(
                    model=model,
                    ngay_bat_dau_du_bao=(
                        ngay_bat_dau_du_bao
                    ),
                    so_tuan_du_bao=horizon,
                )
            )

            thuc_te = (
                test["y"]
                .to_numpy(
                    dtype=float
                )
            )

            # Prophet có thể cho giá trị âm.
            # Nhu cầu không thể âm nên chặn về 0.
            du_bao = (
                forecast["yhat"]
                .clip(lower=0)
                .to_numpy(
                    dtype=float
                )
            )

            if len(thuc_te) != len(du_bao):
                raise ValueError(
                    "Số điểm thực tế và dự báo "
                    "trong backtesting không khớp."
                )

            # ======================================
            # Kiểm tra ngày test và ngày forecast
            # phải khớp tuyệt đối.
            # ======================================

            for i in range(len(test)):

                ngay_test = (
                    pd.Timestamp(
                        test.iloc[i]["ds"]
                    )
                    .normalize()
                )

                ngay_forecast = (
                    pd.Timestamp(
                        forecast.iloc[i]["ds"]
                    )
                    .normalize()
                )

                if ngay_test != ngay_forecast:
                    raise ValueError(
                        "Backtesting bị lệch tuần: "
                        f"actual={ngay_test.date()}, "
                        f"forecast={ngay_forecast.date()}."
                    )

                tu_ngay = (
                    ngay_test.date()
                )

                den_ngay = (
                    ngay_test
                    + pd.Timedelta(days=6)
                ).date()

                chi_tiet_backtest.append(
                    {
                        "fold": fold + 1,
                        "tu_ngay": tu_ngay,
                        "den_ngay": den_ngay,
                        "thuc_te": float(
                            thuc_te[i]
                        ),
                        "du_bao": float(
                            du_bao[i]
                        ),
                        "sai_so": float(
                            du_bao[i]
                            - thuc_te[i]
                        ),
                        "sai_so_tuyet_doi": float(
                            abs(
                                thuc_te[i]
                                - du_bao[i]
                            )
                        ),
                    }
                )

            thuc_te_tat_ca.extend(
                thuc_te.tolist()
            )

            du_bao_tat_ca.extend(
                du_bao.tolist()
            )

        chi_so = (
            DanhGiaSaiSo.tinh_tat_ca(
                thuc_te=thuc_te_tat_ca,
                du_bao=du_bao_tat_ca,
            )
        )

        return {
            "mo_hinh": "PROPHET",
            "horizon": horizon,
            "so_fold": so_fold,
            "so_diem_danh_gia": len(
                thuc_te_tat_ca
            ),
            "chu_ky": None,
            **chi_so,

            # Chỉ phục vụ kiểm tra backtesting.
            "chi_tiet": chi_tiet_backtest,
        }

    @staticmethod
    def danh_gia_seasonal_naive(
        df: pd.DataFrame,
        horizon: int,
        chu_ky: int,
        so_fold: int,
    ) -> dict:

        Backtesting._kiem_tra_du_lieu(
            df=df,
            horizon=horizon,
            so_fold=so_fold,
        )

        du_bao_tat_ca = []
        thuc_te_tat_ca = []
        chi_tiet_backtest = []

        tong_so_tuan_test = (
            horizon * so_fold
        )

        vi_tri_train_dau = (
            len(df)
            - tong_so_tuan_test
        )

        for fold in range(so_fold):

            train_end = (
                vi_tri_train_dau
                + fold * horizon
            )

            test_end = (
                train_end
                + horizon
            )

            train = (
                df.iloc[:train_end]
                .copy()
                .reset_index(drop=True)
            )

            test = (
                df.iloc[
                    train_end:test_end
                ]
                .copy()
                .reset_index(drop=True)
            )

            if len(train) < chu_ky:
                raise ValueError(
                    "Không đủ dữ liệu train cho "
                    f"Seasonal Naive chu kỳ "
                    f"{chu_ky} tuần."
                )

            du_bao = (
                SeasonalNaive.du_bao(
                    df=train,
                    so_tuan_du_bao=horizon,
                    chu_ky=chu_ky,
                )
            )

            thuc_te = (
                test["y"]
                .to_numpy(
                    dtype=float
                )
            )

            if len(thuc_te) != len(du_bao):
                raise ValueError(
                    "Số điểm thực tế và dự báo "
                    "Seasonal Naive không khớp."
                )

            for i in range(len(test)):

                ngay_test = (
                    pd.Timestamp(
                        test.iloc[i]["ds"]
                    )
                    .normalize()
                )

                tu_ngay = (
                    ngay_test.date()
                )

                den_ngay = (
                    ngay_test
                    + pd.Timedelta(days=6)
                ).date()

                chi_tiet_backtest.append(
                    {
                        "fold": fold + 1,
                        "tu_ngay": tu_ngay,
                        "den_ngay": den_ngay,
                        "thuc_te": float(
                            thuc_te[i]
                        ),
                        "du_bao": float(
                            du_bao[i]
                        ),
                        "sai_so": float(
                            du_bao[i]
                            - thuc_te[i]
                        ),
                        "sai_so_tuyet_doi": float(
                            abs(
                                thuc_te[i]
                                - du_bao[i]
                            )
                        ),
                    }
                )

            thuc_te_tat_ca.extend(
                thuc_te.tolist()
            )

            du_bao_tat_ca.extend(
                du_bao.tolist()
            )

        chi_so = (
            DanhGiaSaiSo.tinh_tat_ca(
                thuc_te=thuc_te_tat_ca,
                du_bao=du_bao_tat_ca,
            )
        )

        return {
            "mo_hinh": "SEASONAL_NAIVE",
            "horizon": horizon,
            "chu_ky": chu_ky,
            "so_fold": so_fold,
            "so_diem_danh_gia": len(
                thuc_te_tat_ca
            ),
            **chi_so,
            "chi_tiet": chi_tiet_backtest,
        }

    @staticmethod
    def co_the_danh_gia_seasonal_naive(
        df: pd.DataFrame,
        horizon: int,
        chu_ky: int,
        so_fold: int,
    ) -> bool:

        tong_so_tuan_test = (
            horizon * so_fold
        )

        so_tuan_train_fold_dau = (
            len(df)
            - tong_so_tuan_test
        )

        return (
            so_tuan_train_fold_dau
            >= chu_ky
        )

    @staticmethod
    def _kiem_tra_du_lieu(
        df: pd.DataFrame,
        horizon: int,
        so_fold: int,
    ) -> None:

        if df.empty:
            raise ValueError(
                "Không có dữ liệu để backtesting."
            )

        if not {
            "ds",
            "y",
        }.issubset(
            df.columns
        ):
            raise ValueError(
                "Dữ liệu backtesting phải "
                "có cột ds và y."
            )

        if horizon < 4 or horizon > 8:
            raise ValueError(
                "Horizon backtesting phải "
                "từ 4 đến 8 tuần."
            )

        if so_fold <= 0:
            raise ValueError(
                "Số fold phải lớn hơn 0."
            )

        so_tuan_test = (
            horizon * so_fold
        )

        so_tuan_train = (
            len(df)
            - so_tuan_test
        )

        if (
            so_tuan_train
            < Backtesting.SO_TUAN_TRAIN_TOI_THIEU
        ):
            raise ValueError(
                "Không đủ dữ liệu để thực hiện "
                "expanding-window backtesting."
            )