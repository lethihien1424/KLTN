import type { ReasonSelection } from "./reasonService";
import { api, jsonBody } from "./apiClient";
import type { Bom } from "./purchaseTypes";
export type BomProduct = {
  ma_san_pham: string;
  ten_san_pham: string;
  khoi_luong: string | number | null;
  don_vi_do_luong: string | null;
};
export const getBomProduct = (id: string, signal?: AbortSignal) =>
  api<BomProduct>(`/cong-thuc/san-pham/${encodeURIComponent(id)}/dinh-luong`, { signal });
export type BomInput = {
  ma_san_pham?: string;
  ten_cong_thuc: string;
  he_so_thu_hoi: string;
  ty_le_hao_hut: string;
  trang_thai?: string;
  thay_doi_trang_thai?: ReasonSelection & { trang_thai: string; trang_thai_cu: string };
  chi_tiet: { ma_nguyen_lieu: string; ty_le_phoi_tron: string }[];
};
export const listBoms = () => api<Bom[]>("/cong-thuc");
export const getBom = (id: string) =>
  api<Bom>(`/cong-thuc/${encodeURIComponent(id)}`);
export const saveBom = (data: BomInput, id?: string) =>
  api<Bom>(id ? `/cong-thuc/${encodeURIComponent(id)}` : "/cong-thuc", {
    method: id ? "PUT" : "POST",
    body: jsonBody(data),
  });
export const changeBomStatus = (id: string, trang_thai: string, reason: ReasonSelection) =>
  api<Bom>(`/cong-thuc/${encodeURIComponent(id)}/trang-thai`, {
    method: "PATCH",
    body: jsonBody({ trang_thai, ...reason }),
  });
