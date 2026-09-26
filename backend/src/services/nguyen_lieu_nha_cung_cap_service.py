from contextlib import contextmanager

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.repositories.nguyen_lieu_nha_cung_cap_repository import NguyenLieuNhaCungCapRepository
from src.services.nha_cung_cap_service import NhaCungCapService


class NguyenLieuNhaCungCapService:
    def __init__(self):
        self.repository = NguyenLieuNhaCungCapRepository()
        self.supplier_service = NhaCungCapService()

    @staticmethod
    def _response(row):
        mapping, supplier, material = row
        return {
            **{key: getattr(mapping, key) for key in (
                "ma_nguyen_lieu_ncc", "ma_ncc", "ma_nguyen_lieu",
                "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book",
                "so_luong_xuat", "lead_time_ngay", "ty_le_chat_luong_dat",
                "ty_le_giao_dung_han", "ty_le_giao_du",
            )},
            "ten_ncc": supplier.ten_ncc,
            "ten_nguyen_lieu": material.ten_nguyen_lieu,
            "don_vi_do_luong": material.don_vi_do_luong,
        }

    def list(self, db, **filters):
        return [self._response(row) for row in self.repository.list(db, **filters)]

    def detail(self, db, code):
        row = self.repository.detail(db, code)
        if row is None:
            raise HTTPException(404, "Không tìm thấy mapping nguyên liệu - nhà cung cấp.")
        return self._response(row)

    def create(self, db, payload):
        with self._write(db):
            if self.repository.supplier(db, payload.ma_ncc) is None:
                raise HTTPException(422, "Nhà cung cấp không tồn tại.")
            if self.repository.material(db, payload.ma_nguyen_lieu) is None:
                raise HTTPException(422, "Nguyên liệu không tồn tại.")
            if self.repository.find_pair(
                db, payload.ma_ncc, payload.ma_nguyen_lieu, lock=True
            ) is not None:
                raise HTTPException(409, "Nhà cung cấp đã có mapping với nguyên liệu này.")
            model = self.repository.add(db, payload.model_dump())
            self.supplier_service.recalculate_all_in_transaction(db)
            result = self.repository.detail(db, model.ma_nguyen_lieu_ncc)
            response = self._response(result)
        return response

    def update(self, db, code, payload):
        with self._write(db):
            model = self.repository.get(db, code, lock=True)
            if model is None:
                raise HTTPException(404, "Không tìm thấy mapping nguyên liệu - nhà cung cấp.")
            self.repository.update(db, model, payload.model_dump())
            self.supplier_service.recalculate_all_in_transaction(db)
            result = self.repository.detail(db, code)
            response = self._response(result)
        return response

    @staticmethod
    @contextmanager
    def _write(db):
        try:
            yield
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise HTTPException(422, "Dữ liệu mapping vi phạm ràng buộc cơ sở dữ liệu.") from exc
        except SQLAlchemyError as exc:
            db.rollback()
            raise HTTPException(500, "Không thể lưu mapping nguyên liệu - nhà cung cấp.") from exc
        except Exception:
            db.rollback()
            raise
