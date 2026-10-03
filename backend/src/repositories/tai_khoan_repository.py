### D:\KLTN\KLTN\backend\src\repositories\tai_khoan_repository.py
import re
from typing import Sequence

from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session

from src.models.user_model import User


ROLE_PREFIXES = {
    "ADMIN": "ADMIN",
    "QUAN_LY_BAN_HANG": "QLBH",
    "QUAN_LY_MUA_HANG": "QLMH",
    "NHAN_VIEN_BAN_HANG": "NVBH",
    "NHAN_VIEN_MUA_HANG": "MH",
}


class TaiKhoanRepository:
    def get_all(
        self,
        db: Session,
        search: str | None = None,
        vai_tro: str | None = None,
        trang_thai: str | None = None,
    ) -> Sequence[User]:
        query = select(User)

        if search and search.strip():
            pattern = f"%{search.strip()}%"

            query = query.where(
                or_(
                    User.ma_nguoi_dung.ilike(pattern),
                    User.ho_ten.ilike(pattern),
                    User.email.ilike(pattern),
                    User.so_dien_thoai.ilike(pattern),
                )
            )

        if vai_tro:
            query = query.where(User.vai_tro == vai_tro)

        if trang_thai:
            query = query.where(User.trang_thai == trang_thai)

        query = query.order_by(
            User.thoi_gian_tao.desc(),
            User.ma_nguoi_dung,
        )

        return db.scalars(query).all()

    def get_by_id(
        self,
        db: Session,
        ma_nguoi_dung: str,
    ) -> User | None:
        return db.scalar(
            select(User).where(
                User.ma_nguoi_dung == ma_nguoi_dung
            )
        )

    def generate_account_id(
        self,
        db: Session,
        vai_tro: str,
    ) -> str:
        prefix = ROLE_PREFIXES[vai_tro]

        # Khóa được giữ đến khi commit/rollback.
        # Tránh hai yêu cầu tạo tài khoản lấy cùng một số.
        db.execute(
            text(
                "LOCK TABLE public.users "
                "IN SHARE ROW EXCLUSIVE MODE"
            )
        )

        account_ids = db.scalars(
            select(User.ma_nguoi_dung).where(
                User.ma_nguoi_dung.like(f"{prefix}%")
            )
        ).all()

        pattern = re.compile(
            rf"{re.escape(prefix)}([0-9]+)"
        )

        largest_number = 0

        for account_id in account_ids:
            match = pattern.fullmatch(account_id)

            if match:
                largest_number = max(
                    largest_number,
                    int(match.group(1)),
                )

        account_id = f"{prefix}{largest_number + 1:02d}"

        if len(account_id) > 20:
            raise ValueError(
                "Mã tài khoản vượt quá 20 ký tự."
            )

        return account_id

    def create(
        self,
        db: Session,
        user: User,
    ) -> User:
        db.add(user)
        db.flush()
        return user

    def update(
        self,
        db: Session,
        user: User,
    ) -> User:
        db.add(user)
        db.flush()
        return user

    def delete(
        self,
        db: Session,
        user: User,
    ) -> None:
        db.delete(user)
        db.flush()