// //D:\KLTN\KLTN\frontend\src\components\layout\MainLayout.tsx
// import { useAuth } from "../../auth/AuthContext";
// import AppRoutes from "../../routes/AppRoutes";
// import { navigate, useLocation } from "../../routes/navigation";
// import { settingsCards } from "../../pages/cau-hinh/settings";
// import { menu } from "../../routes/menu";
// import { groupSidebarMenu } from "../../routes/sidebarGroups";
// import { canonicalPurchasePath } from "../../routes/purchasePaths";
// import {
//   PieChartOutlined,
//   ShoppingCartOutlined,
//   LineChartOutlined,
//   AppstoreOutlined,
//   ExperimentOutlined,
//   DatabaseOutlined,
//   ShopOutlined,
//   UnorderedListOutlined,
//   BulbOutlined,
//   FileTextOutlined,
//   ShoppingOutlined,
//   BarChartOutlined,
//   UserOutlined,
//   SafetyCertificateOutlined,
//   HistoryOutlined,
//   SettingOutlined,
// } from "@ant-design/icons";
// import DashboardBase from "../dashboard/DashboardBase";
// import DashboardPageAdmin from "../../pages/dashboard/DashboardPageAdmin";
// import DashboardPageQL from "../../pages/dashboard/DashboardPageQL";
// import DashboardPageGSBH from "../../pages/dashboard/DashboardPageGSBH";
// import DashboardPageQLMH from "../../pages/dashboard/DashboardPageQLMH";
// import DashboardPageNVMuaHang from "../../pages/dashboard/DashboardPageNVMuaHang";
// import "../../styles/purchase.css";

// const icons = [
//   PieChartOutlined,
//   ShoppingCartOutlined,
//   LineChartOutlined,
//   AppstoreOutlined,
//   ExperimentOutlined,
//   DatabaseOutlined,
//   ShopOutlined,
//   UnorderedListOutlined,
//   LineChartOutlined,
//   BulbOutlined,
//   FileTextOutlined,
//   ShoppingOutlined,
//   BarChartOutlined,
//   PieChartOutlined,
//   UserOutlined,
// ];
// export default function MainLayout({ onLogout }: { onLogout: () => void }) {
//   const { user, can, refreshPermissions } = useAuth();
//   const location = useLocation();
//   const oldPath = (
//     {
//       "/du-bao-nhu-cau": "/du-bao",
//       "/nhap-du-lieu-ban-hang": "/nhap-ban-hang",
//       "/tong-quan": "/",
//       "/quan-ly-tai-khoan": "/tai-khoan",
//       "/phan-quyen": "/vai-tro",
//       "/xem-nhat-ky-hoat-dong": "/nhat-ky",
//       "/ton-kho-nguyen-lieu": "/ton-kho",
//       "/xem-ke-hoach-mua-hang": "/don-mua",
//       "/duyet-ke-hoach": "/de-xuat",
//       "/xem-thong-tin-nha-cung-cap": "/nha-cung-cap",
//     } as Record<string, string>
//   )[location.path];
//   const path = canonicalPurchasePath(oldPath ?? location.path);
//   const entries = menu
//     .filter((item) => !item.permission || can(item.permission))
//     .map((item) => {
//       const Icon = icons[menu.indexOf(item)];
//       return { id: item.path, label: item.label, icon: <Icon /> };
//     });
//   if (can("DON_MUA_VIEW"))
//     entries.push({
//       id: "/xem-ke-hoach-mua-hang",
//       label: "Xem kế hoạch mua hàng",
//       icon: <FileTextOutlined />,
//     });
//   if (
//     can("DE_XUAT_NHAP_HANG_VIEW") &&
//     (can("DE_XUAT_NHAP_HANG_APPROVE") || can("DE_XUAT_NHAP_HANG_REJECT"))
//   )
//     entries.push({
//       id: "/duyet-ke-hoach",
//       label: "Duyệt kế hoạch mua hàng",
//       icon: <FileTextOutlined />,
//     });
//   if (can("NHA_CUNG_CAP_VIEW"))
//     entries.push({
//       id: "/xem-thong-tin-nha-cung-cap",
//       label: "Xem thông tin nhà cung cấp",
//       icon: <ShopOutlined />,
//     });
//   for (let i = entries.length - 1; i >= 0; i--)
//     if (entries[i].id === "/tai-khoan") entries.splice(i, 1);
//   if (settingsCards.some((card) => can(card.permission)))
//     entries.push({
//       id: "/cau-hinh",
//       label: "Cấu hình",
//       icon: <SettingOutlined />,
//     });
//   const isOldPage = [
//     "/du-bao",
//     "/tai-khoan",
//     "/vai-tro",
//     "/nhat-ky",
//     "/quan-ly-san-pham",
//     "/nhap-du-lieu-mua-hang",
//   ].includes(path);
//   const content =
//     path === "/" && user.permissions.length ? undefined : (
//       <div className={isOldPage ? undefined : "db-page purchase-page"}>
//         <AppRoutes location={{ ...location, path }} />
//       </div>
//     );
//   const props = {
//     user,
//     onLogout,
//     workspace: {
//       path,
//       menu: groupSidebarMenu(entries),
//       content,
//       onNavigate: navigate,
//       refreshPermissions,
//     },
//   };
//   const sharedConfig = {
//     title: "Tổng quan",
//     subtitle: "Hệ thống dự báo nhu cầu",
//     roleLabel: user.vai_tro,
//     menu: [],
//     stats: [],
//     tableTitle: "Dữ liệu",
//     rows: [],
//   };
//   // Keep the same mounted shell while permissions refresh on an active form.
//   if (path !== "/") return <DashboardBase {...props} config={sharedConfig} />;
//   // Choose existing overview content by available capabilities; all users share
//   // the same original DashboardBase shell, and authorization remains permission based.
//   if (can("USER_VIEW")) return <DashboardPageAdmin {...props} />;
//   if (can("DON_MUA_APPROVE") || can("DE_XUAT_NHAP_HANG_APPROVE"))
//     return <DashboardPageQLMH {...props} />;
//   if (can("IMPORT_SAN_PHAM")) return <DashboardPageQL {...props} />;
//   if (can("DU_BAO_RUN") || can("IMPORT_DON_HANG"))
//     return <DashboardPageGSBH {...props} />;
//   if (can("DON_MUA_VIEW")) return <DashboardPageNVMuaHang {...props} />;
//   return <DashboardBase {...props} config={sharedConfig} />;
// }
//D:\KLTN\KLTN\frontend\src\components\layout\MainLayout.tsx
import { useAuth } from "../../auth/AuthContext";
import AppRoutes from "../../routes/AppRoutes";
import { navigate, useLocation } from "../../routes/navigation";
import { menu } from "../../routes/menu";
import { groupSidebarMenu } from "../../routes/sidebarGroups";
import { canonicalPurchasePath } from "../../routes/purchasePaths";
import {
  FileTextOutlined, PieChartOutlined, ShoppingCartOutlined, LineChartOutlined,
  ExperimentOutlined, DatabaseOutlined, ShopOutlined, UnorderedListOutlined,
  BulbOutlined, ShoppingOutlined, BarChartOutlined, UserOutlined,
  SafetyCertificateOutlined, HistoryOutlined, SettingOutlined,
} from "@ant-design/icons";
import type { ComponentType } from "react";
import DashboardBase from "../dashboard/DashboardBase";
import DashboardPageAdmin from "../../pages/dashboard/DashboardPageAdmin";
import DashboardPageQL from "../../pages/dashboard/DashboardPageQL";
import DashboardPageGSBH from "../../pages/dashboard/DashboardPageGSBH";
import DashboardPageQLMH from "../../pages/dashboard/DashboardPageQLMH";
import DashboardPageNVMuaHang from "../../pages/dashboard/DashboardPageNVMuaHang";
import "../../styles/purchase.css";

const aliases: Record<string, string> = {
  "/tong-quan": "/",
  "/du-bao-nhu-cau": "/du-bao",
  "/nhap-du-lieu-ban-hang": "/nhap-ban-hang",
  "/quan-ly-tai-khoan": "/tai-khoan",
  "/quan-tri-tai-khoan": "/tai-khoan",
  "/vai-tro": "/phan-quyen",
  "/xem-nhat-ky-hoat-dong": "/cau-hinh/nhat-ky",
  "/nhat-ky-hoat-dong": "/cau-hinh/nhat-ky",
  "/nhat-ky": "/cau-hinh/nhat-ky",
  "/ton-kho-nguyen-lieu": "/ton-kho",
  "/quan-ly-nguyen-lieu": "/nguyen-lieu",
  "/quan-ly-cong-thuc-bom": "/cong-thuc",
  "/quan-ly-ti-le-hao-hut": "/ti-le-hao-hut",
  "/nguyen-lieu-nha-cung-cap": "/nha-cung-cap/cung-ung",
};

const featureIcons: Record<string, ComponentType> = {
  san_pham: ShoppingOutlined,
  du_lieu_ban_hang: ShoppingCartOutlined,
  du_bao_nhu_cau: LineChartOutlined,
  danh_gia_mo_hinh: BarChartOutlined,
  lich_su_du_bao: HistoryOutlined,
  nguyen_lieu: ExperimentOutlined,
  cong_thuc: DatabaseOutlined,
  ti_le_hao_hut: DatabaseOutlined,
  ton_kho_nguyen_lieu: UnorderedListOutlined,
  nguyen_lieu_nha_cung_cap: ShopOutlined,
  nha_cung_cap: ShopOutlined,
  goi_y_nha_cung_cap: BulbOutlined,
  hieu_suat_nha_cung_cap: BarChartOutlined,
  nhu_cau_nguyen_lieu: LineChartOutlined,
  de_xuat_nhap_hang: FileTextOutlined,
  don_mua_nguyen_lieu: ShoppingOutlined,
  ke_hoach_mua_hang: FileTextOutlined,
  dashboard_mua_hang: PieChartOutlined,
  tai_khoan: UserOutlined,
  phan_quyen: SafetyCertificateOutlined,
  quan_ly_ly_do: SettingOutlined,
  nhat_ky_hoat_dong: HistoryOutlined,
};

const groupLabels: Record<string, string> = {
  du_bao: "Dự báo",
  materials: "Nguyên liệu",
  suppliers: "Nhà cung cấp",
  purchasing: "Mua hàng",
  quan_tri: "Quản trị hệ thống",
};

function RouteBreadcrumb({ path }: { path: string }) {
  const { can } = useAuth();
  if (path === "/" || path === "/cau-hinh" || path.startsWith("/cau-hinh/")) return null;

  const entry = menu.find(item => item.path === path) ??
    menu.filter(item => item.path !== "/" && path.startsWith(item.path + "/"))
      .sort((a, b) => b.path.length - a.path.length)[0];
  if (!entry) return null;

  const group = groupLabels[entry.group];
  const detail = entry.path !== path;
  const tail = path.slice(entry.path.length + 1);
  let detailLabel = "Chi tiết";
  if (tail === "tao") detailLabel = "Tạo đề xuất";
  else if (detail) {
    try { detailLabel = `Chi tiết ${decodeURIComponent(tail)}`; }
    catch { detailLabel = "Chi tiết"; }
  }
  const canOpenParent = (!entry.permission || can(entry.permission)) &&
    (!entry.anyPermissions || entry.anyPermissions.some(can));

  return (
    <nav className="pm-route-breadcrumb" aria-label="Breadcrumb">
      <a href="#/">Trang chủ</a>
      {group && <><span aria-hidden="true">/</span><span>{group}</span></>}
      <span aria-hidden="true">/</span>
      {detail ? <>
        {canOpenParent ? <a href={`#${entry.path}`}>{entry.label}</a> : <span>{entry.label}</span>}
        <span aria-hidden="true">/</span>
        <span aria-current="page">{detailLabel}</span>
      </> : <span aria-current="page">{entry.label}</span>}
    </nav>
  );
}

export default function MainLayout({ onLogout }: { onLogout: () => void | Promise<void> }) {
  const { user, can, refreshPermissions } = useAuth();
  const location = useLocation();
  const path = canonicalPurchasePath(aliases[location.path] ?? location.path);
  const entries = menu.filter(item =>
    (!item.permission || can(item.permission)) &&
    (!item.anyPermissions || item.anyPermissions.some(can))
  ).map(item => {
    const permission = item.permission ? item.permission.split(":")[0] : undefined;
    const Icon = item.path === "/" ? PieChartOutlined : featureIcons[permission ?? ""] ?? FileTextOutlined;
    return { id: item.path, label: item.label, permission, icon: <Icon /> };
  });
  const oldPages = ["/du-bao", "/tai-khoan", "/phan-quyen", "/quan-ly-san-pham", "/nhap-ban-hang", "/lich-su-du-bao", "/danh-gia-mo-hinh"];
  const unified = !oldPages.includes(path) && path !== "/cau-hinh" && !path.startsWith("/cau-hinh/");
  const props = {
    user, onLogout,
    workspace: {
      path,
      menu: groupSidebarMenu(entries),
      content: path === "/" ? undefined : (
        <div className={oldPages.includes(path) ? undefined : `db-page purchase-page${unified ? " pm-unified-page" : ""}`}>
          <RouteBreadcrumb path={path} />
          <div className={unified ? "pm-unified-content" : undefined}>
            <AppRoutes location={{ ...location, path }} />
          </div>
        </div>
      ),
      onNavigate: navigate,
      refreshPermissions,
    },
  };
  // Vai trò chọn tổng quan; quyền thực tế quyết định menu và thao tác.
  // Giữ cùng một component khi đổi đường dẫn để không dựng lại cả shell.
  switch (user.vai_tro) {
    case "ADMIN": return <DashboardPageAdmin {...props} />;
    case "QUAN_LY_BAN_HANG": return <DashboardPageQL {...props} />;
    case "QUAN_LY_MUA_HANG": return <DashboardPageQLMH {...props} />;
    case "NHAN_VIEN_BAN_HANG": return <DashboardPageGSBH {...props} />;
    case "NHAN_VIEN_MUA_HANG": return <DashboardPageNVMuaHang {...props} />;
    default: return <DashboardBase {...props} config={{
      title: "Tổng quan", subtitle: "Hệ thống dự báo nhu cầu",
      roleLabel: user.vai_tro, menu: [], stats: [], tableTitle: "Dữ liệu", rows: [],
    }} />;
  }
}

