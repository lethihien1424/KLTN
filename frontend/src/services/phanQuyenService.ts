////D:\KLTN\KLTN\frontend\src\services\phanQuyenService.ts
import { getToken } from "./authService";

export type PermissionDetail = {
  chuc_nang: string;
  thao_tac: string;
};

export type PermissionGroup = {
  ma: string;
  ten_quyen: string;
  dien_giai: string | null;
  vai_tro: string[];
  chi_tiet: PermissionDetail[];
  duoc_xoa: boolean;
  nguoi_tao: string | null;
  nguoi_cap_nhat: string | null;
  thoi_gian_tao: string;
  thoi_gian_cap_nhat: string;
};

export type PermissionInput = {
  ten_quyen: string;
  dien_giai: string | null;
  vai_tro: string[];
  chi_tiet: PermissionDetail[];
};

export type PermissionCatalog = {
  vai_tro: {
    ma: string;
    ten: string;
  }[];
  thao_tac: {
    ma: string;
    ten: string;
  }[];
  chuc_nang: {
    ma: string;
    ten: string;
    thao_tac: string[];
  }[];
};

export type MyPermissions = {
  ma_nguoi_dung: string;
  vai_tro: string;
  chi_tiet: PermissionDetail[];
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

function readError(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item: unknown) => {
          if (!item || typeof item !== "object") {
            return "Dữ liệu không hợp lệ.";
          }

          const row = item as {
            loc?: unknown[];
            msg?: string;
          };

          const field = row.loc?.slice(1).join(".") || "Dữ liệu";

          return `${field}: ${row.msg || "Không hợp lệ."}`;
        })
        .join("; ");
    }
  }

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  return `Không thể thực hiện yêu cầu (${status}).`;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Vui lòng đăng nhập lại.");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new Error(
      "Không kết nối được máy chủ. Vui lòng thử lại.",
    );
  }

  if (response.status === 204 && response.ok) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readError(body, response.status));
  }

  if (body === null) {
    throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
  }

  return body as T;
}

export function getPermissionCatalog(
  signal?: AbortSignal,
): Promise<PermissionCatalog> {
  return request("/api/phan-quyen/danh-muc", { signal });
}

export function getPermissionGroups(
  signal?: AbortSignal,
): Promise<PermissionGroup[]> {
  return request("/api/phan-quyen", { signal });
}

export function getPermissionGroup(
  id: string,
  signal?: AbortSignal,
): Promise<PermissionGroup> {
  return request(
    `/api/phan-quyen/${encodeURIComponent(id)}`,
    { signal },
  );
}

export function createPermissionGroup(
  input: PermissionInput,
): Promise<PermissionGroup> {
  return request("/api/phan-quyen", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePermissionGroup(
  id: string,
  input: PermissionInput,
): Promise<PermissionGroup> {
  return request(
    `/api/phan-quyen/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(input),
    },
  );
}

export function deletePermissionGroup(
  id: string,
): Promise<void> {
  return request(
    `/api/phan-quyen/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

export function getMyPermissions(
  signal?: AbortSignal,
): Promise<MyPermissions> {
  return request("/api/phan-quyen/cua-toi", { signal });
}

export async function exportPermissionGroups(
  groups: PermissionGroup[],
  catalog: PermissionCatalog,
): Promise<void> {
  const { Workbook } = await import("exceljs");

  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("PhanQuyen");

  const roleNames = new Map(
    catalog.vai_tro.map(item => [item.ma, item.ten]),
  );

  const featureNames = new Map(
    catalog.chuc_nang.map(item => [item.ma, item.ten]),
  );

  const actionNames = new Map(
    catalog.thao_tac.map(item => [item.ma, item.ten]),
  );

  sheet.addRow([
    "Mã quyền",
    "Tên quyền",
    "Diễn giải",
    "Vai trò áp dụng",
    "Chức năng",
    "Thao tác",
    "Người tạo",
    "Người cập nhật",
    "Thời gian tạo",
    "Thời gian cập nhật",
  ]);

  for (const group of groups) {
    const roles = group.vai_tro
      .map(role => roleNames.get(role) || role)
      .join(", ");

    const details: (PermissionDetail | null)[] =
      group.chi_tiet.length > 0 ? group.chi_tiet : [null];

    for (const detail of details) {
      sheet.addRow([
        group.ma,
        group.ten_quyen,
        group.dien_giai || "",
        roles,
        detail
          ? featureNames.get(detail.chuc_nang) || detail.chuc_nang
          : "",
        detail
          ? actionNames.get(detail.thao_tac) || detail.thao_tac
          : "",
        group.nguoi_tao || "",
        group.nguoi_cap_nhat || "",
        group.thoi_gian_tao,
        group.thoi_gian_cap_nhat,
      ]);
    }
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 10 },
  };

  sheet.columns.forEach(column => {
    column.width = 26;
  });

  sheet.getColumn(3).width = 40;
  sheet.getColumn(4).width = 36;

  sheet.eachRow(row => {
    row.eachCell(cell => {
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    });
  });

  sheet.getRow(1).height = 30;

  sheet.getRow(1).eachCell(cell => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const bytes = new Uint8Array(
    buffer as unknown as ArrayBuffer,
  );

  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  const blob = new Blob([copy.buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "Danh_sach_phan_quyen_MILANO.xlsx";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}