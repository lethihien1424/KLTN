### D:\KLTN\KLTN\backend\src\repositories\tai_khoan_repository.py
from typing import Sequence
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from src.models.user_model import User


class TaiKhoanRepository:
    def get_all(
        self,
        db: Session,
        search: str | None = None,
        vai_tro: str | None = None,
        trang_thai: str | None = None,
    ) -> Sequence[User]:
        query = select(User)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    User.ma_nguoi_dung.ilike(search_pattern),
                    User.ho_ten.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.so_dien_thoai.ilike(search_pattern),
                )
            )

        if vai_tro:
            query = query.where(User.vai_tro == vai_tro)

        if trang_thai:
            query = query.where(User.trang_thai == trang_thai)

        query = query.order_by(User.thoi_gian_tao.desc())
        return db.scalars(query).all()

    def get_by_id(self, db: Session, ma_nguoi_dung: str) -> User | None:
        return db.scalar(
            select(User).where(User.ma_nguoi_dung == ma_nguoi_dung)
        )

    def create(self, db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(self, db: Session, user: User) -> User:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def delete(self, db: Session, user: User) -> None:
        db.delete(user)
        db.commit()
