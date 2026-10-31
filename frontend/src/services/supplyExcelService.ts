import { api, queryString } from "./apiClient";
import { download } from "./bomExcelService";
export type SupplyExcelReport = { valid: boolean; imported: number; total_rows: number;
  errors: { row: number; message: string }[];
  items: { row: number; ma_ncc: string; ten_ncc: string; ma_nguyen_lieu: string; ten_nguyen_lieu: string; don_vi: string; gia: string; ton_ncc: string }[] };
export const downloadSupplyTemplate = () => download("/nguyen-lieu-nha-cung-cap/excel/template", "Template_nguyen_lieu_cung_ung.xlsx");
export const supplyExcel = (file: File, confirmed = false, supplier = "") => {
  const body = new FormData(); body.append("file", file); body.append("confirmed", String(confirmed));
  return api<SupplyExcelReport>(`/nguyen-lieu-nha-cung-cap/excel/${confirmed ? "import" : "preview"}` + queryString({ ma_ncc: supplier }), { method: "POST", body });
};
export const exportSupplyExcel = (search: string, supplier: string) => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const date = ["year", "month", "day"].map((key) => parts.find((part) => part.type === key)?.value).join("");
  return download("/nguyen-lieu-nha-cung-cap/excel/export" + queryString({ search, ma_ncc: supplier }), `Nguyen_lieu_cung_ung_${date}.xlsx`);
};
