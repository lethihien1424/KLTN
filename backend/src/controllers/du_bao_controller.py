##D:\KLTN\KLTN\backend\src\controllers\du_bao_controller.py
from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.schemas.du_bao_schema import (
    DuBaoRequest,
)
from src.services.forecasting.du_bao_service import (
    DuBaoService,
)


class DuBaoController:

    @staticmethod
    def du_bao_nhu_cau(
        db: Session,
        request: DuBaoRequest,
        current_user,
    ):
        try:
            return (
                DuBaoService.du_bao_nhu_cau(
                    db=db,
                    so_tuan_du_bao=(
                        request.so_tuan_du_bao
                    ),
                    nguoi_thuc_hien=(
                        current_user.ma_nguoi_dung
                    ),
                )
            )

        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=str(exc),
            ) from exc