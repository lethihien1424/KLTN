/// D:\KLTN\KLTN\frontend\src\services\taiKhoanService.ts
import { Workbook } from "exceljs";
import { getToken } from "./authService";

export const ACCOUNT_ROLES = [
  { value: "ADMIN", label: "Quản trị viên" },
  { value: "QUAN_LY_BAN_HANG", label: "Quản lý bán hàng" },
  { value: "QUAN_LY_MUA_HANG", label: "Quản lý mua hàng" },
  { value: "NHAN_VIEN_BAN_HANG", label: "Nhân viên bán hàng" },
  { value: "NHAN_VIEN_MUA_HANG", label: "Nhân viên mua hàng" },
] as const;

export type AccountRole = typeof ACCOUNT_ROLES[number]["value"];
export type AccountStatus = "HOAT_DONG" | "NGUNG_HOAT_DONG";

export type UserAccount = {
  ma_nguoi_dung: string;
  ho_ten: string;
  vai_tro: string;
  trang_thai: string;
  nguoi_thao_tac?: string | null;
  email?: string | null;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  thoi_gian_tao?: string | null;
  thoi_gian_cap_nhat?: string | null;
};

export type UserCreateInput = {
  ho_ten: string;
  mat_khau: string;
  vai_tro: AccountRole;
  trang_thai: AccountStatus;
  email?: string | null;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
};

export type UserUpdateInput = Partial<UserCreateInput>;

export type ImportRow = {
  rowNumber: number;
  input: UserCreateInput;
};

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

export function roleLabel(role: string): string {
  const current = ACCOUNT_ROLES.find(item => item.value === role);
  if (current) return current.label;

  const legacy: Record<string, string> = {
    QUAN_LY: "Quản lý (vai trò cũ)",
    GIAM_SAT_BAN_HANG: "Giám sát bán hàng (vai trò cũ)",
    NHAN_VIEN_KHO: "Nhân viên kho (vai trò cũ)",
    NHAN_VIEN_KE_HOACH_SAN_XUAT: "Kế hoạch sản xuất (vai trò cũ)",
  };

  return legacy[role] || role;
}

export function statusLabel(status: string): string {
  if (status === "HOAT_DONG") return "Hoạt động";
  if (status === "NGUNG_HOAT_DONG") return "Ngưng hoạt động";
  return status;
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    let message = `Yêu cầu thất bại (${response.status}).`;

    if (typeof result?.detail === "string") {
      message = result.detail;
    } else if (Array.isArray(result?.detail)) {
      message = result.detail
        .map((item: { loc?: unknown[]; msg?: string }) =>
          `${item.loc?.slice(1).join(".") || "Dữ liệu"}: ${item.msg || "Không hợp lệ"}`
        )
        .join("; ");
    } else if (response.status === 401) {
      message = "Phiên đăng nhập đã hết hạn.";
    }

    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function fetchUsersFromApi(): Promise<UserAccount[]> {
  return apiRequest("/api/users");
}

export function fetchUserApi(id: string): Promise<UserAccount> {
  return apiRequest(`/api/users/${encodeURIComponent(id)}`);
}

export function createUserApi(
  payload: UserCreateInput,
): Promise<UserAccount> {
  return apiRequest("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUserApi(
  id: string,
  payload: UserUpdateInput,
): Promise<UserAccount> {
  return apiRequest(`/api/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUserApi(id: string): Promise<void> {
  return apiRequest(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

async function downloadWorkbook(
  filename: string,
  headers: string[],
  rows: string[][],
): Promise<void> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("TaiKhoan");

  sheet.addRow(headers);
  rows.forEach(row => sheet.addRow(row));

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };

  sheet.getRow(1).height = 28;
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.alignment = { vertical: "middle" };
  });

  sheet.columns.forEach(column => {
    column.width = 25;
  });

  sheet.eachRow((row, index) => {
    if (index > 1) row.height = 24;

    row.eachCell(cell => {
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.numFmt = "@";
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportUsersToExcel(
  users: UserAccount[],
): Promise<void> {
  await downloadWorkbook(
    "Danh_sach_tai_khoan_MILANO.xlsx",
    [
      "Mã tài khoản", "Họ và tên", "Vai trò", "Trạng thái",
      "Email", "Số điện thoại", "Địa chỉ", "Người thao tác",
      "Thời gian tạo", "Thời gian cập nhật",
    ],
    users.map(user => [
      user.ma_nguoi_dung,
      user.ho_ten,
      roleLabel(user.vai_tro),
      statusLabel(user.trang_thai),
      user.email || "",
      user.so_dien_thoai || "",
      user.dia_chi || "",
      user.nguoi_thao_tac || "",
      user.thoi_gian_tao || "",
      user.thoi_gian_cap_nhat || "",
    ]),
  );
}

const IMPORT_HEADERS = [
  "ho_ten", "mat_khau", "vai_tro", "trang_thai",
  "email", "so_dien_thoai", "dia_chi",
];

export async function downloadSampleExcelTemplate(): Promise<void> {
  await downloadWorkbook(
    "Mau_nhap_tai_khoan_MILANO.xlsx",
    IMPORT_HEADERS,
    [[
      "Nguyễn Văn A",
      "123456",
      "NHAN_VIEN_BAN_HANG",
      "HOAT_DONG",
      "nva@example.com",
      "0912345678",
      "",
    ]],
  );
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (quoted) throw new Error("File CSV có dấu ngoặc kép chưa đóng.");

  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export async function parseCsvOrExcelFile(
  file: File,
): Promise<ImportRow[]> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Dung lượng file tối đa là 10 MB.");
  }

  let rows: string[][];

  if (file.name.toLowerCase().endsWith(".csv")) {
    rows = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
  } else if (file.name.toLowerCase().endsWith(".xlsx")) {
    const workbook = new Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());

    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("File Excel không có sheet.");

    rows = [];
    sheet.eachRow({ includeEmpty: true }, row => {
      rows.push(
        IMPORT_HEADERS.map((_, index) => row.getCell(index + 1).text)
      );
    });
  } else {
    throw new Error("Chỉ hỗ trợ file .xlsx hoặc .csv.");
  }

  if (
    !rows[0] ||
    IMPORT_HEADERS.some((header, index) => rows[0][index]?.trim() !== header) ||
    rows[0].length !== IMPORT_HEADERS.length
  ) {
    throw new Error("Tên hoặc thứ tự cột không đúng. Hãy tải file mẫu.");
  }

  const result: ImportRow[] = [];

  rows.slice(1).forEach((columns, index) => {
    if (!columns.some(value => value.trim())) return;

    const rowNumber = index + 2;
    const [name, password, role, status, email, phone, address] = columns;

    if (!name?.trim() || !password) {
      throw new Error(`Dòng ${rowNumber}: thiếu họ tên hoặc mật khẩu.`);
    }

    if (!ACCOUNT_ROLES.some(item => item.value === role?.trim())) {
      throw new Error(`Dòng ${rowNumber}: vai trò không hợp lệ.`);
    }

    if (!["HOAT_DONG", "NGUNG_HOAT_DONG"].includes(status?.trim())) {
      throw new Error(`Dòng ${rowNumber}: trạng thái không hợp lệ.`);
    }

    if (new TextEncoder().encode(password).length > 72) {
      throw new Error(`Dòng ${rowNumber}: mật khẩu vượt quá 72 byte.`);
    }

    result.push({
      rowNumber,
      input: {
        ho_ten: name.trim(),
        mat_khau: password,
        vai_tro: role.trim() as AccountRole,
        trang_thai: status.trim() as AccountStatus,
        email: email?.trim() || null,
        so_dien_thoai: phone?.trim() || null,
        dia_chi: address?.trim() || null,
      },
    });
  });

  if (!result.length) throw new Error("File không có dòng dữ liệu.");
  return result;
}