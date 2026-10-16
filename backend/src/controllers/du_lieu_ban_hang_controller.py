####D:\KLTN\KLTN\backend\src\controllers\du_lieu_ban_hang_controller.py
from sqlalchemy.orm import Session

from src.schemas.du_lieu_ban_hang_schema import (
    DanhMucBanHangResponse,
    DuLieuBanHangCreateRequest,
    DuLieuBanHangCreateResponse,
)
from src.services.du_lieu_ban_hang_service import (
    DuLieuBanHangService,
)


class DuLieuBanHangController:
    @staticmethod
    def get_catalog(
        db: Session,
    ) -> DanhMucBanHangResponse:
        return DuLieuBanHangService().get_catalog(db=db)

    @staticmethod
    def create(
        db: Session,
        payload: DuLieuBanHangCreateRequest,
    ) -> DuLieuBanHangCreateResponse:
        return DuLieuBanHangService().create(
            db=db,
            payload=payload,
        )

    @staticmethod
    def update(
        db: Session,
        ma: str,
        payload: DuLieuBanHangCreateRequest,
    ) -> DuLieuBanHangCreateResponse:
        return DuLieuBanHangService().update(
            db=db,
            ma=ma,
            payload=payload,
        )