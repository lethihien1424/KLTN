export type Decimal = string;
export type Material = {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  trang_thai: string;
};
export type BomLine = {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  ty_le_phoi_tron: Decimal;
};
export type Bom = {
  ma_cong_thuc: string;
  ten_cong_thuc: string;
  ma_san_pham: string;
  ten_san_pham: string;
  he_so_thu_hoi: Decimal;
  ty_le_hao_hut: Decimal;
  trang_thai: string;
  thoi_gian_tao: string;
  thoi_gian_cap_nhat: string;
  chi_tiet: BomLine[];
};
export type Stock = Material & {
  ngay_ghi_nhan: string;
  ton_kho_thuc_te: Decimal;
  so_luong_book: Decimal;
  ton_kho_kha_dung: Decimal;
  ton_kho_an_toan: Decimal;
  ton_kho_toi_da: Decimal;
};
export type Supplier = {
  ma_ncc: string;
  ten_ncc: string;
  trang_thai: string;
  diem_dieu_kien_thuong_mai: Decimal | null;
  ty_le_giao_dung_han_thuc_te: Decimal | null;
  ty_le_giao_du_thuc_te: Decimal | null;
};
export type Mapping = {
  ma_nguyen_lieu_ncc: string;
  ma_ncc: string;
  ten_ncc: string;
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  don_gia_nguyen_lieu: Decimal;
  so_luong_ton_kho: Decimal;
  so_luong_book: Decimal;
  so_luong_xuat: Decimal;
  lead_time_ngay: number;
  ty_le_chat_luong_dat: Decimal;
  ty_le_giao_dung_han: Decimal;
  ty_le_giao_du: Decimal;
};
export type DemandLine = {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  nhu_cau_du_bao_kg: Decimal;
  ton_kho_kha_dung: Decimal;
  ton_kho_an_toan: Decimal;
  so_luong_dang_ve: Decimal;
  so_luong_thieu_kg: Decimal;
  ton_kho_toi_da: Decimal;
  so_luong_can_mua_kg: Decimal;
};
export type Demand = { ma_lich_su_du_bao: string; chi_tiet: DemandLine[] };
export type Suggestion = {
  ma_ncc: string;
  ten_ncc: string;
  don_gia: Decimal;
  ton_kho_kha_dung_ncc: Decimal;
  lead_time_ngay: number;
  diem_ncc: Decimal | null;
  ty_le_giao_dung_han_thuc_te: Decimal | null;
  ty_le_giao_du_thuc_te: Decimal | null;
  du_kha_nang_cung_cap: boolean;
};
export type Suggestions = {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  so_luong_can_mua: Decimal;
  nha_cung_cap: Suggestion[];
};
export type ProposalLine = {
  ma_chi_tiet: string;
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  ma_ncc: string;
  ten_ncc: string;
  so_luong_de_xuat_kg: Decimal;
  don_gia_du_kien: Decimal;
};
export type Proposal = {
  ma_de_xuat: string;
  ngay_de_xuat_nhap_hang: string;
  ngay_tao_de_xuat: string;
  ghi_chu: string | null;
  trang_thai: string;
  nguoi_tao: string | null;
  nguoi_duyet: string | null;
  thoi_gian_duyet: string | null;
  ly_do_tu_choi: string | null;
  chi_tiet: ProposalLine[];
};
export type OrderLine = {
  ma_chi_tiet_don_mua: string;
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  so_luong_mua: Decimal;
  don_gia_vnd_kg: Decimal;
  thanh_tien: Decimal;
  so_luong_thuc_nhan: Decimal;
  ly_do_khong_nhan: string | null;
};
export type Order = {
  ma_don_mua: string;
  ma_ncc: string;
  ten_ncc: string;
  ma_de_xuat: string | null;
  nguoi_tao: string | null;
  ngay_dat_hang: string;
  ngay_du_kien_giao: string;
  ngay_giao_thuc_te: string | null;
  tong_tien: Decimal;
  trang_thai: string;
  nguoi_duyet: string | null;
  thoi_gian_duyet: string | null;
  ly_do_tu_choi: string | null;
  chi_tiet: OrderLine[];
};
export type Performance = {
  ma_ncc: string;
  ten_ncc: string;
  diem_ncc: Decimal | null;
  ty_le_giao_dung_han_thuc_te: Decimal | null;
  ty_le_giao_du_thuc_te: Decimal | null;
};
export type Overview = {
  nguyen_lieu: { tong_so: number; duoi_ton_an_toan: number };
  de_xuat_nhap_hang: Record<string, number>;
  don_mua: Record<string, number>;
  mua_hang: { gia_tri_da_duyet: Decimal; gia_tri_da_nhan_hang: Decimal };
  nha_cung_cap: { tong_so: number; co_du_lieu_hieu_suat_thuc_te: number };
};
export type StockAlert = Material & {
  ngay_ghi_nhan: string;
  ton_kho_kha_dung: Decimal;
  ton_kho_an_toan: Decimal;
  so_luong_thieu_an_toan: Decimal;
};
