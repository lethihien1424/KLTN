##D:\KLTN\KLTN\backend\src\controllers\du_bao_controller.py
import logging

from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from src.schemas.du_bao_schema import DuBaoRequest
from src.services.forecasting.du_bao_service import (
    DuBaoService,
)


logger = logging.getLogger(__name__)


class DuBaoController:
    @staticmethod
    def du_bao_nhu_cau(
        db: Session,
        request: DuBaoRequest,
        current_user,
    ):
        try:
            return DuBaoService.du_bao_nhu_cau(
                db=db,
                request=request,
                nguoi_thuc_hien=current_user.ma_nguoi_dung,
            )

        except ValueError as exc:
            db.rollback()

            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc

        except SQLAlchemyError as exc:
            db.rollback()
            logger.exception(
                "Lỗi database khi chạy/lưu dự báo."
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Không thể đọc hoặc lưu dự báo. "
                    "Kiểm tra log backend và cấu trúc database."
                ),
            ) from exc

        except Exception as exc:
            db.rollback()
            logger.exception(
                "Chạy mô hình dự báo thất bại."
            )

            raise HTTPException(
                status_code=500,
                detail=(
                    "Mô hình chưa chạy thành công. "
                    "Kiểm tra log backend để xác định lỗi."
                ),
            ) from exc