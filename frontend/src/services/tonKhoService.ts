import { api, jsonBody } from "./apiClient";
import type { Stock } from "./purchaseTypes";
export type StockInput = {
  ma_nguyen_lieu?: string;
  ngay_ghi_nhan?: string;
  ton_kho_thuc_te: string;
  so_luong_book: string;
  ton_kho_an_toan: string;
  ton_kho_toi_da: string;
  trang_thai: string;
};
export const listStocks = () =>
  api<Stock[]>("/ton-kho-nguyen-lieu?latest_only=true");
export const stockHistory = (id: string) =>
  api<Stock[]>(`/ton-kho-nguyen-lieu/${encodeURIComponent(id)}`);
export const saveStock = (data: StockInput, row?: Stock) =>
  api<Stock>(
    row
      ? `/ton-kho-nguyen-lieu/${encodeURIComponent(row.ma_nguyen_lieu)}/${row.ngay_ghi_nhan}`
      : "/ton-kho-nguyen-lieu",
    { method: row ? "PUT" : "POST", body: jsonBody(data) },
  );
