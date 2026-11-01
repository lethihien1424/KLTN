from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

Code = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Quantity = Annotated[Decimal, Field(ge=0, max_digits=14, decimal_places=2, allow_inf_nan=False)]


class SupplyConfirmationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_nguyen_lieu_ncc: Code
    ma_lich_su_du_bao: Code | None = None
    so_luong_can_mua: Annotated[Quantity, Field(gt=0)]
    so_luong_xac_nhan: Quantity
    ngay_xac_nhan: datetime
    hieu_luc_den: datetime
    nguon_xac_nhan: Literal["EMAIL", "DIEN_THOAI", "VAN_BAN", "TRUC_TIEP"]
    ly_do: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]
    ghi_chu: Annotated[str, StringConstraints(max_length=2000)] | None = None
    phien_ban_truoc: Annotated[str, StringConstraints(min_length=32, max_length=32)] | None = None

    @model_validator(mode="after")
    def dates(self):
        if self.ngay_xac_nhan.tzinfo is None or self.hieu_luc_den.tzinfo is None:
            raise ValueError("Ngày xác nhận và hiệu lực phải có múi giờ.")
        if self.hieu_luc_den <= self.ngay_xac_nhan:
            raise ValueError("Thời hạn hiệu lực phải sau ngày xác nhận.")
        return self
