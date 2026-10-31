import { api, queryString } from "./apiClient";
import { download } from "./bomExcelService";

export type PurchaseExcelFilters = { search: string; ma_ncc: string; trang_thai: string; ngay_dat_tu: string; ngay_dat_den: string };
export type PurchaseExcelReport = {
  valid: boolean; total_rows: number; total_orders: number; imported: number;
  items: { row: number; code: string; supplier: string; material: string; unit: string; quantity: string; price: string; total: string; delivery: string; note: string }[];
  errors: { row: number; column: string; code: string; message: string }[];
};
function submit(path: string, file: File, confirmed = false) {
  const body = new FormData(); body.append("file", file);
  if (confirmed) body.append("confirmed", "true");
  return api<PurchaseExcelReport>(`/don-mua-nguyen-lieu/excel/${path}`, { method: "POST", body });
}
export const previewPurchaseExcel = (file: File) => submit("preview", file);
export const importPurchaseExcel = (file: File) => submit("import", file, true);
export const downloadPurchaseTemplate = () => download("/don-mua-nguyen-lieu/excel/template", "Template_don_mua_nguyen_lieu.xlsx");
export function exportPurchaseExcel(filters: PurchaseExcelFilters) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const date = ["year", "month", "day"].map(key => parts.find(part => part.type === key)?.value).join("");
  return download("/don-mua-nguyen-lieu/excel/export" + queryString(filters), `Danh_sach_don_mua_nguyen_lieu_${date}.xlsx`);
}
