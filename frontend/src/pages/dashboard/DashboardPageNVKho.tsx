import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";
import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Kho Nguyên Liệu",
  subtitle:
    "Quản lý nguyên liệu, kiểm tra tồn kho và theo dõi kế hoạch sản xuất.",
  roleLabel: "NHÂN VIÊN KHO",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: "📊" },
    { id: "quan-ly-nguyen-lieu", label: "Quản lý nguyên liệu", icon: "📦" },
    { id: "xem-ton-kho", label: "Xem tồn kho", icon: "🏬" },
    { id: "xem-ke-hoach-san-xuat", label: "Xem kế hoạch sản xuất", icon: "⚙️" },
  ],
  stats: [
    {
      label: "Loại nguyên liệu",
      value: "12",
      note: "Nguyên liệu cà phê & phụ liệu",
      color: "blue",
    },
    {
      label: "Tổng lượng tồn",
      value: "15.2 Tấn",
      note: "Tồn kho an toàn",
      color: "green",
    },
    {
      label: "Cần bổ sung",
      value: "02",
      note: "Nguyên liệu sắp chạm ngưỡng",
      color: "orange",
    },
    {
      label: "Kế hoạch sản xuất",
      value: "04",
      note: "Đơn sản xuất cần cấp NL",
      color: "purple",
    },
  ],
  tableTitle: "Danh sách nguyên liệu trong kho",
  columns: [
    { key: "code", label: "Mã nguyên liệu" },
    { key: "name", label: "Tên nguyên liệu" },
    { key: "detail", label: "Số lượng tồn kho" },
    { key: "status", label: "Trạng thái" },
  ],
  rows: [
    {
      code: "NL-001",
      name: "Hạt cà phê Arabica Cầu Đất (Thô)",
      detail: "8.5 Tấn • Kho A1",
      status: "Đủ tồn",
    },
    {
      code: "NL-002",
      name: "Hạt cà phê Robusta Đắk Lắk (Thô)",
      detail: "5.2 Tấn • Kho A2",
      status: "Đủ tồn",
    },
    {
      code: "NL-003",
      name: "Bao bì đóng gói Milano 500g",
      detail: "1,200 Cái • Kho B1",
      status: "Cần bổ sung",
    },
  ],
};

export default function DashboardPageNVKho({
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