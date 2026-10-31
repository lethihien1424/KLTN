import { api, ApiError, jsonBody, queryString } from "./apiClient";
import { download } from "./bomExcelService";
import type { Stock } from "./purchaseTypes";
export type StockInput = {
  ma_nguyen_lieu?: string;
  ngay_ghi_nhan?: string;
  ton_kho_thuc_te: string;
  so_luong_book?: string;
  ton_kho_an_toan: string;
  ton_kho_toi_da: string;
  trang_thai: string;
  ly_do_id: string;
  ghi_chu?: string;
};
export const listStocks = () =>
  api<Stock[]>("/ton-kho-nguyen-lieu?latest_only=true");
export const stockHistory = (id: string) =>
  api<Stock[]>(`/ton-kho-nguyen-lieu/${encodeURIComponent(id)}`);
export const saveStock = (data: StockInput, row?: Stock) => {
  const { so_luong_book: _held, ...values } = data;
  values.ly_do_id = values.ly_do_id?.trim() ?? "";
  if (!values.ly_do_id) return Promise.reject(new Error("Vui lòng chọn lý do điều chỉnh tồn kho"));
  return api<Stock>(
    row
      ? `/ton-kho-nguyen-lieu/${encodeURIComponent(row.ma_nguyen_lieu)}/${row.ngay_ghi_nhan}`
      : "/ton-kho-nguyen-lieu",
    { method: row ? "PUT" : "POST", body: jsonBody(values) },
  ).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 422 && Array.isArray(error.detail) &&
      error.detail.some((item) => item?.loc?.includes("ly_do_id"))) {
      throw new ApiError("Vui lòng chọn lý do điều chỉnh tồn kho", 422, error.detail);
    }
    throw error;
  });
};

export const stockLevel = (r: Stock) => Number(r.ton_kho_kha_dung) < 0 ? "TON_AM"
  : Number(r.ton_kho_kha_dung) < Number(r.ton_kho_an_toan) ? "CAN_NHAP" : "BINH_THUONG";
export const stockLevelLabel = (r: Stock) => ({ TON_AM: "Tồn khả dụng âm", CAN_NHAP: "Cần bổ sung", BINH_THUONG: "Bình thường" })[stockLevel(r)];
export type StockDetail = {
  ton_kho: Stock; hang_dang_ve: string; da_giu_chua_co_nguon: string; ngay_cap_nhat_gan_nhat?: string;
  giu_theo_ke_hoach: { ma_ke_hoach: string; ma_cong_thuc: string; so_luong_giu: string; so_luong_xuat: string; da_huy: string }[];
  giao_dich: { id: string; thoi_gian: string; ngay_kiem_ke: string; loai: string; so_luong: string; ton_truoc: string; ton_sau: string;
    giu_truoc: string; giu_sau: string; tham_chieu: string; nguoi_thuc_hien: string; ten_nguoi_thuc_hien: string; ly_do: string; ghi_chu: string | null }[];
  don_mua: { ma_don_mua: string; ten_ncc: string; so_luong_mua: string; so_luong_thuc_nhan: string; con_cho_giao: string; ngay_du_kien_giao: string; trang_thai: string }[];
};
export const getStockDetail = (code: string) => api<StockDetail>(`/ton-kho-nguyen-lieu/${encodeURIComponent(code)}/chi-tiet`);
export type StockExcelReport = {
  valid: boolean; total_rows: number; imported: number;
  items: { row: number; code: string; name: string; unit: string; before: string; after: string; date: string }[];
  errors: { row: number; code: string; message: string }[];
};
export const stockExcel = (file: File, confirmed = false) => {
  const body = new FormData(); body.append("file", file); body.append("confirmed", String(confirmed));
  return api<StockExcelReport>(`/ton-kho-nguyen-lieu/excel/${confirmed ? "import" : "preview"}`, { method: "POST", body });
};
export const downloadStockTemplate = () => download("/ton-kho-nguyen-lieu/excel/template", "Template_ton_kho.xlsx");
export const exportStockExcel = (filters: { search: string; muc_ton: string; ngay_ghi_nhan: string }) => {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const date = ["year", "month", "day"].map((key) => parts.find((p) => p.type === key)?.value).join("");
  return download("/ton-kho-nguyen-lieu/excel/export" + queryString(filters), `Ton_kho_nguyen_lieu_${date}.xlsx`);
};
export type StockPlan = { ma_ke_hoach: string; ten_san_pham: string; so_luong: number; trang_thai: string;
  chi_tiet: { ma_nguyen_lieu: string; ten_nguyen_lieu: string; don_vi_do_luong: string; so_luong_giu: string; so_luong_xuat: string; da_huy: string }[] };
export const listStockPlans = () => api<StockPlan[]>("/ton-kho-nguyen-lieu/san-xuat/ke-hoach");
export const stockPlanAction = (code: string, action: "giu" | "xuat" | "huy", payload?: unknown) =>
  api<{ message: string }>(`/ton-kho-nguyen-lieu/san-xuat/${encodeURIComponent(code)}/${action}`, { method: "POST", ...(payload ? { body: jsonBody(payload) } : {}) });
