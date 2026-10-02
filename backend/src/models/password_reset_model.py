from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from src.core.database import Base


class PasswordResetRequest(Base):
    __tablename__ = "password_reset_requests"

    ma_nguoi_dung: Mapped[str] = mapped_column(
        String(20),
        ForeignKey(
            "users.ma_nguoi_dung",
            ondelete="CASCADE",
        ),
        primary_key=True,
    )

    otp_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    otp_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    attempts_left: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    reset_token_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    reset_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )