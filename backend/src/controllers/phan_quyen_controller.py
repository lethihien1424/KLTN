###D:\KLTN\KLTN\backend\src\controllers\phan_quyen_controller.py
from sqlalchemy.orm import Session

from src.models.user_model import User
from src.schemas.phan_quyen_schema import (
    DanhMucPhanQuyenResponse,
    NhomQuyenRequest,
    NhomQuyenResponse,
    QuyenCuaToiResponse,
)
from src.services.phan_quyen_service import (
    PhanQuyenService,
)


class PhanQuyenController:
    @staticmethod
    def get_catalog() -> DanhMucPhanQuyenResponse:
        return PhanQuyenService.get_catalog()

    @staticmethod
    def get_all(
        db: Session,
        search: str | None = None,
    ) -> list[NhomQuyenResponse]:
        return PhanQuyenService().get_all(
            db=db,
            search=search,
        )

    @staticmethod
    def get_by_id(
        db: Session,
        ma: str,
    ) -> NhomQuyenResponse:
        return PhanQuyenService().get_by_id(
            db=db,
            ma=ma,
        )

    @staticmethod
    def create(
        db: Session,
        payload: NhomQuyenRequest,
        current_user: User,
    ) -> NhomQuyenResponse:
        return PhanQuyenService().create(
            db=db,
            payload=payload,
            current_user=current_user,
        )

    @staticmethod
    def update(
        db: Session,
        ma: str,
        payload: NhomQuyenRequest,
        current_user: User,
    ) -> NhomQuyenResponse:
        return PhanQuyenService().update(
            db=db,
            ma=ma,
            payload=payload,
            current_user=current_user,
        )

    @staticmethod
    def delete(
        db: Session,
        ma: str,
    ) -> None:
        PhanQuyenService().delete(
            db=db,
            ma=ma,
        )

    @staticmethod
    def get_my_permissions(
        db: Session,
        current_user: User,
    ) -> QuyenCuaToiResponse:
        return PhanQuyenService().get_my_permissions(
            db=db,
            current_user=current_user,
        )