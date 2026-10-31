import { api, queryString } from "./apiClient";
import { download } from "./bomExcelService";

export type DeliveryPrice = { don_gia_mua?: string | null; don_vi_don_gia?: string | null; thanh_tien?: string | null };
// Preserve exact Decimal strings; no binary floating point or rounded totals in UI.
export function formatDeliveryMoney(value: string | null | undefined): string {
  if (value == null) return "Chưa có giá";
  const [whole, rawFraction = ""] = value.split(".");
  const fraction = rawFraction.replace(/0+$/, "");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${fraction ? `,${fraction}` : ""} ₫`;
}

export type DeliveryRow = { ma_phieu_nhan: string; ma_phieu_nhap?: string; chi_tiet_id: string; ma_don_mua: string | null; ma_don_cu: string | null;
  nguon: string; ngay_du_kien_giao: string; ngay_giao_thuc_te: string; so_luong_dat: string; so_luong_giao: string;
  so_luong_dat_chat_luong: string | null; so_luong_khong_dat: string | null; so_luong_nhap_kho: string; ma_nguyen_lieu: string;
  ten_nguyen_lieu: string; don_vi: string; nguoi_xac_nhan: string; ten_nguoi_xac_nhan: string; dung_han: boolean; hoan_tat: boolean; ly_do: string | null; ghi_chu: string | null } & DeliveryPrice;
export type DeliveryMetrics = { ty_le_giao_dung_han_thuc_te: string | null; ty_le_giao_du_thuc_te: string | null;
  ty_le_chat_luong_dat_thuc_te: string | null; thoi_gian_giao_tb_ngay: string | null; so_don: number; so_don_da_nhan: number;
  so_don_dang_giao: number; so_phieu: number; lich_su_giao: DeliveryRow[];
  nguon_tieu_chi?: Record<string, string>; thanh_phan_diem?: { ma_nguyen_lieu: string; diem: string }[];
  don_mua: { ma_don: string; nguon: string; hoan_tat: boolean; ngay_du_kien_giao: string; ngay_nhan_cuoi: string; dung_han: boolean | null; ty_le_du: string; so_dot: number }[] };
export const orderDeliveryHistory = (code: string) => api<DeliveryRow[]>(`/don-mua-nguyen-lieu/${encodeURIComponent(code)}/lich-su-nhan-hang`);
export const supplierDeliveryMetrics = (code: string) => api<DeliveryMetrics>(`/nha-cung-cap/${encodeURIComponent(code)}/hieu-suat-chi-tiet`);
export type DeliveryImportReport = { valid: boolean; imported: number; total_rows: number; errors: { row: number; message: string }[];
  items: { code: string; supplier: string; delivery: string; date: string; closed: boolean; lines: number;
    tong_gia_tri_nhap?: string | null; chi_tiet?: (DeliveryPrice & { ma_nguyen_lieu: string; so_luong_nhap_kho: string })[] }[] };
export const deliveryTemplate = () => download("/giao-nguyen-lieu/lich-su/excel/template", "Template_lich_su_giao_hang.xlsx");
export const deliveryExcel = (file: File, confirmed = false) => {
  const body = new FormData(); body.append("file", file); body.append("confirmed", String(confirmed));
  return api<DeliveryImportReport>(`/giao-nguyen-lieu/lich-su/excel/${confirmed ? "import" : "preview"}`, { method: "POST", body });
};

export type ReceiptLine = DeliveryPrice & {
  id: string; ma_nguyen_lieu: string; ten_nguyen_lieu: string; don_vi: string;
  so_luong_dat: string; so_luong_giao: string; so_luong_nhap_kho: string;
  so_luong_dat_chat_luong: string | null; so_luong_khong_dat: string | null;
  ton_truoc: string | null; ton_sau: string | null; don_vi_ton_kho: string;
  ma_giao_dich_kho: string | null; ly_do: string | null;
};
export type DeliveryReceipt = {
  ma_phieu_nhap?: string;
  ma_phieu_nhan: string; ma_don_mua: string | null; ma_don_cu: string | null; lan_giao_cu: string | null;
  ma_ncc: string; ten_ncc: string; nguon: string; ngay_dat_hang: string;
  ngay_du_kien_giao: string; ngay_giao_thuc_te: string; hoan_tat: boolean; dung_han: boolean | null;
  trang_thai_giao_hang: string; so_nguyen_lieu: number; tong_thuc_nhan: { don_vi: string; so_luong: string }[];
  tong_gia_tri_nhap?: string | null;
  nguoi_xac_nhan: string; ten_nguoi_xac_nhan: string; ghi_chu: string | null; chi_tiet: ReceiptLine[];
};
export type ReceiptFilters = { search: string; ngay_nhan_tu: string; ngay_nhan_den: string; ma_ncc: string; ma_nguyen_lieu: string; ma_don_mua: string; ma_phieu_nhap?: string };
export const receiptNumber = (receipt: { ma_phieu_nhan: string; ma_phieu_nhap?: string }) => receipt.ma_phieu_nhap || receipt.ma_phieu_nhan;
export const listDeliveryReceipts = () => api<DeliveryReceipt[]>("/giao-nguyen-lieu/lich-su");
export const getDeliveryReceipt = (code: string) => api<DeliveryReceipt>(`/giao-nguyen-lieu/lich-su/phieu/${encodeURIComponent(code)}`);
export const exportDeliveryReceipts = (filters: ReceiptFilters) => download(
  "/giao-nguyen-lieu/lich-su/excel/export" + queryString(filters), "Lich_su_nhap_nguyen_lieu.xlsx",
);

export type ReceiptPriceUpdateReport = {
  valid: boolean; total_rows: number; updated: number; preview_token: string | null;
  errors: { row: number; message: string }[];
  items: { row: number; ma_phieu_nhan: string; ma_phieu_nhap?: string; ma_nguyen_lieu: string; so_luong_nhap_kho: string;
    don_gia_cu: string | null; don_vi_cu: string | null; thanh_tien_cu: string | null;
    don_gia_moi: string; don_vi_moi: string; thanh_tien_moi: string; changed: boolean; source_note?: string | null }[];
};
export const receiptPriceTemplate = (filters: ReceiptFilters) => download(
  '/giao-nguyen-lieu/lich-su/excel/prices/template' + queryString(filters), 'Template_cap_nhat_gia_phieu_nhap.xlsx',
);
export const receiptPriceExcel = (file: File, confirmation?: { token: string; reason: string }) => {
  const body = new FormData(); body.append('file', file);
  if (confirmation) {
    body.append('confirmed', 'true'); body.append('preview_token', confirmation.token); body.append('reason', confirmation.reason);
  }
  return api<ReceiptPriceUpdateReport>(`/giao-nguyen-lieu/lich-su/excel/prices/${confirmation ? 'apply' : 'preview'}`, { method: 'POST', body });
};
