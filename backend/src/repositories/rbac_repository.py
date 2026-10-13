from sqlalchemy import delete, select

from src.models.rbac_model import Permission, Role, RolePermission


class RbacRepository:
    def authorization(self, db, role_code):
        # One query, including the role even when it has no grants.
        return db.execute(
            select(Role, Permission.ma_quyen)
            .outerjoin(RolePermission, RolePermission.ma_vai_tro == Role.ma_vai_tro)
            .outerjoin(Permission, Permission.ma_quyen == RolePermission.ma_quyen)
            .where(Role.ma_vai_tro == role_code)
            .execution_options(populate_existing=True)
        ).all()

    def roles(self, db):
        return db.scalars(select(Role).order_by(Role.ma_vai_tro)).all()

    def role(self, db, code, lock=False):
        query = select(Role).where(Role.ma_vai_tro == code).execution_options(populate_existing=True)
        if lock:
            query = query.with_for_update()
        return db.scalar(query)

    def permissions(self, db):
        return db.scalars(select(Permission).order_by(Permission.module, Permission.ma_quyen)).all()

    def role_permissions(self, db, code):
        return db.scalars(select(RolePermission.ma_quyen).where(RolePermission.ma_vai_tro == code).order_by(RolePermission.ma_quyen)).all()

    def existing_permissions(self, db, codes):
        return set(db.scalars(select(Permission.ma_quyen).where(Permission.ma_quyen.in_(codes))).all())

    def replace_permissions(self, db, code, codes):
        db.execute(delete(RolePermission).where(RolePermission.ma_vai_tro == code))
        db.add_all([RolePermission(ma_vai_tro=code, ma_quyen=key) for key in sorted(codes)])
        db.flush()
