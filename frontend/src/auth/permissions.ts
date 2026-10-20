// export function hasPermission(
//   permissions: readonly string[] | undefined,
//   permission: string,
// ): boolean {
//   return permissions?.includes(permission) ?? false;
// }

// export function hasAllPermissions(
//   permissions: readonly string[] | undefined,
//   required: readonly string[],
// ): boolean {
//   return required.every((permission) => hasPermission(permissions, permission));
// }

// D:\KLTN\KLTN\frontend\src\auth\permissions.ts
type PermissionPair = readonly [feature: string, action: string];
const LEGACY_PERMISSIONS: Record<string, PermissionPair> = {
  USER_VIEW: ["tai_khoan", "XEM"],
  USER_CREATE: ["tai_khoan", "THEM"],
  USER_UPDATE: ["tai_khoan", "SUA"],
  USER_DELETE: ["tai_khoan", "XOA"],
  USER_EXPORT: ["tai_khoan", "XUAT_EXCEL"],

  ROLE_VIEW: ["phan_quyen", "XEM"],
  ROLE_CREATE: ["phan_quyen", "THEM"],
  ROLE_UPDATE: ["phan_quyen", "SUA"],
  ROLE_DELETE: ["phan_quyen", "XOA"],

  VIEW_REASON_CONFIG: ["quan_ly_ly_do", "XEM"],
  CREATE_REASON_CONFIG: ["quan_ly_ly_do", "THEM"],
  UPDATE_REASON_CONFIG: ["quan_ly_ly_do", "SUA"],
  CONFIRM_REASON_CONFIG: ["quan_ly_ly_do", "XAC_NHAN"],

  VIEW_AUDIT_LOG: ["nhat_ky_hoat_dong", "XEM"],
  AUDIT_VIEW: ["nhat_ky_hoat_dong", "XEM"],
  AUDIT_EXPORT: ["nhat_ky_hoat_dong", "XUAT_EXCEL"],

  SAN_PHAM_VIEW: ["san_pham", "XEM"],
  SAN_PHAM_CREATE: ["san_pham", "THEM"],
  SAN_PHAM_UPDATE: ["san_pham", "SUA"],
  SAN_PHAM_DELETE: ["san_pham", "XOA"],
  SAN_PHAM_EXPORT: ["san_pham", "XUAT_EXCEL"],

  DU_BAO_VIEW: ["du_bao_nhu_cau", "XEM"],
  DU_BAO_RUN: ["du_bao_nhu_cau", "CHAY_DU_BAO"],
  DU_BAO_EXPORT: ["du_bao_nhu_cau", "XUAT_EXCEL"],

  NGUYEN_LIEU_VIEW: ["nguyen_lieu", "XEM"],
  NGUYEN_LIEU_CREATE: ["nguyen_lieu", "THEM"],
  NGUYEN_LIEU_UPDATE: ["nguyen_lieu", "SUA"],
  NGUYEN_LIEU_CHANGE_STATUS: ["nguyen_lieu", "SUA"],
  NGUYEN_LIEU_DELETE: ["nguyen_lieu", "XOA"],
  NGUYEN_LIEU_CONFIRM: ["nguyen_lieu", "XAC_NHAN"],
  NGUYEN_LIEU_EXPORT: ["nguyen_lieu", "XUAT_EXCEL"],

  CONG_THUC_VIEW: ["cong_thuc", "XEM"],
  CONG_THUC_CREATE: ["cong_thuc", "THEM"],
  CONG_THUC_UPDATE: ["cong_thuc", "SUA"],
  CONG_THUC_DELETE: ["cong_thuc", "XOA"],
  CONG_THUC_CONFIRM: ["cong_thuc", "XAC_NHAN"],
  CONG_THUC_EXPORT: ["cong_thuc", "XUAT_EXCEL"],

  TON_KHO_VIEW: ["ton_kho_nguyen_lieu", "XEM"],
  TON_KHO_CREATE: ["ton_kho_nguyen_lieu", "THEM"],
  TON_KHO_UPDATE: ["ton_kho_nguyen_lieu", "SUA"],
  TON_KHO_DELETE: ["ton_kho_nguyen_lieu", "XOA"],
  TON_KHO_EXPORT: ["ton_kho_nguyen_lieu", "XUAT_EXCEL"],

  NHA_CUNG_CAP_VIEW: ["nha_cung_cap", "XEM"],
  NHA_CUNG_CAP_CREATE: ["nha_cung_cap", "THEM"],
  NHA_CUNG_CAP_UPDATE: ["nha_cung_cap", "SUA"],
  NHA_CUNG_CAP_DELETE: ["nha_cung_cap", "XOA"],
  NHA_CUNG_CAP_CONFIRM: ["nha_cung_cap", "XAC_NHAN"],
  NHA_CUNG_CAP_SCORE: ["nha_cung_cap", "TINH_DIEM"],
  NHA_CUNG_CAP_EXPORT: ["nha_cung_cap", "XUAT_EXCEL"],

  NHA_CUNG_CAP_PERFORMANCE_VIEW: [
    "hieu_suat_nha_cung_cap",
    "XEM",
  ],

  NGUYEN_LIEU_NCC_VIEW: ["nguyen_lieu_nha_cung_cap", "XEM"],
  NGUYEN_LIEU_NCC_CREATE: ["nguyen_lieu_nha_cung_cap", "THEM"],
  NGUYEN_LIEU_NCC_UPDATE: ["nguyen_lieu_nha_cung_cap", "SUA"],
  NGUYEN_LIEU_NCC_DELETE: ["nguyen_lieu_nha_cung_cap", "XOA"],
  NGUYEN_LIEU_NCC_EXPORT: [
    "nguyen_lieu_nha_cung_cap",
    "XUAT_EXCEL",
  ],

  NHU_CAU_NGUYEN_LIEU_VIEW: ["nhu_cau_nguyen_lieu", "XEM"],
  NHU_CAU_NGUYEN_LIEU_EXPORT: [
    "nhu_cau_nguyen_lieu",
    "XUAT_EXCEL",
  ],

  GOI_Y_NHA_CUNG_CAP_VIEW: ["goi_y_nha_cung_cap", "XEM"],
  GOI_Y_NHA_CUNG_CAP_EXPORT: [
    "goi_y_nha_cung_cap",
    "XUAT_EXCEL",
  ],

  DE_XUAT_NHAP_HANG_VIEW: ["de_xuat_nhap_hang", "XEM"],
  DE_XUAT_NHAP_HANG_CREATE: ["de_xuat_nhap_hang", "THEM"],
  DE_XUAT_NHAP_HANG_APPROVE: ["de_xuat_nhap_hang", "DUYET"],
  DE_XUAT_NHAP_HANG_REJECT: ["de_xuat_nhap_hang", "TU_CHOI"],
  DE_XUAT_NHAP_HANG_EXPORT: [
    "de_xuat_nhap_hang",
    "XUAT_EXCEL",
  ],

  DON_MUA_VIEW: ["don_mua_nguyen_lieu", "XEM"],
  DON_MUA_CREATE: ["don_mua_nguyen_lieu", "THEM"],
  DON_MUA_UPDATE: ["don_mua_nguyen_lieu", "SUA"],
  DON_MUA_DELETE: ["don_mua_nguyen_lieu", "XOA"],
  DON_MUA_APPROVE: ["don_mua_nguyen_lieu", "DUYET"],
  DON_MUA_REJECT: ["don_mua_nguyen_lieu", "TU_CHOI"],
  DON_MUA_RECEIVE: ["don_mua_nguyen_lieu", "XAC_NHAN"],
  DON_MUA_EXPORT: ["don_mua_nguyen_lieu", "XUAT_EXCEL"],

  KE_HOACH_MUA_HANG_VIEW: ["ke_hoach_mua_hang", "XEM"],
  KE_HOACH_MUA_HANG_CREATE: ["ke_hoach_mua_hang", "THEM"],
  KE_HOACH_MUA_HANG_UPDATE: ["ke_hoach_mua_hang", "SUA"],
  KE_HOACH_MUA_HANG_DELETE: ["ke_hoach_mua_hang", "XOA"],
  KE_HOACH_MUA_HANG_APPROVE: ["ke_hoach_mua_hang", "DUYET"],
  KE_HOACH_MUA_HANG_REJECT: ["ke_hoach_mua_hang", "TU_CHOI"],
  KE_HOACH_MUA_HANG_EXPORT: [
    "ke_hoach_mua_hang",
    "XUAT_EXCEL",
  ],

  DASHBOARD_VIEW: ["dashboard_mua_hang", "XEM"],

  IMPORT_USERS: ["tai_khoan", "NHAP_FILE"],
  IMPORT_SAN_PHAM: ["san_pham", "NHAP_FILE"],
  IMPORT_DON_HANG: ["du_lieu_ban_hang", "NHAP_FILE"],
  IMPORT_CTKM: ["du_lieu_ban_hang", "NHAP_FILE"],
  IMPORT_NGUYEN_LIEU: ["nguyen_lieu", "NHAP_FILE"],
  IMPORT_NHA_CUNG_CAP: ["nha_cung_cap", "NHAP_FILE"],
  IMPORT_NGUYEN_LIEU_NCC: [
    "nguyen_lieu_nha_cung_cap",
    "NHAP_FILE",
  ],
  IMPORT_TON_KHO: ["ton_kho_nguyen_lieu", "NHAP_FILE"],
  IMPORT_CONG_THUC: ["cong_thuc", "NHAP_FILE"],
};

export function hasPermission(
  permissions: readonly string[] | undefined,
  permission: string,
): boolean {
  if (!permissions) return false;
  const pair = LEGACY_PERMISSIONS[permission];
  const key = pair ? `${pair[0]}:${pair[1]}` : permission;
  return permissions.includes(key) || permissions.includes(permission);
}

export function hasAllPermissions(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  return required.every(permission => hasPermission(permissions, permission));
}

// Backend trả cặp quyền; mở rộng alias chỉ để các page cũ tiếp tục hoạt động.
export function permissionDetailsToKeys(
  details: readonly { chuc_nang: string; thao_tac: string }[],
): string[] {
  const canonical = new Set(details.map(item => `${item.chuc_nang}:${item.thao_tac}`));
  const result = new Set(canonical);
  for (const [alias, pair] of Object.entries(LEGACY_PERMISSIONS)) {
    if (canonical.has(`${pair[0]}:${pair[1]}`)) result.add(alias);
  }
  return [...result];
}

export function permissionKeysToDetails(
  keys: readonly string[] | undefined,
): { chuc_nang: string; thao_tac: string }[] {
  const selected = new Map<string, { chuc_nang: string; thao_tac: string }>();
  for (const key of keys ?? []) {
    const pair = LEGACY_PERMISSIONS[key];
    const parts = pair ?? key.split(":");
    if (parts.length !== 2 || !parts[0] || !parts[1]) continue;
    const [chuc_nang, thao_tac] = parts;
    selected.set(`${chuc_nang}:${thao_tac}`, { chuc_nang, thao_tac });
  }
  return [...selected.values()];
}
