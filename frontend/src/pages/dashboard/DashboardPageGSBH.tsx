import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";
import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Bán Hàng",
  subtitle:
    "Nhập dữ liệu bán hàng và xem kết quả dự báo nhu cầu sản phẩm cà phê.",
  roleLabel: "GIÁM SÁT BÁN HÀNG",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: "📊" },
    { id: "nhap-du-lieu-ban-hang", label: "Nhập dữ liệu bán hàng", icon: "📈" },
    { id: "xem-du-bao", label: "Xem dự báo", icon: "📉" },
  ],
  stats: [
    {
      label: "Đơn bán trong tháng",
      value: "128",
      note: "Tổng số hóa đơn tiêu thụ",
      color: "blue",
    },
    {
      label: "Sản phẩm theo dõi",
      value: "07",
      note: "Dòng sản phẩm cà phê",
      color: "purple",
    },
    {
      label: "Cần kiểm tra dữ liệu",
      value: "03",
      note: "Số liệu bán chưa đồng bộ",
      color: "orange",
    },
    {
      label: "Cập nhật bán hàng",
      value: "Đã cập nhật",
      note: "Dữ liệu mới nhất",
      color: "green",
    },
  ],
  tableTitle: "Nhật ký nhập dữ liệu bán hàng gần đây",
  columns: [
    { key: "code", label: "Mã đơn hàng" },
    { key: "name", label: "Tên sản phẩm" },
    { key: "detail", label: "Số lượng tiêu thụ" },
    { key: "status", label: "Trạng thái" },
  ],
  rows: [
    {
      code: "DH-001",
      name: "Cà phê Espresso rang xay",
      detail: "85 kg • Chi nhánh Q.1",
      status: "Đã nhập",
    },
    {
      code: "DH-002",
      name: "Cà phê Robusta nguyên hạt",
      detail: "120 kg • Chi nhánh Q.3",
      status: "Đã nhập",
    },
    {
      code: "DH-003",
      name: "Cà phê Arabica Cầu Đất",
      detail: "95 kg • Chi nhánh Q.7",
      status: "Chờ xác nhận",
    },
  ],
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