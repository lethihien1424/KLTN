### D:\KLTN\KLTN\backend\src\schemas\password_reset_schema.py
from datetime import datetime

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


class EmailRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=100,
    )

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()

        if (
            value.count("@") != 1
            or any(char.isspace() for char in value)
        ):
            raise ValueError("Email không hợp lệ.")

        local, domain = value.split("@")

        if (
            not local
            or "." not in domain
            or domain.startswith(".")
            or domain.endswith(".")
            or ".." in domain
        ):
            raise ValueError("Email không hợp lệ.")

        return value


class ForgotPasswordRequest(EmailRequest):
    pass


class VerifyOtpRequest(EmailRequest):
    otp: str = Field(
        pattern=r"^[0-9]{6}$",
    )


class ResetPasswordRequest(EmailRequest):
    reset_token: str = Field(
        min_length=1,
        max_length=200,
    )

    mat_khau_moi: str = Field(
        min_length=8,
        max_length=72,
    )

    nhap_lai_mat_khau: str = Field(
        min_length=8,
        max_length=72,
    )


class MessageResponse(BaseModel):
    message: str


class SendOtpResponse(MessageResponse):
    server_now: datetime
    expires_at: datetime


class VerifyOtpResponse(MessageResponse):
    reset_token: str