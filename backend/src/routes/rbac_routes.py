from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.core.database import get_db
from src.dependencies.permission_dependency import require_permission
from src.schemas.rbac_schema import (
    PermissionResponse, RoleCreate, RoleDetailResponse, RolePermissionsUpdate,
    RoleResponse, RoleUpdate,
)
from src.services.rbac_service import RbacService


router = APIRouter(tags=["Role & Permission Management"])
service = RbacService()


@router.get("/roles", response_model=list[RoleResponse], dependencies=[Depends(require_permission("ROLE_VIEW"))])
def list_roles(db: Session = Depends(get_db)):
    return service.list_roles(db)


@router.get("/roles/{ma_vai_tro}", response_model=RoleDetailResponse, dependencies=[Depends(require_permission("ROLE_VIEW"))])
def role_detail(ma_vai_tro: str, db: Session = Depends(get_db)):
    return service.detail(db, ma_vai_tro)


@router.post("/roles", response_model=RoleResponse, status_code=201, dependencies=[Depends(require_permission("ROLE_CREATE"))])
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return service.create(db, payload)


@router.put("/roles/{ma_vai_tro}", response_model=RoleResponse, dependencies=[Depends(require_permission("ROLE_UPDATE"))])
def update_role(ma_vai_tro: str, payload: RoleUpdate, db: Session = Depends(get_db)):
    return service.update(db, ma_vai_tro, payload)


@router.put("/roles/{ma_vai_tro}/permissions", response_model=RoleDetailResponse, dependencies=[Depends(require_permission("ROLE_ASSIGN_PERMISSION"))])
def assign_permissions(ma_vai_tro: str, payload: RolePermissionsUpdate, db: Session = Depends(get_db)):
    return service.assign_permissions(db, ma_vai_tro, payload)


@router.get("/permissions", response_model=list[PermissionResponse], dependencies=[Depends(require_permission("PERMISSION_VIEW"))])
def list_permissions(db: Session = Depends(get_db)):
    return service.permissions(db)
