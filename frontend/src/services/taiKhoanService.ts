/// D:\KLTN\KLTN\frontend\src\services\taiKhoanService.ts
import { getToken } from "./authService";

export type UserAccount = {
  ma_nguoi_dung: string;
  ho_ten: string;
  vai_tro: string;
  trang_thai: string;
  nguoi_thao_tac?: string | null;
  email: string | null;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  thoi_gian_tao?: string | null;
  thoi_gian_cap_nhat?: string | null;
};

export type UserCreateInput = {
  ma_nguoi_dung: string;
  mat_khau: string;
  ho_ten: string;
  vai_tro: string;
  trang_thai: string;
  email?: string | null;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
};

export type UserUpdateInput = Partial<
  Omit<UserCreateInput, "ma_nguoi_dung">
>;

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Phiên đăng nhập đã hết hạn."
    );
  }

  const response = await fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers: {
        ...(options.body
          ? {
              "Content-Type":
                "application/json",
            }
          : {}),
        Authorization:
          `Bearer ${token}`,
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const result = await response
      .json()
      .catch(() => null);

    const message =
      typeof result?.detail ===
      "string"
        ? result.detail
        : response.status === 401
          ? "Phiên đăng nhập đã hết hạn."
          : `Yêu cầu thất bại (${response.status}).`;

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function fetchUsersFromApi():
  Promise<UserAccount[]> {
  return apiRequest<UserAccount[]>(
    "/api/users"
  );
}

export function createUserApi(
  payload: UserCreateInput
): Promise<UserAccount> {
  return apiRequest<UserAccount>(
    "/api/users",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function updateUserApi(
  ma_nguoi_dung: string,
  payload: UserUpdateInput
): Promise<UserAccount> {
  return apiRequest<UserAccount>(
    `/api/users/${encodeURIComponent(
      ma_nguoi_dung
    )}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export function deleteUserApi(
  ma_nguoi_dung: string
): Promise<void> {
  return apiRequest<void>(
    `/api/users/${encodeURIComponent(
      ma_nguoi_dung
    )}`,
    {
      method: "DELETE",
    }
  );
}

function csvCell(
  value: unknown
): string {
  const raw = String(value ?? "");

  const safe =
    /^[=+\-@\t\r]/.test(raw)
      ? `'${raw}`
      : raw;

  return (
    `"${safe.replace(
      /"/g,
      '""'
    )}"`
  );
}

function downloadCsv(
  filename: string,
  rows: unknown[][]
): void {
  const content =
    "\uFEFF" +
    rows
      .map(row =>
        row
          .map(csvCell)
          .join(",")
      )
      .join("\r\n");

  const blob = new Blob(
    [content],
    {
      type:
        "text/csv;charset=utf-8",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}

const CSV_HEADERS = [
  "Mã người dùng",
  "Họ và tên",
  "Vai trò",
  "Trạng thái",
  "Email",
  "Số điện thoại",
  "Địa chỉ",
];

export function exportUsersToCsv(
  users: UserAccount[]
): void {
  downloadCsv(
    "Danh_sach_tai_khoan_MILANO.csv",
    [
      CSV_HEADERS,

      ...users.map(user => [
        user.ma_nguoi_dung,
        user.ho_ten,
        user.vai_tro,
        user.trang_thai,
        user.email,
        user.so_dien_thoai,
        user.dia_chi,
      ]),
    ]
  );
}

export function downloadSampleExcelTemplate():
  void {
  downloadCsv(
    "File_Mau_Nhap_Tai_Khoan_MILANO.csv",
    [
      CSV_HEADERS,
      [
        "NV001",
        "Nguyễn Văn A",
        "NHAN_VIEN_KHO",
        "HOAT_DONG",
        "nva@example.com",
        "0912345678",
        "",
      ],
    ]
  );
}

function parseCsv(
  text: string
): string[][] {
  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (
    let index = 0;
    index < text.length;
    index++
  ) {
    const char = text[index];

    if (char === '"') {
      if (
        quoted &&
        text[index + 1] === '"'
      ) {
        cell += '"';
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (
      char === "," &&
      !quoted
    ) {
      row.push(cell);
      cell = "";
    } else if (
      (char === "\n" ||
        char === "\r") &&
      !quoted
    ) {
      if (
        char === "\r" &&
        text[index + 1] === "\n"
      ) {
        index++;
      }

      row.push(cell);

      if (
        row.some(value =>
          value.trim()
        )
      ) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (quoted) {
    throw new Error(
      "File CSV có dấu ngoặc kép chưa đóng."
    );
  }

  row.push(cell);

  if (
    row.some(value =>
      value.trim()
    )
  ) {
    rows.push(row);
  }

  return rows;
}

export async function parseCsvOrExcelFile(
  file: File
): Promise<UserCreateInput[]> {
  if (
    !file.name
      .toLowerCase()
      .endsWith(".csv")
  ) {
    throw new Error(
      "Vui lòng chọn file .csv; file .xlsx chưa được hỗ trợ."
    );
  }

  const content = (
    await file.text()
  ).replace(
    /^\uFEFF/,
    ""
  );

  const rows =
    parseCsv(content);

  if (
    rows.length < 2
  ) {
    return [];
  }

  if (
    rows[0][0]?.trim() !==
    "Mã người dùng"
  ) {
    throw new Error(
      "File CSV không đúng mẫu cột."
    );
  }

  return rows
    .slice(1)
    .map(
      (
        columns,
        index
      ): UserCreateInput => {
        const accountId =
          columns[0]?.trim();

        const name =
          columns[1]?.trim();

        if (
          !accountId ||
          !name
        ) {
          throw new Error(
            `Dòng ${
              index + 2
            } thiếu mã hoặc họ tên.`
          );
        }

        return {
          ma_nguoi_dung:
            accountId,

          ho_ten:
            name,

          vai_tro:
            columns[2]?.trim() ||
            "NHAN_VIEN_KHO",

          trang_thai:
            columns[3]?.trim() ||
            "HOAT_DONG",

          email:
            columns[4]?.trim() ||
            null,

          so_dien_thoai:
            columns[5]?.trim() ||
            null,

          dia_chi:
            columns[6]?.trim() ||
            null,

          mat_khau:
            "123456",
        };
      }
    );
}