import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";
import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Mua Hàng",
  subtitle:
    "Xem kế hoạch mua hàng, nhập dữ liệu mua hàng và xem thông tin nhà cung cấp.",
  roleLabel: "NHÂN VIÊN MUA HÀNG",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: "📊" },
    { id: "xem-ke-hoach-mua-hang", label: "Xem kế hoạch mua hàng", icon: "📋" },
    { id: "nhap-du-lieu-mua-hang", label: "Nhập dữ liệu mua hàng", icon: "🛒" },
    { id: "xem-thong-tin-nha-cung-cap", label: "Xem thông tin nhà cung cấp", icon: "🏢" },
  ],
  stats: [
    {
      label: "Kế hoạch cần thực hiện",
      value: "02",
      note: "Kế hoạch đã được phê duyệt",
      color: "blue",
    },
    {
      label: "Nhà cung cấp đối tác",
      value: "05",
      note: "Doanh nghiệp cung ứng cà phê",
      color: "purple",
    },
    {
      label: "Đơn mua đang xử lý",
      value: "02",
      note: "Đang chờ giao hàng",
      color: "orange",
    },
    {
      label: "Đơn mua hoàn thành",
      value: "06",
      note: "Đã nhập kho thành công",
      color: "green",
    },
  ],
  tableTitle: "Danh sách đơn mua hàng",
  columns: [
    { key: "code", label: "Mã đơn nhập" },
    { key: "name", label: "Tên nguyên liệu / Nhà cung cấp" },
    { key: "detail", label: "Khối lượng & Giá trị" },
    { key: "status", label: "Trạng thái" },
  ],
  rows: [
    {
      code: "NH-001",
      name: "Cà phê Arabica • NCC Nông nông sản Đà Lạt",
      detail: "8.5 Tấn • 810,000,000 đ",
      status: "Đang xử lý",
    },
    {
      code: "NH-002",
      name: "Cà phê Robusta • NCC Nông sản Tây Nguyên",
      detail: "3.2 Tấn • 320,000,000 đ",
      status: "Chờ xác nhận",
    },
  ],
};

export default function DashboardPageNVMuaHang({
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