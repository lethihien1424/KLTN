from fastapi import Depends, HTTPException, status

from src.dependencies.auth_dependency import get_current_user
from src.models.tai_khoan import TaiKhoan


def require_role(
    *allowed_roles: str,
):
    def dependency(
        current_user: TaiKhoan = Depends(
            get_current_user
        ),
    ) -> TaiKhoan:
        # Kiểm tra vai trò lấy trực tiếp từ PostgreSQL
        if current_user.vai_tro not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Bạn không có quyền truy cập "
                    "tài nguyên này."
                ),
            )

        return current_user

    return dependency