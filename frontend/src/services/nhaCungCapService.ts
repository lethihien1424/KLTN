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
export const scoreSupplier = (id?: string) =>
  api<unknown>(
    id
      ? `/nha-cung-cap/${encodeURIComponent(id)}/tinh-diem`
      : "/nha-cung-cap/tinh-diem",
    { method: "POST" },
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
