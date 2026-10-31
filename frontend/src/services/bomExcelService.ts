import { api, API_BASE_URL, queryString } from "./apiClient";
import { getToken } from "./authService";

export type BomExcelReport = {
  valid: boolean;
  total_rows: number;
  total_boms: number;
  imported: number;
  items: { code: string; name: string; product: string; lines: number; rows: number[]; status: string }[];
  errors: { row: number; code: string; message: string }[];
};
export type BomExcelFilters = { search: string; ma_san_pham: string; trang_thai: string };

export const previewBomExcel = (file: File) => {
  const body = new FormData();
  body.append("file", file);
  return api<BomExcelReport>("/cong-thuc/excel/preview", { method: "POST", body });
};
export const importBomExcel = (file: File) => {
  const body = new FormData();
  body.append("file", file);
  body.append("confirmed", "true");
  return api<BomExcelReport>("/cong-thuc/excel/import", { method: "POST", body });
};

export async function download(path: string, filename: string) {
  const token = getToken();
  if (!token) throw new Error("Phiên đăng nhập đã kết thúc.");
  const response = await fetch(API_BASE_URL + path, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (response.status === 401) window.dispatchEvent(new Event("auth-session-expired"));
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `Không thể tải Excel (HTTP ${response.status}).`);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadBomTemplate = () => download("/cong-thuc/excel/template", "Template_cong_thuc_BOM.xlsx");
export function exportBomExcel(filters: BomExcelFilters) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const date = ["year", "month", "day"].map((key) => parts.find((part) => part.type === key)?.value).join("");
  return download("/cong-thuc/excel/export" + queryString(filters), `Danh_sach_cong_thuc_BOM_${date}.xlsx`);
}
