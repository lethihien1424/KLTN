import { useEffect, useState } from "react";

import Login from "./pages/auth/Login";
import DashboardPageAdmin from "./pages/dashboard/DashboardPageAdmin";
import DashboardPageQL from "./pages/dashboard/DashboardPageQL";
import DashboardPageGSBH from "./pages/dashboard/DashboardPageGSBH";
import DashboardPageNVKHSX from "./pages/dashboard/DashboardPageNVKHSX";
import DashboardPageNVKho from "./pages/dashboard/DashboardPageNVKho";
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
    if (!getToken()) {
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setUser(null);
    }
  }

  if (checking) {
    return (
      <p style={{ padding: 40, textAlign: "center" }}>
        Đang kiểm tra phiên đăng nhập...
      </p>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  const props = {
    user,
    onLogout: handleLogout,
  };

  switch (user.vai_tro) {
    case "ADMIN":
      return <DashboardPageAdmin {...props} />;

    case "QUAN_LY":
      return <DashboardPageQL {...props} />;

    case "GIAM_SAT_BAN_HANG":
      return <DashboardPageGSBH {...props} />;

    case "NHAN_VIEN_KE_HOACH_SAN_XUAT":
      return <DashboardPageNVKHSX {...props} />;

    case "NHAN_VIEN_KHO":
      return <DashboardPageNVKho {...props} />;

    case "NHAN_VIEN_MUA_HANG":
      return <DashboardPageNVMuaHang {...props} />;

    default:
      return (
        <main style={{ padding: 32 }}>
          <h1>Vai trò chưa được hỗ trợ</h1>
          <p>{user.vai_tro}</p>
          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </main>
      );
  }
}