from zoneinfo import ZoneInfo

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from src.models.lich_su_du_bao import LichSuDuBao
from src.repositories.du_bao_repository import DuBaoRepository
from src.schemas.du_bao_schema import (
    DuBaoResponse,
    LichSuDuBaoResponse,
)


MUI_GIO_VIET_NAM = ZoneInfo("Asia/Ho_Chi_Minh")


class LichSuDuBaoService:
    @staticmethod
    def lay_danh_sach(
        db: Session,
    ) -> list[LichSuDuBaoResponse]:
        rows = DuBaoRepository.lay_danh_sach_lich_su(db)

        return [
            LichSuDuBaoResponse(
                ma_lich_su_du_bao=run.ma_lich_su_du_bao,
                thoi_gian_chay=run.thoi_gian_chay,
                ngay_bat_dau_huan_luyen=(
                    run.ngay_bat_dau_huan_luyen
                ),
                ngay_ket_thuc_huan_luyen=(
                    run.ngay_ket_thuc_huan_luyen
                ),
                so_tuan_du_bao=run.so_tuan_du_bao,
                nguoi_thuc_hien=run.nguoi_thuc_hien,
                ho_ten_nguoi_thuc_hien=ho_ten,
                trang_thai=run.trang_thai,
            )
            for run, ho_ten in rows
        ]

    @staticmethod
    def lay_chi_tiet(
        db: Session,
        ma_lich_su_du_bao: str,
    ) -> DuBaoResponse:
        run = DuBaoRepository.lay_lich_su_theo_ma(
            db=db,
            ma_lich_su_du_bao=ma_lich_su_du_bao,
        )

        if run is None:
            raise HTTPException(
                status_code=404,
                detail="Không tìm thấy lần dự báo.",
            )

        if run.trang_thai != "THANH_CONG":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Lần dự báo này chưa có kết quả thành công "
                    "để hiển thị."
                ),
            )

        return LichSuDuBaoService._tao_response(
            db=db,
            run=run,
        )

    @staticmethod
    def lay_moi_nhat(
        db: Session,
    ) -> DuBaoResponse | None:
        run = DuBaoRepository.lay_lich_su_moi_nhat(db)

        if run is None:
            return None

        return LichSuDuBaoService._tao_response(
            db=db,
            run=run,
        )

    @staticmethod
    def _tao_response(
        db: Session,
        run: LichSuDuBao,
    ) -> DuBaoResponse:
        details = DuBaoRepository.lay_chi_tiet_da_luu(
            db=db,
            ma_lich_su_du_bao=run.ma_lich_su_du_bao,
        )

        scores = DuBaoRepository.lay_danh_gia_da_luu(
            db=db,
            ma_lich_su_du_bao=run.ma_lich_su_du_bao,
        )

        if not details:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Lần dự báo đã lưu chưa có dữ liệu "
                    "chi tiết sản phẩm."
                ),
            )

        products: dict[str, list[dict]] = {}
        seen: set[tuple[str, object]] = set()

        for detail in details:
            product_id = detail.ma_san_pham
            key = (product_id, detail.tu_ngay)

            if key in seen:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Dữ liệu đã lưu có tuần dự báo bị trùng. "
                        "Vui lòng kiểm tra lần dự báo này."
                    ),
                )

            seen.add(key)

            quantity = detail.so_luong_du_bao
            lower = detail.can_duoi
            upper = detail.can_tren

            if (
                quantity is None
                or lower is None
                or upper is None
                or detail.tu_ngay is None
                or detail.den_ngay is None
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Chi tiết lần dự báo đã lưu "
                        "chưa đầy đủ dữ liệu."
                    ),
                )

            if (
                quantity < 0
                or lower < 0
                or lower > quantity
                or upper < quantity
                or detail.tu_ngay > detail.den_ngay
            ):
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Chi tiết lần dự báo đã lưu "
                        "có số liệu không hợp lệ."
                    ),
                )

            products.setdefault(product_id, []).append(
                {
                    "tu_ngay": detail.tu_ngay,
                    "den_ngay": detail.den_ngay,
                    "so_luong_du_bao": quantity,
                    "can_duoi": lower,
                    "can_tren": upper,
                }
            )

        for weeks in products.values():
            if len(weeks) != run.so_tuan_du_bao:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        "Lần dự báo đã lưu chưa đủ số tuần "
                        "để hiển thị."
                    ),
                )

        run_time = run.thoi_gian_chay

        if run_time is None:
            raise HTTPException(
                status_code=409,
                detail="Lần dự báo chưa có thời gian chạy.",
            )

        if run_time.tzinfo is not None:
            run_date = run_time.astimezone(
                MUI_GIO_VIET_NAM
            ).date()
        else:
            run_date = run_time.date()

        evaluations = [
            {
                "ma_san_pham": score.ma_san_pham,
                "mo_hinh": score.mo_hinh,
                "horizon": score.horizon,
                "so_fold": score.so_fold,
                "so_diem_danh_gia": score.so_diem_danh_gia,
                "chu_ky": score.chu_ky,
                "mae": score.mae,
                "rmse": score.rmse,
                "wape": score.wape,
                "smape": score.smape,
                "chi_tiet": [],
            }
            for score in scores
            if (
                score.ma_san_pham in products
                and score.horizon == run.so_tuan_du_bao
            )
        ]

        payload = {
            "ma_lich_su_du_bao": run.ma_lich_su_du_bao,
            "ngay_chay": run_date,
            "so_tuan_du_bao": run.so_tuan_du_bao,
            "thoi_gian_chay": run_time,
            "tong_san_pham": len(products),
            "danh_gia_mo_hinh": evaluations,
            "ket_qua": [
                {
                    "ma_san_pham": product_id,
                    "ket_qua": weeks,
                }
                for product_id, weeks in products.items()
            ],
        }

        try:
            return DuBaoResponse.model_validate(payload)
        except ValidationError as exc:
            raise HTTPException(
                status_code=409,
                detail=(
                    "Dữ liệu lần dự báo đã lưu "
                    "không đúng cấu trúc."
                ),
            ) from exc