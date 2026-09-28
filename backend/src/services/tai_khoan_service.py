#### D:\KLTN\KLTN\backend\src\services\tai_khoan_service.py
from typing import Sequence

from fastapi import HTTPException, status
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

    def create(
        self,
        db: Session,
        payload: TaiKhoanCreateRequest,
        creator: User | None = None,
    ) -> User:
        ma_nguoi_dung = payload.ma_nguoi_dung.strip()
        ho_ten = payload.ho_ten.strip()

        if not ma_nguoi_dung or not ho_ten:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Mã người dùng và họ tên "
                    "không được để trống."
                ),
            )

        existing = self.repository.get_by_id(
            db=db,
            ma_nguoi_dung=ma_nguoi_dung,
        )

        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Mã người dùng "
                    f"{ma_nguoi_dung} đã tồn tại."
                ),
            )

        user = User(
            ma_nguoi_dung=ma_nguoi_dung,
            mat_khau=hash_password(payload.mat_khau),
            ho_ten=ho_ten,
            vai_tro=payload.vai_tro,
            trang_thai=payload.trang_thai,
            nguoi_thao_tac=(
                creator.ma_nguoi_dung
                if creator is not None
                else None
            ),
            email=payload.email,
            so_dien_thoai=payload.so_dien_thoai,
            dia_chi=payload.dia_chi,
        )

        created_user = self.repository.create(
            db=db,
            user=user,
        )

        self._write_log(
            db=db,
            account_id=(
                creator.ma_nguoi_dung
                if creator is not None
                else created_user.ma_nguoi_dung
            ),
            action="THEM_TAI_KHOAN",
            description=(
                "Thêm tài khoản: "
                f"{created_user.ma_nguoi_dung} "
                f"({created_user.ho_ten})."
            ),
        )

        return created_user

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

        if "ho_ten" in changes:
            value = changes["ho_ten"]

            if value is None or not value.strip():
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_ENTITY
                    ),
                    detail="Họ tên không được để trống.",
                )

            user.ho_ten = value.strip()

        if "vai_tro" in changes:
            value = changes["vai_tro"]

            if value is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_ENTITY
                    ),
                    detail="Vai trò không được để trống.",
                )

            user.vai_tro = value

        if "trang_thai" in changes:
            value = changes["trang_thai"]

            if value is None:
                raise HTTPException(
                    status_code=(
                        status.HTTP_422_UNPROCESSABLE_ENTITY
                    ),
                    detail="Trạng thái không được để trống.",
                )

            user.trang_thai = value

        for field in (
            "email",
            "so_dien_thoai",
            "dia_chi",
        ):
            if field in changes:
                setattr(
                    user,
                    field,
                    changes[field],
                )

        if "mat_khau" in changes:
            new_password = changes["mat_khau"]

            if new_password:
                user.mat_khau = hash_password(
                    new_password
                )

        if modifier is not None:
            user.nguoi_thao_tac = (
                modifier.ma_nguoi_dung
            )

        updated_user = self.repository.update(
            db=db,
            user=user,
        )

        self._write_log(
            db=db,
            account_id=(
                modifier.ma_nguoi_dung
                if modifier is not None
                else ma_nguoi_dung
            ),
            action="CAP_NHAT_TAI_KHOAN",
            description=(
                f"Cập nhật tài khoản: "
                f"{ma_nguoi_dung}."
            ),
        )

        return updated_user

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

        if ma_nguoi_dung.lower() == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Không thể xóa tài khoản admin."
                ),
            )

        if (
            remover is not None
            and remover.ma_nguoi_dung == ma_nguoi_dung
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Không thể tự xóa tài khoản "
                    "đang đăng nhập."
                ),
            )

        self.repository.delete(
            db=db,
            user=user,
        )

        self._write_log(
            db=db,
            account_id=(
                remover.ma_nguoi_dung
                if remover is not None
                else None
            ),
            action="XOA_TAI_KHOAN",
            description=(
                f"Xóa tài khoản: "
                f"{ma_nguoi_dung}."
            ),
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