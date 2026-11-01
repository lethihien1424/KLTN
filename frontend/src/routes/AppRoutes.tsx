import SettingsPage, { SettingsBreadcrumb } from "../pages/cau-hinh/SettingsPage";
import ReasonsPage from "../pages/cau-hinh/ReasonsPage";
import {
  GeneralSettingsPage,
} from "../pages/cau-hinh/SettingsDetailsPage";
import AuditSettingsPage from "../pages/cau-hinh/AuditSettingsPage";
import { useAuth } from "../auth/AuthContext";
import { lazy, Suspense, type ReactNode } from "react";
import { menu } from "./menu";
import ProtectedRoute from "./ProtectedRoute";
import type { Location } from "./navigation";
import { resolvePurchasePath } from "./purchasePaths";
import {
  EmptyState,
  LoadingState,
} from "../components/common/PurchaseUI";
import QuanLyNguyenLieuPage from "../pages/nguyen-lieu/QuanLyNguyenLieuPage";
import CongThucPage from "../pages/cong-thuc/CongThucPage";
import TonKhoNguyenLieuPage from "../pages/ton-kho/TonKhoNguyenLieuPage";
import NhaCungCapPage from "../pages/nha-cung-cap/NhaCungCapPage";
import ChiTietNhaCungCapPage from "../pages/nha-cung-cap/ChiTietNhaCungCapPage";
import NguyenLieuNhaCungCapPage from "../pages/nha-cung-cap/NguyenLieuNhaCungCapPage";
import HieuSuatNhaCungCapPage from "../pages/nha-cung-cap/HieuSuatNhaCungCapPage";
import NhuCauNguyenLieuPage from "../pages/nhu-cau/NhuCauNguyenLieuPage";
import GoiYNhaCungCapPage from "../pages/goi-y/GoiYNhaCungCapPage";
import DeXuatNhapHangPage from "../pages/de-xuat/DeXuatNhapHangPage";
import ChiTietDeXuatPage from "../pages/de-xuat/ChiTietDeXuatPage";
import TaoDeXuatPage from "../pages/de-xuat/TaoDeXuatPage";
import DanhSachDonMuaPage from "../pages/don-mua/DanhSachDonMuaPage";
import LichSuNhapNguyenLieuPage from "../pages/don-mua/LichSuNhapNguyenLieuPage";
import ChiTietDonMuaPage from "../pages/don-mua/ChiTietDonMuaPage";
import DashboardMuaHangPage from "../pages/dashboard/DashboardMuaHangPage";
const DuBaoNhuCauPage = lazy(() => import("../pages/du-bao/DuBaoNhuCauPage"));
const QuanLyTaiKhoanPage = lazy(
  () => import("../pages/tai-khoan/QuanLyTaiKhoanPage"),
);
import DuLieuBanHangPage from "../pages/ban-hang/DuLieuBanHangPage";
import PhanQuyenPage from "../pages/auth/PhanQuyenPage";
import SanPhamPage from "../pages/san-pham/SanPhamPage";
import LichSuDuBaoPage from "../pages/du-bao/LichSuDuBaoPage";
import DanhGiaMoHinhPage from "../pages/du-bao/DanhGiaMoHinhPage";
import UnifiedDashboardPage from "../pages/dashboard/UnifiedDashboardPage";
import type { DashboardId } from "../auth/dashboardPolicy";

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

export default function AppRoutes({ location }: { location: Location }) {
  const { can } = useAuth();
  const { params } = location;
  const path = resolvePurchasePath(location.path);
  if (path === "/cau-hinh") return can("quan_ly_ly_do:XEM") || can("nhat_ky_hoat_dong:XEM")
    ? <SettingsPage />
    : <EmptyState title="Bạn chưa có quyền truy cập Cấu hình" description="Liên hệ quản trị viên để được cấp quyền phù hợp." />;
  if (path === "/cau-hinh/quan-ly-ly-do" || path === "/cau-hinh/ly-do")
    return (
      <ProtectedRoute permission="quan_ly_ly_do:XEM">
        <ReasonsPage />
      </ProtectedRoute>
    );
  if (path === "/cau-hinh/nguoi-dung")
    return (
      <ProtectedRoute permission="USER_VIEW">
        <Suspense fallback={<LoadingState />}>
          <SettingsBreadcrumb title="Người dùng" />
          <QuanLyTaiKhoanPage />
        </Suspense>
      </ProtectedRoute>
    );
  if (path === "/cau-hinh/vai-tro")
    return (
      <ProtectedRoute permission="ROLE_VIEW">
        <PhanQuyenPage />
      </ProtectedRoute>
    );
  if (path === "/cau-hinh/nhat-ky" || path === "/cau-hinh/nhat-ky-hoat-dong")
    return (
      <ProtectedRoute permission="nhat_ky_hoat_dong:XEM">
        <AuditSettingsPage />
      </ProtectedRoute>
    );
  if (path === "/cau-hinh/chung")
    return (
      <ProtectedRoute permission="VIEW_SETTING">
        <GeneralSettingsPage />
      </ProtectedRoute>
    );
  const guarded = (permission: string, element: ReactNode) => (
    <ProtectedRoute permission={permission}>
      <Suspense fallback={<LoadingState />}>{element}</Suspense>
    </ProtectedRoute>
  );
  if (path === "/" || path === "/dashboard" || path === "/dashboard-tong-hop") {
    return <UnifiedDashboardPage />;
  }
  const dashboardId = dashboardRoutes[path];
  if (dashboardId) return <UnifiedDashboardPage only={dashboardId} />;
  if (path === "/nguyen-lieu")
    return guarded("NGUYEN_LIEU_VIEW", <QuanLyNguyenLieuPage />);
  if (path === "/cong-thuc") return guarded("CONG_THUC_VIEW", <CongThucPage />);
  if (path === "/ton-kho")
    return guarded("TON_KHO_VIEW", <TonKhoNguyenLieuPage />);
  if (path === "/nha-cung-cap/cung-ung")
    return guarded(
      "NGUYEN_LIEU_NCC_VIEW",
      <NguyenLieuNhaCungCapPage
        key={params.get("ncc")}
        supplier={params.get("ncc") ?? ""}
      />,
    );
  if (path === "/nha-cung-cap")
    return guarded("NHA_CUNG_CAP_VIEW", <NhaCungCapPage />);
  if (path.startsWith("/nha-cung-cap/"))
    return guarded(
      "NHA_CUNG_CAP_VIEW",
      <ChiTietNhaCungCapPage
        key={path}
        id={decodeURIComponent(path.slice(14))}
      />,
    );
  if (path === "/hieu-suat")
    return guarded("NHA_CUNG_CAP_PERFORMANCE_VIEW", <HieuSuatNhaCungCapPage />);
  if (path === "/nhu-cau")
    return guarded(
      "NHU_CAU_NGUYEN_LIEU_VIEW",
      <NhuCauNguyenLieuPage
        key={params.get("forecast")}
        forecast={params.get("forecast") ?? ""}
      />,
    );
  if (path === "/goi-y")
    return guarded(
      "GOI_Y_NHA_CUNG_CAP_VIEW",
      <GoiYNhaCungCapPage
        key={params.toString()}
        material={params.get("material") ?? ""}
        qty={params.get("qty") ?? ""}
        forecast={params.get("forecast") ?? ""}
      />,
    );
  if (path === "/de-xuat/tao")
    return guarded(
      "DE_XUAT_NHAP_HANG_CREATE",
      <TaoDeXuatPage
        key={params.toString()}
        material={params.get("material") ?? ""}
        ncc={params.get("ncc") ?? ""}
        qty={params.get("qty") ?? ""}
      />,
    );
  if (path === "/de-xuat")
    return guarded("DE_XUAT_NHAP_HANG_VIEW", <DeXuatNhapHangPage />);
  if (path.startsWith("/de-xuat/"))
    return guarded(
      "DE_XUAT_NHAP_HANG_VIEW",
      <ChiTietDeXuatPage key={path} id={decodeURIComponent(path.slice(9))} />,
    );
  if (path === "/don-mua")
    return guarded("DON_MUA_VIEW", <DanhSachDonMuaPage />);
  if (path.startsWith("/don-mua/"))
    return guarded(
      "DON_MUA_VIEW",
      <ChiTietDonMuaPage key={path} id={decodeURIComponent(path.slice(9))} />,
    );
  if (path === "/dashboard-mua-hang")
    return guarded("DASHBOARD_VIEW", <DashboardMuaHangPage />);
  if (path === "/du-bao") return guarded("DU_BAO_VIEW", <DuBaoNhuCauPage />);
  if (path === "/tai-khoan")
    return guarded("USER_VIEW", <QuanLyTaiKhoanPage />);
  if (path === "/nhap-ban-hang")
    return guarded("du_lieu_ban_hang:XEM", <DuLieuBanHangPage />);
  if (path === "/quan-ly-san-pham")
    return guarded("san_pham:XEM", <SanPhamPage />);
  if (path === "/phan-quyen" || path === "/vai-tro")
    return guarded("phan_quyen:XEM", <PhanQuyenPage />);
  if (path === "/lich-su-du-bao")
    return guarded("lich_su_du_bao:XEM", <LichSuDuBaoPage />);
  if (path === "/danh-gia-mo-hinh")
    return guarded("danh_gia_mo_hinh:XEM", <DanhGiaMoHinhPage />);
  if (path === "/xem-thong-tin-nha-cung-cap")
    return guarded("nha_cung_cap:XEM", <NhaCungCapPage />);
  if (path === "/duyet-don-mua" || path === "/duyet-ke-hoach") {
    return guarded("DON_MUA_VIEW",
      can("DON_MUA_APPROVE") || can("DON_MUA_REJECT")
        ? <DanhSachDonMuaPage key="approval" approval />
        : <EmptyState title="Bạn chưa có quyền duyệt đơn mua" description="Liên hệ quản trị viên để được cấp quyền phù hợp." />);
  }
  if (path === "/xem-ke-hoach-mua-hang" || path === "/ti-le-hao-hut") {
    const entry = path === "/xem-ke-hoach-mua-hang"
      ? { label: "Xem kế hoạch mua hàng", permission: "ke_hoach_mua_hang:XEM", anyPermissions: undefined }
      : menu.find(item => item.path === path);
    if (!entry) return <EmptyState title="Không tìm thấy màn hình" description="Chọn chức năng từ menu." />;
    const hasAction = !entry.anyPermissions || entry.anyPermissions.some(can);
    return guarded(entry.permission, hasAction ? (
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading"><div>
          <h2>{entry.label}</h2><p>Chức năng đang được hoàn thiện.</p>
        </div></div>
      </section>
    ) : <EmptyState title="Bạn chưa có quyền thực hiện thao tác này" description="Liên hệ quản trị viên để được cấp quyền phù hợp." />);
  }
  if (path === "/nhap-du-lieu-mua-hang") return guarded("don_mua_nguyen_lieu:XEM", <DanhSachDonMuaPage />);
  if (path === "/lich-su-nhap-nguyen-lieu") return guarded("don_mua_nguyen_lieu:XEM", <LichSuNhapNguyenLieuPage />);
  return (
    <EmptyState
      title="Không tìm thấy màn hình"
      description="Chọn chức năng từ menu bên trái."
    />
  );
}
