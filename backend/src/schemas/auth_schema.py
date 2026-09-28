#### D:\KLTN\KLTN\backend\src\schemas\auth_schema.py
from pydantic import BaseModel, ConfigDict


class LoginRequest(BaseModel):
    ma_nguoi_dung: str
    mat_khau: str


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    ma_nguoi_dung: str
    ho_ten: str
    vai_tro: str
    trang_thai: str
    email: str | None = None
    so_dien_thoai: str | None = None
    dia_chi: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


class MeResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    ma_nguoi_dung: str
    ho_ten: str
    vai_tro: str
    trang_thai: str
    email: str | None = None
    so_dien_thoai: str | None = None
    dia_chi: str | None = None


class LogoutResponse(BaseModel):
    message: str