// // // D:\KLTN\KLTN\frontend\src\services\dashboardService.ts

// import { api, queryString } from "./apiClient";


// // ==================== NGUYÊN LIỆU SỬ DỤNG ====================

// export interface MaterialUsageItem {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   don_vi_do_luong: string;
//   so_luong_su_dung: number;
//   ty_le_phan_tram: number;
// }

// export interface MaterialUsageResponse {
//   period_type: string;
//   period_label: string;
//   start_date: string;
//   end_date: string;

//   top_used: MaterialUsageItem[];
//   least_used: MaterialUsageItem[];
//   all_materials: MaterialUsageItem[];

//   summary: {
//     tong_luong_su_dung: number;
//     so_loai_nguyen_lieu: number;
//     nguyen_lieu_dung_nhieu_nhat: MaterialUsageItem | null;
//     nguyen_lieu_dung_it_nhat: MaterialUsageItem | null;
//   };
// }

// export async function fetchMaterialUsage(params: {
//   period_type?: "tuan" | "thang" | "nam";
//   year?: number;
//   month?: number;
//   week?: number;
// }): Promise<MaterialUsageResponse> {
//   const query = queryString(params);

//   return api<MaterialUsageResponse>(
//     `/dashboard/nguyen-lieu-tieu-thu${
//       query ? `?${query}` : ""
//     }`,
//   );
// }


// // ==================== SẢN PHẨM TIÊU THỤ ====================

// export interface ProductConsumptionItem {
//   ma_san_pham: string;
//   ten_san_pham: string;
//   don_vi_tinh: string;
//   so_luong_ban: number;
//   doanh_thu: number;
//   so_don_hang: number;
//   ty_le_phan_tram: number;
// }

// export interface ProductConsumptionResponse {
//   period_type: string;
//   period_label: string;
//   start_date: string;
//   end_date: string;

//   top_products: ProductConsumptionItem[];
//   least_products: ProductConsumptionItem[];
//   all_products: ProductConsumptionItem[];

//   summary: {
//     tong_so_luong: number;
//     tong_doanh_thu: number;
//     tong_don_hang: number;
//     so_loai_san_pham: number;
//     san_pham_ban_chay_nhat: ProductConsumptionItem | null;
//     san_pham_ban_it_nhat: ProductConsumptionItem | null;
//   };
// }

// export async function fetchProductConsumption(params: {
//   period_type?: "tuan" | "thang" | "nam";
//   year?: number;
//   month?: number;
//   week?: number;
//   from_date?: string;
//   to_date?: string;
// }): Promise<ProductConsumptionResponse> {
//   const query = queryString(params);

//   return api<ProductConsumptionResponse>(
//     `/dashboard/san-pham-tieu-thu${
//       query ? `?${query}` : ""
//     }`,
//   );
// }


// // ==================== SO SÁNH PROPHET ====================

// export interface ProphetComparisonItem {
//   nhan_thoi_gian: string;
//   tu_ngay: string;
//   den_ngay: string;

//   thuc_te: number;
//   du_bao_prophet: number;

//   can_duoi: number | null;
//   can_tren: number | null;

//   chenh_lech: number;
//   phan_tram_lech: number;

//   danh_gia:
//     | "VUOT_DU_BAO"
//     | "DUOI_DU_BAO"
//     | "KHOP";
// }

// export interface ProphetProductComparisonItem {
//   ma_san_pham: string;
//   ten_san_pham: string;
//   thuc_te: number;
//   du_bao_prophet: number;
//   chenh_lech: number;
//   phan_tram_lech: number;
// }

// export interface ProphetComparisonResponse {
//   tu_ngay: string;
//   den_ngay: string;
//   ma_san_pham: string | null;

//   periods: ProphetComparisonItem[];
//   products: ProphetProductComparisonItem[];

//   summary: {
//     tong_thuc_te: number;
//     tong_prophet: number;
//     tong_chenh_lech: number;
//     phan_tram_lech_tong: number;
//     mae: number;
//     mape: number;
//   };
// }

// export async function fetchProphetComparison(params: {
//   from_date?: string;
//   to_date?: string;
//   ma_san_pham?: string;
// }): Promise<ProphetComparisonResponse> {
//   const query = queryString(params);

//   return api<ProphetComparisonResponse>(
//     `/dashboard/so-sanh-prophet${
//       query ? `?${query}` : ""
//     }`,
//   );
// }


// // ==================== ĐIỂM NHÀ CUNG CẤP ====================

// export interface SupplierPerformanceItem {
//   ma_ncc: string;
//   ten_ncc: string;

//   // Backend serialize Decimal thành chuỗi.
//   diem_ncc: string | null;
//   ty_le_giao_dung_han_thuc_te: string | null;
//   ty_le_giao_du_thuc_te: string | null;

//   xep_loai:
//     | "XUAT_SAC"
//     | "TOT"
//     | "TRUNG_BINH"
//     | "YEU";
// }

// export async function fetchSupplierScores():
//   Promise<SupplierPerformanceItem[]> {
//   return api<SupplierPerformanceItem[]>(
//     "/dashboard/hieu-suat-nha-cung-cap",
//   );
// }


// // ==================== TÀI KHOẢN VÀ VAI TRÒ ====================

// export interface RoleGroupStat {
//   vai_tro: string;
//   label: string;
//   so_luong: number;
//   ty_le: number;
// }

// export interface AccountStatisticsResponse {
//   tong_tai_khoan: number;
//   dang_hoat_dong: number;
//   ngung_hoat_dong: number;
//   ty_le_hoat_dong: number;

//   vai_tro_distribution: RoleGroupStat[];
//   recent_logins: {
//     ten_tai_khoan: string;
//     ma_nguoi_dung: string;
//     vai_tro: string;
//     thoi_gian_dang_nhap: string;
//   }[];
// }

// export async function fetchAccountStatistics():
//   Promise<AccountStatisticsResponse> {
//   return api<AccountStatisticsResponse>(
//     "/dashboard/thong-ke-tai-khoan",
//   );
// }


// // ==================== CẢNH BÁO TỒN KHO ====================

// export interface InventoryAlertItem {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   don_vi_do_luong: string;
//   ngay_ghi_nhan: string;

//   // Giữ kiểu chuỗi theo serializer Decimal của backend.
//   ton_kho_thuc_te: string;
//   so_luong_book: string;
//   ton_kho_kha_dung: string;
//   ton_kho_an_toan: string;
//   so_luong_thieu_an_toan: string;

//   muc_do_canh_bao:
//     | "KHAN_CAP"
//     | "CANH_BAO"
//     | "AN_TOAN";
// }

// export interface InventoryAlertSummary {
//   tong_so_nguyen_lieu: number;
//   duoi_ton_an_toan: number;
//   khan_cap: number;
//   canh_bao: number;
//   an_toan: number;
//   ty_le_an_toan: number;

//   items: InventoryAlertItem[];
// }

// export async function fetchInventoryAlertsDetailed():
//   Promise<InventoryAlertSummary> {
//   return api<InventoryAlertSummary>(
//     "/dashboard/canh-bao-ton-kho-chi-tiet",
//   );
// }


// // ==================== ĐƠN HÀNG BÁN ====================

// export interface OrderDetailStatItem {
//   ma_don_hang: string;
//   ngay_ban: string | null;
//   tong_so_luong: number;
//   tong_gia_tri: number;
//   so_mat_hang: number;
// }

// export interface OrderTimelineStat {
//   nhan_thoi_gian: string;
//   so_don_hang: number;
//   tong_so_luong: number;
//   tong_gia_tri: number;
// }

// export interface OrderStatsResponse {
//   period_type: string;
//   period_label: string;
//   start_date: string;
//   end_date: string;

//   top_orders: OrderDetailStatItem[];
//   least_orders: OrderDetailStatItem[];
//   timeline: OrderTimelineStat[];

//   summary: {
//     tong_so_don_hang: number;
//     tong_so_luong_ban: number;
//     tong_doanh_thu: number;
//     gia_tri_trung_binh_don: number;
//     don_hang_lon_nhat: OrderDetailStatItem | null;
//     don_hang_nho_nhat: OrderDetailStatItem | null;
//   };
// }

// export async function fetchOrderStats(params: {
//   period_type?: "tuan" | "thang" | "nam";
//   year?: number;
//   month?: number;
//   week?: number;
// }): Promise<OrderStatsResponse> {
//   const query = queryString(params);

//   return api<OrderStatsResponse>(
//     `/dashboard/don-hang${
//       query ? `?${query}` : ""
//     }`,
//   );
// }


// // ==================== CÔNG THỨC / BOM ====================

// export interface FormulaMaterialUsageItem {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   don_vi_do_luong: string;
//   so_cong_thuc_tham_gia: number;
//   ty_le_phoi_tron_tb: number;
//   trang_thai: string;
// }

// export interface FormulaBomStatsResponse {
//   tong_so_cong_thuc: number;
//   tong_so_nguyen_lieu: number;

//   nguyen_lieu_trong_bom: number;
//   nguyen_lieu_chua_dung: number;

//   top_materials: FormulaMaterialUsageItem[];
//   least_materials: FormulaMaterialUsageItem[];
//   unused_materials: FormulaMaterialUsageItem[];
// }

// export async function fetchFormulaBomStats():
//   Promise<FormulaBomStatsResponse> {
//   return api<FormulaBomStatsResponse>(
//     "/dashboard/cong-thuc-bom",
//   );
// }


// // ==================== TỒN KHO VÀ LƯỢNG BOOK ====================

// export interface InventoryStockItem {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   don_vi_do_luong: string;

//   so_luong_book: number;
//   ton_kho_thuc_te: number;
//   ton_kho_kha_dung: number;
//   ton_kho_an_toan: number;
//   so_luong_thieu_an_toan: number;

//   muc_do_canh_bao:
//     | "KHAN_CAP"
//     | "CANH_BAO"
//     | "AN_TOAN";
// }

// export interface InventoryStockStatsResponse {
//   tong_nguyen_lieu: number;
//   tong_luong_book: number;
//   tong_ton_thuc_te: number;

//   top_booked: InventoryStockItem[];
//   least_booked: InventoryStockItem[];

//   top_actual_stock: InventoryStockItem[];
//   least_actual_stock: InventoryStockItem[];

//   alerts: InventoryStockItem[];
// }

// export async function fetchInventoryStockStats():
//   Promise<InventoryStockStatsResponse> {
//   return api<InventoryStockStatsResponse>(
//     "/dashboard/ton-kho-book",
//   );
// }


// // ==================== NGUYÊN LIỆU CUNG ỨNG ====================

// export interface SupplierMaterialDetailItem {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   ma_ncc: string;
//   ten_ncc: string;

//   don_gia: number;
//   lead_time_ngay: number;

//   // null là chưa có dữ liệu; 0 là tỷ lệ thực bằng 0%.
//   ty_le_chat_luong_dat: number | null;
//   ty_le_giao_dung_han: number | null;
//   ty_le_giao_du: number | null;
// }

// export interface SupplierSummaryByMaterial {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;

//   so_nha_cung_cap: number;
//   don_gia_thap_nhat: number;
//   don_gia_cao_nhat: number;
// }

// export interface SupplierMaterialsStatsResponse {
//   top_supplied_materials: SupplierSummaryByMaterial[];
//   least_supplied_materials: SupplierSummaryByMaterial[];

//   highest_price_items: SupplierMaterialDetailItem[];
//   lowest_price_items: SupplierMaterialDetailItem[];

//   best_quality_items: SupplierMaterialDetailItem[];
//   worst_quality_items: SupplierMaterialDetailItem[];

//   best_ontime_items: SupplierMaterialDetailItem[];
//   worst_ontime_items: SupplierMaterialDetailItem[];
// }

// export async function fetchSupplierMaterialsStats():
//   Promise<SupplierMaterialsStatsResponse> {
//   return api<SupplierMaterialsStatsResponse>(
//     "/dashboard/nguyen-lieu-cung-ung",
//   );
// }


// // ==================== GỢI Ý NHÀ CUNG CẤP ====================

// export interface SuggestedSupplierItem {
//   ma_ncc: string;
//   ten_ncc: string;

//   so_lan_goi_y_top1: number;
//   so_nguyen_lieu_cung_ung: number;

//   diem_ncc: number | null;
//   ty_le_dung_han: number | null;

//   trang_thai_goi_y: string;
// }

// export interface SupplierSuggestionStatsResponse {
//   co_du_lieu_lich_su: boolean;
//   thong_bao: string | null;

//   tong_ncc: number;

//   // null khi chưa có nguồn lịch sử để xác định.
//   so_ncc_duoc_goi_y: number | null;
//   so_ncc_khong_goi_y: number | null;

//   top_suggested: SuggestedSupplierItem[];
//   least_suggested: SuggestedSupplierItem[];
//   not_suggested: SuggestedSupplierItem[];
// }

// export async function fetchSupplierSuggestionStats():
//   Promise<SupplierSuggestionStatsResponse> {
//   return api<SupplierSuggestionStatsResponse>(
//     "/dashboard/goi-y-nha-cung-cap",
//   );
// }


// // ==================== NHU CẦU NGUYÊN LIỆU ====================

// export interface MaterialDemandItem {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   don_vi_do_luong: string;

//   nhu_cau: number;
//   ton_kho_kha_dung: number;
//   ton_kho_an_toan: number;
//   luong_can_mua: number;
// }

// export interface MaterialDemandStatsResponse {
//   co_du_lieu_du_bao: boolean;
//   thong_bao: string | null;
//   ma_lich_su_du_bao: string | null;

//   tong_nhu_cau: number;
//   tong_can_mua: number;

//   top_demand: MaterialDemandItem[];
//   least_demand: MaterialDemandItem[];
//   all_demand: MaterialDemandItem[];
// }

// export async function fetchMaterialDemandStats():
//   Promise<MaterialDemandStatsResponse> {
//   return api<MaterialDemandStatsResponse>(
//     "/dashboard/nhu-cau-nguyen-lieu",
//   );
// }


// // ==================== ĐƠN MUA NGUYÊN LIỆU ====================

// export interface PurchaseOrderMaterialStat {
//   ma_nguyen_lieu: string;
//   ten_nguyen_lieu: string;
//   don_vi_do_luong: string;

//   so_luong_mua: number;
//   tong_gia_tri: number;
//   so_don_mua: number;
// }

// export interface PurchaseOrderStatsResponse {
//   tong_gia_tri_mua: number;
//   tong_so_don_mua: number;

//   top_purchased: PurchaseOrderMaterialStat[];
//   least_purchased: PurchaseOrderMaterialStat[];
//   all_purchased: PurchaseOrderMaterialStat[];
// }

// export async function fetchPurchaseOrderStats():
//   Promise<PurchaseOrderStatsResponse> {
//   return api<PurchaseOrderStatsResponse>(
//     "/dashboard/don-mua-nguyen-lieu",
//   );
// }


// // ==================== CẤU HÌNH VÀ NHẬT KÝ ====================

// export interface AuditUserStat {
//   ten_nguoi_thao_tac: string;
//   so_lan: number;
// }

// export interface AuditFeatureStat {
//   chuc_nang: string;
//   so_lan: number;
// }

// export interface ConfigAuditStatsResponse {
//   tong_nhat_ky: number;
//   top_users: AuditUserStat[];
//   top_features: AuditFeatureStat[];
//   ty_le_thanh_cong: number;
// }

// export async function fetchConfigAuditStats():
//   Promise<ConfigAuditStatsResponse> {
//   return api<ConfigAuditStatsResponse>(
//     "/dashboard/cau-hinh-nhat-ky",
//   );
// }
import { api, queryString } from "./apiClient";


// ==================== NGUYÊN LIỆU SỬ DỤNG ====================

export interface MaterialUsageItem {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  so_luong_su_dung: number;
  ty_le_phan_tram: number;
}

export interface MaterialUsageResponse {
  period_type: string;
  period_label: string;
  start_date: string;
  end_date: string;

  top_used: MaterialUsageItem[];
  least_used: MaterialUsageItem[];
  all_materials: MaterialUsageItem[];

  summary: {
    tong_luong_su_dung: number;
    so_loai_nguyen_lieu: number;
    nguyen_lieu_dung_nhieu_nhat: MaterialUsageItem | null;
    nguyen_lieu_dung_it_nhat: MaterialUsageItem | null;
  };
}

export async function fetchMaterialUsage(params: {
  period_type?: "tuan" | "thang" | "nam";
  year?: number;
  month?: number;
  week?: number;
}): Promise<MaterialUsageResponse> {
  const query = queryString(params);

  return api<MaterialUsageResponse>(
    `/dashboard/nguyen-lieu-tieu-thu${
      query ? `?${query}` : ""
    }`,
  );
}


// ==================== SẢN PHẨM TIÊU THỤ ====================

export interface ProductConsumptionItem {
  ma_san_pham: string;
  ten_san_pham: string;
  don_vi_tinh: string;
  so_luong_ban: number;
  doanh_thu: number;
  so_don_hang: number;
  ty_le_phan_tram: number;
}

export interface ProductConsumptionResponse {
  period_type: string;
  period_label: string;
  start_date: string;
  end_date: string;

  top_products: ProductConsumptionItem[];
  least_products: ProductConsumptionItem[];
  all_products: ProductConsumptionItem[];
  formulas?: OrderFormulaUsageItem[];
  materials?: MaterialUsageItem[];

  summary: {
    tong_so_luong: number;
    tong_doanh_thu: number;
    tong_don_hang: number;
    so_loai_san_pham: number;
    san_pham_ban_chay_nhat: ProductConsumptionItem | null;
    san_pham_ban_it_nhat: ProductConsumptionItem | null;
  };
}

export interface OrderFormulaUsageItem {
  ma_cong_thuc: string;
  ten_cong_thuc: string;
  ten_san_pham: string;
  so_luong_san_pham_ban: number;
  so_luong_cong_thuc_su_dung: number;
}

export interface OrderUsageResponse {
  period_type: string;
  period_label: string;
  start_date: string;
  end_date: string;
  products: ProductConsumptionItem[];
  formulas: OrderFormulaUsageItem[];
  materials: MaterialUsageItem[];
}

export async function fetchOrderUsage(params: {
  period_type?: "tuan" | "thang" | "nam";
  year?: number;
  month?: number;
  week?: number;
  from_date?: string;
  to_date?: string;
}): Promise<OrderUsageResponse> {
  const query = queryString(params);
  const response = await api<ProductConsumptionResponse>(
    `/dashboard/san-pham-tieu-thu${query}`,
  );
  return {
    period_type: response.period_type,
    period_label: response.period_label,
    start_date: response.start_date,
    end_date: response.end_date,
    products: response.all_products,
    formulas: response.formulas ?? [],
    materials: response.materials ?? [],
  };
}

export async function fetchProductConsumption(params: {
  period_type?: "tuan" | "thang" | "nam";
  year?: number;
  month?: number;
  week?: number;
  from_date?: string;
  to_date?: string;
}): Promise<ProductConsumptionResponse> {
  const query = queryString(params);

  return api<ProductConsumptionResponse>(
    `/dashboard/san-pham-tieu-thu${
      query ? `?${query}` : ""
    }`,
  );
}


// ==================== SO SÁNH PROPHET ====================

export interface ProphetComparisonItem {
  nhan_thoi_gian: string;
  tu_ngay: string;
  den_ngay: string;

  thuc_te: number;
  du_bao_prophet: number;

  can_duoi: number | null;
  can_tren: number | null;

  chenh_lech: number;
  phan_tram_lech: number;

  danh_gia:
    | "VUOT_DU_BAO"
    | "DUOI_DU_BAO"
    | "KHOP";
}

export interface ProphetProductComparisonItem {
  ma_san_pham: string;
  ten_san_pham: string;
  thuc_te: number;
  du_bao_prophet: number;
  chenh_lech: number;
  phan_tram_lech: number;
}

export interface ProphetComparisonResponse {
  tu_ngay: string;
  den_ngay: string;
  ma_san_pham: string | null;

  periods: ProphetComparisonItem[];
  products: ProphetProductComparisonItem[];

  summary: {
    tong_thuc_te: number;
    tong_prophet: number;
    tong_chenh_lech: number;
    phan_tram_lech_tong: number;
    mae: number;
    mape: number;
  };
}

export async function fetchProphetComparison(params: {
  from_date?: string;
  to_date?: string;
  ma_san_pham?: string;
}): Promise<ProphetComparisonResponse> {
  const query = queryString(params);

  return api<ProphetComparisonResponse>(
    `/dashboard/so-sanh-prophet${
      query ? `?${query}` : ""
    }`,
  );
}


// ==================== ĐIỂM NHÀ CUNG CẤP ====================

export interface SupplierPerformanceItem {
  ma_ncc: string;
  ten_ncc: string;

  // Backend serialize Decimal thành chuỗi.
  diem_ncc: string | null;
  ty_le_giao_dung_han_thuc_te: string | null;
  ty_le_giao_du_thuc_te: string | null;

  xep_loai:
    | "XUAT_SAC"
    | "TOT"
    | "TRUNG_BINH"
    | "YEU";
}

export async function fetchSupplierScores():
  Promise<SupplierPerformanceItem[]> {
  return api<SupplierPerformanceItem[]>(
    "/dashboard/hieu-suat-nha-cung-cap",
  );
}


// ==================== TÀI KHOẢN VÀ VAI TRÒ ====================

export interface RoleGroupStat {
  vai_tro: string;
  label: string;
  so_luong: number;
  ty_le: number;
}

export interface AccountStatisticsResponse {
  tong_tai_khoan: number;
  dang_hoat_dong: number;
  ngung_hoat_dong: number;
  ty_le_hoat_dong: number;

  vai_tro_distribution: RoleGroupStat[];
  recent_logins: {
    ten_tai_khoan: string;
    ma_nguoi_dung: string;
    vai_tro: string;
    thoi_gian_dang_nhap: string;
  }[];
}

export async function fetchAccountStatistics():
  Promise<AccountStatisticsResponse> {
  return api<AccountStatisticsResponse>(
    "/dashboard/thong-ke-tai-khoan",
  );
}


// ==================== CẢNH BÁO TỒN KHO ====================

export interface InventoryAlertItem {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  ngay_ghi_nhan: string;

  // Giữ kiểu chuỗi theo serializer Decimal của backend.
  ton_kho_thuc_te: string;
  so_luong_book: string;
  ton_kho_kha_dung: string;
  ton_kho_an_toan: string;
  so_luong_thieu_an_toan: string;

  muc_do_canh_bao:
    | "KHAN_CAP"
    | "CANH_BAO"
    | "AN_TOAN";
}

export interface InventoryAlertSummary {
  tong_so_nguyen_lieu: number;
  duoi_ton_an_toan: number;
  khan_cap: number;
  canh_bao: number;
  an_toan: number;
  ty_le_an_toan: number;

  items: InventoryAlertItem[];
}

export async function fetchInventoryAlertsDetailed():
  Promise<InventoryAlertSummary> {
  return api<InventoryAlertSummary>(
    "/dashboard/canh-bao-ton-kho-chi-tiet",
  );
}


// ==================== ĐƠN HÀNG BÁN ====================

export interface OrderDetailStatItem {
  ma_don_hang: string;
  ngay_ban: string | null;
  tong_so_luong: number;
  tong_gia_tri: number;
  so_mat_hang: number;
}

export interface OrderTimelineStat {
  nhan_thoi_gian: string;
  so_don_hang: number;
  tong_so_luong: number;
  tong_gia_tri: number;
}

export interface OrderStatsResponse {
  period_type: string;
  period_label: string;
  start_date: string;
  end_date: string;

  top_orders: OrderDetailStatItem[];
  least_orders: OrderDetailStatItem[];
  timeline: OrderTimelineStat[];

  summary: {
    tong_so_don_hang: number;
    tong_so_luong_ban: number;
    tong_doanh_thu: number;
    gia_tri_trung_binh_don: number;
    don_hang_lon_nhat: OrderDetailStatItem | null;
    don_hang_nho_nhat: OrderDetailStatItem | null;
  };
}

export async function fetchOrderStats(params: {
  period_type?: "tuan" | "thang" | "nam";
  year?: number;
  month?: number;
  week?: number;
}): Promise<OrderStatsResponse> {
  const query = queryString(params);

  return api<OrderStatsResponse>(
    `/dashboard/don-hang${
      query ? `?${query}` : ""
    }`,
  );
}


// ==================== CÔNG THỨC / BOM ====================

export interface FormulaMaterialUsageItem {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;
  so_cong_thuc_tham_gia: number;
  ty_le_phoi_tron_tb: number;
  trang_thai: string;
}

export interface FormulaBomStatsResponse {
  tong_so_cong_thuc: number;
  tong_so_nguyen_lieu: number;

  nguyen_lieu_trong_bom: number;
  nguyen_lieu_chua_dung: number;

  top_materials: FormulaMaterialUsageItem[];
  least_materials: FormulaMaterialUsageItem[];
  unused_materials: FormulaMaterialUsageItem[];
}

export async function fetchFormulaBomStats():
  Promise<FormulaBomStatsResponse> {
  return api<FormulaBomStatsResponse>(
    "/dashboard/cong-thuc-bom",
  );
}


// ==================== TỒN KHO VÀ LƯỢNG BOOK ====================

export interface InventoryStockItem {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;

  so_luong_book: number;
  ton_kho_thuc_te: number;
  ton_kho_kha_dung: number;
  ton_kho_an_toan: number;
  so_luong_thieu_an_toan: number;

  muc_do_canh_bao:
    | "KHAN_CAP"
    | "CANH_BAO"
    | "AN_TOAN";
}

export interface InventoryStockStatsResponse {
  all_stock: InventoryStockItem[];
  tong_nguyen_lieu: number;
  tong_luong_book: number;
  tong_ton_thuc_te: number;

  top_booked: InventoryStockItem[];
  least_booked: InventoryStockItem[];

  top_actual_stock: InventoryStockItem[];
  least_actual_stock: InventoryStockItem[];

  alerts: InventoryStockItem[];
}

export async function fetchInventoryStockStats():
  Promise<InventoryStockStatsResponse> {
  return api<InventoryStockStatsResponse>(
    "/dashboard/ton-kho-book",
  );
}


// ==================== NGUYÊN LIỆU CUNG ỨNG ====================

export interface SupplierMaterialDetailItem {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  ma_ncc: string;
  ten_ncc: string;

  don_gia: number;
  lead_time_ngay: number;

  // null là chưa có dữ liệu; 0 là tỷ lệ thực bằng 0%.
  ty_le_chat_luong_dat: number | null;
  ty_le_giao_dung_han: number | null;
  ty_le_giao_du: number | null;
}

export interface SupplierSummaryByMaterial {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;

  so_nha_cung_cap: number;
  don_gia_thap_nhat: number;
  don_gia_cao_nhat: number;
}

export interface SupplierMaterialsStatsResponse {
  all_items?: SupplierMaterialDetailItem[];
  top_supplied_materials: SupplierSummaryByMaterial[];
  least_supplied_materials: SupplierSummaryByMaterial[];

  highest_price_items: SupplierMaterialDetailItem[];
  lowest_price_items: SupplierMaterialDetailItem[];

  best_quality_items: SupplierMaterialDetailItem[];
  worst_quality_items: SupplierMaterialDetailItem[];

  best_ontime_items: SupplierMaterialDetailItem[];
  worst_ontime_items: SupplierMaterialDetailItem[];
}

export async function fetchSupplierMaterialsStats():
  Promise<SupplierMaterialsStatsResponse> {
  return api<SupplierMaterialsStatsResponse>(
    "/dashboard/nguyen-lieu-cung-ung",
  );
}


// ==================== GỢI Ý NHÀ CUNG CẤP ====================

export interface SuggestedSupplierItem {
  ma_ncc: string;
  ten_ncc: string;

  so_lan_goi_y_top1: number;
  so_nguyen_lieu_cung_ung: number;

  diem_ncc: number | null;
  ty_le_dung_han: number | null;

  trang_thai_goi_y: string;
}

export interface SupplierSuggestionStatsResponse {
  co_du_lieu_lich_su: boolean;
  thong_bao: string | null;

  tong_ncc: number;

  // null khi chưa có nguồn lịch sử để xác định.
  so_ncc_duoc_goi_y: number | null;
  so_ncc_khong_goi_y: number | null;

  top_suggested: SuggestedSupplierItem[];
  least_suggested: SuggestedSupplierItem[];
  not_suggested: SuggestedSupplierItem[];
}

export async function fetchSupplierSuggestionStats():
  Promise<SupplierSuggestionStatsResponse> {
  return api<SupplierSuggestionStatsResponse>(
    "/dashboard/goi-y-nha-cung-cap",
  );
}


// ==================== NHU CẦU NGUYÊN LIỆU ====================

export interface MaterialDemandItem {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;

  nhu_cau: number;
  ton_kho_kha_dung: number;
  ton_kho_an_toan: number;
  luong_can_mua: number;
}

export interface MaterialDemandStatsResponse {
  co_du_lieu_du_bao: boolean;
  thong_bao: string | null;
  ma_lich_su_du_bao: string | null;

  tong_nhu_cau: number;
  tong_can_mua: number;

  top_demand: MaterialDemandItem[];
  least_demand: MaterialDemandItem[];
  all_demand: MaterialDemandItem[];
}

export async function fetchMaterialDemandStats():
  Promise<MaterialDemandStatsResponse> {
  return api<MaterialDemandStatsResponse>(
    "/dashboard/nhu-cau-nguyen-lieu",
  );
}


// ==================== ĐƠN MUA NGUYÊN LIỆU ====================

export interface PurchaseOrderMaterialStat {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_do_luong: string;

  so_luong_mua: number;
  tong_gia_tri: number;
  so_don_mua: number;
}

export interface PurchaseOrderStatsResponse {
  tong_gia_tri_mua: number;
  tong_so_don_mua: number;

  top_purchased: PurchaseOrderMaterialStat[];
  least_purchased: PurchaseOrderMaterialStat[];
  all_purchased: PurchaseOrderMaterialStat[];
}

export async function fetchPurchaseOrderStats():
  Promise<PurchaseOrderStatsResponse> {
  return api<PurchaseOrderStatsResponse>(
    "/dashboard/don-mua-nguyen-lieu",
  );
}


// ==================== CẤU HÌNH VÀ NHẬT KÝ ====================

export interface AuditUserStat {
  ten_nguoi_thao_tac: string;
  so_lan: number;
}

export interface AuditFeatureStat {
  chuc_nang: string;
  so_lan: number;
}

export interface ConfigAuditStatsResponse {
  activities: { user_name: string; feature: string; action: string; count: number }[];
  tong_nhat_ky: number;
  top_users: AuditUserStat[];
  top_features: AuditFeatureStat[];
  ty_le_thanh_cong: number;
}

export async function fetchConfigAuditStats():
  Promise<ConfigAuditStatsResponse> {
  return api<ConfigAuditStatsResponse>(
    "/dashboard/cau-hinh-nhat-ky",
  );
}
