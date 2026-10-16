/// frontend/src/services/sanPhamService.ts
import { getToken } from "./authService";

export type ProductStatus =
  | "DANG_KINH_DOANH"
  | "NGUNG_BAN";

export type Product = {
  ma_san_pham: string;
  ten_san_pham: string;

  khoi_luong: string | number;
  don_vi_do_luong: string;

  nhom_san_pham: string | null;
  trang_thai: ProductStatus;

  don_gia: string | number;
  don_vi_tien_te: string;

  thoi_gian_tao: string;
  thoi_gian_cap_nhat: string;
};

export type ProductInput = {
  ten_san_pham: string;

  khoi_luong: string;
  don_vi_do_luong: "kg";

  nhom_san_pham: string | null;
  trang_thai: ProductStatus;

  don_gia: string;
  don_vi_tien_te: "VND";
};

export type ProductFilter = {
  search: string;
  nhom: string;
  trang_thai: ProductStatus | "";
};

export type ProductList = {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
};

export type ImportResult = {
  success: boolean;
  message: string;
  total_rows: number;
  imported_rows: number;
};

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/+$/, "");

function errorText(
  body: unknown,
  status: number,
): string {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body
  ) {
    const detail = (
      body as { detail: unknown }
    ).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map(item => {
          const error = item as {
            loc?: unknown[];
            msg?: string;
          };

          const field =
            error.loc?.slice(1).join(".") ||
            "Dữ liệu";

          return (
            `${field}: ` +
            (error.msg || "Không hợp lệ")
          );
        })
        .join("; ");
    }

    if (
      detail &&
      typeof detail === "object"
    ) {
      const error = detail as {
        message?: string;
        thieu_cot?: string[];
        du_cot?: string[];
      };

      return [
        error.message,

        error.thieu_cot?.length
          ? `Thiếu cột: ${error.thieu_cot.join(", ")}`
          : "",

        error.du_cot?.length
          ? `Dư cột: ${error.du_cot.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join(" — ") || "Dữ liệu không hợp lệ.";
    }
  }

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (status === 403) {
    return (
      "Bạn chưa được cấp quyền thực hiện thao tác này."
    );
  }

  return `Yêu cầu thất bại (HTTP ${status}).`;
}

async function request(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();

  if (!token) {
    throw new Error("Vui lòng đăng nhập lại.");
  }

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${token}`,
  );

  if (options.body instanceof FormData) {
    headers.delete("Content-Type");
  } else if (options.body !== undefined) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...options,
        headers,
        cache: "no-store",
      },
    );
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new Error(
      "Không kết nối được máy chủ.",
    );
  }

  if (!response.ok) {
    const body: unknown = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorText(body, response.status),
    );
  }

  return response;
}

async function json<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await request(
    path,
    options,
  );

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function query(
  filter: ProductFilter,
): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.search.trim()) {
    params.set(
      "search",
      filter.search.trim(),
    );
  }

  if (filter.nhom) {
    params.set("nhom", filter.nhom);
  }

  if (filter.trang_thai) {
    params.set(
      "trang_thai",
      filter.trang_thai,
    );
  }

  return params;
}

export function getProducts(
  filter: ProductFilter,
  page: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<ProductList> {
  const params = query(filter);

  params.set("page", String(page));
  params.set(
    "page_size",
    String(pageSize),
  );

  return json(
    `/api/san-pham?${params}`,
    { signal },
  );
}

export function getProductGroups(
  signal?: AbortSignal,
): Promise<string[]> {
  return json(
    "/api/san-pham/nhom",
    { signal },
  );
}

export function getProduct(
  ma: string,
): Promise<Product> {
  return json(
    `/api/san-pham/${encodeURIComponent(ma)}`,
  );
}

export function createProduct(
  input: ProductInput,
): Promise<Product> {
  return json("/api/san-pham", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  ma: string,
  input: ProductInput,
): Promise<Product> {
  return json(
    `/api/san-pham/${encodeURIComponent(ma)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export async function deleteProduct(
  ma: string,
): Promise<void> {
  await request(
    `/api/san-pham/${encodeURIComponent(ma)}`,
    { method: "DELETE" },
  );
}

export function importProducts(
  file: File,
): Promise<ImportResult> {
  const form = new FormData();
  form.append("file", file);

  return json(
    "/api/san-pham/import",
    {
      method: "POST",
      body: form,
    },
  );
}

async function download(
  path: string,
  filename: string,
): Promise<void> {
  const response = await request(path);

  const url = URL.createObjectURL(
    await response.blob(),
  );

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    60000,
  );
}

export function exportProducts(
  filter: ProductFilter,
): Promise<void> {
  return download(
    `/api/san-pham/export?${query(filter)}`,
    "SanPham_Milano.xlsx",
  );
}

export function downloadProductTemplate():
  Promise<void> {
  return download(
    "/api/san-pham/template",
    "Template_SanPham_Milano.xlsx",
  );
}