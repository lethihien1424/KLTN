import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";
import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Kế Hoạch Sản Xuất",
  subtitle:
    "Quản lý công thức BOM, tỉ lệ hao hụt, xem đề xuất nhập hàng và lập kế hoạch mua hàng.",
  roleLabel: "KẾ HOẠCH SẢN XUẤT",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: "📊" },
    { id: "quan-ly-cong-thuc-bom", label: "Quản lý công thức BOM", icon: "🧪" },
    { id: "quan-ly-ti-le-hao-hut", label: "Quản lý tỉ lệ hao hụt", icon: "📉" },
    { id: "xem-de-xuat-nhap-hang", label: "Xem đề xuất nhập hàng", icon: "📑" },
    { id: "lap-ke-hoach-mua-hang", label: "Lập kế hoạch mua hàng", icon: "📝" },
  ],
  stats: [
    {
      label: "Công thức BOM",
      value: "12",
      note: "Công thức chế biến cà phê",
      color: "blue",
    },
    {
      label: "Tỉ lệ hao hụt trung bình",
      value: "3.5%",
      note: "Trong định mức quy định",
      color: "purple",
    },
    {
      label: "Đề xuất nhập hàng",
      value: "05",
      note: "Đề xuất cần lập kế hoạch",
      color: "orange",
    },
    {
      label: "Kế hoạch mua đã lập",
      value: "04",
      note: "Đang chờ duyệt",
      color: "green",
    },
  ],
  tableTitle: "Danh sách kế hoạch mua hàng đã lập",
  columns: [
    { key: "code", label: "Mã KH" },
    { key: "name", label: "Tên kế hoạch" },
    { key: "detail", label: "Nhu cầu nguyên liệu" },
    { key: "status", label: "Trạng thái" },
  ],
  rows: [
    {
      code: "KH-0926",
      name: "Kế hoạch mua cà phê Arabica T10",
      detail: "8.5 Tấn • Nhu cầu sản xuất SP0001",
      status: "Chờ duyệt",
    },
    {
      code: "KH-0927",
      name: "Kế hoạch mua cà phê Robusta T10",
      detail: "3.2 Tấn • Nhu cầu sản xuất SP0002",
      status: "Chờ duyệt",
    },
  ],
};

export default function DashboardPageNVKHSX({
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