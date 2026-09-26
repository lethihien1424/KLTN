export type User = {
  ma_nguoi_dung: string;
  ho_ten: string;
  vai_tro: string;
  trang_thai: string;
};

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

export function getToken(): string | null {
  return (
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token")
  );
}

export function clearAuth(): void {
  localStorage.removeItem("access_token");
  sessionStorage.removeItem("access_token");
}

async function getError(response: Response): Promise<Error> {
  const result: unknown = await response.json().catch(() => null);

  if (
    result !== null &&
    typeof result === "object" &&
    "detail" in result &&
    typeof result.detail === "string"
  ) {
    return new Error(result.detail);
  }

  return new Error(`Yêu cầu thất bại (HTTP ${response.status}).`);
}

export async function login(
  ma_nguoi_dung: string,
  mat_khau: string,
  ghi_nho: boolean
): Promise<User> {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ma_nguoi_dung,
      mat_khau,
    }),
  });

  if (!response.ok) {
    throw await getError(response);
  }

  const result = (await response.json()) as LoginResponse;

  if (!result.access_token || !result.user) {
    throw new Error("Phản hồi đăng nhập không hợp lệ.");
  }

  clearAuth();

  const storage = ghi_nho ? localStorage : sessionStorage;
  storage.setItem("access_token", result.access_token);

  return result.user;
}

export async function getMe(): Promise<User> {
  const token = getToken();

  if (!token) {
    throw new Error("Chưa đăng nhập.");
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await getError(response);
  }

  return (await response.json()) as User;
}

export async function logout(): Promise<void> {
  const token = getToken();

  try {
    if (token) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } finally {
    clearAuth();
  }
}