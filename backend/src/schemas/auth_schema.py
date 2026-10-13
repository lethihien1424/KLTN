#### D:\KLTN\KLTN\backend\src\schemas\auth_schema.py
from pydantic import BaseModel, ConfigDict, Field


class UserRoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ma_vai_tro: str
    ten_vai_tro: str


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
    role: UserRoleResponse
    permissions: list[str] = Field(default_factory=list)
    trang_thai: str
    email: str | None = None
    so_dien_thoai: str | None = None
    dia_chi: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse


class MeResponse(UserResponse):
    pass


class LogoutResponse(BaseModel):
    message: str
