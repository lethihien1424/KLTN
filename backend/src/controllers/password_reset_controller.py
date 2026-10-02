### D:\KLTN\KLTN\backend\src\controllers\password_reset_controller.py
from sqlalchemy.orm import Session

from src.schemas.password_reset_schema import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)
from src.services.password_reset_service import (
    PasswordResetService,
)


class PasswordResetController:
    @staticmethod
    def forgot_password(
        payload: ForgotPasswordRequest,
        db: Session,
    ) -> SendOtpResponse:
        return PasswordResetService().forgot_password(
            payload=payload,
            db=db,
        )

    @staticmethod
    def verify_otp(
        payload: VerifyOtpRequest,
        db: Session,
    ) -> VerifyOtpResponse:
        return PasswordResetService().verify_otp(
            payload=payload,
            db=db,
        )

    @staticmethod
    def reset_password(
        payload: ResetPasswordRequest,
        db: Session,
    ) -> MessageResponse:
        return PasswordResetService().reset_password(
            payload=payload,
            db=db,
        )