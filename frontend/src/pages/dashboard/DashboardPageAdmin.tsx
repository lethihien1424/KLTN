/// D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardPageAdmin.tsx
import {
  HistoryOutlined,
  PieChartOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";

import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";

import type { User } from "../../services/authService";

import QuanLyTaiKhoanPage from "../tai-khoan/QuanLyTaiKhoanPage";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

export default function DashboardPageAdmin({
  user,
  onLogout,
}: Props) {
  const config: DashboardConfig = {
    title: "Bảng Điều Khiển Quản Trị",

    subtitle:
      "Quản lý tài khoản, phân quyền, sản phẩm và xem nhật ký hoạt động hệ thống.",

    roleLabel: "ADMIN",

    menu: [
      {
        id: "tong-quan",
        label: "Tổng quan",
        icon: <PieChartOutlined />,
      },
      {
        id: "quan-ly-tai-khoan",
        label: "Quản lý tài khoản",
        icon: <UserOutlined />,
      },
      {
        id: "phan-quyen",
        label: "Phân quyền",
        icon: <SafetyCertificateOutlined />,
      },
      {
        id: "quan-ly-san-pham",
        label: "Quản lý sản phẩm",
        icon: <ShoppingOutlined />,
      },
      {
        id: "xem-nhat-ky-hoat-dong",
        label: "Xem nhật ký hoạt động",
        icon: <HistoryOutlined />,
      },
    ],

    stats: [
      {
        label: "Quản trị hệ thống",
        value: "ADMIN",
        note: "Vai trò đang đăng nhập",
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
        note: "Dữ liệu minh họa",
        color: "orange",
      },
      {
        label: "Trạng thái hệ thống",
        value: "Hoạt động",
        note: "Giao diện quản trị",
        color: "green",
      },
    ],

    tableTitle: "Quản lý tài khoản",

    // DashboardBase yêu cầu columns và rows cho bảng mặc định.
    // Phần quản lý tài khoản được render riêng bên dưới.
    columns: [],
    rows: [],

    renderCustomContent: activeMenu => {
      if (
        activeMenu === "tong-quan" ||
        activeMenu === "quan-ly-tai-khoan"
      ) {
        return <QuanLyTaiKhoanPage />;
      }

      if (activeMenu === "phan-quyen") {
        return (
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Phân quyền</h2>
                <p>Quản lý vai trò và quyền truy cập hệ thống.</p>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              Chức năng phân quyền đang được hoàn thiện.
            </div>
          </section>
        );
      }

      if (activeMenu === "quan-ly-san-pham") {
        return (
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Quản lý sản phẩm</h2>
                <p>Danh sách sản phẩm của hệ thống.</p>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              Chức năng quản lý sản phẩm đang được hoàn thiện.
            </div>
          </section>
        );
      }

      if (activeMenu === "xem-nhat-ky-hoat-dong") {
        return (
          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>Nhật ký hoạt động</h2>
                <p>Các thao tác được ghi nhận trong hệ thống.</p>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              Chức năng xem nhật ký đang được hoàn thiện.
            </div>
          </section>
        );
      }

      return null;
    },
  };

  return (
    <DashboardBase
      user={user}
      config={config}
      onLogout={onLogout}
    />
  );
}