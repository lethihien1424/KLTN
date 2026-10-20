///D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardPageQL.tsx
import {
  DatabaseOutlined,
  FileDoneOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ShoppingOutlined,
  TruckOutlined,
} from "@ant-design/icons";

import DashboardBase, {
  type DashboardConfig,
  type DashboardWorkspace,
} from "../../components/dashboard/DashboardBase";

import type { User } from "../../services/authService";


type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
  workspace?: DashboardWorkspace;
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
      id: "du-bao-nhu-cau", permission: "du_bao_nhu_cau",
      label: "Dự báo nhu cầu",
      icon: <LineChartOutlined />,
    },
    {
      id: "duyet-ke-hoach", permission: "ke_hoach_mua_hang",
      label: "Duyệt kế hoạch",
      icon: <FileDoneOutlined />,
      badge: 2,
    },
    {
      id: "ton-kho-nguyen-lieu", permission: "ton_kho_nguyen_lieu",
      label: "Tồn kho nguyên liệu",
      icon: <DatabaseOutlined />,
    },
    {
      id: "quan-ly-san-pham", permission: "san_pham",
      label: "Quản lý sản phẩm",
      icon: <ShoppingOutlined />,
    },
    {
      id: "nha-cung-cap", permission: "nha_cung_cap",
      label: "Nhà cung cấp",
      icon: <TruckOutlined />,
    },
  ],

  // Các số liệu dưới đây hiện là dữ liệu minh họa.
  stats: [
    {
      label: "KẾ HOẠCH CHỜ DUYỆT",
      permission: "ke_hoach_mua_hang",
      value: "02",
      note: "Cấp thiết",
      color: "orange",
    },
    {
      label: "CHÍNH XÁC DỰ BÁO",
      permission: "danh_gia_mo_hinh",
      value: "94.2%",
      note: "↑ 1.2%",
      color: "blue",
    },
    {
      label: "DỰ TRÙ CHI PHÍ T10",
      permission: "ke_hoach_mua_hang",
      value: "810 Tr",
      note: "VNĐ",
      color: "purple",
    },
    {
      label: "TỒN KHO AN TOÀN",
      permission: "ton_kho_nguyen_lieu",
      value: "Ổn định",
      note: "(15.2 Tấn)",
      color: "green",
    },
  ],

  tablePermission: "ke_hoach_mua_hang",
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
  workspace,
}: Props) {
  return (
    <DashboardBase
      user={user}
      config={config}
      onLogout={onLogout}
      workspace={workspace}
    />
  );
}
