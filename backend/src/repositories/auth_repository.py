from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.tai_khoan import TaiKhoan


class AuthRepository:
    def get_by_account_id(
        self,
        db: Session,
        account_id: str,
    ) -> TaiKhoan | None:
        if not account_id:
            return None

        statement = select(TaiKhoan).where(
            TaiKhoan.ma_tai_khoan == account_id
        )

        return db.scalar(statement)