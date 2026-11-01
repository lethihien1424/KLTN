// //D:\KLTN\KLTN\frontend\src\routes\AppRoutes.tsx
// // import SettingsPage, { SettingsBreadcrumb } from "../pages/cau-hinh/SettingsPage";
// // import ReasonsPage from "../pages/cau-hinh/ReasonsPage";
// // import {
// //   RolesSettingsPage,
// //   GeneralSettingsPage,
// // } from "../pages/cau-hinh/SettingsDetailsPage";
// // import AuditSettingsPage from "../pages/cau-hinh/AuditSettingsPage";
// // import { useAuth } from "../auth/AuthContext";
// // import { lazy, Suspense, type ReactNode } from "react";
// // import { menu } from "./menu";
// // import ProtectedRoute from "./ProtectedRoute";
// // import type { Location } from "./navigation";
// // import { resolvePurchasePath } from "./purchasePaths";
// // import {
// //   PageHeader,
// //   EmptyState,
// //   LoadingState,
// // } from "../components/common/PurchaseUI";
// // import QuanLyNguyenLieuPage from "../pages/nguyen-lieu/QuanLyNguyenLieuPage";
// // import CongThucPage from "../pages/cong-thuc/CongThucPage";
// // import TonKhoNguyenLieuPage from "../pages/ton-kho/TonKhoNguyenLieuPage";
// // import NhaCungCapPage from "../pages/nha-cung-cap/NhaCungCapPage";
// // import ChiTietNhaCungCapPage from "../pages/nha-cung-cap/ChiTietNhaCungCapPage";
// // import NguyenLieuNhaCungCapPage from "../pages/nha-cung-cap/NguyenLieuNhaCungCapPage";
// // import HieuSuatNhaCungCapPage from "../pages/nha-cung-cap/HieuSuatNhaCungCapPage";
// // import NhuCauNguyenLieuPage from "../pages/nhu-cau/NhuCauNguyenLieuPage";
// // import GoiYNhaCungCapPage from "../pages/goi-y/GoiYNhaCungCapPage";
// // import DeXuatNhapHangPage from "../pages/de-xuat/DeXuatNhapHangPage";
// // import ChiTietDeXuatPage from "../pages/de-xuat/ChiTietDeXuatPage";
// // import TaoDeXuatPage from "../pages/de-xuat/TaoDeXuatPage";
// // import DanhSachDonMuaPage from "../pages/don-mua/DanhSachDonMuaPage";
// // import ChiTietDonMuaPage from "../pages/don-mua/ChiTietDonMuaPage";
// // import DashboardMuaHangPage from "../pages/dashboard/DashboardMuaHangPage";
// // const DuBaoNhuCauPage = lazy(() => import("../pages/du-bao/DuBaoNhuCauPage"));
// // const QuanLyTaiKhoanPage = lazy(
// //   () => import("../pages/tai-khoan/QuanLyTaiKhoanPage"),
// // );
// // import NhapDuLieuBanHangPage from "../pages/tieu-thu/NhapDuLieuBanHangPage";
// // export default function AppRoutes({ location }: { location: Location }) {
// //   const { can, user } = useAuth();
// //   const { params } = location;
// //   const path = resolvePurchasePath(location.path);
// //   if (path === "/cau-hinh") return <SettingsPage />;
// //   if (path === "/cau-hinh/quan-ly-ly-do")
// //     return (
// //       <ProtectedRoute permission="VIEW_REASON_CONFIG">
// //         <ReasonsPage />
// //       </ProtectedRoute>
// //     );
// //   if (path === "/cau-hinh/nguoi-dung")
// //     return (
// //       <ProtectedRoute permission="USER_VIEW">
// //         <Suspense fallback={<LoadingState />}>
// //           <SettingsBreadcrumb title="Người dùng" />
// //           <QuanLyTaiKhoanPage />
// //         </Suspense>
// //       </ProtectedRoute>
// //     );
// //   if (path === "/cau-hinh/vai-tro")
// //     return (
// //       <ProtectedRoute permission="ROLE_VIEW">
// //         <RolesSettingsPage />
// //       </ProtectedRoute>
// //     );
// //   if (path === "/cau-hinh/nhat-ky")
// //     return (
// //       <ProtectedRoute permission="VIEW_AUDIT_LOG">
// //         <AuditSettingsPage />
// //       </ProtectedRoute>
// //     );
// //   if (path === "/cau-hinh/chung")
// //     return (
// //       <ProtectedRoute permission="VIEW_SETTING">
// //         <GeneralSettingsPage />
// //       </ProtectedRoute>
// //     );
// //   const legacy = {
// //     "/vai-tro": { title: "Phân quyền", permissions: ["ROLE_VIEW"] },
// //     "/nhat-ky": { title: "Xem nhật ký hoạt động", permissions: ["USER_VIEW"] },
// //     "/quan-ly-san-pham": {
// //       title: "Quản lý sản phẩm",
// //       permissions: ["IMPORT_SAN_PHAM"],
// //     },
// //     "/nhap-du-lieu-mua-hang": {
// //       title: "Nhập dữ liệu mua hàng",
// //       permissions: [
// //         "IMPORT_NGUYEN_LIEU",
// //         "IMPORT_CONG_THUC",
// //         "IMPORT_TON_KHO",
// //         "IMPORT_NHA_CUNG_CAP",
// //         "IMPORT_NGUYEN_LIEU_NCC",
// //       ],
// //     },
// //   }[path];
// //   if (legacy) return guardedLegacy();
// //   function guardedLegacy() {
// //     return (
// //       <ProtectedRoute
// //         permission={legacy!.permissions.find(can) ?? legacy!.permissions[0]}
// //       >
// //         <section className="dashboard-panel">
// //           <div className="dashboard-panel-heading">
// //             <div>
// //               <h2>{legacy!.title}</h2>
// //               <p>Chức năng đang được hoàn thiện.</p>
// //             </div>
// //           </div>
// //         </section>
// //       </ProtectedRoute>
// //     );
// //   }
// //   const guarded = (permission: string, element: ReactNode) => (
// //     <ProtectedRoute permission={permission}>
// //       <Suspense fallback={<LoadingState />}>{element}</Suspense>
// //     </ProtectedRoute>
// //   );
// //   if (path === "/" && can("DASHBOARD_VIEW")) return <DashboardMuaHangPage />;
// //   if (path === "/")
// //     return (
// //       <>
// //         <PageHeader
// //           title={`Xin chào, ${user.ho_ten}`}
// //           description="Chọn chức năng để bắt đầu công việc hôm nay."
// //         />
// //         <div className="pm-quicklinks">
// //           {menu
// //             .filter((r) => r.permission && can(r.permission))
// //             .map((r) => (
// //               <a key={r.path} href={`#${r.path}`}>
// //                 <strong>{r.label}</strong>
// //                 <div className="pm-small">Mở chức năng →</div>
// //               </a>
// //             ))}
// //         </div>
// //         {!user.permissions.length && (
// //           <EmptyState
// //             title="Chưa có chức năng được cấp quyền"
// //             description="Liên hệ quản trị viên để cấp quyền cho tài khoản."
// //           />
// //         )}
// //       </>
// //     );
// //   if (path === "/nguyen-lieu")
// //     return guarded("NGUYEN_LIEU_VIEW", <QuanLyNguyenLieuPage />);
// //   if (path === "/cong-thuc") return guarded("CONG_THUC_VIEW", <CongThucPage />);
// //   if (path === "/ton-kho")
// //     return guarded("TON_KHO_VIEW", <TonKhoNguyenLieuPage />);
// //   if (path === "/nha-cung-cap/cung-ung")
// //     return guarded(
// //       "NGUYEN_LIEU_NCC_VIEW",
// //       <NguyenLieuNhaCungCapPage
// //         key={params.get("ncc")}
// //         supplier={params.get("ncc") ?? ""}
// //       />,
// //     );
// //   if (path === "/nha-cung-cap")
// //     return guarded("NHA_CUNG_CAP_VIEW", <NhaCungCapPage />);
// //   if (path.startsWith("/nha-cung-cap/"))
// //     return guarded(
// //       "NHA_CUNG_CAP_VIEW",
// //       <ChiTietNhaCungCapPage
// //         key={path}
// //         id={decodeURIComponent(path.slice(14))}
// //       />,
// //     );
// //   if (path === "/hieu-suat")
// //     return guarded("NHA_CUNG_CAP_PERFORMANCE_VIEW", <HieuSuatNhaCungCapPage />);
// //   if (path === "/nhu-cau")
// //     return guarded(
// //       "NHU_CAU_NGUYEN_LIEU_VIEW",
// //       <NhuCauNguyenLieuPage
// //         key={params.get("forecast")}
// //         forecast={params.get("forecast") ?? ""}
// //       />,
// //     );
// //   if (path === "/goi-y")
// //     return guarded(
// //       "GOI_Y_NHA_CUNG_CAP_VIEW",
// //       <GoiYNhaCungCapPage
// //         key={params.toString()}
// //         material={params.get("material") ?? ""}
// //         qty={params.get("qty") ?? ""}
// //         forecast={params.get("forecast") ?? ""}
// //       />,
// //     );
// //   if (path === "/de-xuat/tao")
// //     return guarded(
// //       "DE_XUAT_NHAP_HANG_CREATE",
// //       <TaoDeXuatPage
// //         key={params.toString()}
// //         material={params.get("material") ?? ""}
// //         ncc={params.get("ncc") ?? ""}
// //         qty={params.get("qty") ?? ""}
// //       />,
// //     );
// //   if (path === "/de-xuat")
// //     return guarded("DE_XUAT_NHAP_HANG_VIEW", <DeXuatNhapHangPage />);
// //   if (path.startsWith("/de-xuat/"))
// //     return guarded(
// //       "DE_XUAT_NHAP_HANG_VIEW",
// //       <ChiTietDeXuatPage key={path} id={decodeURIComponent(path.slice(9))} />,
// //     );
// //   if (path === "/don-mua")
// //     return guarded("DON_MUA_VIEW", <DanhSachDonMuaPage />);
// //   if (path.startsWith("/don-mua/"))
// //     return guarded(
// //       "DON_MUA_VIEW",
// //       <ChiTietDonMuaPage key={path} id={decodeURIComponent(path.slice(9))} />,
// //     );
// //   if (path === "/dashboard-mua-hang")
// //     return guarded("DASHBOARD_VIEW", <DashboardMuaHangPage />);
// //   if (path === "/du-bao") return guarded("DU_BAO_VIEW", <DuBaoNhuCauPage />);
// //   if (path === "/tai-khoan")
// //     return guarded("USER_VIEW", <QuanLyTaiKhoanPage />);
// //   if (path === "/nhap-ban-hang")
// //     return guarded("IMPORT_DON_HANG", <NhapDuLieuBanHangPage />);
// //   return (
// //     <EmptyState
// //       title="Không tìm thấy màn hình"
// //       description="Chọn chức năng từ menu bên trái."
// //     />
// //   );
// // }

// // D:\KLTN\KLTN\frontend\src\routes\AppRoutes.tsx
// import SettingsPage, { SettingsBreadcrumb } from "../pages/cau-hinh/SettingsPage";
// import ReasonsPage from "../pages/cau-hinh/ReasonsPage";
// import {
//   GeneralSettingsPage,
// } from "../pages/cau-hinh/SettingsDetailsPage";
// import AuditSettingsPage from "../pages/cau-hinh/AuditSettingsPage";
// import { useAuth } from "../auth/AuthContext";
// import { lazy, Suspense, type ReactNode } from "react";
// import { menu } from "./menu";
// import ProtectedRoute from "./ProtectedRoute";
// import type { Location } from "./navigation";
// import { resolvePurchasePath } from "./purchasePaths";
// import {
//   PageHeader,
//   EmptyState,
//   LoadingState,
// } from "../components/common/PurchaseUI";
// import QuanLyNguyenLieuPage from "../pages/nguyen-lieu/QuanLyNguyenLieuPage";
// import CongThucPage from "../pages/cong-thuc/CongThucPage";
// import TonKhoNguyenLieuPage from "../pages/ton-kho/TonKhoNguyenLieuPage";
// import NhaCungCapPage from "../pages/nha-cung-cap/NhaCungCapPage";
// import ChiTietNhaCungCapPage from "../pages/nha-cung-cap/ChiTietNhaCungCapPage";
// import NguyenLieuNhaCungCapPage from "../pages/nha-cung-cap/NguyenLieuNhaCungCapPage";
// import HieuSuatNhaCungCapPage from "../pages/nha-cung-cap/HieuSuatNhaCungCapPage";
// import NhuCauNguyenLieuPage from "../pages/nhu-cau/NhuCauNguyenLieuPage";
// import GoiYNhaCungCapPage from "../pages/goi-y/GoiYNhaCungCapPage";
// import DeXuatNhapHangPage from "../pages/de-xuat/DeXuatNhapHangPage";
// import ChiTietDeXuatPage from "../pages/de-xuat/ChiTietDeXuatPage";
// import TaoDeXuatPage from "../pages/de-xuat/TaoDeXuatPage";
// import DanhSachDonMuaPage from "../pages/don-mua/DanhSachDonMuaPage";
// import ChiTietDonMuaPage from "../pages/don-mua/ChiTietDonMuaPage";
// import DashboardMuaHangPage from "../pages/dashboard/DashboardMuaHangPage";
// const DuBaoNhuCauPage = lazy(() => import("../pages/du-bao/DuBaoNhuCauPage"));
// const QuanLyTaiKhoanPage = lazy(
//   () => import("../pages/tai-khoan/QuanLyTaiKhoanPage"),
// );
// import DuLieuBanHangPage from "../pages/ban-hang/DuLieuBanHangPage";
// import PhanQuyenPage from "../pages/auth/PhanQuyenPage";
// import SanPhamPage from "../pages/san-pham/SanPhamPage";
// import LichSuDuBaoPage from "../pages/du-bao/LichSuDuBaoPage";
// import DanhGiaMoHinhPage from "../pages/du-bao/DanhGiaMoHinhPage";
// import UnifiedDashboardPage from "../pages/dashboard/UnifiedDashboardPage";
// import DashboardNguyenLieuUsage from "../pages/dashboard/DashboardNguyenLieuUsage";
// import DashboardProductConsumption from "../pages/dashboard/DashboardProductConsumption";
// import DashboardOrderStats from "../pages/dashboard/DashboardOrderStats";
// import DashboardProphetComparison from "../pages/dashboard/DashboardProphetComparison";
// import DashboardFormulaBom from "../pages/dashboard/DashboardFormulaBom";
// import DashboardInventoryStock from "../pages/dashboard/DashboardInventoryStock";
// import DashboardSupplierMaterials from "../pages/dashboard/DashboardSupplierMaterials";
// import DashboardSupplierScore from "../pages/dashboard/DashboardSupplierScore";
// import DashboardSupplierSuggestion from "../pages/dashboard/DashboardSupplierSuggestion";
// import DashboardMaterialDemand from "../pages/dashboard/DashboardMaterialDemand";
// import DashboardPurchaseOrders from "../pages/dashboard/DashboardPurchaseOrders";
// import DashboardAccountStatus from "../pages/dashboard/DashboardAccountStatus";
// import DashboardInventoryAlerts from "../pages/dashboard/DashboardInventoryAlerts";
// import DashboardConfigAudit from "../pages/dashboard/DashboardConfigAudit";
// export default function AppRoutes({ location }: { location: Location }) {
//   const { can, user } = useAuth();
//   const { params } = location;
//   const path = resolvePurchasePath(location.path);
//   if (path === "/cau-hinh") return can("quan_ly_ly_do:XEM") || can("nhat_ky_hoat_dong:XEM")
//     ? <SettingsPage />
//     : <EmptyState title="Bạn chưa có quyền truy cập Cấu hình" description="Liên hệ quản trị viên để được cấp quyền phù hợp." />;
//   if (path === "/cau-hinh/quan-ly-ly-do" || path === "/cau-hinh/ly-do")
//     return (
//       <ProtectedRoute permission="quan_ly_ly_do:XEM">
//         <ReasonsPage />
//       </ProtectedRoute>
//     );
//   if (path === "/cau-hinh/nguoi-dung")
//     return (
//       <ProtectedRoute permission="USER_VIEW">
//         <Suspense fallback={<LoadingState />}>
//           <SettingsBreadcrumb title="Người dùng" />
//           <QuanLyTaiKhoanPage />
//         </Suspense>
//       </ProtectedRoute>
//     );
//   if (path === "/cau-hinh/vai-tro")
//     return (
//       <ProtectedRoute permission="ROLE_VIEW">
//         <PhanQuyenPage />
//       </ProtectedRoute>
//     );
//   if (path === "/cau-hinh/nhat-ky" || path === "/cau-hinh/nhat-ky-hoat-dong")
//     return (
//       <ProtectedRoute permission="nhat_ky_hoat_dong:XEM">
//         <AuditSettingsPage />
//       </ProtectedRoute>
//     );
//   if (path === "/cau-hinh/chung")
//     return (
//       <ProtectedRoute permission="VIEW_SETTING">
//         <GeneralSettingsPage />
//       </ProtectedRoute>
//     );
//   const guarded = (permission: string, element: ReactNode) => (
//     <ProtectedRoute permission={permission}>
//       <Suspense fallback={<LoadingState />}>{element}</Suspense>
//     </ProtectedRoute>
//   );
//   if (path === "/" || path === "/dashboard" || path === "/dashboard-tong-hop") {
//     return <UnifiedDashboardPage />;
//   }
//   if (path === "/dashboard/nguyen-lieu") return <DashboardNguyenLieuUsage />;
//   if (path === "/dashboard/san-pham") return <DashboardProductConsumption />;
//   if (path === "/dashboard/don-hang") return <DashboardOrderStats />;
//   if (path === "/dashboard/prophet") return <DashboardProphetComparison />;
//   if (path === "/dashboard/cong-thuc") return <DashboardFormulaBom />;
//   if (path === "/dashboard/ton-kho" || path === "/dashboard/ton-kho-book") return <DashboardInventoryStock />;
//   if (path === "/dashboard/canh-bao-ton-kho") return <DashboardInventoryAlerts />;
//   if (path === "/dashboard/nguyen-lieu-cung-ung") return <DashboardSupplierMaterials />;
//   if (path === "/dashboard/nha-cung-cap") return <DashboardSupplierScore />;
//   if (path === "/dashboard/goi-y-ncc") return <DashboardSupplierSuggestion />;
//   if (path === "/dashboard/nhu-cau") return <DashboardMaterialDemand />;
//   if (path === "/dashboard/don-mua") return <DashboardPurchaseOrders />;
//   if (path === "/dashboard/tai-khoan") return <DashboardAccountStatus />;
//   if (path === "/dashboard/cau-hinh") return <DashboardConfigAudit />;
//   if (path === "/nguyen-lieu")
//     return guarded("NGUYEN_LIEU_VIEW", <QuanLyNguyenLieuPage />);
//   if (path === "/cong-thuc") return guarded("CONG_THUC_VIEW", <CongThucPage />);
//   if (path === "/ton-kho")
//     return guarded("TON_KHO_VIEW", <TonKhoNguyenLieuPage />);
//   if (path === "/nha-cung-cap/cung-ung")
//     return guarded(
//       "NGUYEN_LIEU_NCC_VIEW",
//       <NguyenLieuNhaCungCapPage
//         key={params.get("ncc")}
//         supplier={params.get("ncc") ?? ""}
//       />,
//     );
//   if (path === "/nha-cung-cap")
//     return guarded("NHA_CUNG_CAP_VIEW", <NhaCungCapPage />);
//   if (path.startsWith("/nha-cung-cap/"))
//     return guarded(
//       "NHA_CUNG_CAP_VIEW",
//       <ChiTietNhaCungCapPage
//         key={path}
//         id={decodeURIComponent(path.slice(14))}
//       />,
//     );
//   if (path === "/hieu-suat")
//     return guarded("NHA_CUNG_CAP_PERFORMANCE_VIEW", <HieuSuatNhaCungCapPage />);
//   if (path === "/nhu-cau")
//     return guarded(
//       "NHU_CAU_NGUYEN_LIEU_VIEW",
//       <NhuCauNguyenLieuPage
//         key={params.get("forecast")}
//         forecast={params.get("forecast") ?? ""}
//       />,
//     );
//   if (path === "/goi-y")
//     return guarded(
//       "GOI_Y_NHA_CUNG_CAP_VIEW",
//       <GoiYNhaCungCapPage
//         key={params.toString()}
//         material={params.get("material") ?? ""}
//         qty={params.get("qty") ?? ""}
//         forecast={params.get("forecast") ?? ""}
//       />,
//     );
//   if (path === "/de-xuat/tao")
//     return guarded(
//       "DE_XUAT_NHAP_HANG_CREATE",
//       <TaoDeXuatPage
//         key={params.toString()}
//         material={params.get("material") ?? ""}
//         ncc={params.get("ncc") ?? ""}
//         qty={params.get("qty") ?? ""}
//       />,
//     );
//   if (path === "/de-xuat")
//     return guarded("DE_XUAT_NHAP_HANG_VIEW", <DeXuatNhapHangPage />);
//   if (path.startsWith("/de-xuat/"))
//     return guarded(
//       "DE_XUAT_NHAP_HANG_VIEW",
//       <ChiTietDeXuatPage key={path} id={decodeURIComponent(path.slice(9))} />,
//     );
//   if (path === "/don-mua")
//     return guarded("DON_MUA_VIEW", <DanhSachDonMuaPage />);
//   if (path.startsWith("/don-mua/"))
//     return guarded(
//       "DON_MUA_VIEW",
//       <ChiTietDonMuaPage key={path} id={decodeURIComponent(path.slice(9))} />,
//     );
//   if (path === "/dashboard-mua-hang")
//     return guarded("DASHBOARD_VIEW", <DashboardMuaHangPage />);
//   if (path === "/du-bao") return guarded("DU_BAO_VIEW", <DuBaoNhuCauPage />);
//   if (path === "/tai-khoan")
//     return guarded("USER_VIEW", <QuanLyTaiKhoanPage />);
//   if (path === "/nhap-ban-hang")
//     return guarded("du_lieu_ban_hang:XEM", <DuLieuBanHangPage />);
//   if (path === "/quan-ly-san-pham")
//     return guarded("san_pham:XEM", <SanPhamPage />);
//   if (path === "/phan-quyen" || path === "/vai-tro")
//     return guarded("phan_quyen:XEM", <PhanQuyenPage />);
//   if (path === "/lich-su-du-bao")
//     return guarded("lich_su_du_bao:XEM", <LichSuDuBaoPage />);
//   if (path === "/danh-gia-mo-hinh")
//     return guarded("danh_gia_mo_hinh:XEM", <DanhGiaMoHinhPage />);
//   if (path === "/xem-thong-tin-nha-cung-cap")
//     return guarded("nha_cung_cap:XEM", <NhaCungCapPage />);
//   if (path === "/duyet-don-mua" || path === "/duyet-ke-hoach") {
//     return guarded("DON_MUA_VIEW",
//       can("DON_MUA_APPROVE") || can("DON_MUA_REJECT")
//         ? <DanhSachDonMuaPage key="approval" approval />
//         : <EmptyState title="Bạn chưa có quyền duyệt đơn mua" description="Liên hệ quản trị viên để được cấp quyền phù hợp." />);
//   }
//   // Các đoạn nguồn đã gửi chưa có component kế hoạch mua hàng hoặc tỉ lệ hao hụt.
//   // Giữ trạng thái chưa hoàn thiện, không thay bằng API đơn mua/đề xuất khác nghiệp vụ.
//   if (path === "/xem-ke-hoach-mua-hang" || path === "/ti-le-hao-hut") {
//     const entry = menu.find(item => item.path === path);
//     if (!entry) return <EmptyState title="Không tìm thấy màn hình" description="Chọn chức năng từ menu." />;
//     const hasAction = !entry.anyPermissions || entry.anyPermissions.some(can);
//     return guarded(entry.permission, hasAction ? (
//       <section className="dashboard-panel">
//         <div className="dashboard-panel-heading"><div>
//           <h2>{entry.label}</h2><p>Chức năng đang được hoàn thiện.</p>
//         </div></div>
//       </section>
//     ) : <EmptyState title="Bạn chưa có quyền thực hiện thao tác này" description="Liên hệ quản trị viên để được cấp quyền phù hợp." />);
//   }
//   if (path === "/nhap-du-lieu-mua-hang") return guarded("don_mua_nguyen_lieu:XEM", <DanhSachDonMuaPage />);
//   return (
//     <EmptyState
//       title="Không tìm thấy màn hình"
//       description="Chọn chức năng từ menu bên trái."
//     />
//   );
// }

import {
  lazy,
  Suspense,
  type ReactNode,
} from "react";

import { useAuth } from "../auth/AuthContext";
import type { DashboardId } from "../auth/dashboardPolicy";

import { menu } from "./menu";
import ProtectedRoute from "./ProtectedRoute";
import type { Location } from "./navigation";
import { resolvePurchasePath } from "./purchasePaths";

import {
  EmptyState,
  LoadingState,
} from "../components/common/PurchaseUI";

import SettingsPage, {
  SettingsBreadcrumb,
} from "../pages/cau-hinh/SettingsPage";

import ReasonsPage from "../pages/cau-hinh/ReasonsPage";

import {
  GeneralSettingsPage,
} from "../pages/cau-hinh/SettingsDetailsPage";

import AuditSettingsPage from
  "../pages/cau-hinh/AuditSettingsPage";

import QuanLyNguyenLieuPage from
  "../pages/nguyen-lieu/QuanLyNguyenLieuPage";

import CongThucPage from
  "../pages/cong-thuc/CongThucPage";

import TonKhoNguyenLieuPage from
  "../pages/ton-kho/TonKhoNguyenLieuPage";

import NhaCungCapPage from
  "../pages/nha-cung-cap/NhaCungCapPage";

import ChiTietNhaCungCapPage from
  "../pages/nha-cung-cap/ChiTietNhaCungCapPage";

import NguyenLieuNhaCungCapPage from
  "../pages/nha-cung-cap/NguyenLieuNhaCungCapPage";

import HieuSuatNhaCungCapPage from
  "../pages/nha-cung-cap/HieuSuatNhaCungCapPage";

import NhuCauNguyenLieuPage from
  "../pages/nhu-cau/NhuCauNguyenLieuPage";

import GoiYNhaCungCapPage from
  "../pages/goi-y/GoiYNhaCungCapPage";

import DeXuatNhapHangPage from
  "../pages/de-xuat/DeXuatNhapHangPage";

import ChiTietDeXuatPage from
  "../pages/de-xuat/ChiTietDeXuatPage";

import TaoDeXuatPage from
  "../pages/de-xuat/TaoDeXuatPage";

import DanhSachDonMuaPage from
  "../pages/don-mua/DanhSachDonMuaPage";

import ChiTietDonMuaPage from
  "../pages/don-mua/ChiTietDonMuaPage";

import DashboardMuaHangPage from
  "../pages/dashboard/DashboardMuaHangPage";

import DuLieuBanHangPage from
  "../pages/ban-hang/DuLieuBanHangPage";

import PhanQuyenPage from
  "../pages/auth/PhanQuyenPage";

import SanPhamPage from
  "../pages/san-pham/SanPhamPage";

import LichSuDuBaoPage from
  "../pages/du-bao/LichSuDuBaoPage";

import DanhGiaMoHinhPage from
  "../pages/du-bao/DanhGiaMoHinhPage";

import UnifiedDashboardPage from
  "../pages/dashboard/UnifiedDashboardPage";


const DuBaoNhuCauPage = lazy(
  () => import("../pages/du-bao/DuBaoNhuCauPage"),
);

const QuanLyTaiKhoanPage = lazy(
  () => import("../pages/tai-khoan/QuanLyTaiKhoanPage"),
);


const dashboardRoutes: Partial<
  Record<string, DashboardId>
> = {
  "/dashboard/nguyen-lieu": "materials",
  "/dashboard/san-pham": "products",
  "/dashboard/don-hang": "orders",
  "/dashboard/prophet": "prophet",
  "/dashboard/cong-thuc": "formula",
  "/dashboard/ton-kho": "stock",
  "/dashboard/ton-kho-book": "stock",
  "/dashboard/canh-bao-ton-kho": "alerts",
  "/dashboard/nguyen-lieu-cung-ung": "supply",
  "/dashboard/nha-cung-cap": "suppliers",
  "/dashboard/goi-y-ncc": "suggestions",
  "/dashboard/nhu-cau": "demand",
  "/dashboard/don-mua": "purchases",
  "/dashboard/tai-khoan": "accounts",
  "/dashboard/cau-hinh": "config",
};


type Props = {
  location: Location;
};


export default function AppRoutes({
  location,
}: Props) {
  const { can } = useAuth();

  const { params } = location;

  const path = resolvePurchasePath(
    location.path,
  );

  const guarded = (
    permission: string,
    element: ReactNode,
  ) => (
    <ProtectedRoute permission={permission}>
      <Suspense fallback={<LoadingState />}>
        {element}
      </Suspense>
    </ProtectedRoute>
  );

  // ==================== TỔNG QUAN ====================

  if (
    path === "/" ||
    path === "/dashboard" ||
    path === "/dashboard-tong-hop"
  ) {
    return <UnifiedDashboardPage />;
  }

  const dashboardId = dashboardRoutes[path];

  if (dashboardId) {
    return (
      <UnifiedDashboardPage
        only={dashboardId}
      />
    );
  }

  // ==================== CẤU HÌNH ====================

  if (path === "/cau-hinh") {
    const allowed =
      can("quan_ly_ly_do:XEM") ||
      can("nhat_ky_hoat_dong:XEM");

    return allowed ? (
      <SettingsPage />
    ) : (
      <EmptyState
        title="Bạn chưa có quyền truy cập Cấu hình"
        description="Liên hệ quản trị viên để được cấp quyền phù hợp."
      />
    );
  }

  if (
    path === "/cau-hinh/quan-ly-ly-do" ||
    path === "/cau-hinh/ly-do"
  ) {
    return guarded(
      "quan_ly_ly_do:XEM",
      <ReasonsPage />,
    );
  }

  if (path === "/cau-hinh/nguoi-dung") {
    return guarded(
      "tai_khoan:XEM",
      <>
        <SettingsBreadcrumb title="Người dùng" />
        <QuanLyTaiKhoanPage />
      </>,
    );
  }

  if (path === "/cau-hinh/vai-tro") {
    return guarded(
      "phan_quyen:XEM",
      <PhanQuyenPage />,
    );
  }

  if (
    path === "/cau-hinh/nhat-ky" ||
    path === "/cau-hinh/nhat-ky-hoat-dong"
  ) {
    return guarded(
      "nhat_ky_hoat_dong:XEM",
      <AuditSettingsPage />,
    );
  }

  if (path === "/cau-hinh/chung") {
    // Giữ quyền của màn hình cấu hình chung hiện có.
    return guarded(
      "VIEW_SETTING",
      <GeneralSettingsPage />,
    );
  }

  // ==================== NGUYÊN LIỆU ====================

  if (path === "/nguyen-lieu") {
    return guarded(
      "nguyen_lieu:XEM",
      <QuanLyNguyenLieuPage />,
    );
  }

  if (path === "/cong-thuc") {
    return guarded(
      "cong_thuc:XEM",
      <CongThucPage />,
    );
  }

  if (path === "/ton-kho") {
    return guarded(
      "ton_kho_nguyen_lieu:XEM",
      <TonKhoNguyenLieuPage />,
    );
  }

  // Phải kiểm tra đường dẫn cố định này trước
  // đường dẫn chi tiết /nha-cung-cap/{ma}.
  if (path === "/nha-cung-cap/cung-ung") {
    return guarded(
      "nguyen_lieu_nha_cung_cap:XEM",
      <NguyenLieuNhaCungCapPage
        key={params.get("ncc")}
        supplier={params.get("ncc") ?? ""}
      />,
    );
  }

  // ==================== NHÀ CUNG CẤP ====================

  if (path === "/nha-cung-cap") {
    return guarded(
      "nha_cung_cap:XEM",
      <NhaCungCapPage />,
    );
  }

  if (path.startsWith("/nha-cung-cap/")) {
    return guarded(
      "nha_cung_cap:XEM",
      <ChiTietNhaCungCapPage
        key={path}
        id={decodeURIComponent(
          path.slice("/nha-cung-cap/".length),
        )}
      />,
    );
  }

  if (path === "/hieu-suat") {
    return guarded(
      "hieu_suat_nha_cung_cap:XEM",
      <HieuSuatNhaCungCapPage />,
    );
  }

  if (path === "/xem-thong-tin-nha-cung-cap") {
    return guarded(
      "nha_cung_cap:XEM",
      <NhaCungCapPage />,
    );
  }

  // ==================== NHU CẦU / GỢI Ý ====================

  if (path === "/nhu-cau") {
    return guarded(
      "nhu_cau_nguyen_lieu:XEM",
      <NhuCauNguyenLieuPage
        key={params.get("forecast")}
        forecast={params.get("forecast") ?? ""}
      />,
    );
  }

  if (path === "/goi-y") {
    return guarded(
      "goi_y_nha_cung_cap:XEM",
      <GoiYNhaCungCapPage
        key={params.toString()}
        material={params.get("material") ?? ""}
        qty={params.get("qty") ?? ""}
        forecast={params.get("forecast") ?? ""}
      />,
    );
  }

  // ==================== ĐỀ XUẤT NHẬP HÀNG ====================

  if (path === "/de-xuat/tao") {
    return guarded(
      "de_xuat_nhap_hang:THEM",
      <TaoDeXuatPage
        key={params.toString()}
        material={params.get("material") ?? ""}
        ncc={params.get("ncc") ?? ""}
        qty={params.get("qty") ?? ""}
      />,
    );
  }

  if (path === "/de-xuat") {
    return guarded(
      "de_xuat_nhap_hang:XEM",
      <DeXuatNhapHangPage />,
    );
  }

  if (path.startsWith("/de-xuat/")) {
    return guarded(
      "de_xuat_nhap_hang:XEM",
      <ChiTietDeXuatPage
        key={path}
        id={decodeURIComponent(
          path.slice("/de-xuat/".length),
        )}
      />,
    );
  }

  // ==================== ĐƠN MUA NGUYÊN LIỆU ====================

  if (path === "/don-mua") {
    return guarded(
      "don_mua_nguyen_lieu:XEM",
      <DanhSachDonMuaPage />,
    );
  }

  if (path.startsWith("/don-mua/")) {
    return guarded(
      "don_mua_nguyen_lieu:XEM",
      <ChiTietDonMuaPage
        key={path}
        id={decodeURIComponent(
          path.slice("/don-mua/".length),
        )}
      />,
    );
  }

  if (path === "/nhap-du-lieu-mua-hang") {
    return guarded(
      "don_mua_nguyen_lieu:XEM",
      <DanhSachDonMuaPage />,
    );
  }

  if (
    path === "/duyet-don-mua" ||
    path === "/duyet-ke-hoach"
  ) {
    const canApprove =
      can("don_mua_nguyen_lieu:DUYET") ||
      can("don_mua_nguyen_lieu:TU_CHOI");

    return guarded(
      "don_mua_nguyen_lieu:XEM",
      canApprove ? (
        <DanhSachDonMuaPage
          key="approval"
          approval
        />
      ) : (
        <EmptyState
          title="Bạn chưa có quyền duyệt đơn mua"
          description="Liên hệ quản trị viên để được cấp quyền phù hợp."
        />
      ),
    );
  }

  if (path === "/dashboard-mua-hang") {
    return guarded(
      "dashboard_mua_hang:XEM",
      <DashboardMuaHangPage />,
    );
  }

  // ==================== SẢN PHẨM / BÁN HÀNG ====================

  if (path === "/quan-ly-san-pham") {
    return guarded(
      "san_pham:XEM",
      <SanPhamPage />,
    );
  }

  if (path === "/nhap-ban-hang") {
    return guarded(
      "du_lieu_ban_hang:XEM",
      <DuLieuBanHangPage />,
    );
  }

  // ==================== DỰ BÁO ====================

  if (path === "/du-bao") {
    return guarded(
      "du_bao_nhu_cau:XEM",
      <DuBaoNhuCauPage />,
    );
  }

  if (path === "/lich-su-du-bao") {
    return guarded(
      "lich_su_du_bao:XEM",
      <LichSuDuBaoPage />,
    );
  }

  if (path === "/danh-gia-mo-hinh") {
    return guarded(
      "danh_gia_mo_hinh:XEM",
      <DanhGiaMoHinhPage />,
    );
  }

  // ==================== TÀI KHOẢN / PHÂN QUYỀN ====================

  if (path === "/tai-khoan") {
    return guarded(
      "tai_khoan:XEM",
      <QuanLyTaiKhoanPage />,
    );
  }

  if (
    path === "/phan-quyen" ||
    path === "/vai-tro"
  ) {
    return guarded(
      "phan_quyen:XEM",
      <PhanQuyenPage />,
    );
  }

  // Các màn hình chưa có component nghiệp vụ
  // trong nguồn đã gửi được giữ trạng thái hiện có.
  if (
    path === "/xem-ke-hoach-mua-hang" ||
    path === "/ti-le-hao-hut"
  ) {
    const entry = menu.find(
      item => item.path === path,
    );

    if (!entry) {
      return (
        <EmptyState
          title="Không tìm thấy màn hình"
          description="Chọn chức năng từ menu."
        />
      );
    }

    const hasAction =
      !entry.anyPermissions ||
      entry.anyPermissions.some(can);

    return guarded(
      entry.permission,
      hasAction ? (
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>{entry.label}</h2>
              <p>Chức năng đang được hoàn thiện.</p>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          title="Bạn chưa có quyền thực hiện thao tác này"
          description="Liên hệ quản trị viên để được cấp quyền phù hợp."
        />
      ),
    );
  }

  return (
    <EmptyState
      title="Không tìm thấy màn hình"
      description="Chọn chức năng từ menu bên trái."
    />
  );
}