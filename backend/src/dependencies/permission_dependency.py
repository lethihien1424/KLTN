###D:\KLTN\KLTN\backend\src\dependencies\permission_dependency.py

from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.core.permission_catalog import (
    ACTION_LABELS,
    PERMISSION_CATALOG,
)
from src.dependencies.auth_dependency import get_current_user
from src.models.user_model import User
from src.services.phan_quyen_service import PhanQuyenService


ADMIN_RECOVERY_PERMISSIONS = frozenset({
    ("phan_quyen", "XEM"),
    ("phan_quyen", "THEM"),
    ("phan_quyen", "SUA"),
})


def _validate_permission(
    chuc_nang: str,
    thao_tac: str,
) -> None:
    feature = PERMISSION_CATALOG.get(chuc_nang)

    if (
        feature is None
        or thao_tac not in feature["thao_tac"]
    ):
        raise ValueError(
            "Cấu hình quyền không hợp lệ: "
            f"{chuc_nang}/{thao_tac}."
        )


def _get_selected_permissions(
    db: Session,
    current_user: User,
) -> set[tuple[str, str]]:
    if current_user.trang_thai != "HOAT_DONG":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản đã ngưng hoạt động.",
        )

    permissions = PhanQuyenService().get_my_permissions(
        db=db,
        current_user=current_user,
    )

    selected = {
        (item.chuc_nang, item.thao_tac)
        for item in permissions.chi_tiet
    }

    # Bảo đảm ADMIN không tự khóa quyền
    # quản lý phân quyền trong quá trình khôi phục.
    if current_user.vai_tro == "ADMIN":
        selected.update(ADMIN_RECOVERY_PERMISSIONS)

    return selected


def require_permission(
    chuc_nang: str,
    thao_tac: str,
) -> Callable:
    _validate_permission(chuc_nang, thao_tac)

    def dependency(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> User:
        selected = _get_selected_permissions(
            db=db,
            current_user=current_user,
        )

        if (chuc_nang, thao_tac) not in selected:
            feature_name = PERMISSION_CATALOG[
                chuc_nang
            ]["ten"]

            action_name = ACTION_LABELS.get(
                thao_tac,
                thao_tac,
            )

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Bạn chưa được cấp quyền "
                    f"'{action_name}' cho chức năng "
                    f"'{feature_name}'."
                ),
            )

        return current_user

    return dependency


def require_any_permission(
    *permissions: tuple[str, str],
) -> Callable:
    if not permissions:
        raise ValueError(
            "Phải khai báo ít nhất một quyền."
        )

    for chuc_nang, thao_tac in permissions:
        _validate_permission(chuc_nang, thao_tac)

    required = frozenset(permissions)

    def dependency(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user),
    ) -> User:
        selected = _get_selected_permissions(
            db=db,
            current_user=current_user,
        )

        if not required.intersection(selected):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Bạn chưa được cấp quyền truy cập "
                    "chức năng này."
                ),
            )

        return current_user

    return dependency


def require_permission_admin(
    chuc_nang: str,
    thao_tac: str,
) -> Callable:
    return require_permission(
        chuc_nang,
        thao_tac,
    )
