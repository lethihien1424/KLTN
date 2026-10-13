from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints


RoleCode = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50, pattern=r"^[A-Z][A-Z0-9_]*$")]
PermissionCode = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
RoleStatus = Literal["HOAT_DONG", "NGUNG_HOAT_DONG"]


class RoleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_vai_tro: RoleCode
    ten_vai_tro: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    mo_ta: str | None = None
    trang_thai: RoleStatus = "HOAT_DONG"


class RoleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ten_vai_tro: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
    mo_ta: str | None = None
    trang_thai: RoleStatus = "HOAT_DONG"


class RoleResponse(RoleCreate):
    model_config = ConfigDict(from_attributes=True)
    thoi_gian_tao: datetime
    thoi_gian_cap_nhat: datetime


class RolePermissionsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    permissions: list[PermissionCode] = Field(max_length=500)


class RoleDetailResponse(RoleResponse):
    permissions: list[str]


class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    ma_quyen: str
    ten_quyen: str
    module: str
    mo_ta: str | None
    thoi_gian_tao: datetime
