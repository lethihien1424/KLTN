from datetime import date, datetime
from zoneinfo import ZoneInfo

import pandas as pd
from sqlalchemy.orm import Session

from src.models.chi_tiet_lich_su_du_bao import (
    ChiTietLichSuDuBao,
)
from src.models.danh_gia_mo_hinh import (
    DanhGiaMoHinh,
)
from src.models.lich_su_du_bao import (
    LichSuDuBao,
)

from src.repositories.danh_gia_mo_hinh_repository import (
    DanhGiaMoHinhRepository,
)
from src.repositories.du_bao_repository import (
    DuBaoRepository,
)
from src.repositories.ngay_le_repository import (
    NgayLeRepository,
)
from src.repositories.san_pham_repository import (
    SanPhamRepository,
)
from src.repositories.tieu_thu_repository import (
    TieuThuRepository,
)

from src.services.forecasting.backtesting import (
    Backtesting,
)
from src.services.forecasting.chuan_bi_du_lieu import (
    ChuanBiDuLieu,
)
from src.services.forecasting.prophet_co_ban import (
    ProphetCoBan,
)
from src.services.forecasting.prophet_ngay_le import (
    ProphetNgayLe,
)


MUI_GIO_VIET_NAM = ZoneInfo("Asia/Ho_Chi_Minh")


class DuBaoService:

    CHU_KY_SEASONAL_NAIVE = 52
    SO_FOLD_TOI_DA = 3

    @staticmethod
    def du_bao_nhu_cau(
        db: Session,
        so_tuan_du_bao: int,
        nguoi_thuc_hien: str,
        ngay_chay: date | None = None,
    ) -> dict:

        # ==========================================
        # 1. Kiểm tra tham số
        # ==========================================

        if ngay_chay is None:
            ngay_chay = datetime.now(MUI_GIO_VIET_NAM).date()

        if not 4 <= so_tuan_du_bao <= 8:
            raise ValueError(
                "Số tuần dự báo phải từ 4 đến 8."
            )

        # ==========================================
        # 2. Lấy toàn bộ sản phẩm đang kinh doanh
        # ==========================================

        danh_sach_san_pham = (
            SanPhamRepository
            .get_san_pham_dang_kinh_doanh(
                db=db
            )
        )

        if not danh_sach_san_pham:
            raise ValueError(
                "Không có sản phẩm đang kinh doanh "
                "để thực hiện dự báo."
            )

        # ==========================================
        # 3. Xác định kỳ dự báo
        #
        # Ví dụ:
        # ngày chạy = 24/09/2026
        #
        # tuần hiện tại:
        # 21/09 -> 27/09
        #
        # forecast bắt đầu:
        # 28/09/2026
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

        ngay_bat_dau_du_bao = (
            dau_tuan_hien_tai
            + pd.Timedelta(weeks=1)
        )

        ngay_ket_thuc_du_bao = (
            ngay_bat_dau_du_bao
            + pd.Timedelta(
                weeks=so_tuan_du_bao
            )
            - pd.Timedelta(days=1)
        )

        # ==========================================
        # 4. Chuẩn bị dữ liệu từng sản phẩm
        # ==========================================

        du_lieu_san_pham = []

        ngay_huan_luyen_som_nhat = None
        ngay_huan_luyen_muon_nhat = None

        for san_pham in danh_sach_san_pham:

            ma_san_pham = (
                san_pham.ma_san_pham
            )

            # Lấy nhu cầu quá khứ:
            # - lịch sử tiêu thụ
            # - kế hoạch sản xuất có ngày < ngày chạy
            du_lieu = (
                TieuThuRepository
                .get_nhu_cau_qua_khu(
                    db=db,
                    ma_san_pham=ma_san_pham,
                    ngay_chay=ngay_chay,
                )
            )

            if not du_lieu:
                raise ValueError(
                    f"Sản phẩm {ma_san_pham} "
                    "không có dữ liệu nhu cầu quá khứ."
                )

            try:
                df = (
                    ChuanBiDuLieu
                    .tao_du_lieu_theo_tuan(
                        du_lieu=du_lieu,
                        ngay_chay=ngay_chay,
                    )
                )

            except ValueError as exc:
                raise ValueError(
                    f"Sản phẩm {ma_san_pham}: "
                    f"{exc}"
                ) from exc

            if len(df) < 8:
                raise ValueError(
                    f"Sản phẩm {ma_san_pham} "
                    "chưa đủ tối thiểu 8 tuần "
                    "dữ liệu để huấn luyện Prophet."
                )

            ngay_dau = (
                df["ds"]
                .min()
                .date()
            )

            ngay_cuoi = (
                (
                    df["ds"].max()
                    + pd.Timedelta(days=6)
                )
                .date()
            )

            if (
                ngay_huan_luyen_som_nhat is None
                or ngay_dau
                < ngay_huan_luyen_som_nhat
            ):
                ngay_huan_luyen_som_nhat = (
                    ngay_dau
                )

            if (
                ngay_huan_luyen_muon_nhat is None
                or ngay_cuoi
                > ngay_huan_luyen_muon_nhat
            ):
                ngay_huan_luyen_muon_nhat = (
                    ngay_cuoi
                )

            du_lieu_san_pham.append(
                {
                    "ma_san_pham": (
                        ma_san_pham
                    ),
                    "df": df,
                }
            )

        # ==========================================
        # 5. Chuẩn bị dữ liệu ngày lễ
        # ==========================================

        danh_sach_ngay_le = (
            NgayLeRepository
            .get_ngay_le_trong_khoang(
                db=db,
                tu_ngay=(
                    ngay_huan_luyen_som_nhat
                ),
                den_ngay=(
                    ngay_ket_thuc_du_bao.date()
                ),
            )
        )

        holidays = (
            ProphetNgayLe
            .tao_dataframe_ngay_le(
                danh_sach_ngay_le
            )
        )

        # ==========================================
        # 6. BACKTESTING
        #
        # Chưa lưu DB.
        #
        # Nếu bất kỳ SP nào lỗi:
        # toàn bộ lần chạy dừng.
        # ==========================================

        ket_qua_danh_gia = []

        for item_sp in du_lieu_san_pham:

            ma_san_pham = (
                item_sp["ma_san_pham"]
            )

            df = item_sp["df"]

            # --------------------------------------
            # Tính số fold phù hợp
            # --------------------------------------

            so_fold = (
                Backtesting
                .tinh_so_fold_phu_hop(
                    df=df,
                    horizon=so_tuan_du_bao,
                    so_fold_toi_da=(
                        DuBaoService
                        .SO_FOLD_TOI_DA
                    ),
                    so_tuan_train_toi_thieu=(
                        Backtesting
                        .SO_TUAN_TRAIN_TOI_THIEU
                    ),
                )
            )

            if so_fold <= 0:
                raise ValueError(
                    f"Sản phẩm {ma_san_pham} "
                    "không đủ dữ liệu để "
                    "thực hiện backtesting."
                )

            # --------------------------------------
            # 6.1. Đánh giá Prophet
            # --------------------------------------

            try:
                danh_gia_prophet = (
                    Backtesting
                    .danh_gia_prophet(
                        df=df,
                        holidays=holidays,
                        horizon=(
                            so_tuan_du_bao
                        ),
                        so_fold=so_fold,
                    )
                )

            except Exception as exc:
                raise ValueError(
                    "Không thể backtesting Prophet "
                    f"cho sản phẩm {ma_san_pham}: "
                    f"{exc}"
                ) from exc

            ket_qua_danh_gia.append(
                {
                    "ma_san_pham": (
                        ma_san_pham
                    ),
                    **danh_gia_prophet,
                }
            )

            # --------------------------------------
            # 6.2. Đánh giá Seasonal Naive
            #
            # Chu kỳ 52 tuần.
            #
            # Chỉ chạy khi fold đầu tiên
            # có đủ >= 52 tuần train.
            # --------------------------------------

            co_the_chay_seasonal_naive = (
                Backtesting
                .co_the_danh_gia_seasonal_naive(
                    df=df,
                    horizon=(
                        so_tuan_du_bao
                    ),
                    chu_ky=(
                        DuBaoService
                        .CHU_KY_SEASONAL_NAIVE
                    ),
                    so_fold=so_fold,
                )
            )

            if co_the_chay_seasonal_naive:

                try:
                    danh_gia_seasonal_naive = (
                        Backtesting
                        .danh_gia_seasonal_naive(
                            df=df,
                            horizon=(
                                so_tuan_du_bao
                            ),
                            chu_ky=(
                                DuBaoService
                                .CHU_KY_SEASONAL_NAIVE
                            ),
                            so_fold=so_fold,
                        )
                    )

                except Exception as exc:
                    raise ValueError(
                        "Không thể backtesting "
                        "Seasonal Naive cho sản phẩm "
                        f"{ma_san_pham}: {exc}"
                    ) from exc

                ket_qua_danh_gia.append(
                    {
                        "ma_san_pham": (
                            ma_san_pham
                        ),
                        **danh_gia_seasonal_naive,
                    }
                )

        # ==========================================
        # 7. TRAIN PROPHET BẰNG TOÀN BỘ
        #    DỮ LIỆU VÀ FORECAST TƯƠNG LAI
        # ==========================================

        ket_qua_tat_ca = []

        for item_sp in du_lieu_san_pham:

            ma_san_pham = (
                item_sp["ma_san_pham"]
            )

            df = item_sp["df"]

            try:
                model = (
                    ProphetCoBan
                    .huan_luyen(
                        df=df,
                        holidays=holidays,
                    )
                )

                forecast = (
                    ProphetCoBan
                    .du_bao(
                        model=model,
                        ngay_bat_dau_du_bao=(
                            ngay_bat_dau_du_bao
                        ),
                        so_tuan_du_bao=(
                            so_tuan_du_bao
                        ),
                    )
                )

            except Exception as exc:
                raise ValueError(
                    f"Không thể dự báo sản phẩm "
                    f"{ma_san_pham}: {exc}"
                ) from exc

            ket_qua_sp = []

            for _, row in forecast.iterrows():

                tu_ngay = (
                    pd.Timestamp(
                        row["ds"]
                    )
                    .date()
                )

                den_ngay = (
                    pd.Timestamp(
                        row["ds"]
                    )
                    + pd.Timedelta(days=6)
                ).date()

                # Nhu cầu không thể âm.
                yhat = max(
                    0.0,
                    float(row["yhat"]),
                )

                yhat_lower = max(
                    0.0,
                    float(row["yhat_lower"]),
                )

                yhat_upper = max(
                    0.0,
                    float(row["yhat_upper"]),
                )

                ket_qua_sp.append(
                    {
                        "tu_ngay": (
                            tu_ngay
                        ),
                        "den_ngay": (
                            den_ngay
                        ),
                        "so_luong_du_bao": (
                            round(yhat)
                        ),
                        "can_duoi": (
                            round(yhat_lower)
                        ),
                        "can_tren": (
                            round(yhat_upper)
                        ),
                    }
                )

            ket_qua_tat_ca.append(
                {
                    "ma_san_pham": (
                        ma_san_pham
                    ),
                    "ket_qua": (
                        ket_qua_sp
                    ),
                }
            )

        # ==========================================
        # 8. LƯU DATABASE
        #
        # Một transaction:
        #
        # lich_su_du_bao
        #       +
        # danh_gia_mo_hinh
        #       +
        # chi_tiet_lich_su_du_bao
        #
        # Chỉ commit khi tất cả thành công.
        # ==========================================

        thoi_gian_chay = datetime.now(MUI_GIO_VIET_NAM)

        try:

            # --------------------------------------
            # 8.1. Lưu lịch sử lần chạy
            # --------------------------------------

            lich_su = LichSuDuBao(
                ngay_bat_dau_huan_luyen=(
                    ngay_huan_luyen_som_nhat
                ),
                ngay_ket_thuc_huan_luyen=(
                    ngay_huan_luyen_muon_nhat
                ),
                so_tuan_du_bao=(
                    so_tuan_du_bao
                ),
                cau_hinh_mo_hinh=(
                    "PROPHET"
                ),
                thoi_gian_chay=(
                    thoi_gian_chay
                ),
                tham_so={
                    "daily_seasonality": False,
                    "weekly_seasonality": False,
                    "yearly_seasonality": False,
                    "tan_suat": "TUAN",
                    "kieu_du_bao": (
                        "TAT_CA_SAN_PHAM"
                    ),
                    "so_san_pham": len(
                        danh_sach_san_pham
                    ),
                    "backtesting": True,
                    "so_fold_toi_da": (
                        DuBaoService
                        .SO_FOLD_TOI_DA
                    ),
                    "seasonal_naive_chu_ky": (
                        DuBaoService
                        .CHU_KY_SEASONAL_NAIVE
                    ),
                },
                trang_thai="THANH_CONG",
                nguoi_thuc_hien=(
                    nguoi_thuc_hien
                ),
            )

            DuBaoRepository.tao_lich_su(
                db=db,
                lich_su=lich_su,
            )

            # --------------------------------------
            # 8.2. Lưu kết quả đánh giá model
            #
            # KHÔNG lưu chi_tiet backtest.
            # chi_tiet chỉ trả Postman để debug.
            # --------------------------------------

            for item in ket_qua_danh_gia:

                danh_gia = (
                    DanhGiaMoHinh(
                        ma_lich_su_du_bao=(
                            lich_su
                            .ma_lich_su_du_bao
                        ),
                        ma_san_pham=(
                            item[
                                "ma_san_pham"
                            ]
                        ),
                        mo_hinh=(
                            item["mo_hinh"]
                        ),
                        horizon=(
                            item["horizon"]
                        ),
                        so_fold=(
                            item["so_fold"]
                        ),
                        so_diem_danh_gia=(
                            item[
                                "so_diem_danh_gia"
                            ]
                        ),
                        chu_ky=(
                            item.get(
                                "chu_ky"
                            )
                        ),
                        mae=(
                            item["mae"]
                        ),
                        rmse=(
                            item["rmse"]
                        ),
                        wape=(
                            item.get(
                                "wape"
                            )
                        ),
                        smape=(
                            item["smape"]
                        ),
                    )
                )

                (
                    DanhGiaMoHinhRepository
                    .tao_danh_gia(
                        db=db,
                        danh_gia=danh_gia,
                    )
                )

            # --------------------------------------
            # 8.3. Lưu forecast tương lai
            # --------------------------------------

            for san_pham in ket_qua_tat_ca:

                ma_san_pham = (
                    san_pham[
                        "ma_san_pham"
                    ]
                )

                for item in san_pham["ket_qua"]:

                    chi_tiet = (
                        ChiTietLichSuDuBao(
                            ma_lich_su_du_bao=(
                                lich_su
                                .ma_lich_su_du_bao
                            ),
                            ma_san_pham=(
                                ma_san_pham
                            ),

                            # Chưa đến bước
                            # quy đổi nguyên liệu.
                            ma_nguyen_lieu=None,
                            so_luong_du_bao_kg=None,

                            tu_ngay=(
                                item["tu_ngay"]
                            ),
                            den_ngay=(
                                item["den_ngay"]
                            ),
                            so_luong_du_bao=(
                                item[
                                    "so_luong_du_bao"
                                ]
                            ),
                            can_duoi=(
                                item["can_duoi"]
                            ),
                            can_tren=(
                                item["can_tren"]
                            ),
                        )
                    )

                    DuBaoRepository.tao_chi_tiet(
                        db=db,
                        chi_tiet=chi_tiet,
                    )

            # --------------------------------------
            # Commit duy nhất
            # --------------------------------------

            db.commit()

            db.refresh(lich_su)

        except Exception:
            db.rollback()
            raise

        # ==========================================
        # 9. RESPONSE
        #
        # Tạm thời trả cả chi tiết backtesting
        # để kiểm tra actual <-> forecast.
        # ==========================================

        return {
            "ma_lich_su_du_bao": (
                lich_su.ma_lich_su_du_bao
            ),
            "ngay_chay": (
                ngay_chay
            ),
            "so_tuan_du_bao": (
                so_tuan_du_bao
            ),
            "thoi_gian_chay": (
                thoi_gian_chay
            ),
            "tong_san_pham": len(
                ket_qua_tat_ca
            ),

            # Tạm trả để debug backtesting.
            "danh_gia_mo_hinh": (
                ket_qua_danh_gia
            ),

            "ket_qua": (
                ket_qua_tat_ca
            ),
        }