### D:\KLTN\KLTN\backend\src\services\lich_su_du_bao_service.py
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.san_pham_model import SanPham
from src.repositories.du_bao_repository import DuBaoRepository
from src.schemas.du_bao_schema import (
    DuBaoResponse,
    LichSuDuBaoResponse,
)


class LichSuDuBaoService:
    @staticmethod
    def lay_danh_sach(db: Session):
        results = []

        for run, full_name in (
            DuBaoRepository.lay_danh_sach_lich_su(db)
        ):
            parameters = run.tham_so or {}

            results.append(LichSuDuBaoResponse(
                ma_lich_su_du_bao=run.ma_lich_su_du_bao,
                thoi_gian_chay=run.thoi_gian_chay,
                ngay_bat_dau_huan_luyen=run.ngay_bat_dau_huan_luyen,
                ngay_ket_thuc_huan_luyen=run.ngay_ket_thuc_huan_luyen,
                so_tuan_du_bao=run.so_tuan_du_bao,
                nguoi_thuc_hien=run.nguoi_thuc_hien,
                ho_ten_nguoi_thuc_hien=full_name,
                trang_thai=run.trang_thai,
                tong_san_pham=parameters.get(
                    "so_san_pham",
                    0,
                ),
                kieu_du_bao=parameters.get(
                    "kieu_du_bao",
                    "",
                ),
            ))

        return results

    @staticmethod
    def lay_moi_nhat(db: Session):
        run = DuBaoRepository.lay_lich_su_moi_nhat(db)

        if run is None:
            return None

        return LichSuDuBaoService.lay_chi_tiet(
            db,
            run.ma_lich_su_du_bao,
        )

    @staticmethod
    def lay_chi_tiet(
        db: Session,
        ma_lich_su_du_bao: str,
    ):
        run = DuBaoRepository.lay_lich_su_theo_ma(
            db,
            ma_lich_su_du_bao,
        )

        if run is None:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy lần dự báo.",
            )

        snapshot = (run.tham_so or {}).get("snapshot")

        if snapshot:
            return DuBaoResponse.model_validate(snapshot)

        # Lịch sử trước khi có snapshot.
        names = dict(db.execute(
            select(
                SanPham.ma_san_pham,
                SanPham.ten_san_pham,
            )
        ).all())

        grouped = {}

        for detail in DuBaoRepository.lay_chi_tiet_da_luu(
            db,
            ma_lich_su_du_bao,
        ):
            item = grouped.setdefault(
                detail.ma_san_pham,
                {
                    "ma_san_pham": detail.ma_san_pham,
                    "ten_san_pham": names.get(
                        detail.ma_san_pham,
                        detail.ma_san_pham,
                    ),
                    "ket_qua": [],
                    "tong_du_bao": 0,
                    "dien_giai": (
                        "Lần chạy cũ chưa lưu diễn giải "
                        "và dữ liệu kỳ trước."
                    ),
                },
            )

            item["tong_du_bao"] += detail.so_luong_du_bao

            item["ket_qua"].append({
                "tu_ngay": detail.tu_ngay,
                "den_ngay": detail.den_ngay,
                "so_luong_du_bao": detail.so_luong_du_bao,
                "can_duoi": (
                    detail.can_duoi
                    if detail.can_duoi is not None
                    else detail.so_luong_du_bao
                ),
                "can_tren": (
                    detail.can_tren
                    if detail.can_tren is not None
                    else detail.so_luong_du_bao
                ),
                "so_luong_du_bao_kg": (
                    float(detail.so_luong_du_bao_kg)
                    if detail.so_luong_du_bao_kg is not None
                    else None
                ),
            })

        evaluations = []

        for score in DuBaoRepository.lay_danh_gia_da_luu(
            db,
            ma_lich_su_du_bao,
        ):
            evaluations.append({
                "ma_san_pham": score.ma_san_pham,
                "mo_hinh": score.mo_hinh,
                "horizon": score.horizon,
                "so_fold": score.so_fold,
                "so_diem_danh_gia": score.so_diem_danh_gia,
                "chu_ky": score.chu_ky,
                "mae": float(score.mae),
                "rmse": float(score.rmse),
                "wape": (
                    float(score.wape)
                    if score.wape is not None
                    else None
                ),
                "smape": float(score.smape),
                "chi_tiet": [],
            })

        return DuBaoResponse(
            ma_lich_su_du_bao=run.ma_lich_su_du_bao,
            ngay_chay=run.thoi_gian_chay.date(),
            so_tuan_du_bao=run.so_tuan_du_bao,
            thoi_gian_chay=run.thoi_gian_chay,
            tong_san_pham=len(grouped),
            ngay_bat_dau_huan_luyen=run.ngay_bat_dau_huan_luyen,
            ngay_ket_thuc_huan_luyen=run.ngay_ket_thuc_huan_luyen,
            danh_gia_mo_hinh=evaluations,
            ket_qua=list(grouped.values()),
            canh_bao=[
                "Đây là lịch sử cũ. Chỉ hiển thị thông tin "
                "đã lưu, không tính lại nguyên nhân."
            ],
        )