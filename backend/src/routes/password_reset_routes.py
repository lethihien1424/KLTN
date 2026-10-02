### D:\KLTN\KLTN\backend\src\routes\password_reset_routes.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.controllers.password_reset_controller import (
    PasswordResetController,
)
from src.core.database import get_db
from src.schemas.password_reset_schema import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/forgot-password",
    response_model=SendOtpResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> SendOtpResponse:
    return PasswordResetController.forgot_password(
        payload=payload,
        db=db,
    )


@router.post(
    "/verify-reset-otp",
    response_model=VerifyOtpResponse,
)
def verify_reset_otp(
    payload: VerifyOtpRequest,
    db: Session = Depends(get_db),
) -> VerifyOtpResponse:
    return PasswordResetController.verify_otp(
        payload=payload,
        db=db,
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    return PasswordResetController.reset_password(
        payload=payload,
        db=db,
    )