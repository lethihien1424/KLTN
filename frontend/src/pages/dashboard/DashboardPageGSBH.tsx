///D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardPageGSBH.tsx
import {
  LineChartOutlined,
  PieChartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";

import DuLieuBanHangPage from "../ban-hang/DuLieuBanHangPage";

import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Nhân Viên Bán Hàng",

  subtitle:
    "Theo dõi dữ liệu bán hàng và dự báo nhu cầu tiêu thụ sản phẩm cà phê.",

  roleLabel: "NHÂN VIÊN BÁN HÀNG",

  menu: [
    {
      id: "tong-quan",
      label: "Tổng quan",
      icon: <PieChartOutlined />,
    },
    {
      id: "nhap-du-lieu-ban-hang",
      label: "Nhập dữ liệu bán hàng",
      icon: <ShoppingCartOutlined />,
      permission: "du_lieu_ban_hang",
    },
    {
      id: "du-bao-nhu-cau",
      label: "Dự báo nhu cầu",
      icon: <LineChartOutlined />,
      permission: "du_bao_nhu_cau",
    },
  ],

  stats: [],

  tableTitle: "Dữ liệu bán hàng",

  columns: [
    { key: "code", label: "Mã đơn hàng" },
    { key: "name", label: "Tên sản phẩm" },
    { key: "detail", label: "Số lượng tiêu thụ" },
    { key: "status", label: "Trạng thái" },
  ],

  rows: [],

  renderCustomContent: activeMenu => {
    if (activeMenu === "nhap-du-lieu-ban-hang") {
      return <DuLieuBanHangPage />;
    }

    return null;
  },
};

export default function DashboardPageGSBH({
  user,
  onLogout,
}: Props) {
  return (
    <DashboardBase
      user={user}
      config={config}
      onLogout={onLogout}
    />
  );
}