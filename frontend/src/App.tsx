//D:\KLTN\KLTN\frontend\src\App.tsx
// import { useEffect, useRef, useState } from "react";
// import Login from "./pages/auth/Login";
// import {
//   clearAuth,
//   getMe,
//   getToken,
//   logout,
//   type User,
// } from "./services/authService";
// import { AuthContext } from "./auth/AuthContext";
// import MainLayout from "./components/layout/MainLayout";
// import { ErrorState, LoadingState } from "./components/common/PurchaseUI";
// export default function App() {
//   const [user, setUser] = useState<User | null>(null);
//   const [checking, setChecking] = useState(Boolean(getToken()));
//   const [error, setError] = useState("");
//   const requestVersion = useRef(0);
//   const endSession = () => {
//     clearAuth();
//     setUser(null);
//     setError("");
//     setChecking(false);
//   };
//   async function refreshPermissions() {
//     const token = getToken();
//     if (!token) return;
//     const version = ++requestVersion.current;
//     try {
//       const current = await getMe();
//       if (getToken() !== token || requestVersion.current !== version) return;
//       if (current.trang_thai !== "HOAT_DONG") {
//         endSession();
//         return;
//       }
//       setUser(current);
//       setError("");
//     } catch (cause) {
//       if (getToken() === token && requestVersion.current === version)
//         setError(
//           cause instanceof Error
//             ? cause.message
//             : "Không thể kiểm tra phiên đăng nhập.",
//         );
//     } finally {
//       setChecking(false);
//     }
//   }
//   useEffect(() => {
//     void refreshPermissions();
//     const refresh = () => {
//       if (document.visibilityState === "visible") void refreshPermissions();
//     };
//     window.addEventListener("focus", refresh);
//     window.addEventListener("auth-permissions-refresh", refresh);
//     window.addEventListener("auth-session-expired", endSession);
//     const timer = window.setInterval(refresh, 60000);
//     return () => {
//       clearInterval(timer);
//       window.removeEventListener("focus", refresh);
//       window.removeEventListener("auth-permissions-refresh", refresh);
//       window.removeEventListener("auth-session-expired", endSession);
//     };
//   }, []);
//   if (checking) return <main style={{ padding: 40, textAlign: 'center' }}><p role="status">Đang kiểm tra phiên đăng nhập...</p></main>;
//   if (!user && error && getToken())
//     return (
//       <main className="pm-session">
//         <ErrorState message={error} retry={() => void refreshPermissions()} />
//         <button className="pm-btn" onClick={endSession}>
//           Đăng nhập lại
//         </button>
//       </main>
//     );
//   if (!user) return <Login onLoginSuccess={setUser} />;
//   return (
//     <AuthContext.Provider value={{ user, refreshPermissions }}>
//       <MainLayout
//         onLogout={() => {
//           void logout().finally(endSession);
//         }}
//       />
//     </AuthContext.Provider>
//   );
// }


//D:\KLTN\KLTN\frontend\src\App.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import Login from "./pages/auth/Login";
import { clearAuth, getMe, getToken, logout, type User } from "./services/authService";
import { getMyPermissions } from "./services/phanQuyenService";
import { permissionDetailsToKeys } from "./auth/permissions";
import { AuthContext } from "./auth/AuthContext";
import MainLayout from "./components/layout/MainLayout";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [error, setError] = useState("");
  const version = useRef(0);
  const pending = useRef<{ token: string; promise: Promise<void> } | null>(null);

  const endSession = useCallback(() => {
    version.current += 1;
    pending.current = null;
    clearAuth();
    setUser(null);
    setError("");
    setChecking(false);
  }, []);

  const refreshPermissions = useCallback(async (): Promise<void> => {
    const token = getToken();
    if (!token) { endSession(); return; }
    if (pending.current?.token === token) return pending.current.promise;
    const requestVersion = ++version.current;
    const promise = (async () => {
      try {
        const current = await getMe();
        if (getToken() !== token || requestVersion !== version.current) return;
        if (current.trang_thai !== "HOAT_DONG") { endSession(); return; }
        const result = await getMyPermissions();
        if (getToken() !== token || requestVersion !== version.current) return;
        if (result.ma_nguoi_dung !== current.ma_nguoi_dung || result.vai_tro !== current.vai_tro ||
            !Array.isArray(result.chi_tiet) || !result.chi_tiet.every(item => item != null &&
              typeof item.chuc_nang === "string" && typeof item.thao_tac === "string")) {
          throw new Error("Thông tin quyền truy cập không hợp lệ.");
        }
        setUser({ ...current, permissions: permissionDetailsToKeys(result.chi_tiet) });
        setError("");
      } catch (cause) {
        if (getToken() !== token || requestVersion !== version.current) return;
        setError(cause instanceof Error ? cause.message : "Không tải được quyền truy cập.");
        // Không giữ quyền cũ khi không kiểm tra được quyền hiện tại.
        setUser(previous => previous ? { ...previous, permissions: [] } : null);
      } finally {
        if (requestVersion === version.current) setChecking(false);
      }
    })();
    pending.current = { token, promise };
    try { await promise; }
    finally { if (pending.current?.promise === promise) pending.current = null; }
  }, [endSession]);

  useEffect(() => {
    void refreshPermissions();
    const refresh = () => {
      if (document.visibilityState === "visible" && getToken()) void refreshPermissions();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("auth-permissions-refresh", refresh);
    window.addEventListener("milano:permissions-changed", refresh);
    window.addEventListener("auth-session-expired", endSession);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("auth-permissions-refresh", refresh);
      window.removeEventListener("milano:permissions-changed", refresh);
      window.removeEventListener("auth-session-expired", endSession);
    };
  }, [refreshPermissions, endSession]);

  if (checking) return <main style={{ padding: 40 }} role="status">Đang kiểm tra phiên đăng nhập...</main>;
  if (!user && error && getToken()) return (
    <main className="pm-session">
      <p role="alert">{error}</p>
      <button type="button" onClick={() => void refreshPermissions()}>Thử lại</button>
      <button type="button" onClick={endSession}>Đăng nhập lại</button>
    </main>
  );
  if (!user) return <Login onLoginSuccess={() => {
    setChecking(true);
    void refreshPermissions();
  }} />;
  return (
    <AuthContext.Provider value={{ user, refreshPermissions }}>
      {error && <div className="dashboard-session-error" role="alert">
        {error} <button type="button" onClick={() => void refreshPermissions()}>Thử lại</button>
      </div>}
      <MainLayout onLogout={async () => { try { await logout(); } finally { endSession(); } }} />
    </AuthContext.Provider>
  );
}
