import uuid
from datetime import (
    datetime,
    timedelta,
    timezone,
)
from typing import Any

import bcrypt
from jose import jwt

from src.core.config import settings


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    if not password_bytes:
        raise ValueError(
            "Mật khẩu không được để trống."
        )

    if len(password_bytes) > 72:
        raise ValueError(
            "Mật khẩu không được vượt quá 72 byte."
        )

    password_hash = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt(),
    )

    return password_hash.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )

    except (TypeError, ValueError):
        return False


def create_access_token(
    sub: str,
    role: str,
) -> str:
    now = datetime.now(timezone.utc)

    expires_at = now + timedelta(
        minutes=(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": sub,
        "role": role,
        "jti": uuid.uuid4().hex,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "type": "access",
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(
    token: str,
) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[
            settings.JWT_ALGORITHM,
        ],
    )