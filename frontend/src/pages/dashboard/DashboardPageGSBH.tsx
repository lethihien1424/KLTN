//D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardPageGSBH.tsx
import {
  DatabaseOutlined,
  HistoryOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ShoppingOutlined,
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

// Giữ tên file GSBH để không làm thay đổi các import hiện có.
// Vai trò sử dụng là NHAN_VIEN_BAN_HANG.
const config: DashboardConfig = {
  title: "Bảng Điều Khiển Nhân Viên Bán Hàng",
  subtitle: "Theo dõi sản phẩm, dữ liệu bán hàng và dự báo nhu cầu.",
  roleLabel: "NHÂN VIÊN BÁN HÀNG",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: <PieChartOutlined /> },
    {
      id: "quan-ly-san-pham", label: "Quản lý sản phẩm",
      permission: "san_pham", icon: <ShoppingOutlined />,
    },
    {
      id: "nhap-du-lieu-ban-hang", label: "Dữ liệu bán hàng",
      permission: "du_lieu_ban_hang", icon: <DatabaseOutlined />,
    },
    {
      id: "du-bao-nhu-cau", label: "Dự báo nhu cầu",
      permission: "du_bao_nhu_cau", icon: <LineChartOutlined />,
    },
    {
      id: "danh-gia-mo-hinh", label: "Đánh giá mô hình",
      permission: "danh_gia_mo_hinh", icon: <LineChartOutlined />,
    },
    {
      id: "lich-su-du-bao", label: "Lịch sử dự báo",
      permission: "lich_su_du_bao", icon: <HistoryOutlined />,
    },
  ],
  stats: [],
  tableTitle: "Tổng quan bán hàng",
  columns: [],
  rows: [],
};

export default function DashboardPageGSBH({ user, onLogout, workspace }: Props) {
  return (
    <DashboardBase
      user={user}
      config={config}
      onLogout={onLogout}
      workspace={workspace}
    />
  );
}
