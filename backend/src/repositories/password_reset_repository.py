### D:\KLTN\KLTN\backend\src\repositories\password_reset_repository.py
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from src.models.password_reset_model import (
    PasswordResetRequest,
)
from src.models.user_model import User


class PasswordResetRepository:
    def get_user_by_email(
        self,
        db: Session,
        email: str,
    ) -> User | None:
        normalized_email = email.strip().lower()

        if not normalized_email:
            return None

        statement = (
            select(User)
            .where(
                func.lower(func.trim(User.email))
                == normalized_email
            )
            .limit(2)
        )

        users = list(db.scalars(statement))

        # Email phải thuộc đúng một tài khoản
        # để xác định tài khoản cần đổi mật khẩu.
        if len(users) != 1:
            return None

        return users[0]

    def lock_account(
        self,
        db: Session,
        account_id: str,
    ) -> None:
        """
        Xử lý lần lượt các yêu cầu quên mật khẩu
        trên cùng một tài khoản trong PostgreSQL.

        Khóa được giải phóng khi giao dịch
        commit hoặc rollback.
        """
        db.execute(
            text(
                """
                SELECT pg_advisory_xact_lock(
                    hashtextextended(:account_id, 0)
                )
                """
            ),
            {
                "account_id": account_id,
            },
        )

    def get_by_account_id(
        self,
        db: Session,
        account_id: str,
    ) -> PasswordResetRequest | None:
        statement = select(
            PasswordResetRequest
        ).where(
            PasswordResetRequest.ma_nguoi_dung
            == account_id
        )

        return db.scalar(statement)

    def add(
        self,
        db: Session,
        request: PasswordResetRequest,
    ) -> None:
        db.add(request)

    def delete(
        self,
        db: Session,
        request: PasswordResetRequest,
    ) -> None:
        db.delete(request)