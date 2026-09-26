from contextlib import contextmanager

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from src.repositories.ton_kho_repository import TonKhoRepository


class TonKhoService:
    def __init__(self):
        self.repository = TonKhoRepository()

    @staticmethod
    def _response(snapshot, material):
        return {
            **{key: getattr(snapshot, key) for key in (
                "ma_nguyen_lieu", "ngay_ghi_nhan", "ton_kho_thuc_te",
                "so_luong_book", "ton_kho_kha_dung", "ton_kho_an_toan",
                "ton_kho_toi_da", "trang_thai",
            )},
            "ten_nguyen_lieu": material.ten_nguyen_lieu,
            "don_vi_do_luong": material.don_vi_do_luong,
        }

    def list(self, db, **filters):
        return [self._response(row, material) for row, material in self.repository.list(db, **filters)]

    def history(self, db, material_code):
        material = self.repository.material(db, material_code)
        if material is None:
            raise HTTPException(404, "Không tìm thấy nguyên liệu.")
        return [self._response(row, joined_material) for row, joined_material in self.repository.history(db, material_code)]

    def detail(self, db, material_code, recorded_date):
        row = self.repository.get(db, material_code, recorded_date)
        if row is None:
            raise HTTPException(404, "Không tìm thấy snapshot tồn kho.")
        return self._response(row, self.repository.material(db, material_code))

    def _active_material(self, db, code):
        material = self.repository.material(db, code, lock=True)
        if material is None:
            raise HTTPException(422, "Nguyên liệu không tồn tại.")
        if material.trang_thai != "DANG_SU_DUNG":
            raise HTTPException(422, "Nguyên liệu đã ngừng sử dụng.")
        return material

    def create_in_transaction(self, db, payload):
        material = self._active_material(db, payload.ma_nguyen_lieu)
        if self.repository.get(db, payload.ma_nguyen_lieu, payload.ngay_ghi_nhan) is not None:
            raise HTTPException(409, "Snapshot tồn kho cho nguyên liệu và ngày này đã tồn tại.")
        row = self.repository.add(db, payload.model_dump())
        return row, material

    def create(self, db, payload):
        with self._write(db):
            row, material = self.create_in_transaction(db, payload)
            result = self._response(row, material)
        return result

    def update(self, db, material_code, recorded_date, payload):
        with self._write(db):
            row = self.repository.get(db, material_code, recorded_date, lock=True)
            if row is None:
                raise HTTPException(404, "Không tìm thấy snapshot tồn kho.")
            material = self._active_material(db, material_code)
            self.repository.update(db, row, payload.model_dump())
            result = self._response(row, material)
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
