import { useState, type FormEvent } from "react";

import { login, type User } from "../../services/authService";
import ForgotPassword from "./ForgotPassword";

type Props = {
  onLoginSuccess: (user: User) => void;
};

export default function Login({ onLoginSuccess }: Props) {
  const [maNguoiDung, setMaNguoiDung] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ghiNho, setGhiNho] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotPasswordOpen, setForgotPasswordOpen] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!maNguoiDung.trim() || !matKhau) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const user = await login(
        maNguoiDung.trim(),
        matKhau,
        ghiNho,
      );

      onLoginSuccess(user);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Đăng nhập không thành công.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openForgotPassword(): void {
    setError("");
    setForgotPasswordOpen(true);
  }

  function closeForgotPassword(): void {
    setForgotPasswordOpen(false);
    setMatKhau("");
    setError("");
  }

  return (
    <>
      <main className="login-page">
        <section className="login-card">
          <div className="login-logo" aria-hidden="true">
            <svg
              viewBox="0 0 32 32"
              width="27"
              height="27"
              fill="none"
            >
              <path
                d="M10 5c-2 2 2 3 0 5M16 4c-2 2 2 3 0 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <path
                d="M6 13h17v7a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-7Z"
                fill="currentColor"
              />

              <path
                d="M23 15h2a3 3 0 0 1 0 6h-2M4 28h23"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h1>MILANO COFFEE</h1>

          <p className="login-subtitle">
            Dự Báo Nhu Cầu &amp; Đề Xuất Kế Hoạch Nhập Hàng
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="ma-nguoi-dung">
              Tên đăng nhập
            </label>

            <input
              id="ma-nguoi-dung"
              type="text"
              autoComplete="username"
              placeholder="Nhập mã người dùng"
              value={maNguoiDung}
              onChange={event =>
                setMaNguoiDung(event.target.value)
              }
              disabled={loading}
            />

            <label htmlFor="mat-khau">Mật khẩu</label>

            <div className="login-password-field">
              <input
                id="mat-khau"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={matKhau}
                onChange={event => setMatKhau(event.target.value)}
                disabled={loading}
              />
              <button
                className="login-password-toggle"
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-pressed={showPassword}
                aria-controls="mat-khau"
                onClick={() => setShowPassword(visible => !visible)}
                disabled={loading}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.5 4.2 9.5 7-.4 1.1-1.3 2.4-2.5 3.5M6.2 6.2C4.2 7.5 3 9.4 2.5 12c1 2.8 4.5 7 9.5 7 1.2 0 2.3-.2 3.3-.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                    <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </div>
            <div className="login-options">
              <label className="login-remember">
                <input
                  type="checkbox"
                  checked={ghiNho}
                  onChange={event =>
                    setGhiNho(event.target.checked)
                  }
                  disabled={loading}
                />
                Ghi nhớ
              </label>

              <button
                className="login-forgot"
                type="button"
                disabled={loading}
                onClick={openForgotPassword}
                style={{
                  display: "inline",
                  width: "auto",
                  minHeight: 0,
                  margin: 0,
                  padding: 0,
                  border: 0,
                  borderRadius: 0,
                  background: "transparent",
                  boxShadow: "none",
                  color: "#2563eb",
                  font: "inherit",
                  fontSize: 13,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "ĐANG ĐĂNG NHẬP..."
                : "ĐĂNG NHẬP"}

              {!loading && (
                <span aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <p className="login-footer">
            © 2026 Milano Coffee Vietnam. All rights reserved.
          </p>
        </section>
      </main>

      <ForgotPassword
        open={forgotPasswordOpen}
        onClose={closeForgotPassword}
      />
    </>
  );
}