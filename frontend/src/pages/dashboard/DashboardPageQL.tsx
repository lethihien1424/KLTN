import {
  DatabaseOutlined,
  FileDoneOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TruckOutlined,
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
  title: "Bảng Điều Khiển Quản Lý Bán Hàng",

  subtitle:
    "Tổng quan tình hình dự báo nhu cầu và phê duyệt kế hoạch nhập cà phê.",

  roleLabel: "QUẢN LÝ BÁN HÀNG",

  menu: [
    {
      id: "tong-quan",
      label: "Tổng quan",
      icon: <PieChartOutlined />,
    },
    {
      id: "du-bao-nhu-cau",
      label: "Dự báo nhu cầu",
      icon: <LineChartOutlined />,
    },
    {
      id: "duyet-ke-hoach",
      label: "Duyệt kế hoạch",
      icon: <FileDoneOutlined />,
      badge: 2,
    },
    {
      id: "ton-kho-nguyen-lieu",
      label: "Tồn kho nguyên liệu",
      icon: <DatabaseOutlined />,
    },
    {
      id: "nha-cung-cap",
      label: "Nhà cung cấp",
      icon: <TruckOutlined />,
    },
  ],

  // Các số liệu dưới đây hiện là dữ liệu minh họa.
  stats: [
    {
      label: "KẾ HOẠCH CHỜ DUYỆT",
      value: "02",
      note: "Cấp thiết",
      color: "orange",
    },
    {
      label: "CHÍNH XÁC DỰ BÁO",
      value: "94.2%",
      note: "↑ 1.2%",
      color: "blue",
    },
    {
      label: "DỰ TRÙ CHI PHÍ T10",
      value: "810 Tr",
      note: "VNĐ",
      color: "purple",
    },
    {
      label: "TỒN KHO AN TOÀN",
      value: "Ổn định",
      note: "(15.2 Tấn)",
      color: "green",
    },
  ],

  tableTitle: "Kế Hoạch Mua Nguyên Liệu Chờ Phê Duyệt",

  columns: [
    {
      key: "code",
      label: "Mã KH",
    },
    {
      key: "creator",
      label: "Người lập",
    },
    {
      key: "volume",
      label: "Tổng khối lượng",
    },
    {
      key: "cost",
      label: "Chi phí dự kiến",
    },
    {
      key: "date",
      label: "Ngày giao dự kiến",
    },
    {
      key: "status",
      label: "Trạng thái",
    },
    {
      key: "actions",
      label: "Thao tác duyệt",
    },
  ],

  rows: [],
};


export default function DashboardPageQL({
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