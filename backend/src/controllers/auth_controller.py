### backend/src/controllers/auth_controller.py
from sqlalchemy.orm import Session

from src.models.user_model import User
from src.schemas.auth_schema import (
    LoginRequest,
    LogoutResponse,
    MeResponse,
    TokenResponse,
)
from src.services.auth_service import AuthService


class AuthController:
    @staticmethod
    def login(
        payload: LoginRequest,
        db: Session,
    ) -> TokenResponse:
        return AuthService().login(
            payload=payload,
            db=db,
        )

    @staticmethod
    def me(
        current_user: User,
    ) -> MeResponse:
        return MeResponse.model_validate(
            current_user
        )

    @staticmethod
    def logout(
        current_user: User,
        db: Session,
    ) -> LogoutResponse:
        AuthService().logout(
            current_user=current_user,
            db=db,
        )

        return LogoutResponse(
            message="Đăng xuất thành công."
        )