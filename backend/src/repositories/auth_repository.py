from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models.user_model import User


class AuthRepository:
    def get_by_account_id(
        self,
        db: Session,
        account_id: str,
    ) -> User | None:
        if not account_id:
            return None

        statement = select(User).where(
            User.ma_nguoi_dung == account_id
        )

        return db.scalar(statement)