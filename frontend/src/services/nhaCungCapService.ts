import type { ReasonSelection } from "./reasonService";
import { api, jsonBody, queryString } from "./apiClient";
import type { Supplier, Mapping, Performance } from "./purchaseTypes";
export const listSuppliers = () => api<Supplier[]>("/nha-cung-cap");
export const saveSupplier = (ten_ncc: string, id?: string) =>
  api<Supplier>(
    id ? `/nha-cung-cap/${encodeURIComponent(id)}` : "/nha-cung-cap",
    {
      method: id ? "PUT" : "POST",
      body: jsonBody({
        ten_ncc,
        ...(id ? {} : { trang_thai: "DANG_HOAT_DONG" }),
      }),
    },
  );
export const changeSupplierStatus = (id: string, trang_thai: string, reason: ReasonSelection) =>
  api<Supplier>(`/nha-cung-cap/${encodeURIComponent(id)}/trang-thai`, {
    method: "PATCH",
    body: jsonBody({ trang_thai, ...reason }),
  });
export type SupplierScoreCriterion = {
  key: string; ten: string; trong_so: string; trong_so_ap_dung: string | null;
  gia_tri: string | null; diem: string | null; dong_gop: string | null; nguon: string; so_mau: number;
  phep_tinh: string;
  giai_thich: { cong_thuc_ngan: string; tom_tat: string; ghi_chu: string;
    tong_hop_kiem_dinh?: { so_dong_hop_le: number; so_dong_chua_kiem_dinh: number; theo_don_vi: {
      don_vi: string; so_luong_giao: string; so_luong_dat: string; so_luong_khong_dat: string;
      so_dong_hop_le: number; phep_tinh: string; chuoi_du_lieu: string | null;
    }[] }; dong: {
    tieu_de: string; noi_dung: string[]; ma_don?: string; nguon?: string;
    phieu: { ma_phieu_nhan: string; ma_phieu_nhap: string }[];
  }[] };
};
export type SupplierScoreItem = {
  ma_ncc: string; ten_ncc: string; diem_hien_tai: string | null; diem_moi: string | null;
  chenh_lech: string | null; do_day_du: string; tinh_trang: string; so_phieu: number; so_lan_giao: number;
  so_don: number; so_don_da_chot: number; so_dong_kiem_dinh_hop_le: number;
  so_phieu_thuc_te: number; so_phieu_lich_su: number; so_don_cu: number;
  giai_thich_tong: string;
  mapping: { ma_nguyen_lieu_ncc: string; ma_nguyen_lieu: string; diem: string | null; do_day_du: string;
    ten_nguyen_lieu?: string;
    giai_thich_tong: string;
    lead_time_khai_bao_ngay: number; lead_time_thuc_te_ngay: string | null;
    khai_bao_khong_dung_lam_kpi: { chat_luong: string; dung_han: string; giao_du: string }; tieu_chi: SupplierScoreCriterion[] }[];
};
export type SupplierScorePreview = { preview_token: string; tinh_luc: string;
  chinh_sach: { version: string; weights: Record<string, string>; missing: string; formula: string; lead: string; quality: string; on_time: string; full: string; sources: string };
  nha_cung_cap: SupplierScoreItem[] };
export const previewSupplierScore = (id?: string) => api<SupplierScorePreview>(
  id ? `/nha-cung-cap/${encodeURIComponent(id)}/tinh-diem/preview` : "/nha-cung-cap/tinh-diem/preview",
);
export const scoreSupplier = (id: string | undefined, confirmation: { preview_token: string; ly_do: string; ly_do_id: string; ghi_chu: string | null }) =>
  api<unknown>(
    id
      ? `/nha-cung-cap/${encodeURIComponent(id)}/tinh-diem`
      : "/nha-cung-cap/tinh-diem",
    { method: "POST", body: jsonBody(confirmation) },
  );
export const listMappings = (id?: string) =>
  api<Mapping[]>(`/nguyen-lieu-nha-cung-cap${queryString({ ma_ncc: id })}`);
export const saveMapping = (
  data: Record<string, string | number>,
  id?: string,
) =>
  api<Mapping>(
    id
      ? `/nguyen-lieu-nha-cung-cap/${encodeURIComponent(id)}`
      : "/nguyen-lieu-nha-cung-cap",
    { method: id ? "PUT" : "POST", body: jsonBody(data) },
  );
export const supplierPerformance = () =>
  api<Performance[]>("/dashboard/hieu-suat-nha-cung-cap");
