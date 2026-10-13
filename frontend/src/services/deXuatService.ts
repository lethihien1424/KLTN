import { api, jsonBody } from "./apiClient";
import type { Proposal, Order } from "./purchaseTypes";
export type ProposalInput = {
  ghi_chu: string;
  chi_tiet: {
    ma_nguyen_lieu: string;
    ma_ncc: string;
    so_luong_de_xuat_kg: string;
  }[];
};
export const listProposals = () => api<Proposal[]>("/de-xuat-nhap-hang");
export const getProposal = (id: string) =>
  api<Proposal>(`/de-xuat-nhap-hang/${encodeURIComponent(id)}`);
export const createProposal = (data: ProposalInput) =>
  api<Proposal>("/de-xuat-nhap-hang", { method: "POST", body: jsonBody(data) });
export const reviewProposal = (id: string, reason?: string) =>
  api<Proposal>(
    `/de-xuat-nhap-hang/${encodeURIComponent(id)}/${reason === undefined ? "duyet" : "tu-choi"}`,
    {
      method: "PATCH",
      ...(reason === undefined
        ? {}
        : { body: jsonBody({ ly_do_tu_choi: reason }) }),
    },
  );
export const generateOrders = (id: string, ngay_du_kien_giao: string) =>
  api<{ ma_de_xuat: string; don_mua: Order[] }>(
    `/de-xuat-nhap-hang/${encodeURIComponent(id)}/tao-don-mua`,
    { method: "POST", body: jsonBody({ ngay_du_kien_giao }) },
  );
