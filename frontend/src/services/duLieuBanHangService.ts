/// frontend/src/services/duLieuBanHangService.ts

import { getToken } from "./authService";

export type SalesOrderStatus =

  | "CHO_GIAO_HANG"

  | "DA_GIAO_HANG";

export type MoneyValue = string | number;

export type SalesCreateCatalog = {

  san_pham: {

    ma: string;

    ten: string;

    don_gia: MoneyValue;

    don_vi_tien_te: string;

  }[];

  ngay_le: {

    ma: string;

    ten: string;

  }[];

};

export type PendingOrderInput = {

  ma_don_hang: string;

  ma_san_pham: string;

  ngay_ban: string;

  ngay_giao_hang?: string | null;

  so_luong: number;

  trang_thai_don_hang?: SalesOrderStatus;

  gia_goc: string | null;

  muc_giam_gia?: string;

  co_khuyen_mai?: boolean;

  chuong_trinh_km?: string | null;

  kenh_ban_hang?: string | null;

  ma_ngay_le?: string | null;

};



export type SalesRow = {

  ma: string;

  bang_luu: "lich_su_tieu_thu";

  ma_don_hang: string;

  ma_san_pham: string;

  ten_san_pham: string;

  ngay_ban: string;

  ngay_giao_hang: string | null;

  so_luong: number;

  trang_thai_don_hang: SalesOrderStatus;

  trang_thai_san_xuat: string;

  gia_goc: MoneyValue | null;

  muc_giam_gia: MoneyValue;

  gia_ban_sau_giam: MoneyValue | null;

  thanh_tien: MoneyValue | null;

  co_khuyen_mai: boolean;

  chuong_trinh_km: string | null;

  kenh_ban_hang: string | null;

  ma_ngay_le: string | null;

};



export type SalesCreateResult = SalesRow;



export type SalesList = {

  items: SalesRow[];

  total: number;

  page: number;

  page_size: number;

};



export type SalesFilter = {

  search: string;

  trangThai: SalesOrderStatus | "";

};



export type ImportResult = {

  success: boolean;

  message: string;

  total_rows: number;

  imported_rows: number;

};



const API_URL = (

  import.meta.env.VITE_API_URL || "http://localhost:8000"

).replace(/\/+$/, "");



export function formatSalesMoney(

  value: MoneyValue | null | undefined,

): string {

  if (value === null || value === undefined || value === "") {

    return "—";

  }



  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(value));



  if (!match) return "—";



  const integer = match[2].replace(

    /\B(?=(\d{3})+(?!\d))/g,

    ",",

  );



  const decimal = (match[3] || "").replace(/0+$/, "");



  return `${match[1]}${integer}${decimal ? `.${decimal}` : ""}`;

}



export function calculateSalesAmount(

  price: string,

  quantity: string,

  percent: string,

): { salePrice: string; total: string } | null {

  if (!/^\d{1,13}(?:\.\d{1,2})?$/.test(price)) return null;

  if (!/^\d+$/.test(quantity)) return null;

  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(percent)) return null;



  const count = Number(quantity);

  const discount = Number(percent);



  if (

    !Number.isSafeInteger(count) ||

    count < 1 ||

    count > 2147483647 ||

    discount < 0 ||

    discount > 100

  ) {

    return null;

  }



  const [whole, fraction = ""] = price.split(".");

  const [percentWhole, percentFraction = ""] = percent.split(".");



  const cents = BigInt(whole + fraction.padEnd(2, "0"));

  const basisPoints = BigInt(

    percentWhole + percentFraction.padEnd(2, "0"),

  );



  const saleCents = (

    cents * (BigInt(10000) - basisPoints) + BigInt(5000)

  ) / BigInt(10000);



  const totalCents = saleCents * BigInt(count);



  const decimal = (value: bigint): string =>

    `${value / BigInt(100)}.${String(

      value % BigInt(100),

    ).padStart(2, "0")}`;



  return {

    salePrice: decimal(saleCents),

    total: decimal(totalCents),

  };

}



function readError(body: unknown, status: number): string {

  if (body && typeof body === "object" && "detail" in body) {

    const detail = (body as { detail: unknown }).detail;



    if (typeof detail === "string") return detail;



    if (Array.isArray(detail)) {

      return detail.map(item => {

        if (item && typeof item === "object" && "msg" in item) {

          return String(item.msg);

        }

        return "Dữ liệu không hợp lệ.";

      }).join("; ");

    }



    if (

      detail &&

      typeof detail === "object" &&

      "message" in detail

    ) {

      return String(detail.message);

    }

  }



  if (status === 401) {

    return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";

  }



  if (status === 403) {

    return "Bạn không có quyền thực hiện thao tác này.";

  }



  return `Yêu cầu thất bại (HTTP ${status}).`;

}



async function request<T>(

  path: string,

  options: RequestInit = {},

): Promise<T> {

  const token = getToken();



  if (!token) throw new Error("Vui lòng đăng nhập lại.");



  const headers = new Headers(options.headers);

  headers.set("Authorization", `Bearer ${token}`);



  if (

    options.body !== undefined &&

    !(options.body instanceof FormData)

  ) {

    headers.set("Content-Type", "application/json");

  }



  let response: Response;



  try {

    response = await fetch(`${API_URL}${path}`, {

      ...options,

      headers,

      cache: "no-store",

    });

  } catch (cause) {

    if (options.signal?.aborted) throw cause;

    throw new Error("Không kết nối được máy chủ.");

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


export function getSalesCreateCatalog(

  signal?: AbortSignal,

): Promise<SalesCreateCatalog> {

  return request(

    "/api/du-lieu-ban-hang/danh-muc-them-moi",

    { signal },

  );

}


export function createSalesData(

  input: PendingOrderInput,

): Promise<SalesCreateResult> {

  return request("/api/du-lieu-ban-hang", {

    method: "POST",

    body: JSON.stringify({

      ...input,

      trang_thai_don_hang: "CHO_GIAO_HANG",

    }),

  });

}


export function updateSalesData(

  ma: string,

  input: PendingOrderInput,

): Promise<SalesCreateResult> {

  return request(

    `/api/du-lieu-ban-hang/${encodeURIComponent(ma)}`,

    {

      method: "PUT",

      body: JSON.stringify(input),

    },

  );

}


export function getSalesData(

  filter: SalesFilter,

  page = 1,

  pageSize = 20,

  signal?: AbortSignal,

): Promise<SalesList> {

  const params = new URLSearchParams({

    page: String(page),

    page_size: String(pageSize),

  });



  if (filter.search.trim()) {

    params.set("search", filter.search.trim());

  }



  if (filter.trangThai) {

    params.set("trang_thai", filter.trangThai);

  }



  return request(

    `/api/du-lieu-ban-hang?${params.toString()}`,

    { signal },

  );

}

export function importSalesFile(file: File): Promise<ImportResult> {

  const form = new FormData();

  form.append("file", file);

  return request("/api/imports/don-hang", {

    method: "POST",

    body: form,

  });

}


const HEADERS = [

  "ma_don_hang",

  "ma_san_pham",

  "ngay_ban",

  "so_luong",

  "trang_thai_don_hang",

  "gia_goc",

  "muc_giam_gia",

  "gia_ban_sau_giam",

  "co_khuyen_mai",

  "chuong_trinh_km",

  "kenh_ban_hang",

  "ma_ngay_le",

  "ngay_giao_hang",

];



function importDate(value: string | null): string {

  if (!value) return "";



  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);



  if (!match) throw new Error(`Ngày không hợp lệ: ${value}.`);



  return `${match[3]}/${match[2]}/${match[1]}`;

}



async function downloadExcel(

  rows: SalesRow[],

  filename: string,

): Promise<void> {

  const { Workbook } = await import("exceljs");



  const workbook = new Workbook();

  const sheet = workbook.addWorksheet("DonHang");



  sheet.addRow(HEADERS);



  for (const row of rows) {

    sheet.addRow([

      row.ma_don_hang,

      row.ma_san_pham,

      importDate(row.ngay_ban),

      row.so_luong,

      row.trang_thai_don_hang,

      row.gia_goc ?? "",

      row.muc_giam_gia,

      row.gia_ban_sau_giam ?? "",

      row.co_khuyen_mai ? "TRUE" : "FALSE",

      row.chuong_trinh_km ?? "",

      row.kenh_ban_hang ?? "",

      row.ma_ngay_le ?? "",

      importDate(row.ngay_giao_hang),

    ]);

  }



  sheet.columns.forEach(column => {

    column.width = 25;

  });



  sheet.getColumn(10).width = 38;

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  sheet.autoFilter = "A1:M1";


  sheet.getRow(1).height = 34;

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

    cell.alignment = {

      vertical: "middle",

      wrapText: true,

    };

  });

  const buffer = await workbook.xlsx.writeBuffer();

  const source = new Uint8Array(

    buffer as unknown as ArrayBuffer,

  );

  const copy = new Uint8Array(source.byteLength);

  copy.set(source);


  const blob = new Blob([copy.buffer], {

    type:

      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  });


  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");


  link.href = url;

  link.download = filename;

  try {

    document.body.appendChild(link);

    link.click();

  } finally {

    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  }

}


export function exportSalesTemplate(): Promise<void> {

  return downloadExcel([], "Template_DonHang_Milano.xlsx");

}


export async function exportSalesData(

  filter: SalesFilter,

): Promise<void> {

  const snapshot = { ...filter };

  const rows: SalesRow[] = [];

  const seen = new Set<string>();

  let page = 1;

  let expectedTotal: number | null = null;


  while (true) {

    const result = await getSalesData(snapshot, page, 500);

    if (expectedTotal === null) {

      expectedTotal = result.total;

    } else if (expectedTotal !== result.total) {

      throw new Error(

        "Danh sách thay đổi trong lúc xuất. Vui lòng thử lại.",

      );

    }

    for (const row of result.items) {

      if (seen.has(row.ma)) {

        throw new Error(

          "Danh sách thay đổi trong lúc xuất. Vui lòng thử lại.",

        );

      }

      seen.add(row.ma);

      rows.push(row);

    }

    if (rows.length >= expectedTotal) break;

    if (result.items.length === 0) {

      throw new Error("Không lấy đủ dữ liệu để xuất Excel.");

    }
    page += 1;

  }
  await downloadExcel(rows, "DuLieuBanHang_Milano.xlsx");

}
