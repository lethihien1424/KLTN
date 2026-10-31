from decimal import Decimal, ROUND_UP
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import select

from src.models.ke_hoach_san_xuat_model import KeHoachSanXuat
from src.models.san_pham_model import SanPham
from src.models.stock_movement_model import StockReservation, StockOperation
from src.repositories.nhu_cau_nguyen_lieu_repository import NhuCauNguyenLieuRepository
from src.schemas.ton_kho_schema import Quantity
from src.services.quy_doi_bom_service import QuyDoiBomService
from src.services.stock_accounting_service import StockAccountingService
from src.services.ton_kho_service import TonKhoService


class IssueLine(BaseModel):
    model_config = ConfigDict(extra="forbid")
    ma_nguyen_lieu: str = Field(min_length=1, max_length=20)
    so_luong: Quantity


class IssueRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: str = Field(min_length=16, max_length=64)
    chi_tiet: list[IssueLine] = Field(min_length=1, max_length=1000)
    ghi_chu: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def unique_materials(self):
        if len({line.ma_nguyen_lieu for line in self.chi_tiet}) != len(self.chi_tiet):
            raise ValueError("Trùng nguyên liệu trong phiếu xuất.")
        if not any(line.so_luong > 0 for line in self.chi_tiet):
            raise ValueError("Phiếu xuất phải có số lượng lớn hơn 0.")
        return self


class StockProductionService:
    accounting = StockAccountingService()
    demand = NhuCauNguyenLieuRepository()

    @staticmethod
    def plan(db, code):
        plan = db.scalar(select(KeHoachSanXuat).where(KeHoachSanXuat.ma_ke_hoach == code)
                         .with_for_update().execution_options(populate_existing=True))
        if plan is None:
            raise HTTPException(404, "Không tìm thấy kế hoạch sản xuất.")
        return plan

    @staticmethod
    def reservations(db, code):
        return list(db.scalars(select(StockReservation).where(StockReservation.ma_ke_hoach == code)
                              .order_by(StockReservation.ma_nguyen_lieu).with_for_update()
                              .execution_options(populate_existing=True)))

    def reserve(self, db, code):
        with TonKhoService._write(db):
            plan = self.plan(db, code)
            if plan.trang_thai_san_xuat != "CHO_SAN_XUAT" or plan.so_luong <= 0:
                raise HTTPException(409, "Chỉ giữ nguyên liệu cho kế hoạch đang chờ sản xuất có số lượng hợp lệ.")
            if self.reservations(db, code):
                raise HTTPException(409, "Kế hoạch đã được xác nhận giữ nguyên liệu; không giữ lần hai.")
            db.scalar(select(SanPham).where(SanPham.ma_san_pham == plan.ma_san_pham).with_for_update(read=True))
            boms = self.demand.active_boms(db, [plan.ma_san_pham])
            quantities = QuyDoiBomService.calculate(
                {plan.ma_san_pham: Decimal(plan.so_luong)}, boms,
                self.demand.bom_details(db, [bom.ma_cong_thuc for bom in boms]),
                self.demand.products(db, [plan.ma_san_pham]),
            )
            for material, kg in sorted(quantities.items()):
                stock, master = self.accounting.lock(db, material)
                unit = master.don_vi_do_luong.strip().lower()
                if unit not in ("kg", "g") or master.trang_thai != "DANG_SU_DUNG":
                    raise HTTPException(422, f"Nguyên liệu {material} cần đang sử dụng và đơn vị kg/g để quy đổi BOM.")
                quantity = (kg * (1000 if unit == "g" else 1)).quantize(Decimal("0.01"), rounding=ROUND_UP)
                if quantity > stock.ton_kho_thuc_te - stock.so_luong_book:
                    raise HTTPException(409, f"Nguyên liệu {material} không đủ tồn khả dụng để giữ.")
                held = stock.so_luong_book
                stock.so_luong_book += quantity
                db.add(StockReservation(ma_ke_hoach=code, ma_nguyen_lieu=material,
                                       ma_cong_thuc=boms[0].ma_cong_thuc, so_luong_ke_hoach=plan.so_luong,
                                       so_luong_giu=quantity, so_luong_xuat=0, da_huy="N"))
                self.accounting.record(db, stock, stock.ton_kho_thuc_te, held, "GIU", code, "Xác nhận giữ theo BOM")
        return {"message": "Đã giữ đủ nguyên liệu theo BOM cho kế hoạch."}

    def issue(self, db, code, payload):
        with TonKhoService._write(db):
            plan = self.plan(db, code)
            fingerprint = payload.model_dump(mode="json")
            existing = db.get(StockOperation, payload.request_id)
            if existing:
                if existing.ma_ke_hoach != code or existing.payload != fingerprint:
                    raise HTTPException(409, "Mã yêu cầu đã dùng với nội dung khác.")
                return {"message": "Phiếu xuất này đã được ghi nhận.", "request_id": payload.request_id}
            if plan.trang_thai_san_xuat != "CHO_SAN_XUAT":
                raise HTTPException(409, "Kế hoạch không còn chờ sản xuất.")
            reservations = self.reservations(db, code)
            requested = {line.ma_nguyen_lieu: line.so_luong for line in payload.chi_tiet}
            if set(requested) != {row.ma_nguyen_lieu for row in reservations}:
                raise HTTPException(422, "Phải cung cấp đầy đủ từng nguyên liệu đã giữ của kế hoạch (có thể xuất 0).")
            if any(row.da_huy == "Y" for row in reservations):
                raise HTTPException(409, "Kế hoạch đã hủy giữ nguyên liệu.")
            for row in reservations:
                stock, _ = self.accounting.lock(db, row.ma_nguyen_lieu)
                quantity = requested[row.ma_nguyen_lieu]
                if quantity > row.so_luong_giu - row.so_luong_xuat:
                    raise HTTPException(409, "Số thực xuất vượt phần còn giữ của kế hoạch.")
                if quantity > stock.ton_kho_thuc_te or quantity > stock.so_luong_book:
                    raise HTTPException(409, "Không đủ tồn thực tế hoặc dữ liệu đã giữ cần đối soát.")
                if quantity:
                    before, held = stock.ton_kho_thuc_te, stock.so_luong_book
                    stock.ton_kho_thuc_te -= quantity
                    stock.so_luong_book -= quantity
                    row.so_luong_xuat += quantity
                    self.accounting.record(db, stock, before, held, "XUAT", code, "Xuất nguyên liệu sản xuất", payload.ghi_chu)
            db.add(StockOperation(id=payload.request_id, ma_ke_hoach=code, payload=fingerprint))
            db.flush()
        return {"message": "Đã xuất nguyên liệu.", "request_id": payload.request_id}

    def cancel(self, db, code):
        with TonKhoService._write(db):
            self.plan(db, code)
            reservations = self.reservations(db, code)
            if not reservations:
                raise HTTPException(409, "Kế hoạch chưa giữ nguyên liệu.")
            for row in reservations:
                if row.da_huy == "Y":
                    continue
                stock, _ = self.accounting.lock(db, row.ma_nguyen_lieu)
                remaining = row.so_luong_giu - row.so_luong_xuat
                if remaining > stock.so_luong_book:
                    raise HTTPException(409, "Số đã giữ cần đối soát trước khi giải phóng.")
                held = stock.so_luong_book
                stock.so_luong_book -= remaining
                row.da_huy = "Y"
                if remaining:
                    self.accounting.record(db, stock, stock.ton_kho_thuc_te, held, "HUY_GIU", code, "Hủy phần nguyên liệu chưa xuất")
        return {"message": "Đã giải phóng phần nguyên liệu chưa xuất; phần đã xuất được giữ trong lịch sử."}
