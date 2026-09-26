from contextlib import contextmanager
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.repositories.nha_cung_cap_repository import NhaCungCapRepository


class NhaCungCapService:
    QUALITY_WEIGHT = Decimal("0.30")
    ON_TIME_WEIGHT = Decimal("0.25")
    FULL_DELIVERY_WEIGHT = Decimal("0.20")
    LEAD_TIME_WEIGHT = Decimal("0.15")
    AVAILABILITY_WEIGHT = Decimal("0.10")
    HUNDRED = Decimal("100")
    SCORE_QUANTUM = Decimal("0.01")

    def __init__(self):
        self.repository = NhaCungCapRepository()

    def list(self, db, **filters):
        return self.repository.list(db, **filters)

    def detail(self, db, code):
        supplier = self.repository.get(db, code)
        if supplier is None:
            raise HTTPException(404, "Không tìm thấy nhà cung cấp.")
        return supplier

    def create_in_transaction(self, db, payload):
        return self.repository.add(db, {
            **payload.model_dump(), "diem_dieu_kien_thuong_mai": Decimal("0.00")
        })

    def create(self, db, payload):
        with self._write(db):
            supplier = self.create_in_transaction(db, payload)
        return supplier

    def update(self, db, code, payload):
        with self._write(db):
            supplier = self.repository.get(db, code, lock=True)
            if supplier is None:
                raise HTTPException(404, "Không tìm thấy nhà cung cấp.")
            self.repository.update(db, supplier, payload.model_dump())
        return supplier

    def update_status(self, db, code, payload):
        with self._write(db):
            supplier = self.repository.get(db, code, lock=True)
            if supplier is None:
                raise HTTPException(404, "Không tìm thấy nhà cung cấp.")
            self.repository.update(db, supplier, {"trang_thai": payload.trang_thai})
        return supplier

    @classmethod
    def _clamp(cls, value: Decimal) -> Decimal:
        return max(Decimal("0"), min(cls.HUNDRED, value))

    @classmethod
    def percentage_score(cls, ratio) -> Decimal:
        return cls._clamp(Decimal(ratio) * cls.HUNDRED)

    @classmethod
    def availability_score(cls, stock, booked) -> Decimal:
        stock = Decimal(stock)
        if stock == 0:
            return Decimal("0")
        return cls._clamp((stock - Decimal(booked)) / stock * cls.HUNDRED)

    @classmethod
    def lead_time_score(cls, lead_time, min_lead_time, max_lead_time) -> Decimal:
        if min_lead_time is None or max_lead_time is None:
            return Decimal("100")
        if max_lead_time == min_lead_time:
            return Decimal("100")
        result = (
            Decimal(max_lead_time - lead_time)
            / Decimal(max_lead_time - min_lead_time)
            * cls.HUNDRED
        )
        return cls._clamp(result)

    @classmethod
    def mapping_score(
        cls, mapping, min_lead_time, max_lead_time,
        on_time_ratio=None, full_delivery_ratio=None,
    ) -> Decimal:
        quality = cls.percentage_score(mapping.ty_le_chat_luong_dat)
        on_time = cls.percentage_score(
            mapping.ty_le_giao_dung_han if on_time_ratio is None else on_time_ratio
        )
        full_delivery = cls.percentage_score(
            mapping.ty_le_giao_du if full_delivery_ratio is None else full_delivery_ratio
        )
        lead_time = cls.lead_time_score(
            mapping.lead_time_ngay, min_lead_time, max_lead_time
        )
        availability = cls.availability_score(
            mapping.so_luong_ton_kho, mapping.so_luong_book
        )
        return cls._clamp(
            quality * cls.QUALITY_WEIGHT
            + on_time * cls.ON_TIME_WEIGHT
            + full_delivery * cls.FULL_DELIVERY_WEIGHT
            + lead_time * cls.LEAD_TIME_WEIGHT
            + availability * cls.AVAILABILITY_WEIGHT
        )

    def delivery_performance(self, db, supplier_code):
        on_time_count = 0
        order_count = 0
        ordered = Decimal("0")
        received = Decimal("0")
        for order in self.repository.received_orders(db, supplier_code):
            details = self.repository.received_details(db, order.ma_don_mua)
            if not details or any(
                row.so_luong_mua is None or row.so_luong_mua <= 0
                or row.so_luong_thuc_nhan is None or row.so_luong_thuc_nhan < 0
                or row.so_luong_thuc_nhan > row.so_luong_mua
                for row in details
            ):
                continue
            order_count += 1
            on_time_count += order.ngay_giao_thuc_te <= order.ngay_du_kien_giao
            ordered += sum((row.so_luong_mua for row in details), Decimal("0"))
            received += sum((row.so_luong_thuc_nhan for row in details), Decimal("0"))
        if not order_count:
            return None, None, 0
        return (
            Decimal(on_time_count) / Decimal(order_count),
            self._clamp(received / ordered * self.HUNDRED) / self.HUNDRED,
            order_count,
        )

    def calculate_supplier_score_in_transaction(
        self, db, supplier_code, lead_time_range=None
    ):
        supplier = self.repository.get(db, supplier_code, lock=True)
        if supplier is None:
            raise HTTPException(404, "Không tìm thấy nhà cung cấp.")
        on_time_ratio, full_delivery_ratio, order_count = self.delivery_performance(
            db, supplier_code
        )
        mappings = self.repository.mappings(db, supplier_code)
        if not mappings:
            score = Decimal("0.00")
        else:
            minimum, maximum = (
                lead_time_range or self.repository.global_lead_time_range(db)
            )
            total = sum(
                (self.mapping_score(
                    row, minimum, maximum, on_time_ratio, full_delivery_ratio
                ) for row in mappings),
                Decimal("0"),
            )
            score = (total / Decimal(len(mappings))).quantize(
                self.SCORE_QUANTUM, rounding=ROUND_HALF_UP
            )
        on_time_percent = (
            (on_time_ratio * self.HUNDRED).quantize(self.SCORE_QUANTUM, rounding=ROUND_HALF_UP)
            if on_time_ratio is not None else None
        )
        full_percent = (
            (full_delivery_ratio * self.HUNDRED).quantize(self.SCORE_QUANTUM, rounding=ROUND_HALF_UP)
            if full_delivery_ratio is not None else None
        )
        self.repository.update(db, supplier, {
            "diem_dieu_kien_thuong_mai": score,
            "ty_le_giao_dung_han_thuc_te": on_time_percent,
            "ty_le_giao_du_thuc_te": full_percent,
        })
        return {
            "ma_ncc": supplier.ma_ncc,
            "diem_dieu_kien_thuong_mai": score,
            "ty_le_giao_dung_han_thuc_te": on_time_percent,
            "ty_le_giao_du_thuc_te": full_percent,
            "so_don_da_nhan": order_count,
        }

    def calculate_supplier_score(self, db, supplier_code):
        with self._write(db):
            result = self.calculate_supplier_score_in_transaction(db, supplier_code)
        return result

    def recalculate_all_in_transaction(self, db):
        lead_time_range = self.repository.global_lead_time_range(db)
        suppliers = self.repository.list(db)
        return [
            self.calculate_supplier_score_in_transaction(
                db, supplier.ma_ncc, lead_time_range=lead_time_range
            )
            for supplier in suppliers
        ]

    def recalculate_all(self, db):
        with self._write(db):
            results = self.recalculate_all_in_transaction(db)
        return {"so_ncc_da_cap_nhat": len(results), "nha_cung_cap": results}

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(
                422, "Dữ liệu nhà cung cấp vi phạm ràng buộc cơ sở dữ liệu."
            ) from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu nhà cung cấp.") from exc
        except Exception:
            db.rollback()
            raise
