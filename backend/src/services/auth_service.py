from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.security import (
    create_access_token,
    verify_password,
)
from src.models.user_model import User
from src.repositories.auth_repository import (
    AuthRepository,
)
from src.repositories.nhat_ky_repository import (
    NhatKyRepository,
)
from src.schemas.auth_schema import (
    LoginRequest,
    TokenResponse,
    UserResponse,
)


class AuthService:
    def __init__(self) -> None:
        self.auth_repository = AuthRepository()
        self.log_repository = NhatKyRepository()

    def login(
        self,
        payload: LoginRequest,
        db: Session,
    ) -> TokenResponse:
        user = self.auth_repository.get_by_account_id(
            db=db,
            account_id=payload.ma_nguoi_dung,
        )

        if user is None:
            self._write_log(
                db=db,
                account_id=None,
                action="DANG_NHAP",
                result="THAT_BAI",
                description="Mã người dùng không tồn tại.",
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Mã người dùng hoặc mật khẩu "
                    "không chính xác."
                ),
            )

        if not verify_password(
            payload.mat_khau,
            user.mat_khau,
        ):
            self._write_log(
                db=db,
                account_id=user.ma_nguoi_dung,
                action="DANG_NHAP",
                result="THAT_BAI",
                description="Sai mật khẩu.",
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Mã người dùng hoặc mật khẩu "
                    "không chính xác."
                ),
            )

        if user.trang_thai != "HOAT_DONG":
            self._write_log(
                db=db,
                account_id=user.ma_nguoi_dung,
                action="DANG_NHAP",
                result="THAT_BAI",
                description=(
                    "Tài khoản đã ngừng hoạt động."
                ),
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Tài khoản đã ngừng hoạt động."
                ),
            )

        access_token = create_access_token(
            sub=user.ma_nguoi_dung,
            role=user.vai_tro,
        )

        self._write_log(
            db=db,
            account_id=user.ma_nguoi_dung,
            action="DANG_NHAP",
            result="THANH_CONG",
            description="Đăng nhập thành công.",
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=(
                settings.ACCESS_TOKEN_EXPIRE_MINUTES
                * 60
            ),
            user=UserResponse.model_validate(user),
        )

    def logout(
        self,
        current_user: User,
        db: Session,
    ) -> None:
        self._write_log(
            db=db,
            account_id=current_user.ma_nguoi_dung,
            action="DANG_XUAT",
            result="THANH_CONG",
            description="Đăng xuất thành công.",
        )

    def _write_log(
        self,
        db: Session,
        account_id: str | None,
        action: str,
        result: str,
        description: str,
    ) -> None:
        if not self.log_repository.has_table(db):
            return

        self.log_repository.log_action(
            db=db,
            ma_nguoi_dung=account_id,
            hanh_dong=action,
            ket_qua=result,
            mo_ta=description,
        )