#### D:\KLTN\KLTN\backend\src\services\auth_service.py
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.security import (
    create_access_token,
    verify_password,
)
from src.models.user_model import User
from src.services.authorization_service import AuthorizationService
from src.repositories.auth_repository import (
    AuthRepository,
)
from src.schemas.auth_schema import (
    LoginRequest,
    TokenResponse,
    UserResponse,
)


class AuthService:
    def __init__(self) -> None:
        self.auth_repository = AuthRepository()

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

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Mã người dùng hoặc mật khẩu "
                    "không chính xác."
                ),
            )

        if user.trang_thai != "HOAT_DONG":

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Tài khoản đã ngừng hoạt động."
                ),
            )

        context = AuthorizationService().load(db, user)
        access_token = create_access_token(
            sub=user.ma_nguoi_dung,
            role=user.vai_tro,
        )


        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=(
                settings.ACCESS_TOKEN_EXPIRE_MINUTES
                * 60
            ),
            user=self.user_response(context),
        )

    @staticmethod
    def user_response(context) -> UserResponse:
        user = context.user
        return UserResponse(
            ma_nguoi_dung=user.ma_nguoi_dung,
            ho_ten=user.ho_ten,
            vai_tro=user.vai_tro,
            trang_thai=user.trang_thai,
            email=user.email,
            so_dien_thoai=user.so_dien_thoai,
            dia_chi=user.dia_chi,
            role={"ma_vai_tro": context.role.ma_vai_tro, "ten_vai_tro": context.role.ten_vai_tro},
            permissions=sorted(context.permissions),
        )

    def logout(
        self,
        current_user: User,
        db: Session,
    ) -> None:
        # JWT logout has no persistent business data change to audit.
        return None
