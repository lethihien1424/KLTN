//D:\KLTN\KLTN\frontend\src\services\apiClient.ts
import { getToken } from "./authService";

export const API_BASE_URL = `${(
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "").replace(/\/api$/, "")}/api`;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError("Phiên đăng nhập đã kết thúc.", 401);
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("Đường dẫn API phải bắt đầu bằng một dấu /.");
  }
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body != null && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  let response: Response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...options, headers, cache: options.cache ?? "no-store",
    });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new Error("Không thể kết nối máy chủ. Vui lòng thử lại.");
  }
  if (response.status === 401) {
    window.dispatchEvent(new Event("auth-session-expired"));
  }
  // Không tự phát sự kiện làm mới khi gặp 403: tránh vòng lặp
  // request -> 403 -> refresh -> request. Làm mới sau khi lưu quyền.
  if (response.status === 204 && response.ok) return undefined as T;
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body && typeof body === "object" && "detail" in body
      ? (body as { detail: unknown }).detail : null;
    const message = typeof detail === "string" ? detail
      : Array.isArray(detail) ? detail.map((value: unknown) => {
        if (!value || typeof value !== "object") return "Dữ liệu không hợp lệ.";
        const row = value as { loc?: unknown[]; msg?: string };
        return `${row.loc?.slice(1).join(" / ") || "Dữ liệu"}: ${row.msg || "Không hợp lệ"}`;
      }).join("; ") : `Yêu cầu thất bại (HTTP ${response.status}).`;
    throw new ApiError(message, response.status);
  }
  if (body === null) throw new Error("Máy chủ trả dữ liệu không hợp lệ.");
  return body as T;
}

export function queryString(values: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : "";
}

export const jsonBody = (value: unknown) => JSON.stringify(value);
