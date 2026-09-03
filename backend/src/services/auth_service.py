from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.security import (
    create_access_token,
    verify_password,
)
from src.models.tai_khoan import TaiKhoan
from src.repositories.auth_repository import AuthRepository
from src.repositories.nhat_ky_repository import NhatKyRepository
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
            account_id=payload.ma_tai_khoan,
        )

        # Không tìm thấy mã tài khoản
        if user is None:
            self._write_log(
                db=db,
                account_id=None,
                action="DANG_NHAP",
                result="THAT_BAI",
                description="Mã tài khoản không tồn tại.",
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Mã tài khoản hoặc mật khẩu "
                    "không chính xác."
                ),
            )

        # Sai mật khẩu
        if not verify_password(
            payload.mat_khau,
            user.mat_khau,
        ):
            self._write_log(
                db=db,
                account_id=user.ma_tai_khoan,
                action="DANG_NHAP",
                result="THAT_BAI",
                description="Sai mật khẩu.",
            )

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Mã tài khoản hoặc mật khẩu "
                    "không chính xác."
                ),
            )

        # Tài khoản đã ngừng hoạt động
        if user.trang_thai != "HOAT_DONG":
            self._write_log(
                db=db,
                account_id=user.ma_tai_khoan,
                action="DANG_NHAP",
                result="THAT_BAI",
                description="Tài khoản đã ngừng hoạt động.",
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản đã ngừng hoạt động.",
            )

        # Tạo JWT
        access_token = create_access_token(
            sub=user.ma_tai_khoan,
            role=user.vai_tro,
        )

        # Ghi nhật ký đăng nhập thành công
        self._write_log(
            db=db,
            account_id=user.ma_tai_khoan,
            action="DANG_NHAP",
            result="THANH_CONG",
            description="Đăng nhập thành công.",
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=(
                settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            ),
            user=UserResponse.model_validate(user),
        )

    def logout(
        self,
        current_user: TaiKhoan,
        db: Session,
    ) -> None:
        self._write_log(
            db=db,
            account_id=current_user.ma_tai_khoan,
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
            ma_tai_khoan=account_id,
            hanh_dong=action,
            ket_qua=result,
            mo_ta=description,
        )