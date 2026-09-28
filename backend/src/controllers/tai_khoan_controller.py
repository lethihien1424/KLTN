###D:\KLTN\KLTN\backend\src\controllers\tai_khoan_controller.py
from typing import Sequence
from sqlalchemy.orm import Session

from src.models.user_model import User
from src.schemas.tai_khoan_schema import (
    TaiKhoanCreateRequest,
    TaiKhoanUpdateRequest,
)
from src.services.tai_khoan_service import TaiKhoanService


class TaiKhoanController:
    _service = TaiKhoanService()

    @classmethod
    def get_all(
        cls,
        db: Session,
        search: str | None = None,
        vai_tro: str | None = None,
        trang_thai: str | None = None,
    ) -> Sequence[User]:
        return cls._service.get_all(
            db=db,
            search=search,
            vai_tro=vai_tro,
            trang_thai=trang_thai,
        )

    @classmethod
    def get_by_id(cls, db: Session, ma_nguoi_dung: str) -> User:
        return cls._service.get_by_id(db=db, ma_nguoi_dung=ma_nguoi_dung)

    @classmethod
    def create(
        cls,
        db: Session,
        payload: TaiKhoanCreateRequest,
        creator: User | None = None,
    ) -> User:
        return cls._service.create(db=db, payload=payload, creator=creator)

    @classmethod
    def update(
        cls,
        db: Session,
        ma_nguoi_dung: str,
        payload: TaiKhoanUpdateRequest,
        modifier: User | None = None,
    ) -> User:
        return cls._service.update(
            db=db,
            ma_nguoi_dung=ma_nguoi_dung,
            payload=payload,
            modifier=modifier,
        )

    @classmethod
    def delete(
        cls,
        db: Session,
        ma_nguoi_dung: str,
        remover: User | None = None,
    ) -> None:
        return cls._service.delete(
            db=db, ma_nguoi_dung=ma_nguoi_dung, remover=remover
        )
