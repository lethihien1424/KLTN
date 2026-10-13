import { getToken } from "./authService";

const BASE_URL = `${(import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "")}/api`;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  if (!token) throw new ApiError("Phiên đăng nhập đã kết thúc.", 401);
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(BASE_URL + path, { ...options, headers });
  } catch (cause) {
    if (options.signal?.aborted) throw cause;
    throw new Error("Không thể kết nối máy chủ. Vui lòng thử lại.");
  }
  if (response.status === 401)
    window.dispatchEvent(new Event("auth-session-expired"));
  if (response.status === 403)
    window.dispatchEvent(new Event("auth-permissions-refresh"));
  if (response.status === 204 && response.ok) return undefined as T;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = body?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map(
                (item: { loc?: (string | number)[]; msg?: string }) =>
                  `${item.loc?.slice(1).join(" / ") ?? "Dữ liệu"}: ${item.msg ?? "Không hợp lệ"}`,
              )
              .join("; ")
          : `Yêu cầu thất bại (HTTP ${response.status}).`;
    throw new ApiError(message, response.status);
  }
  if (body === null) throw new Error("Máy chủ trả dữ liệu không hợp lệ.");
  return body as T;
}

export function queryString(
  values: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  return query.size ? `?${query}` : "";
}

export const jsonBody = (value: unknown) => JSON.stringify(value);
