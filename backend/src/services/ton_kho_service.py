### D:\KLTN\KLTN\backend\src\services\ton_kho_service.py
from contextlib import contextmanager
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.repositories.ton_kho_repository import TonKhoRepository
from src.repositories.nhu_cau_nguyen_lieu_repository import NhuCauNguyenLieuRepository
from src.services.stock_accounting_service import StockAccountingService


class TonKhoService:
    def __init__(self):
        self.repository = TonKhoRepository()

    @staticmethod
    def _response(snapshot, material, incoming=Decimal("0")):
        return {
            **{key: getattr(snapshot, key) for key in (
                "ma_nguyen_lieu", "ngay_ghi_nhan", "ton_kho_thuc_te",
                "so_luong_book", "ton_kho_kha_dung", "ton_kho_an_toan",
                "ton_kho_toi_da", "trang_thai",
            )},
            "ten_nguyen_lieu": material.ten_nguyen_lieu,
            "don_vi_do_luong": material.don_vi_do_luong,
            "hang_dang_ve": incoming,
        }

    def _responses(self, db, rows):
        if not rows:
            return []
        incoming = NhuCauNguyenLieuRepository.incoming_quantities(
            db, list({row.ma_nguyen_lieu for row, _ in rows}), ("DA_DUYET",),
        )
        # Purchase quantities use kg for materials whose stock unit is g.
        return [self._response(
            row, material,
            incoming.get(row.ma_nguyen_lieu, Decimal("0")) * (
                Decimal("1000") if material.don_vi_do_luong.strip().lower() == "g" else Decimal("1")
            ),
        ) for row, material in rows]

    def list(self, db, **filters):
        return self._responses(db, self.repository.list(db, **filters))

    def history(self, db, material_code):
        material = self.repository.material(db, material_code)
        if material is None:
            raise HTTPException(404, "Không tìm thấy nguyên liệu.")
        return self._responses(db, self.repository.history(db, material_code))

    def detail(self, db, material_code, recorded_date):
        row = self.repository.get(db, material_code, recorded_date)
        if row is None:
            raise HTTPException(404, "Không tìm thấy snapshot tồn kho.")
        return self._responses(db, [(row, self.repository.material(db, material_code))])[0]

    def _active_material(self, db, code):
        material = self.repository.material(db, code, lock=True)
        if material is None:
            raise HTTPException(422, "Nguyên liệu không tồn tại.")
        if material.trang_thai != "DANG_SU_DUNG":
            raise HTTPException(422, "Nguyên liệu đã ngừng sử dụng.")
        return material

    def create_in_transaction(self, db, payload):
        return StockAccountingService().count(db, payload, payload.ma_nguyen_lieu, payload.ngay_ghi_nhan, creating=True)

    def create(self, db, payload):
        with self._write(db):
            row, material = self.create_in_transaction(db, payload)
            result = self._responses(db, [(row, material)])[0]
        return result

    def update(self, db, material_code, recorded_date, payload):
        with self._write(db):
            latest, _ = StockAccountingService().lock(db, material_code)
            row = self.repository.get(db, material_code, recorded_date)
            if row is None:
                raise HTTPException(404, "Không tìm thấy snapshot tồn kho.")
            if latest.ngay_ghi_nhan != recorded_date:
                raise HTTPException(409, "Không chỉnh sửa snapshot cũ.")
            row, material = StockAccountingService().count(db, payload, material_code, recorded_date)
            result = self._responses(db, [(row, material)])[0]
        return result

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            if getattr(exc.orig, "pgcode", None) == "23505":
                raise HTTPException(409, "Snapshot tồn kho cho nguyên liệu và ngày này đã tồn tại.") from exc
            raise HTTPException(422, "Dữ liệu tồn kho vi phạm ràng buộc cơ sở dữ liệu.") from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu snapshot tồn kho.") from exc
        except Exception:
            db.rollback()
            raise
