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
  san_pham?: import("./congThucService").BomProduct | null;
  dinh_luong?: {
    khoi_luong_thanh_pham_kg: string;
    tong_nguyen_lieu_kg: string;
    hao_hut_kg: string;
    chi_tiet: { ma_nguyen_lieu: string; ty_le_phoi_tron: string; khoi_luong_kg: string }[];
  } | null;
  loi_dinh_luong?: string | null;
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
  hang_dang_ve: Decimal;
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
export type ForecastDemandDetail = {
  ma_lich_su_du_bao: string;
  thoi_gian_chay: string;
  so_tuan_du_bao: number;
  trang_thai: string | null;
  tu_ngay: string | null;
  den_ngay: string | null;
  tong_san_pham: number;
  du_bom: boolean;
  san_pham: {
    ma_san_pham: string;
    ten_san_pham: string;
    so_luong_du_bao: Decimal;
    bom: { ma_cong_thuc: string; ten_cong_thuc: string; khoi_luong_thanh_pham_kg: Decimal; he_so_thu_hoi: Decimal; ty_le_hao_hut: Decimal } | null;
    loi_bom: string | null;
  }[];
  nguyen_lieu: {
    ma_nguyen_lieu: string;
    ten_nguyen_lieu: string;
    nhu_cau_du_bao_kg: Decimal;
    cach_tinh: {
      ma_san_pham: string; ma_cong_thuc: string;
      so_luong_du_bao: Decimal; khoi_luong_thanh_pham_kg: Decimal;
      he_so_thu_hoi: Decimal; ty_le_phoi_tron: Decimal;
      kg_moi_san_pham: Decimal; nhu_cau_kg: Decimal;
    }[];
  }[];
};
export type Suggestion = {
  giai_thich_xep_hang?: SupplierRankingExplanation | null;
  ma_nguyen_lieu_ncc: string;
  trang_thai_cung_ung: "DA_XAC_NHAN_DU" | "DA_XAC_NHAN_KHONG_DU" | "CHUA_XAC_NHAN";
  do_day_du_kpi: Decimal;
  diem_xep_hang: Decimal;
  nguon_diem: string;
  xac_nhan: { id: string; so_luong_can_mua: Decimal; so_luong_xac_nhan: Decimal; ngay_xac_nhan: string; hieu_luc_den: string; nguoi_xac_nhan: string; nguon_xac_nhan: string; ly_do: string; ghi_chu: string | null } | null;
  ma_ncc: string;
  ten_ncc: string;
  don_gia: Decimal;
  ton_kho_kha_dung_ncc?: Decimal;
  lead_time_ngay: number;
  diem_ncc: Decimal | null;
  ty_le_giao_dung_han_thuc_te: Decimal | null;
  ty_le_giao_du_thuc_te: Decimal | null;
  du_kha_nang_cung_cap: boolean;
};
export type Suggestions = {
  chinh_sach_xep_hang?: SupplierRankingPolicy | null;
  tinh_luc?: string;
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  so_luong_can_mua: Decimal;
  nha_cung_cap: Suggestion[];
};
export type SupplierRankingPolicy = {
  trong_so_gia: Decimal; trong_so_kpi: Decimal; nhom_cung_ung: string[];
  cong_thuc: string; cong_thuc_gia: string; sap_xep: string; thieu_kpi: string; lam_tron: string;
};
export type SupplierRankingExplanation = {
  diem_gia: Decimal; dong_gop_gia: Decimal; dong_gop_kpi: Decimal; nhom_uu_tien: number; nhan_nhom: string;
  vi_tri: number; so_sanh: string; phep_tinh_gia: string; phep_tinh_dong_gop_gia: string;
  phep_tinh_dong_gop_kpi: string; phep_tinh_tong: string;
  gia: { ma_nguyen_lieu_ncc: string; ma_nguyen_lieu: string; don_gia: Decimal; gia_thap_nhat: Decimal;
    don_vi_tien: string; don_vi_nguyen_lieu: string; don_vi_gia: string | null; cap_nhat_luc: string | null; ghi_chu: string };
  thoi_gian_giao: { ma_nguyen_lieu_ncc: string; lead_time_ngay: number; ghi_chu: string };
  cung_ung: { ma_lich_su_du_bao: string | null; so_luong_yeu_cau: Decimal; so_luong_da_phan_bo: Decimal;
    so_luong_con_lai: Decimal | null; xac_nhan_con_hieu_luc: boolean; phep_tinh: string; ghi_chu: string };
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
  ma_lich_su_du_bao?: string | null;
  yeu_cau_xac_nhan?: boolean;
  ly_do_chua_xac_nhan?: string | null;
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
  nguon?: "EXCEL_TRUC_TIEP" | "DE_XUAT" | "TRUC_TIEP";
  ma_tham_chieu?: string | null;
  ghi_chu?: string | null;
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
  ty_le_chat_luong_dat_thuc_te?: Decimal | null;
  thoi_gian_giao_tb_ngay?: Decimal | null;
  so_don?: number;
  so_don_dang_giao?: number;
  so_phieu?: number;
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
