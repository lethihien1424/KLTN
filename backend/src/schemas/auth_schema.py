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


class LogoutResponse(BaseModel):
    message: str