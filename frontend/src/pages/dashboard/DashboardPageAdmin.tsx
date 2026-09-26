import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";
import type { User } from "../../services/authService";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Quản Trị",
  subtitle:
    "Quản lý tài khoản, phân quyền, sản phẩm và xem nhật ký hoạt động hệ thống.",
  roleLabel: "ADMIN",
  menu: [
    { id: "tong-quan", label: "Tổng quan", icon: "📊" },
    { id: "quan-ly-tai-khoan", label: "Quản lý tài khoản", icon: "👤" },
    { id: "phan-quyen", label: "Phân quyền", icon: "🔑" },
    { id: "quan-ly-san-pham", label: "Quản lý sản phẩm", icon: "📦" },
    { id: "xem-nhat-ky-hoat-dong", label: "Xem nhật ký hoạt động", icon: "📜" },
  ],
  stats: [
    {
      label: "Tổng tài khoản",
      value: "06",
      note: "Người dùng trong hệ thống",
      color: "blue",
    },
    {
      label: "Nhóm phân quyền",
      value: "06",
      note: "Vai trò chức năng",
      color: "purple",
    },
    {
      label: "Danh mục sản phẩm",
      value: "07",
      note: "Sản phẩm cà phê",
      color: "orange",
    },
    {
      label: "Trạng thái hệ thống",
      value: "Hoạt động",
      note: "Hệ thống vận hành ổn định",
      color: "green",
    },
  ],
  tableTitle: "Danh sách tài khoản & vai trò",
  columns: [
    { key: "code", label: "Mã người dùng" },
    { key: "name", label: "Họ và tên" },
    { key: "detail", label: "Vai trò phân quyền" },
    { key: "status", label: "Trạng thái" },
  ],
  rows: [
    {
      code: "admin",
      name: "Quản trị viên hệ thống",
      detail: "ADMIN",
      status: "Hoạt động",
    },
    {
      code: "QL",
      name: "Nguyễn Minh Tâm",
      detail: "QUẢN LÝ",
      status: "Hoạt động",
    },
    {
      code: "GSBH01",
      name: "Nguyễn Văn An",
      detail: "GIÁM SÁT BÁN HÀNG",
      status: "Hoạt động",
    },
    {
      code: "KHSX01",
      name: "Lê Thị Dinh",
      detail: "NHÂN VIÊN KẾ HOẠCH SẢN XUẤT",
      status: "Hoạt động",
    },
    {
      code: "KHO01",
      name: "Lê Minh Hùng",
      detail: "NHÂN VIÊN KHO",
      status: "Hoạt động",
    },
    {
      code: "MH01",
      name: "Nguyễn Hữu Thái",
      detail: "NHÂN VIÊN MUA HÀNG",
      status: "Hoạt động",
    },
  ],
};

export default function DashboardPageAdmin({
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