from fastapi import (
    Depends,
    HTTPException,
    status,
)

from src.dependencies.auth_dependency import (
    get_current_user,
)
from src.models.user_model import User


def require_role(
    *allowed_roles: str,
):
    def dependency(
        current_user: User = Depends(
            get_current_user
        ),
    ) -> User:
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