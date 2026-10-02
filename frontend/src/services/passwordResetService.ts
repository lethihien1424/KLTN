const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export type SendOtpResponse = {
  message: string;
  server_now: string;
  expires_at: string;
};

type VerifyOtpResponse = {
  message: string;
  reset_token: string;
};

type MessageResponse = {
  message: string;
};

async function post<T>(
  endpoint: string,
  body: Record<string, string>
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Không kết nối được máy chủ. Vui lòng kiểm tra kết nối."
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    if (typeof result?.detail === "string") {
      throw new Error(result.detail);
    }

    if (Array.isArray(result?.detail)) {
      throw new Error("Dữ liệu nhập chưa hợp lệ. Vui lòng kiểm tra lại.");
    }

    throw new Error(`Yêu cầu thất bại (HTTP ${response.status}).`);
  }

  return result as T;
}

export function sendResetOtp(email: string): Promise<SendOtpResponse> {
  return post("forgot-password", { email });
}

export function verifyResetOtp(
  email: string,
  otp: string
): Promise<VerifyOtpResponse> {
  return post("verify-reset-otp", { email, otp });
}

export function saveNewPassword(
  email: string,
  resetToken: string,
  password: string,
  confirmPassword: string
): Promise<MessageResponse> {
  return post("reset-password", {
    email,
    reset_token: resetToken,
    mat_khau_moi: password,
    nhap_lai_mat_khau: confirmPassword,
  });
}