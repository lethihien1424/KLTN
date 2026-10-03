import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

import {
  sendResetOtp,
  verifyResetOtp,
  saveNewPassword,
} from "../../services/passwordResetService";

import "../../../public/ForgotPassword.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Step = "email" | "otp" | "password" | "success";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Không thể thực hiện lúc này. Vui lòng thử lại.";
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainder,
  ).padStart(2, "0")}`;
}

export default function ForgotPassword({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return createPortal(
    <PasswordResetFlow onClose={onClose} />,
    document.body,
  );
}

function PasswordResetFlow({
  onClose,
}: {
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const mounted = useRef(true);
  const requestBusy = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mounted.current = true;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      mounted.current = false;
      document.body.style.overflow = previousOverflow;

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    const firstInput =
      cardRef.current?.querySelector<HTMLInputElement>(
        "input:not([readonly])",
      );

    if (firstInput) {
      firstInput.focus();
    } else {
      cardRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (step !== "otp" || deadline === null) return;

    function updateCountdown() {
      setRemaining(
        Math.max(0, Math.ceil((deadline! - Date.now()) / 1000)),
      );
    }

    updateCountdown();

    const timer = window.setInterval(updateCountdown, 250);

    return () => window.clearInterval(timer);
  }, [step, deadline]);

  async function requestOtp(): Promise<void> {
    if (requestBusy.current) return;

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    requestBusy.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await sendResetOtp(normalizedEmail);

      const serverTime = Date.parse(response.server_now);
      const expiryTime = Date.parse(response.expires_at);
      const duration = expiryTime - serverTime;

      if (
        !Number.isFinite(serverTime) ||
        !Number.isFinite(expiryTime) ||
        duration <= 0
      ) {
        throw new Error(
          "Không xác định được thời hạn mã OTP. Vui lòng gửi lại.",
        );
      }

      if (!mounted.current) return;

      // Dùng thời hạn server cấp, tránh lệch đồng hồ máy người dùng.
      setDeadline(Date.now() + duration);
      setRemaining(Math.ceil(duration / 1000));

      setEmail(normalizedEmail);
      setOtp("");
      setResetToken("");
      setPassword("");
      setConfirmation("");
      setNotice("Đã gửi mã OTP. Vui lòng kiểm tra email.");
      setStep("otp");
    } catch (cause) {
      if (mounted.current) {
        setError(errorMessage(cause));
      }
    } finally {
      requestBusy.current = false;

      if (mounted.current) {
        setBusy(false);
      }
    }
  }

  async function submitOtp(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (requestBusy.current) return;

    if (deadline === null || Date.now() >= deadline) {
      setRemaining(0);
      await requestOtp();
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    requestBusy.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await verifyResetOtp(email, otp);

      if (!response.reset_token) {
        throw new Error(
          "Không xác nhận được mã OTP. Vui lòng thử lại.",
        );
      }

      if (!mounted.current) return;

      setResetToken(response.reset_token);
      setPassword("");
      setConfirmation("");
      setStep("password");
    } catch (cause) {
      if (mounted.current) {
        setError(errorMessage(cause));
      }
    } finally {
      requestBusy.current = false;

      if (mounted.current) {
        setBusy(false);
      }
    }
  }

  async function submitPassword(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (requestBusy.current) return;

    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError("Mật khẩu mới không được vượt quá 72 byte.");
      return;
    }

    if (password !== confirmation) {
      setError("Mật khẩu nhập lại chưa khớp.");
      return;
    }

    if (!resetToken) {
      setError("Vui lòng xác nhận OTP trước khi đổi mật khẩu.");
      return;
    }

    requestBusy.current = true;
    setBusy(true);
    setError("");

    try {
      await saveNewPassword(
        email,
        resetToken,
        password,
        confirmation,
      );

      if (!mounted.current) return;

      setPassword("");
      setConfirmation("");
      setResetToken("");
      setStep("success");
    } catch (cause) {
      if (mounted.current) {
        setError(errorMessage(cause));
      }
    } finally {
      requestBusy.current = false;

      if (mounted.current) {
        setBusy(false);
      }
    }
  }

  function returnToEmail() {
    if (requestBusy.current) return;

    setError("");
    setNotice("");
    setOtp("");
    setDeadline(null);
    setRemaining(0);
    setStep("email");
  }

  const expired = remaining <= 0;

  return (
    <div
      className={`fp-root ${
        step === "email" ? "fp-overlay" : "fp-screen"
      }`}
      onKeyDown={event => {
        if (event.key === "Escape" && !requestBusy.current) {
          onClose();
          return;
        }

        if (event.key !== "Tab") return;

        const elements = Array.from(
          cardRef.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), [tabindex="0"]',
          ) ?? [],
        );

        const first = elements[0];
        const last = elements[elements.length - 1];

        if (!first || !last) {
          event.preventDefault();
          cardRef.current?.focus();
          return;
        }

        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === cardRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div
        ref={cardRef}
        className={`fp-card ${
          step === "email" ? "fp-email-card" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fp-title"
        aria-describedby="fp-description"
        aria-busy={busy}
        tabIndex={-1}
      >
        <button
          type="button"
          className="fp-close"
          aria-label="Đóng quên mật khẩu"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>

        <div
          className={`fp-icon ${
            step === "password" || step === "success"
              ? "fp-icon-green"
              : ""
          }`}
          aria-hidden="true"
        >
          {step === "email" ? (
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="4" y="6" width="16" height="12" rx="2" />
              <path d="m5 7 7 5 7-5" />
            </svg>
          ) : step === "success" ? (
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m5 12 4 4L19 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          )}
        </div>

        <h2 id="fp-title">
          {step === "email"
            ? "Quên mật khẩu"
            : step === "otp"
              ? "Xác nhận mã OTP"
              : step === "password"
                ? "Đặt lại mật khẩu"
                : "Đổi mật khẩu thành công"}
        </h2>

        <p id="fp-description" className="fp-description">
          {step === "email"
            ? "Nhập email đã đăng ký, hệ thống sẽ gửi mã OTP để xác nhận."
            : step === "otp"
              ? "Mã gồm 6 chữ số đã được gửi tới email của bạn."
              : step === "password"
                ? "Xác nhận thành công, hãy đặt mật khẩu mới."
                : "Bạn có thể đăng nhập bằng mật khẩu mới."}
        </p>

        {error && (
          <div className="fp-message fp-error" role="alert">
            {error}
          </div>
        )}

        {notice && step === "otp" && (
          <div className="fp-message fp-notice" role="status">
            {notice}
          </div>
        )}

        {step === "email" && (
          <form
            onSubmit={event => {
              event.preventDefault();
              void requestOtp();
            }}
          >
            <label className="fp-field">
              <span>Email <b>*</b></span>
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="ten@gmail.com"
                autoComplete="email"
                maxLength={100}
                required
                disabled={busy}
              />
            </label>

            <button
              className="fp-button fp-primary fp-full"
              type="submit"
              disabled={busy}
            >
              {busy ? "Đang gửi mã..." : "Gửi mã OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={event => void submitOtp(event)}>
            <label className="fp-field">
              <span>Email</span>
              <input type="email" value={email} readOnly />
            </label>

            <label className="fp-field">
              <span>Mã OTP <b>*</b></span>
              <input
                className="fp-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={event =>
                  setOtp(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                maxLength={6}
                placeholder="— — — — — —"
                disabled={busy || expired}
                aria-describedby="fp-countdown"
              />
            </label>

            <p
              id="fp-countdown"
              className={`fp-countdown ${expired ? "fp-expired" : ""}`}
            >
              {expired ? (
                "Mã OTP đã hết hạn"
              ) : (
                <>
                  Mã hết hạn sau{" "}
                  <strong>{formatCountdown(remaining)}</strong>
                </>
              )}
            </p>

            <div className="fp-actions">
              <button
                className="fp-button"
                type="button"
                disabled={busy}
                onClick={returnToEmail}
              >
                Quay lại
              </button>

              <button
                className="fp-button fp-primary"
                type="submit"
                disabled={busy || (!expired && otp.length !== 6)}
              >
                {busy
                  ? expired
                    ? "Đang gửi mã..."
                    : "Đang xác nhận..."
                  : expired
                    ? "Gửi lại mã OTP"
                    : "Tiếp tục"}
              </button>
            </div>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={event => void submitPassword(event)}>
            <label className="fp-field">
              <span>Email</span>
              <input type="email" value={email} readOnly />
            </label>

            <label className="fp-field">
              <span>Mật khẩu mới <b>*</b></span>
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={busy}
              />
            </label>

            <label className="fp-field">
              <span>Nhập lại mật khẩu mới <b>*</b></span>
              <input
                type="password"
                value={confirmation}
                onChange={event =>
                  setConfirmation(event.target.value)
                }
                placeholder="Nhập lại cho khớp"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={busy}
              />
            </label>

            <button
              className="fp-button fp-primary fp-full"
              type="submit"
              disabled={busy}
            >
              {busy ? "Đang cập nhật..." : "Xác nhận"}
            </button>
          </form>
        )}

        {step === "success" && (
          <button
            className="fp-button fp-primary fp-full"
            type="button"
            onClick={onClose}
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}