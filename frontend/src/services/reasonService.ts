//D:\KLTN\KLTN\frontend\src\services\reasonService.ts
import { api, jsonBody, queryString } from "./apiClient";
export type Reason = {
  id: string;
  ma_ly_do: string;
  ten_ly_do: string;
  ghi_chu: string | null;
  trang_thai: string;
  chuc_nang_ap_dung: string[];
  created_at: string;
};
export type ReasonSelection = { ly_do_id: string; ghi_chu: string | null };
export const reasonFunctions = [
  { value: "DOI_TRANG_THAI_NGUYEN_LIEU", label: "Đổi trạng thái nguyên liệu" },
  { value: "DOI_TRANG_THAI_CONG_THUC", label: "Đổi trạng thái công thức" },
  {
    value: "DOI_TRANG_THAI_NHA_CUNG_CAP",
    label: "Đổi trạng thái nhà cung cấp",
  },
];
export type Paged<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};
export const applicableReasons = (code: string) =>
  api<Reason[]>("/ly-do/ap-dung" + queryString({ chuc_nang: code }));
export const listReasons = (query: Record<string, string | number>) =>
  api<Paged<Reason>>("/ly-do" + queryString(query));
export const saveReason = (
  value: Pick<
    Reason,
    "ten_ly_do" | "ghi_chu" | "trang_thai" | "chuc_nang_ap_dung"
  >,
  id?: string,
) =>
  api<Reason>("/ly-do" + (id ? "/" + encodeURIComponent(id) : ""), {
    method: id ? "PUT" : "POST",
    body: jsonBody(value),
  });
export const changeReasonStatus = (id: string, trang_thai: string) =>
  api<Reason>("/ly-do/" + encodeURIComponent(id) + "/trang-thai", {
    method: "PATCH",
    body: jsonBody({ trang_thai }),
  });
