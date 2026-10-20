import type { ReasonSelection } from "./reasonService";
import { api, jsonBody } from "./apiClient";
import type { Bom } from "./purchaseTypes";
export type BomInput = {
  ma_san_pham?: string;
  ten_cong_thuc: string;
  he_so_thu_hoi: string;
  ty_le_hao_hut: string;
  trang_thai?: string;
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
