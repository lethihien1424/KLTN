### D:\KLTN\KLTN\backend\src\services\password_reset_service.py
import hashlib
import hmac
import secrets
import smtplib
import ssl

from datetime import (
    datetime,
    timedelta,
    timezone,
)
from email.message import EmailMessage

from fastapi import HTTPException
from sqlalchemy.orm import Session

from src.core.config import settings
from src.core.security import hash_password
from src.models.password_reset_model import (
    PasswordResetRequest,
)
from src.models.user_model import User
from src.repositories.password_reset_repository import (
    PasswordResetRepository,
)
from src.schemas.password_reset_schema import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    SendOtpResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
)


OTP_LIFETIME = timedelta(seconds=60)
RESET_LIFETIME = timedelta(minutes=10)
RESEND_COOLDOWN = timedelta(seconds=60)
MAX_OTP_ATTEMPTS = 5

GENERIC_RESPONSE = (
    "Nếu email thuộc một tài khoản đang hoạt động, "
    "mã OTP sẽ được gửi đến email đó."
)


class PasswordResetService:
    def __init__(self) -> None:
        self.reset_repository = (
            PasswordResetRepository()
        )

    @staticmethod
    def _now() -> datetime:
        return datetime.now(timezone.utc)

    @staticmethod
    def _digest(
        purpose: str,
        value: str,
    ) -> str:
        """
        Lưu giá trị băm của OTP và reset token.
        Không lưu mã gốc trong database.
        """
        data = f"{purpose}:{value}"

        return hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"),
            data.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    @staticmethod
    def _send_otp(
        recipient: str,
        otp: str,
    ) -> None:
        message = EmailMessage()

        message["Subject"] = (
            "Mã OTP đặt lại mật khẩu Milano Coffee"
        )
        message["From"] = settings.SMTP_FROM_EMAIL
        message["To"] = recipient

        message.set_content(
            f"Mã OTP của bạn là: {otp}\n\n"
            "Mã có hiệu lực trong 1 phút.\n"
            "Không chia sẻ mã này với người khác.\n"
            "Nếu bạn không yêu cầu đặt lại mật khẩu, "
            "hãy bỏ qua email này."
        )

        with smtplib.SMTP_SSL(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=10,
            context=ssl.create_default_context(),
        ) as smtp:
            smtp.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )
            smtp.send_message(message)

    def _get_active_user(
        self,
        db: Session,
        email: str,
    ) -> User | None:
        user = self.reset_repository.get_user_by_email(
            db=db,
            email=email,
        )

        if (
            user is None
            or user.trang_thai != "HOAT_DONG"
        ):
            return None

        return user

    def forgot_password(
        self,
        payload: ForgotPasswordRequest,
        db: Session,
    ) -> SendOtpResponse:
        try:
            user = self._get_active_user(
                db=db,
                email=payload.email,
            )

            # Dùng cùng thông báo để không công khai
            # email nào có tài khoản trong hệ thống.
            if user is None:
                now = self._now()
                db.rollback()

                return SendOtpResponse(
                    message=GENERIC_RESPONSE,
                    server_now=now,
                    expires_at=now + OTP_LIFETIME,
                )

            account_id = user.ma_nguoi_dung

            # Xử lý lần lượt các yêu cầu trên
            # cùng một tài khoản.
            self.reset_repository.lock_account(
                db=db,
                account_id=account_id,
            )

            request = (
                self.reset_repository.get_by_account_id(
                    db=db,
                    account_id=account_id,
                )
            )

            if (
                request is not None
                and self._now() - request.requested_at
                < RESEND_COOLDOWN
            ):
                raise HTTPException(
                    status_code=429,
                    detail=(
                        "Bạn vừa yêu cầu OTP. "
                        "Vui lòng đợi đủ 60 giây "
                        "từ lần gửi trước để gửi lại mã."
                    ),
                )

            otp = (
                f"{secrets.randbelow(1_000_000):06d}"
            )

            self._send_otp(
                recipient=user.email.strip(),
                otp=otp,
            )

            # Tính thời hạn sau khi SMTP báo
            # đã gửi thành công.
            sent_at = self._now()
            expires_at = sent_at + OTP_LIFETIME

            if request is None:
                request = PasswordResetRequest(
                    ma_nguoi_dung=account_id,
                    otp_hash=self._digest("otp", otp),
                    otp_expires_at=expires_at,
                    attempts_left=MAX_OTP_ATTEMPTS,
                    reset_token_hash=None,
                    reset_expires_at=None,
                    requested_at=sent_at,
                )

                self.reset_repository.add(
                    db=db,
                    request=request,
                )
            else:
                # Gửi lại mã: thay OTP cũ và
                # vô hiệu phiên đặt lại mật khẩu cũ.
                request.otp_hash = self._digest(
                    "otp",
                    otp,
                )
                request.otp_expires_at = expires_at
                request.attempts_left = (
                    MAX_OTP_ATTEMPTS
                )
                request.reset_token_hash = None
                request.reset_expires_at = None
                request.requested_at = sent_at

            db.commit()

            return SendOtpResponse(
                message=GENERIC_RESPONSE,
                server_now=self._now(),
                expires_at=expires_at,
            )

        except (
            OSError,
            smtplib.SMTPException,
        ) as exc:
            db.rollback()

            raise HTTPException(
                status_code=503,
                detail=(
                    "Không gửi được email OTP. "
                    "Vui lòng thử lại sau."
                ),
            ) from exc

        except Exception:
            db.rollback()
            raise

    def verify_otp(
        self,
        payload: VerifyOtpRequest,
        db: Session,
    ) -> VerifyOtpResponse:
        try:
            user = self._get_active_user(
                db=db,
                email=payload.email,
            )

            if user is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Email hoặc mã OTP không hợp lệ."
                    ),
                )

            account_id = user.ma_nguoi_dung

            self.reset_repository.lock_account(
                db=db,
                account_id=account_id,
            )

            request = (
                self.reset_repository.get_by_account_id(
                    db=db,
                    account_id=account_id,
                )
            )

            if request is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Chưa có yêu cầu OTP. "
                        "Vui lòng yêu cầu mã mới."
                    ),
                )

            if request.reset_token_hash is not None:
                raise HTTPException(
                    status_code=400,
                    detail="Mã OTP đã được sử dụng.",
                )

            now = self._now()

            if now >= request.otp_expires_at:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Mã OTP đã hết hạn. "
                        "Vui lòng gửi lại mã."
                    ),
                )

            if request.attempts_left <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Bạn đã nhập sai 5 lần. "
                        "Vui lòng yêu cầu mã mới."
                    ),
                )

            submitted_hash = self._digest(
                "otp",
                payload.otp,
            )

            if not hmac.compare_digest(
                submitted_hash,
                request.otp_hash,
            ):
                request.attempts_left -= 1

                # Ghi nhận lần nhập sai trong DB.
                db.commit()

                detail = "Mã OTP không đúng."

                if request.attempts_left <= 0:
                    detail = (
                        "Bạn đã nhập sai 5 lần. "
                        "Vui lòng yêu cầu mã mới."
                    )

                raise HTTPException(
                    status_code=400,
                    detail=detail,
                )

            reset_token = (
                secrets.token_urlsafe(32)
            )

            request.reset_token_hash = self._digest(
                "reset",
                reset_token,
            )
            request.reset_expires_at = (
                now + RESET_LIFETIME
            )

            db.commit()

            return VerifyOtpResponse(
                message="Xác nhận OTP thành công.",
                reset_token=reset_token,
            )

        except Exception:
            db.rollback()
            raise

    def reset_password(
        self,
        payload: ResetPasswordRequest,
        db: Session,
    ) -> MessageResponse:
        if (
            payload.mat_khau_moi
            != payload.nhap_lai_mat_khau
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Mật khẩu mới và mật khẩu "
                    "nhập lại không khớp."
                ),
            )

        if (
            len(payload.mat_khau_moi.encode("utf-8"))
            > 72
        ):
            raise HTTPException(
                status_code=422,
                detail=(
                    "Mật khẩu không được vượt quá "
                    "72 byte."
                ),
            )

        try:
            user = self._get_active_user(
                db=db,
                email=payload.email,
            )

            if user is None:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Yêu cầu đặt lại mật khẩu "
                        "không hợp lệ."
                    ),
                )

            account_id = user.ma_nguoi_dung

            self.reset_repository.lock_account(
                db=db,
                account_id=account_id,
            )

            request = (
                self.reset_repository.get_by_account_id(
                    db=db,
                    account_id=account_id,
                )
            )

            if (
                request is None
                or request.reset_token_hash is None
                or request.reset_expires_at is None
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Vui lòng xác nhận OTP trước "
                        "khi đổi mật khẩu."
                    ),
                )

            if (
                self._now()
                >= request.reset_expires_at
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Phiên đặt lại mật khẩu "
                        "đã hết hạn. Vui lòng "
                        "yêu cầu OTP mới."
                    ),
                )

            submitted_hash = self._digest(
                "reset",
                payload.reset_token,
            )

            if not hmac.compare_digest(
                submitted_hash,
                request.reset_token_hash,
            ):
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Yêu cầu đặt lại mật khẩu "
                        "không hợp lệ."
                    ),
                )

            try:
                new_password_hash = hash_password(
                    payload.mat_khau_moi
                )
            except ValueError as exc:
                raise HTTPException(
                    status_code=422,
                    detail=str(exc),
                ) from exc

            # Cập nhật mật khẩu đã băm trong users.
            user.mat_khau = new_password_hash
            user.thoi_gian_cap_nhat = self._now()

            # Xóa yêu cầu để token không dùng lại được.
            self.reset_repository.delete(
                db=db,
                request=request,
            )

            # Cập nhật mật khẩu và xóa yêu cầu
            # trong cùng một giao dịch.
            db.commit()

            return MessageResponse(
                message=(
                    "Đổi mật khẩu thành công. "
                    "Vui lòng đăng nhập bằng "
                    "mật khẩu mới."
                )
            )

        except Exception:
            db.rollback()
            raise