import { api, jsonBody } from "./apiClient";
import type { Order } from "./purchaseTypes";
export type OrderInput = {
  ma_ncc: string;
  ngay_dat_hang: string;
  ngay_du_kien_giao: string;
  chi_tiet: { ma_nguyen_lieu: string; so_luong_mua: string }[];
};
export type ReceiptInput = {
  ngay_giao_thuc_te: string;
  chi_tiet: {
    ma_chi_tiet_don_mua: string;
    so_luong_thuc_nhan: string;
    ly_do_khong_nhan: string | null;
  }[];
};
export const listOrders = () => api<Order[]>("/don-mua-nguyen-lieu");
export const getOrder = (id: string) =>
  api<Order>(`/don-mua-nguyen-lieu/${encodeURIComponent(id)}`);
export const saveOrder = (data: OrderInput, id?: string) =>
  api<Order>(
    id
      ? `/don-mua-nguyen-lieu/${encodeURIComponent(id)}`
      : "/don-mua-nguyen-lieu",
    { method: id ? "PUT" : "POST", body: jsonBody(data) },
  );
export const reviewOrder = (id: string, reason?: string) =>
  api<Order>(
    `/don-mua-nguyen-lieu/${encodeURIComponent(id)}/${reason === undefined ? "duyet" : "tu-choi"}`,
    {
      method: "PATCH",
      ...(reason === undefined
        ? {}
        : { body: jsonBody({ ly_do_tu_choi: reason }) }),
    },
  );
export const receiveOrder = (id: string, data: ReceiptInput) =>
  api<Order>(`/don-mua-nguyen-lieu/${encodeURIComponent(id)}/nhan-hang`, {
    method: "PATCH",
    body: jsonBody(data),
  });
