// //D:\KLTN\KLTN\frontend\src\routes\menu.ts
// export const menu = [
//   {
//     path: "/",
//     label: "Tổng quan",
//     permission: "",
//     icon: "◫",
//     group: "HỆ THỐNG",
//   },
//   {
//     path: "/nhap-ban-hang",
//     label: "Nhập dữ liệu bán hàng",
//     permission: "IMPORT_DON_HANG",
//     icon: "↥",
//     group: "HỆ THỐNG",
//   },
//   {
//     path: "/du-bao",
//     label: "Dự báo nhu cầu",
//     permission: "DU_BAO_VIEW",
//     icon: "⌁",
//     group: "HỆ THỐNG",
//   },
//   {
//     path: "/nguyen-lieu",
//     label: "Nguyên liệu",
//     permission: "NGUYEN_LIEU_VIEW",
//     icon: "▧",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/cong-thuc",
//     label: "Công thức / BOM",
//     permission: "CONG_THUC_VIEW",
//     icon: "⊞",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/ton-kho",
//     label: "Tồn kho nguyên liệu",
//     permission: "TON_KHO_VIEW",
//     icon: "▤",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/nha-cung-cap",
//     label: "Nhà cung cấp",
//     permission: "NHA_CUNG_CAP_VIEW",
//     icon: "◇",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/nha-cung-cap/cung-ung",
//     label: "Nguyên liệu cung ứng",
//     permission: "NGUYEN_LIEU_NCC_VIEW",
//     icon: "▦",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/nhu-cau-nguyen-lieu",
//     label: "Nhu cầu nguyên liệu",
//     permission: "NHU_CAU_NGUYEN_LIEU_VIEW",
//     icon: "⌁",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/goi-y",
//     label: "Gợi ý nhà cung cấp",
//     permission: "GOI_Y_NHA_CUNG_CAP_VIEW",
//     icon: "☆",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/de-xuat-nhap-hang",
//     label: "Đề xuất nhập hàng",
//     permission: "DE_XUAT_NHAP_HANG_VIEW",
//     icon: "▣",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/don-mua-nguyen-lieu",
//     label: "Đơn mua nguyên liệu",
//     permission: "DON_MUA_VIEW",
//     icon: "▥",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/hieu-suat",
//     label: "Hiệu suất nhà cung cấp",
//     permission: "NHA_CUNG_CAP_PERFORMANCE_VIEW",
//     icon: "▥",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/dashboard-mua-hang",
//     label: "Dashboard mua hàng",
//     permission: "DASHBOARD_VIEW",
//     icon: "◫",
//     group: "MUA HÀNG",
//   },
//   {
//     path: "/tai-khoan",
//     label: "Quản lý tài khoản",
//     permission: "USER_VIEW",
//     icon: "♙",
//     group: "QUẢN TRỊ",
//   },
// ];

// D:\KLTN\KLTN\frontend\src\routes\menu.ts
export type MenuEntry = {
  path: string;
  label: string;
  permission: string;
  group: string;
  icon: string;
  anyPermissions?: readonly string[];
};

// Một danh sách duy nhất cho menu và liên kết nhanh.
// permission dùng cặp quyền cùng mã với backend.
export const menu: MenuEntry[] = [
  { path: "/", label: "Tổng quan", permission: "", group: "", icon: "◫" },
  { path: "/quan-ly-san-pham", label: "Quản lý sản phẩm", permission: "san_pham:XEM", group: "", icon: "▧" },
  { path: "/nhap-ban-hang", label: "Dữ liệu bán hàng", permission: "du_lieu_ban_hang:XEM", group: "", icon: "↥" },
  { path: "/du-bao", label: "Dự báo nhu cầu", permission: "du_bao_nhu_cau:XEM", group: "du_bao", icon: "⌁" },
  { path: "/danh-gia-mo-hinh", label: "Đánh giá mô hình", permission: "danh_gia_mo_hinh:XEM", group: "du_bao", icon: "⌁" },
  { path: "/lich-su-du-bao", label: "Lịch sử dự báo", permission: "lich_su_du_bao:XEM", group: "du_bao", icon: "◷" },
  { path: "/nguyen-lieu", label: "Nguyên liệu", permission: "nguyen_lieu:XEM", group: "materials", icon: "▧" },
  { path: "/cong-thuc", label: "Công thức / BOM", permission: "cong_thuc:XEM", group: "materials", icon: "⊞" },
  { path: "/ti-le-hao-hut", label: "Tỉ lệ hao hụt", permission: "ti_le_hao_hut:XEM", group: "materials", icon: "⊞" },
  { path: "/ton-kho", label: "Tồn kho nguyên liệu", permission: "ton_kho_nguyen_lieu:XEM", group: "materials", icon: "▤" },
  { path: "/nha-cung-cap/cung-ung", label: "Nguyên liệu cung ứng", permission: "nguyen_lieu_nha_cung_cap:XEM", group: "materials", icon: "▦" },
  { path: "/nha-cung-cap", label: "Nhà cung cấp", permission: "nha_cung_cap:XEM", group: "suppliers", icon: "◇" },
  { path: "/goi-y", label: "Gợi ý nhà cung cấp", permission: "goi_y_nha_cung_cap:XEM", group: "suppliers", icon: "☆" },
  { path: "/hieu-suat", label: "Hiệu suất nhà cung cấp", permission: "hieu_suat_nha_cung_cap:XEM", group: "suppliers", icon: "▥" },
  { path: "/xem-thong-tin-nha-cung-cap", label: "Xem thông tin nhà cung cấp", permission: "nha_cung_cap:XEM", group: "suppliers", icon: "◇" },
  { path: "/nhu-cau-nguyen-lieu", label: "Nhu cầu nguyên liệu", permission: "nhu_cau_nguyen_lieu:XEM", group: "purchasing", icon: "⌁" },
  { path: "/de-xuat-nhap-hang", label: "Đề xuất nhập hàng", permission: "de_xuat_nhap_hang:XEM", group: "purchasing", icon: "▣" },
  { path: "/don-mua-nguyen-lieu", label: "Đơn mua nguyên liệu", permission: "don_mua_nguyen_lieu:XEM", group: "purchasing", icon: "▥" },
  { path: "/xem-ke-hoach-mua-hang", label: "Xem kế hoạch mua hàng", permission: "ke_hoach_mua_hang:XEM", group: "purchasing", icon: "▤" },
  { path: "/dashboard-mua-hang", label: "Dashboard mua hàng", permission: "dashboard_mua_hang:XEM", group: "purchasing", icon: "◫" },
  {
    path: "/duyet-ke-hoach", label: "Duyệt kế hoạch mua hàng",
    permission: "ke_hoach_mua_hang:XEM", group: "", icon: "▤",
    anyPermissions: ["ke_hoach_mua_hang:DUYET", "ke_hoach_mua_hang:TU_CHOI"],
  },
  { path: "/tai-khoan", label: "Quản lý tài khoản", permission: "tai_khoan:XEM", group: "quan_tri", icon: "♙" },
  { path: "/phan-quyen", label: "Phân quyền", permission: "phan_quyen:XEM", group: "quan_tri", icon: "◇" },
{
  path: "/cau-hinh",
  label: "Cấu hình",
  permission: "",
  group: "",
  icon: "⚙",
  anyPermissions: [
    "quan_ly_ly_do:XEM",
    "nhat_ky_hoat_dong:XEM",
  ],
},
];
