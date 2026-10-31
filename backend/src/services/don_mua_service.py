from contextlib import contextmanager
from decimal import Decimal, ROUND_HALF_UP, localcontext

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy import select
from src.models.purchase_excel_import import PurchaseExcelImport

from src.repositories.don_mua_repository import DonMuaRepository
from src.repositories.ton_kho_repository import TonKhoRepository
from src.services.stock_accounting_service import StockAccountingService


def line_total(quantity, price):
    with localcontext() as context:
        context.prec = 40
        return (quantity * price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class DonMuaService:
    def __init__(self):
        self.repository = DonMuaRepository()
        self.stock_repository = TonKhoRepository()

    @staticmethod
    def _summary(model, supplier_name):
        return {
            **{key: getattr(model, key) for key in (
                "ma_don_mua", "ma_ncc", "ma_de_xuat", "nguoi_tao", "ngay_dat_hang",
                "ngay_du_kien_giao", "ngay_giao_thuc_te", "tong_tien", "trang_thai",
                "nguoi_duyet", "thoi_gian_duyet", "ly_do_tu_choi",
            )},
            "ten_ncc": supplier_name,
        }

    def list(self, db, **filters):
        start, end = filters.get("ngay_dat_tu"), filters.get("ngay_dat_den")
        if start and end and start > end:
            raise HTTPException(422, "Khoảng ngày đặt hàng không hợp lệ.")
        return [self._summary(model, name) for model, name in self.repository.list(db, **filters)]

    def _get(self, db, code, lock=False):
        model = self.repository.get(db, code, lock=lock)
        if model is None:
            raise HTTPException(404, "Không tìm thấy đơn mua nguyên liệu.")
        return model

    def detail(self, db, code):
        return self._detail(db, self._get(db, code))

    def _detail(self, db, model):
        supplier = self.repository.supplier(db, model.ma_ncc)
        metadata = db.scalar(select(PurchaseExcelImport).where(PurchaseExcelImport.ma_don_mua == model.ma_don_mua))
        return {
            **self._summary(model, supplier.ten_ncc),
            "nguon": "EXCEL_TRUC_TIEP" if metadata else "DE_XUAT" if model.ma_de_xuat else "TRUC_TIEP",
            "ma_tham_chieu": metadata.ma_tham_chieu if metadata else None,
            "ghi_chu": metadata.ghi_chu if metadata else None,
            "chi_tiet": [{
                **{key: getattr(row, key) for key in (
                    "ma_chi_tiet_don_mua", "ma_nguyen_lieu", "so_luong_mua",
                    "don_gia_vnd_kg", "so_luong_thuc_nhan", "ly_do_khong_nhan",
                )},
                "ten_nguyen_lieu": material.ten_nguyen_lieu,
                # Purchase quantities/prices are stored in kg in the existing workflow.
                "don_vi_do_luong": "kg" if material.don_vi_do_luong.strip().lower() == "g" else material.don_vi_do_luong,
                "thanh_tien": line_total(row.so_luong_mua, row.don_gia_vnd_kg),
            } for row, material in self.repository.details(db, model.ma_don_mua)],
        }

    def _price_details(self, db, payload):
        supplier = self.repository.supplier(db, payload.ma_ncc, lock=True)
        if supplier is None:
            raise HTTPException(422, "Nhà cung cấp không tồn tại.")
        if supplier.trang_thai != "DANG_HOAT_DONG":
            raise HTTPException(422, "Nhà cung cấp đã ngừng hoạt động.")
        codes = [item.ma_nguyen_lieu for item in payload.chi_tiet]
        if len(self.repository.materials(db, codes)) != len(codes):
            raise HTTPException(422, "Có nguyên liệu không tồn tại.")
        mappings = {row.ma_nguyen_lieu: row for row in self.repository.mappings(db, payload.ma_ncc, codes)}
        items = []
        total = Decimal("0.00")
        for item in payload.chi_tiet:
            mapping = mappings.get(item.ma_nguyen_lieu)
            if mapping is None:
                raise HTTPException(422, f"Nhà cung cấp không cung cấp nguyên liệu {item.ma_nguyen_lieu}.")
            price = mapping.don_gia_nguyen_lieu
            if price is None or not price.is_finite() or price <= 0:
                raise HTTPException(422, "Đơn giá mapping phải lớn hơn 0.")
            total += line_total(item.so_luong_mua, price)
            if total > Decimal("9999999999999999.99"):
                raise HTTPException(422, "Tổng tiền vượt giới hạn numeric(18,2).")
            items.append(dict(ma_nguyen_lieu=item.ma_nguyen_lieu,
                              so_luong_mua=item.so_luong_mua, don_gia_vnd_kg=price))
        return items, total

    def create(self, db, payload, current_user):
        with self._write(db):
            items, total = self._price_details(db, payload)
            model = self.repository.create(db, {
                **payload.model_dump(exclude={"chi_tiet"}),
                "nguoi_tao": current_user.ma_nguoi_dung,
                "tong_tien": total,
                "trang_thai": "CHUA_DUYET",
                "ngay_giao_thuc_te": None,
                "nguoi_duyet": None,
                "thoi_gian_duyet": None,
                "ly_do_tu_choi": None,
            })
            self.repository.replace_details(db, model.ma_don_mua, items)
            response = self._detail(db, model)
        return response

    def _process(self, db, code, current_user, target_status, rejection_reason=None):
        with self._write(db):
            model = self._get(db, code, lock=True)
            if model.trang_thai != "CHUA_DUYET":
                raise HTTPException(409, "Chỉ được xử lý đơn mua đang CHUA_DUYET.")
            self.repository.update_workflow(db, model, {
                "trang_thai": target_status,
                "nguoi_duyet": current_user.ma_nguoi_dung,
                "thoi_gian_duyet": self.repository.current_timestamp(db),
                "ly_do_tu_choi": rejection_reason if target_status == "TU_CHOI" else None,
            })
            response = self._detail(db, model)
        return response

    def approve(self, db, code, current_user):
        return self._process(db, code, current_user, "DA_DUYET")

    def reject(self, db, code, payload, current_user):
        return self._process(db, code, current_user, "TU_CHOI", payload.ly_do_tu_choi)

    def receive(self, db, code, payload):
        with self._write(db):
            from src.services.delivery_service import DeliveryService
            response = DeliveryService().receive(self, db, code, payload)
        return response

    def update(self, db, code, payload):
        with self._write(db):
            model = self._get(db, code, lock=True)
            if model.trang_thai != "CHUA_DUYET":
                raise HTTPException(409, "Chỉ được chỉnh sửa đơn mua CHUA_DUYET.")
            items, total = self._price_details(db, payload)
            for key, value in payload.model_dump(exclude={"chi_tiet"}).items():
                setattr(model, key, value)
            model.tong_tien = total
            self.repository.replace_details(db, code, items)
            response = self._detail(db, model)
        return response

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(422, "Dữ liệu đơn mua vi phạm ràng buộc cơ sở dữ liệu.") from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu đơn mua nguyên liệu.") from exc
        except Exception:
            db.rollback()
            raise
