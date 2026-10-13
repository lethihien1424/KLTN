import { useAuth } from "../../auth/AuthContext";
import AppRoutes from "../../routes/AppRoutes";
import { navigate, useLocation } from "../../routes/navigation";
import { settingsCards } from "../../pages/cau-hinh/settings";
import { menu } from "../../routes/menu";
import { groupSidebarMenu } from "../../routes/sidebarGroups";
import { canonicalPurchasePath } from "../../routes/purchasePaths";
import {
  PieChartOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  BulbOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import DashboardBase from "../dashboard/DashboardBase";
import DashboardPageAdmin from "../../pages/dashboard/DashboardPageAdmin";
import DashboardPageQL from "../../pages/dashboard/DashboardPageQL";
import DashboardPageGSBH from "../../pages/dashboard/DashboardPageGSBH";
import DashboardPageQLMH from "../../pages/dashboard/DashboardPageQLMH";
import DashboardPageNVMuaHang from "../../pages/dashboard/DashboardPageNVMuaHang";
import "../../styles/purchase.css";

const icons = [
  PieChartOutlined,
  ShoppingCartOutlined,
  LineChartOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  DatabaseOutlined,
  ShopOutlined,
  UnorderedListOutlined,
  LineChartOutlined,
  BulbOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  PieChartOutlined,
  UserOutlined,
];
export default function MainLayout({ onLogout }: { onLogout: () => void }) {
  const { user, can, refreshPermissions } = useAuth();
  const location = useLocation();
  const oldPath = (
    {
      "/du-bao-nhu-cau": "/du-bao",
      "/nhap-du-lieu-ban-hang": "/nhap-ban-hang",
      "/tong-quan": "/",
      "/quan-ly-tai-khoan": "/tai-khoan",
      "/phan-quyen": "/vai-tro",
      "/xem-nhat-ky-hoat-dong": "/nhat-ky",
      "/ton-kho-nguyen-lieu": "/ton-kho",
      "/xem-ke-hoach-mua-hang": "/don-mua",
      "/duyet-ke-hoach": "/de-xuat",
      "/xem-thong-tin-nha-cung-cap": "/nha-cung-cap",
    } as Record<string, string>
  )[location.path];
  const path = canonicalPurchasePath(oldPath ?? location.path);
  const entries = menu
    .filter((item) => !item.permission || can(item.permission))
    .map((item) => {
      const Icon = icons[menu.indexOf(item)];
      return { id: item.path, label: item.label, icon: <Icon /> };
    });
  if (can("DON_MUA_VIEW"))
    entries.push({
      id: "/xem-ke-hoach-mua-hang",
      label: "Xem kế hoạch mua hàng",
      icon: <FileTextOutlined />,
    });
  if (
    can("DE_XUAT_NHAP_HANG_VIEW") &&
    (can("DE_XUAT_NHAP_HANG_APPROVE") || can("DE_XUAT_NHAP_HANG_REJECT"))
  )
    entries.push({
      id: "/duyet-ke-hoach",
      label: "Duyệt kế hoạch mua hàng",
      icon: <FileTextOutlined />,
    });
  if (can("NHA_CUNG_CAP_VIEW"))
    entries.push({
      id: "/xem-thong-tin-nha-cung-cap",
      label: "Xem thông tin nhà cung cấp",
      icon: <ShopOutlined />,
    });
  for (let i = entries.length - 1; i >= 0; i--)
    if (entries[i].id === "/tai-khoan") entries.splice(i, 1);
  if (settingsCards.some((card) => can(card.permission)))
    entries.push({
      id: "/cau-hinh",
      label: "Cấu hình",
      icon: <SettingOutlined />,
    });
  const isOldPage = [
    "/du-bao",
    "/tai-khoan",
    "/vai-tro",
    "/nhat-ky",
    "/quan-ly-san-pham",
    "/nhap-du-lieu-mua-hang",
  ].includes(path);
  const content =
    path === "/" && user.permissions.length ? undefined : (
      <div className={isOldPage ? undefined : "db-page purchase-page"}>
        <AppRoutes location={{ ...location, path }} />
      </div>
    );
  const props = {
    user,
    onLogout,
    workspace: {
      path,
      menu: groupSidebarMenu(entries),
      content,
      onNavigate: navigate,
      refreshPermissions,
    },
  };
  const sharedConfig = {
    title: "Tổng quan",
    subtitle: "Hệ thống dự báo nhu cầu",
    roleLabel: user.vai_tro,
    menu: [],
    stats: [],
    tableTitle: "Dữ liệu",
    rows: [],
  };
  // Keep the same mounted shell while permissions refresh on an active form.
  if (path !== "/") return <DashboardBase {...props} config={sharedConfig} />;
  // Choose existing overview content by available capabilities; all users share
  // the same original DashboardBase shell, and authorization remains permission based.
  if (can("USER_VIEW")) return <DashboardPageAdmin {...props} />;
  if (can("DON_MUA_APPROVE") || can("DE_XUAT_NHAP_HANG_APPROVE"))
    return <DashboardPageQLMH {...props} />;
  if (can("IMPORT_SAN_PHAM")) return <DashboardPageQL {...props} />;
  if (can("DU_BAO_RUN") || can("IMPORT_DON_HANG"))
    return <DashboardPageGSBH {...props} />;
  if (can("DON_MUA_VIEW")) return <DashboardPageNVMuaHang {...props} />;
  return <DashboardBase {...props} config={sharedConfig} />;
}
