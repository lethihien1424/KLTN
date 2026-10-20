from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, String, Text, func

from src.core.database import Base


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (CheckConstraint("trang_thai IN ('HOAT_DONG', 'NGUNG_HOAT_DONG')", name="ck_roles_status"),)

    ma_vai_tro = Column(String(50), primary_key=True)
    ten_vai_tro = Column(String(100), nullable=False)
    mo_ta = Column(Text)
    trang_thai = Column(String(30), nullable=False, default="HOAT_DONG", server_default="HOAT_DONG")
    thoi_gian_tao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    thoi_gian_cap_nhat = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Permission(Base):
    __tablename__ = "permissions"

    ma_quyen = Column(String(80), primary_key=True)
    ten_quyen = Column(String(150), nullable=False)
    module = Column(String(50), nullable=False)
    mo_ta = Column(Text)
    thoi_gian_tao = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RolePermission(Base):
    __tablename__ = "role_permissions"

    ma_vai_tro = Column(String(50), ForeignKey("roles.ma_vai_tro", ondelete="CASCADE"), primary_key=True)
    ma_quyen = Column(String(80), ForeignKey("permissions.ma_quyen", ondelete="CASCADE"), primary_key=True)
