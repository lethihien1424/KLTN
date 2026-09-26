import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";
import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Quản Lý",
  subtitle:
    "Tổng quan tình hình dự báo nhu cầu và phê duyệt kế hoạch nhập cà phê.",
  roleLabel: "QUẢN LÝ",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: "📊" },
    { id: "xem-du-bao", label: "Xem dự báo", icon: "📈" },
    { id: "phe-duyet-ke-hoach", label: "Phê duyệt kế hoạch mua nguyên liệu", icon: "📋" },
    { id: "cap-nhat-nha-cung-cap", label: "Cập nhật nhà cung cấp", icon: "🏢" },
  ],
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
    { key: "code", label: "Mã KH" },
    { key: "creator", label: "Người lập" },
    { key: "volume", label: "Tổng khối lượng" },
    { key: "cost", label: "Chi phí dự kiến" },
    { key: "date", label: "Ngày giao dự kiến" },
    { key: "status", label: "Trạng thái" },
    { key: "actions", label: "Thao tác duyệt" },
  ],
  rows: [
    {
      code: "KH-0926",
      creator: "Lê Thị Dinh (KHSX01)",
      volume: "8.5 Tấn",
      cost: "810,000,000 đ",
      date: "05/10/2026",
      status: "Chờ duyệt",
    },
    {
      code: "KH-0927",
      creator: "Lê Thị Dinh (KHSX01)",
      volume: "3.2 Tấn",
      cost: "320,000,000 đ",
      date: "10/10/2026",
      status: "Chờ duyệt",
    },
  ],
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