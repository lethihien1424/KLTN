from contextlib import contextmanager
from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.models.rbac_model import Role
from src.repositories.rbac_repository import RbacRepository
from src.schemas.rbac_schema import RoleResponse


class RbacService:
    def __init__(self):
        self.repository = RbacRepository()

    def list_roles(self, db):
        return self.repository.roles(db)

    def _get(self, db, code, lock=False):
        role = self.repository.role(db, code, lock=lock)
        if role is None:
            raise HTTPException(404, "Không tìm thấy vai trò.")
        return role

    def detail(self, db, code):
        role = self._get(db, code)
        return {**RoleResponse.model_validate(role).model_dump(), "permissions": self.repository.role_permissions(db, code)}

    def create(self, db, payload):
        with self._write(db):
            role = Role(**payload.model_dump())
            db.add(role)
            db.flush()
            result = RoleResponse.model_validate(role)
        return result

    def update(self, db, code, payload):
        with self._write(db):
            role = self._get(db, code, lock=True)
            for key, value in payload.model_dump().items():
                setattr(role, key, value)
            role.thoi_gian_cap_nhat = datetime.now(timezone.utc)
            db.flush()
            result = RoleResponse.model_validate(role)
        return result

    def permissions(self, db):
        return self.repository.permissions(db)

    def assign_permissions(self, db, code, payload):
        with self._write(db):
            role = self._get(db, code, lock=True)
            keys = set(payload.permissions)
            missing = keys - self.repository.existing_permissions(db, keys)
            if missing:
                raise HTTPException(422, "Quyền không tồn tại: " + ", ".join(sorted(missing)))
            self.repository.replace_permissions(db, code, keys)
            role.thoi_gian_cap_nhat = datetime.now(timezone.utc)
            db.flush()
            result = {**RoleResponse.model_validate(role).model_dump(), "permissions": sorted(keys)}
        return result

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(409, "Vai trò đã tồn tại hoặc dữ liệu vi phạm ràng buộc.") from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu cấu hình phân quyền.") from exc
        except Exception:
            db.rollback()
            raise
