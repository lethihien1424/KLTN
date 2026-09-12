from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jose.exceptions import (
    ExpiredSignatureError,
    JWTError,
)
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import decode_access_token
from src.models.user_model import User
from src.repositories.auth_repository import (
    AuthRepository,
)


security = HTTPBearer(
    auto_error=False
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Thiếu token đăng nhập.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Loại token không hợp lệ.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    try:
        payload = decode_access_token(
            credentials.credentials
        )

    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Token đã hết hạn.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from exc

    except JWTError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Token không hợp lệ.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Loại token không hợp lệ.",
        )

    account_id = payload.get("sub")

    if (
        not isinstance(account_id, str)
        or not account_id
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Token không chứa mã người dùng."
            ),
        )

    user = AuthRepository().get_by_account_id(
        db=db,
        account_id=account_id,
    )

    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail="Người dùng không tồn tại.",
        )

    if user.trang_thai != "HOAT_DONG":
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Tài khoản đã ngừng hoạt động."
            ),
        )

    return user