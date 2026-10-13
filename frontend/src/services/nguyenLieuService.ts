import type { ReasonSelection } from "./reasonService";
import { api, jsonBody } from "./apiClient";
import type { Material } from "./purchaseTypes";
export const listMaterials = () => api<Material[]>("/nguyen-lieu");
export const createMaterial = (data: Material) =>
  api<Material>("/nguyen-lieu", { method: "POST", body: jsonBody(data) });
export const updateMaterial = (
  id: string,
  data: { ten_nguyen_lieu: string; don_vi_do_luong: string },
) =>
  api<Material>(`/nguyen-lieu/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: jsonBody(data),
  });
export const changeMaterialStatus = (id: string, trang_thai: string, reason: ReasonSelection) =>
  api<Material>(`/nguyen-lieu/${encodeURIComponent(id)}/trang-thai`, {
    method: "PATCH",
    body: jsonBody({ trang_thai, ...reason }),
  });
