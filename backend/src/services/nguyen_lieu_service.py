from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from src.repositories.nguyen_lieu_repository import NguyenLieuRepository
from src.schemas.nguyen_lieu_schema import (
    NguyenLieuCreate, NguyenLieuStatusUpdate, NguyenLieuUpdate,
)


class NguyenLieuService:
    def __init__(self):
        self.repository = NguyenLieuRepository()

    def list(self, db: Session, search=None, trang_thai=None):
        return self.repository.list(db, search, trang_thai)

    def get(self, db: Session, code: str):
        model = self.repository.get(db, code)
        if model is None:
            raise HTTPException(404, "Không tìm thấy nguyên liệu.")
        return model

    def create(self, db: Session, payload: NguyenLieuCreate):
        if self.repository.get(db, payload.ma_nguyen_lieu) is not None:
            raise HTTPException(409, "Mã nguyên liệu đã tồn tại.")
        model = self.repository.add(db, payload.model_dump())
        self._commit(db)
        return model

    def update(self, db: Session, code: str, payload: NguyenLieuUpdate):
        model = self.get(db, code)
        model.ten_nguyen_lieu = payload.ten_nguyen_lieu
        model.don_vi_do_luong = payload.don_vi_do_luong
        self._commit(db)
        return model

    def update_status(self, db: Session, code: str, payload: NguyenLieuStatusUpdate):
        model = self.get(db, code)
        model.trang_thai = payload.trang_thai
        self._commit(db)
        return model

    def _commit(self, db: Session):
        try:
            self.repository.commit(db)
        except IntegrityError as exc:
            self.repository.rollback(db)
            if getattr(exc.orig, "pgcode", None) == "23505":
                raise HTTPException(409, "Mã hoặc tên nguyên liệu đã tồn tại.") from exc
            raise HTTPException(422, "Dữ liệu vi phạm ràng buộc nguyên liệu.") from exc
        except SQLAlchemyError as exc:
            self.repository.rollback(db)
            raise HTTPException(500, "Không thể lưu nguyên liệu.") from exc
