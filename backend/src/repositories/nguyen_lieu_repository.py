from sqlalchemy import or_, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from src.models.nguyen_lieu_model import NguyenLieu


class NguyenLieuRepository:
    @staticmethod
    def list(db: Session, search: str | None, trang_thai: str | None):
        query = select(NguyenLieu)
        if search and search.strip():
            # Treat %, _ and / as literal search text, not LIKE wildcards.
            term = search.strip().replace("/", "//").replace("%", "/%").replace("_", "/_")
            query = query.where(or_(
                NguyenLieu.ma_nguyen_lieu.ilike(f"%{term}%", escape="/"),
                NguyenLieu.ten_nguyen_lieu.ilike(f"%{term}%", escape="/"),
            ))
        if trang_thai is not None:
            query = query.where(NguyenLieu.trang_thai == trang_thai)
        return db.scalars(query.order_by(NguyenLieu.ma_nguyen_lieu)).all()

    @staticmethod
    def get(db: Session, code: str):
        return db.get(NguyenLieu, code)

    @staticmethod
    def add(db: Session, values: dict):
        model = NguyenLieu(**values)
        db.add(model)
        return model

    @staticmethod
    def add_imported(db: Session, values: dict):
        # Manual codes do not advance the existing PostgreSQL sequence.
        # Skip occupied generated keys, but let UNIQUE(name)/CHECK errors fail
        # the entire import transaction as before. Never overwrite an existing row.
        statement = (
            insert(NguyenLieu).values(**values)
            .on_conflict_do_nothing(index_elements=[NguyenLieu.ma_nguyen_lieu])
            .returning(NguyenLieu.ma_nguyen_lieu)
        )
        for _ in range(10000):
            code = db.scalar(statement)
            if code is not None:
                return code
        raise ValueError("Không thể sinh mã nguyên liệu trống từ sequence hiện tại.")

    @staticmethod
    def commit(db: Session):
        db.commit()

    @staticmethod
    def rollback(db: Session):
        db.rollback()
