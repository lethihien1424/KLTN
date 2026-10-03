import {
  LineChartOutlined,
  PieChartOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";

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
    },
    {
      id: "du-bao-nhu-cau",
      label: "Dự báo nhu cầu",
      icon: <LineChartOutlined />,
    },
  ],

  // Chưa có API số liệu tổng quan trong đoạn code đã gửi.
  stats: [],

  tableTitle: "Dữ liệu bán hàng",

  columns: [
    {
      key: "code",
      label: "Mã đơn hàng",
    },
    {
      key: "name",
      label: "Tên sản phẩm",
    },
    {
      key: "detail",
      label: "Số lượng tiêu thụ",
    },
    {
      key: "status",
      label: "Trạng thái",
    },
  ],

  // Điền dữ liệu từ API khi kết nối bảng bán hàng.
  rows: [],
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