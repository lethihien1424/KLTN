#### D:\KLTN\KLTN\backend\src\services\tai_khoan_service.py
from datetime import datetime, timezone
from typing import Sequence

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from src.core.security import hash_password
from src.models.user_model import User
from src.repositories.nhat_ky_repository import NhatKyRepository
from src.repositories.tai_khoan_repository import TaiKhoanRepository
from src.schemas.tai_khoan_schema import (
    TaiKhoanCreateRequest,
    TaiKhoanUpdateRequest,
)


class TaiKhoanService:
    def __init__(self) -> None:
        self.repository = TaiKhoanRepository()
        self.log_repository = NhatKyRepository()

    def get_all(
        self,
        db: Session,
        search: str | None = None,
        vai_tro: str | None = None,
        trang_thai: str | None = None,
    ) -> Sequence[User]:
        return self.repository.get_all(
            db=db,
            search=search,
            vai_tro=vai_tro,
            trang_thai=trang_thai,
        )

    def get_by_id(
        self,
        db: Session,
        ma_nguoi_dung: str,
    ) -> User:
        user = self.repository.get_by_id(
            db=db,
            ma_nguoi_dung=ma_nguoi_dung,
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=(
                    f"Không tìm thấy người dùng "
                    f"{ma_nguoi_dung}."
                ),
            )

        return user

    @staticmethod
    def _hash_password(password: str) -> str:
        try:
            return hash_password(password)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

    @staticmethod
    def _optional_text(value: str | None) -> str | None:
        if value is None:
            return None

        return value.strip() or None

    @staticmethod
    def _database_error(
        db: Session,
        exc: SQLAlchemyError,
        deleting: bool = False,
    ) -> None:
        db.rollback()

        if isinstance(exc, IntegrityError):
            original = getattr(exc, "orig", None)

            code = (
                getattr(original, "pgcode", None)
                or getattr(original, "sqlstate", None)
            )

            if code == "23503":
                message = (
                    "Tài khoản đang được dữ liệu khác tham chiếu. "
                    "Hãy chuyển sang NGUNG_HOAT_DONG thay vì xóa."
                    if deleting
                    else "Mã tham chiếu không hợp lệ."
                )

            elif code == "23505":
                message = (
                    "Mã tài khoản hoặc dữ liệu duy nhất "
                    "đã tồn tại."
                )

            elif code == "23514":
                message = (
                    "Vai trò hoặc dữ liệu không đáp ứng "
                    "ràng buộc trong database."
                )

            else:
                message = (
                    "Dữ liệu vi phạm ràng buộc database."
                )

            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=message,
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Không thể lưu thay đổi tài khoản.",
        ) from exc

    def create(
        self,
        db: Session,
        payload: TaiKhoanCreateRequest,
        creator: User | None = None,
    ) -> User:
        ho_ten = payload.ho_ten.strip()

        if not ho_ten:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Họ tên không được để trống.",
            )

        password_hash = self._hash_password(
            payload.mat_khau
        )

        actor_id = (
            creator.ma_nguoi_dung
            if creator is not None
            else None
        )

        try:
            account_id = self.repository.generate_account_id(
                db=db,
                vai_tro=payload.vai_tro,
            )

            user = User(
                ma_nguoi_dung=account_id,
                mat_khau=password_hash,
                ho_ten=ho_ten,
                vai_tro=payload.vai_tro,
                trang_thai=payload.trang_thai,
                nguoi_thao_tac=actor_id,
                email=self._optional_text(payload.email),
                so_dien_thoai=self._optional_text(
                    payload.so_dien_thoai
                ),
                dia_chi=self._optional_text(payload.dia_chi),
            )

            self.repository.create(db=db, user=user)
            db.commit()

        except ValueError as exc:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        except SQLAlchemyError as exc:
            self._database_error(db, exc)

        self._write_log(
            db=db,
            account_id=actor_id or user.ma_nguoi_dung,
            action="THEM_TAI_KHOAN",
            description=(
                f"Thêm tài khoản: {user.ma_nguoi_dung} "
                f"({user.ho_ten})."
            ),
        )

        return user

    def update(
        self,
        db: Session,
        ma_nguoi_dung: str,
        payload: TaiKhoanUpdateRequest,
        modifier: User | None = None,
    ) -> User:
        user = self.get_by_id(
            db=db,
            ma_nguoi_dung=ma_nguoi_dung,
        )

        changes = payload.model_dump(
            exclude_unset=True
        )

        for field, label in (
            ("ho_ten", "Họ tên"),
            ("vai_tro", "Vai trò"),
            ("trang_thai", "Trạng thái"),
            ("mat_khau", "Mật khẩu"),
        ):
            if field in changes and changes[field] is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"{label} không được để trống.",
                )

        if "ho_ten" in changes:
            changes["ho_ten"] = changes["ho_ten"].strip()

            if not changes["ho_ten"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Họ tên không được để trống.",
                )

        if "mat_khau" in changes:
            changes["mat_khau"] = self._hash_password(
                changes["mat_khau"]
            )

        actor_id = (
            modifier.ma_nguoi_dung
            if modifier is not None
            else None
        )

        protected = (
            user.ma_nguoi_dung.lower() == "admin"
            or actor_id == user.ma_nguoi_dung
        )

        if protected:
            if (
                "vai_tro" in changes
                and changes["vai_tro"] != user.vai_tro
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Không thể đổi vai trò tài khoản admin "
                        "hoặc tài khoản đang đăng nhập."
                    ),
                )

            if changes.get("trang_thai") == "NGUNG_HOAT_DONG":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Không thể ngưng hoạt động tài khoản admin "
                        "hoặc tài khoản đang đăng nhập."
                    ),
                )

        try:
            for field, value in changes.items():
                if field in {
                    "email",
                    "so_dien_thoai",
                    "dia_chi",
                }:
                    value = self._optional_text(value)

                setattr(user, field, value)

            if actor_id is not None:
                user.nguoi_thao_tac = actor_id

            user.thoi_gian_cap_nhat = datetime.now(
                timezone.utc
            )

            self.repository.update(db=db, user=user)
            db.commit()

        except SQLAlchemyError as exc:
            self._database_error(db, exc)

        self._write_log(
            db=db,
            account_id=actor_id or ma_nguoi_dung,
            action="CAP_NHAT_TAI_KHOAN",
            description=(
                f"Cập nhật tài khoản: {ma_nguoi_dung}."
            ),
        )

        return user

    def delete(
        self,
        db: Session,
        ma_nguoi_dung: str,
        remover: User | None = None,
    ) -> None:
        user = self.get_by_id(
            db=db,
            ma_nguoi_dung=ma_nguoi_dung,
        )

        if user.ma_nguoi_dung.lower() == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xóa tài khoản admin.",
            )

        actor_id = (
            remover.ma_nguoi_dung
            if remover is not None
            else None
        )

        if actor_id == user.ma_nguoi_dung:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Không thể tự xóa tài khoản "
                    "đang đăng nhập."
                ),
            )

        try:
            self.repository.delete(db=db, user=user)
            db.commit()

        except SQLAlchemyError as exc:
            self._database_error(
                db=db,
                exc=exc,
                deleting=True,
            )

        self._write_log(
            db=db,
            account_id=actor_id,
            action="XOA_TAI_KHOAN",
            description=f"Xóa tài khoản: {ma_nguoi_dung}.",
        )

    def _write_log(
        self,
        db: Session,
        account_id: str | None,
        action: str,
        description: str,
    ) -> None:
        if not self.log_repository.has_table(db):
            return

        self.log_repository.log_action(
            db=db,
            ma_nguoi_dung=account_id,
            hanh_dong=action,
            ket_qua="THANH_CONG",
            mo_ta=description,
        )