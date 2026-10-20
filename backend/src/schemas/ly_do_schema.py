from typing import Literal, Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints

FunctionCode = Literal['DOI_TRANG_THAI_NGUYEN_LIEU', 'DOI_TRANG_THAI_CONG_THUC', 'DOI_TRANG_THAI_NHA_CUNG_CAP']
ReasonStatus = Literal['DANG_SU_DUNG', 'NGUNG_SU_DUNG']
TrimmedName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=250)]


class StatusReasonFields(BaseModel):
    ly_do_id: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=40)]
    ghi_chu: str | None = Field(default=None, max_length=2000)


class ReasonWrite(BaseModel):
    model_config = ConfigDict(extra='forbid')
    ten_ly_do: TrimmedName
    ghi_chu: str | None = Field(default=None, max_length=2000)
    trang_thai: ReasonStatus = 'DANG_SU_DUNG'
    chuc_nang_ap_dung: list[FunctionCode] = Field(min_length=1, max_length=3)


class ReasonStatusWrite(BaseModel):
    model_config = ConfigDict(extra='forbid')
    trang_thai: ReasonStatus
