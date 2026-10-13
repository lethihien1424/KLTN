from dataclasses import dataclass

from fastapi import HTTPException

from src.repositories.rbac_repository import RbacRepository


@dataclass(frozen=True)
class AuthorizationContext:
    user: object
    role: object
    permissions: frozenset[str]


class AuthorizationService:
    def __init__(self):
        self.repository = RbacRepository()

    def load(self, db, user):
        if user.trang_thai != "HOAT_DONG":
            raise HTTPException(403, "Tài khoản đã ngừng hoạt động.")
        rows = self.repository.authorization(db, user.vai_tro)
        if not rows or rows[0][0].trang_thai != "HOAT_DONG":
            raise HTTPException(403, "Vai trò không tồn tại hoặc đã ngừng hoạt động.")
        return AuthorizationContext(user, rows[0][0], frozenset(key for _, key in rows if key is not None))

    @staticmethod
    def check(context, *permissions):
        if not set(permissions).issubset(context.permissions):
            raise HTTPException(403, "Bạn không có quyền truy cập tài nguyên này.")
        return context.user

    def require(self, db, user, *permissions):
        return self.check(self.load(db, user), *permissions)

    def assignable_role(self, db, code):
        role = self.repository.role(db, code, lock=True)
        if role is None or role.trang_thai != "HOAT_DONG":
            raise HTTPException(422, "Vai trò không tồn tại hoặc đã ngừng hoạt động.")
        return role
