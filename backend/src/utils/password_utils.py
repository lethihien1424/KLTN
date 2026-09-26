###D:\KLTN\KLTN\backend\src\utils\password_utils.py
import bcrypt


def hash_password(
    plain_password: str,
) -> str:
    password = plain_password.strip()

    if not password:
        raise ValueError(
            "Mật khẩu không được để trống."
        )

    password_bytes = password.encode(
        "utf-8"
    )

    if len(password_bytes) > 72:
        raise ValueError(
            "Mật khẩu không được vượt quá "
            "72 byte khi sử dụng bcrypt."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt(),
    )

    return hashed.decode("utf-8")