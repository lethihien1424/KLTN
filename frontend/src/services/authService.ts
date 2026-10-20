/// D:\KLTN\KLTN\frontend\src\services\authService.ts
export type User = {
  ma_nguoi_dung: string;
  ho_ten: string;
  vai_tro: string;
  role?: { ma_vai_tro: string; ten_vai_tro: string };
  permissions: string[];
  trang_thai: string;
  email?: string | null;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
};

const API_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:8000")
  .replace(/\/+$/, "").replace(/\/api$/, "")}/api`;

export function getToken(): string | null {
  return localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
}
export function clearAuth(): void {
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("access_token");
}
async function getError(response: Response): Promise<Error> {
  const result: unknown = await response.json().catch(() => null);
  if (result && typeof result === "object" && "detail" in result && typeof result.detail === "string") {
    return new Error(result.detail);
  }
  return new Error(`Yêu cầu thất bại (HTTP ${response.status}).`);
}

export async function login(
  ma_nguoi_dung: string, mat_khau: string, ghi_nho: boolean,
): Promise<User> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ma_nguoi_dung, mat_khau }),
  });
  if (!response.ok) throw await getError(response);
  const result = await response.json() as LoginResponse;
  if (!result.access_token || !result.user) throw new Error("Phản hồi đăng nhập không hợp lệ.");
  clearAuth();
  (ghi_nho ? localStorage : sessionStorage).setItem("access_token", result.access_token);
  // App tải quyền thực tế ngay sau đăng nhập, trước khi mở dashboard.
  return { ...result.user, permissions: [] };
}

export async function getMe(signal?: AbortSignal): Promise<User> {
  const token = getToken();
  if (!token) throw new Error("Chưa đăng nhập.");
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }, signal, cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event("auth-session-expired"));
    throw await getError(response);
  }
  const user = await response.json() as User;
  if (!user || typeof user.ma_nguoi_dung !== "string" || typeof user.vai_tro !== "string" || typeof user.trang_thai !== "string") {
    throw new Error("Thông tin tài khoản không hợp lệ.");
  }
  // /me xác định tài khoản; quyền lấy từ /phan-quyen/cua-toi trong App.
  return { ...user, permissions: [] };
}

export async function logout(): Promise<void> {
  const token = getToken();
  try {
    if (token) {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok && response.status !== 401) throw await getError(response);
    }
  } finally {
    clearAuth();
  }
}
