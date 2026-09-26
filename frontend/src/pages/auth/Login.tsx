import { useState, type FormEvent } from "react";
import { login, type User } from "../../services/authService";

type Props = {
  onLoginSuccess: (user: User) => void;
};

export default function Login({ onLoginSuccess }: Props) {
  const [maNguoiDung, setMaNguoiDung] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [ghiNho, setGhiNho] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
        ghiNho
      );

      onLoginSuccess(user);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Đăng nhập không thành công."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="27" height="27" fill="none">
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
          <label htmlFor="ma-nguoi-dung">Tên đăng nhập</label>
          <input
            id="ma-nguoi-dung"
            type="text"
            autoComplete="username"
            placeholder="Nhập mã người dùng"
            value={maNguoiDung}
            onChange={(event) =>
              setMaNguoiDung(event.target.value)
            }
            disabled={loading}
          />

          <label htmlFor="mat-khau">Mật khẩu</label>
          <input
            id="mat-khau"
            type="password"
            autoComplete="current-password"
            placeholder="Nhập mật khẩu"
            value={matKhau}
            onChange={(event) =>
              setMatKhau(event.target.value)
            }
            disabled={loading}
          />

          <div className="login-options">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={ghiNho}
                onChange={(event) =>
                  setGhiNho(event.target.checked)
                }
              />
              Ghi nhớ
            </label>

            <span className="login-forgot">
              Quên mật khẩu?
            </span>
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
            {!loading && <span aria-hidden="true">→</span>}
          </button>
        </form>

        <p className="login-footer">
          © 2026 Milano Coffee Vietnam. All rights reserved.
        </p>
      </section>
    </main>
  );
}