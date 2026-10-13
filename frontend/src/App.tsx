import { useEffect, useRef, useState } from "react";
import Login from "./pages/auth/Login";
import {
  clearAuth,
  getMe,
  getToken,
  logout,
  type User,
} from "./services/authService";
import { AuthContext } from "./auth/AuthContext";
import MainLayout from "./components/layout/MainLayout";
import { ErrorState, LoadingState } from "./components/common/PurchaseUI";
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [error, setError] = useState("");
  const requestVersion = useRef(0);
  const endSession = () => {
    clearAuth();
    setUser(null);
    setError("");
    setChecking(false);
  };
  async function refreshPermissions() {
    const token = getToken();
    if (!token) return;
    const version = ++requestVersion.current;
    try {
      const current = await getMe();
      if (getToken() !== token || requestVersion.current !== version) return;
      if (current.trang_thai !== "HOAT_DONG") {
        endSession();
        return;
      }
      setUser(current);
      setError("");
    } catch (cause) {
      if (getToken() === token && requestVersion.current === version)
        setError(
          cause instanceof Error
            ? cause.message
            : "Không thể kiểm tra phiên đăng nhập.",
        );
    } finally {
      setChecking(false);
    }
  }
  useEffect(() => {
    void refreshPermissions();
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshPermissions();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("auth-permissions-refresh", refresh);
    window.addEventListener("auth-session-expired", endSession);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("auth-permissions-refresh", refresh);
      window.removeEventListener("auth-session-expired", endSession);
    };
  }, []);
  if (checking) return <main style={{ padding: 40, textAlign: 'center' }}><p role="status">Đang kiểm tra phiên đăng nhập...</p></main>;
  if (!user && error && getToken())
    return (
      <main className="pm-session">
        <ErrorState message={error} retry={() => void refreshPermissions()} />
        <button className="pm-btn" onClick={endSession}>
          Đăng nhập lại
        </button>
      </main>
    );
  if (!user) return <Login onLoginSuccess={setUser} />;
  return (
    <AuthContext.Provider value={{ user, refreshPermissions }}>
      <MainLayout
        onLogout={() => {
          void logout().finally(endSession);
        }}
      />
    </AuthContext.Provider>
  );
}
