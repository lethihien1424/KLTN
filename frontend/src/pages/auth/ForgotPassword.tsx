import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  saveNewPassword,
  sendResetOtp,
  verifyResetOtp,
  type SendOtpResponse,
} from "../../services/passwordResetService";

import "./Auth.css";

type Props = {
  onBackToLogin: (message?: string) => void;
};

type Step = "email" | "otp" | "password";

export default function ForgotPassword({ onBackToLogin }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Chặn hai lần nhấn liên tiếp trước khi React cập nhật busy.
  const submitting = useRef(false);

  useEffect(() => {
    if (step !== "otp" || deadline === null) {
      return;
    }

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      setSecondsLeft(remaining);

      if (remaining === 0) {
        setOtp("");
      }
    };

    update();
    const timer = window.setInterval(update, 250);

    return () => window.clearInterval(timer);
  }, [step, deadline]);

  function startCountdown(result: SendOtpResponse) {
    const duration =
      Date.parse(result.expires_at) - Date.parse(result.server_now);

    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Máy chủ trả về thời hạn OTP không hợp lệ.");
    }

    // Tính từ khoảng thời gian server trả về,
    // tránh phụ thuộc việc đồng hồ máy người dùng đúng hay sai.
    const remaining = Math.min(duration, 60_000);

    setDeadline(Date.now() + remaining);
    setSecondsLeft(Math.ceil(remaining / 1000));
  }

  function beginRequest(): boolean {
    if (submitting.current) {
      return false;
    }

    submitting.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    return true;
  }

  function finishRequest() {
    submitting.current = false;
    setBusy(false);
  }

  function getMessage(reason: unknown): string {
    return reason instanceof Error
      ? reason.message
      : "Có lỗi xảy ra. Vui lòng thử lại.";
  }

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!beginRequest()) {
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await sendResetOtp(normalizedEmail);

      startCountdown(result);
      setEmail(normalizedEmail);
      setOtp("");
      setNotice(result.message);
      setStep("otp");
    } catch (reason) {
      setError(getMessage(reason));
    } finally {
      finishRequest();
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (deadline === null || Date.now() >= deadline) {
      setError("Mã OTP đã hết hạn. Vui lòng gửi lại mã.");
      return;
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    if (!beginRequest()) {
      return;
    }

    try {
      const result = await verifyResetOtp(email, otp);

      if (!result.reset_token) {
        throw new Error("Phản hồi xác nhận OTP không hợp lệ.");
      }

      setResetToken(result.reset_token);
      setOtp("");
      setDeadline(null);
      setStep("password");
    } catch (reason) {
      setError(getMessage(reason));
    } finally {
      finishRequest();
    }
  }

  async function handleResend() {
    if (
      deadline !== null &&
      Date.now() < deadline
    ) {
      return;
    }

    if (!beginRequest()) {
      return;
    }

    try {
      const result = await sendResetOtp(email);

      startCountdown(result);
      setOtp("");
      setNotice(result.message);
    } catch (reason) {
      setError(getMessage(reason));
    } finally {
      finishRequest();
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Mật khẩu không được vượt quá 72 byte.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hai lần nhập mật khẩu không khớp.");
      return;
    }

    if (!beginRequest()) {
      return;
    }

    try {
      const result = await saveNewPassword(
        email,
        resetToken,
        password,
        confirmPassword
      );

      setPassword("");
      setConfirmPassword("");
      setResetToken("");
      onBackToLogin(result.message);
    } catch (reason) {
      setError(getMessage(reason));
    } finally {
      finishRequest();
    }
  }

  function changeEmail() {
    setStep("email");
    setOtp("");
    setDeadline(null);
    setError("");
    setNotice("");
  }

  const stepNumber = step === "email" ? 1 : step === "otp" ? 2 : 3;
  const expired = secondsLeft === 0;

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo" aria-hidden="true">M</div>

        <p className="auth-brand">MILANO COFFEE</p>

        <div className="auth-steps" aria-label={`Bước ${stepNumber} trên 3`}>
          {["Email", "Xác nhận OTP", "Mật khẩu mới"].map((label, index) => (
            <div
              key={label}
              className={`auth-step ${
                index + 1 <= stepNumber ? "is-active" : ""
              }`}
              aria-current={index + 1 === stepNumber ? "step" : undefined}
            >
              <span>{index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        <h1>
          {step === "email"
            ? "Quên mật khẩu?"
            : step === "otp"
              ? "Xác nhận email"
              : "Đặt mật khẩu mới"}
        </h1>

        <p className="auth-description">
          {step === "email"
            ? "Nhập email đã đăng ký để nhận mã xác nhận."
            : step === "otp"
              ? "Nhập mã gồm 6 chữ số được gửi đến email của bạn."
              : "Tạo mật khẩu mới để tiếp tục sử dụng tài khoản."}
        </p>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="auth-alert auth-alert-info" role="status">
            {notice}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSend}>
            <label htmlFor="reset-email">Email đã đăng ký</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="vidu@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={100}
              disabled={busy}
              required
              autoFocus
            />

            <button className="auth-primary" disabled={busy}>
              {busy ? "Đang gửi mã..." : "Gửi mã OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify}>
            <label htmlFor="otp-email">Email</label>
            <input id="otp-email" type="email" value={email} readOnly />

            <label htmlFor="reset-otp">Mã OTP</label>
            <input
              id="reset-otp"
              className="auth-otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              maxLength={6}
              disabled={busy || expired}
              required
              autoFocus
            />

            <p className={`auth-countdown ${expired ? "is-expired" : ""}`}>
              {expired
                ? "Mã OTP đã hết hạn. Vui lòng gửi lại mã."
                : `Mã còn hiệu lực: 00:${String(secondsLeft).padStart(2, "0")}`}
            </p>

            <button
              className="auth-primary"
              disabled={busy || expired || otp.length !== 6}
            >
              {busy ? "Đang xử lý..." : "Xác nhận"}
            </button>

            <button
              className="auth-secondary"
              type="button"
              onClick={handleResend}
              disabled={busy || !expired}
            >
              Gửi lại mã OTP
              {!expired ? ` (${secondsLeft}s)` : ""}
            </button>

            <button
              className="auth-text-button"
              type="button"
              onClick={changeEmail}
              disabled={busy}
            >
              Sử dụng email khác
            </button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handleSave}>
            <label htmlFor="password-email">Email</label>
            <input id="password-email" type="email" value={email} readOnly />

            <label htmlFor="new-password">Mật khẩu mới</label>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              minLength={8}
              maxLength={72}
              required
              autoFocus
            />

            <label htmlFor="confirm-password">Nhập lại mật khẩu mới</label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={busy}
              minLength={8}
              maxLength={72}
              required
            />

            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
              />
              Hiển thị mật khẩu
            </label>

            <button className="auth-primary" disabled={busy}>
              {busy ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
          </form>
        )}

        <button
          className="auth-back"
          type="button"
          onClick={() => onBackToLogin()}
          disabled={busy}
        >
          ← Quay lại đăng nhập
        </button>

        <p className="auth-footer">Hệ thống quản lý Milano Coffee</p>
      </section>
    </main>
  );
}