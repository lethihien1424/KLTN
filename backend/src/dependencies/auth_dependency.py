from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.security import decode_access_token
from src.models.tai_khoan import TaiKhoan
from src.repositories.auth_repository import AuthRepository


security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> TaiKhoan:
    # Không gửi Authorization header
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Thiếu token đăng nhập.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )

    # Chỉ chấp nhận Bearer token
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
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
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from exc

    except InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không hợp lệ.",
            headers={
                "WWW-Authenticate": "Bearer"
            },
        ) from exc

    # Token phải là access token
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Loại token không hợp lệ.",
        )

    account_id = payload.get("sub")

    if not isinstance(account_id, str) or not account_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token không chứa mã tài khoản.",
        )

    # Đọc lại tài khoản từ PostgreSQL
    user = AuthRepository().get_by_account_id(
        db=db,
        account_id=account_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại.",
        )

    # Token còn hạn nhưng tài khoản đã ngừng hoạt động
    if user.trang_thai != "HOAT_DONG":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã ngừng hoạt động.",
        )

    return user