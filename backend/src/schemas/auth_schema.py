from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


class LoginRequest(BaseModel):
    ma_tai_khoan: str = Field(
        min_length=1,
        max_length=20,
    )

    mat_khau: str = Field(
        min_length=1,
        max_length=72,
    )

    @field_validator("ma_tai_khoan")
    @classmethod
    def normalize_account_id(cls, value: str) -> str:
        account_id = value.strip()

        if not account_id:
            raise ValueError(
                "Mã tài khoản không được để trống."
            )

        # Riêng tài khoản admin dùng chữ thường
        if account_id.lower() == "admin":
            return "admin"

        # Các mã còn lại: GS001, NVK001, QL001,...
        return account_id.upper()


class UserResponse(BaseModel):
    ma_tai_khoan: str
    ho_ten: str
    vai_tro: str

    model_config = ConfigDict(
        from_attributes=True
    )


class MeResponse(BaseModel):
    ma_tai_khoan: str
    ho_ten: str
    vai_tro: str
    trang_thai: str

    model_config = ConfigDict(
        from_attributes=True
    )


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class LogoutResponse(BaseModel):
    message: str