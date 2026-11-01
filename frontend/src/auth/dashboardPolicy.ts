// Dashboard permissions are explicit feature/action pairs. No role, wildcard,
// username or legacy capability grants an extra dashboard.
//D:\KLTN_3110\KLTN\frontend\src\auth\dashboardPolicy.ts
// Chỉ quyền XEM thực tế; không suy ra quyền từ vai trò ADMIN.
const purchase = ["don_mua_nguyen_lieu", "ke_hoach_mua_hang", "dashboard_mua_hang"] as const;
const forecast = ["du_bao_nhu_cau", "lich_su_du_bao", "danh_gia_mo_hinh"] as const;
export const dashboardPolicy = {
  products: ["san_pham"],
  orders: ["du_lieu_ban_hang", "san_pham"],
  prophet: forecast,
  materials: ["nguyen_lieu", ...purchase],
  formula: ["cong_thuc"],
  stock: ["ton_kho_nguyen_lieu", "nhu_cau_nguyen_lieu", ...purchase],
  alerts: ["ton_kho_nguyen_lieu", "nhu_cau_nguyen_lieu", ...purchase],
  demand: ["nguyen_lieu", "ton_kho_nguyen_lieu", "nhu_cau_nguyen_lieu", ...purchase, ...forecast],
  purchases: purchase,
  supply: ["nguyen_lieu_nha_cung_cap"],
  suppliers: ["nha_cung_cap", "hieu_suat_nha_cung_cap", "goi_y_nha_cung_cap"],
  suggestions: ["goi_y_nha_cung_cap"],
  accounts: ["tai_khoan", "quan_ly_ly_do", "nhat_ky_hoat_dong"],
  config: ["quan_ly_ly_do", "nhat_ky_hoat_dong"],
} as const;
export type DashboardId = keyof typeof dashboardPolicy;
export const dashboardRouteGroup: Partial<Record<DashboardId, DashboardId>> = {
  products: "orders",
  materials: "prophet", formula: "orders", stock: "prophet", alerts: "prophet", demand: "prophet", purchases: "prophet",
  suppliers: "supply", suggestions: "supply", config: "accounts",
};
export function canViewDashboard(permissions: readonly string[] | undefined, id: DashboardId): boolean {
  const selected = new Set(permissions ?? []);
  return dashboardPolicy[id].some(feature => selected.has(`${feature}:XEM`));
}
