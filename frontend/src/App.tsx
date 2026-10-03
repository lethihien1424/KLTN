/// D:\KLTN\KLTN\frontend\src\App.tsx
import { useEffect, useState } from "react";

import Login from "./pages/auth/Login";

import DashboardPageAdmin from "./pages/dashboard/DashboardPageAdmin";
import DashboardPageQL from "./pages/dashboard/DashboardPageQL";
import DashboardPageGSBH from "./pages/dashboard/DashboardPageGSBH";
import DashboardPageQLMH from "./pages/dashboard/DashboardPageQLMH";
import DashboardPageNVMuaHang from "./pages/dashboard/DashboardPageNVMuaHang";

import {
  clearAuth,
  getMe,
  getToken,
  logout,
  type User,
} from "./services/authService";


export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const [checking, setChecking] = useState(
    Boolean(getToken())
  );

  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setChecking(false);
      return;
    }

    async function checkSession(): Promise<void> {
      try {
        const currentUser = await getMe();

        if (cancelled) {
          return;
        }

        if (currentUser.trang_thai !== "HOAT_DONG") {
          clearAuth();
          setUser(null);
          return;
        }

        setUser(currentUser);
      } catch {
        if (!cancelled) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleLoginSuccess(currentUser: User): void {
    if (currentUser.trang_thai !== "HOAT_DONG") {
      clearAuth();
      setUser(null);
      return;
    }

    setUser(currentUser);
  }

  async function handleLogout(): Promise<void> {
    try {
      await logout();
    } catch {
      // Vẫn kết thúc phiên trên trình duyệt nếu API gặp lỗi.
    } finally {
      clearAuth();
      setUser(null);
    }
  }

  if (checking) {
    return (
      <main
        style={{
          padding: 40,
          textAlign: "center",
        }}
      >
        <p role="status">
          Đang kiểm tra phiên đăng nhập...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <Login onLoginSuccess={handleLoginSuccess} />
    );
  }

  const dashboardProps = {
    user,
    onLogout: handleLogout,
  };

  switch (user.vai_tro) {
    case "ADMIN":
      return (
        <DashboardPageAdmin {...dashboardProps} />
      );

    case "QUAN_LY_BAN_HANG":
      return (
        <DashboardPageQL {...dashboardProps} />
      );

    case "QUAN_LY_MUA_HANG":
      return (
        <DashboardPageQLMH {...dashboardProps} />
      );

    case "NHAN_VIEN_BAN_HANG":
      return (
        <DashboardPageGSBH {...dashboardProps} />
      );

    case "NHAN_VIEN_MUA_HANG":
      return (
        <DashboardPageNVMuaHang {...dashboardProps} />
      );

    default:
      return (
        <main style={{ padding: 32 }}>
          <h1>Vai trò chưa được hỗ trợ</h1>

          <p>
            Vai trò của tài khoản: {user.vai_tro}
          </p>

          <p>
            Vui lòng liên hệ quản trị viên để kiểm tra
            vai trò tài khoản.
          </p>

          <button
            type="button"
            onClick={() => void handleLogout()}
          >
            Đăng xuất
          </button>
        </main>
      );
  }
}