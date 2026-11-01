import { api, queryString } from "./apiClient";
import type { Suggestion, SupplierRankingPolicy } from "./purchaseTypes";
import type { SupplierScoreItem, SupplierScorePreview } from "./nhaCungCapService";

export type SupplierSuggestionExplanation = {
  nha_cung_cap: Suggestion & { chi_tiet_diem_ncc: SupplierScoreItem };
  chinh_sach_xep_hang: SupplierRankingPolicy;
  chinh_sach_diem: SupplierScorePreview["chinh_sach"];
  tinh_luc: string;
};
export const explainSupplierSuggestion = (mapping: string, material: string, qty: string, forecast: string) =>
  api<SupplierSuggestionExplanation>(`/goi-y-nha-cung-cap/${encodeURIComponent(mapping)}/giai-thich${queryString({ ma_nguyen_lieu: material, so_luong_can_mua: qty, ma_lich_su_du_bao: forecast || undefined })}`);
