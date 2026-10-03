import {
  DatabaseOutlined,
  FileDoneOutlined,
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

type SectionInfo = {
  title: string;
  description: string;
};

const SECTIONS: Record<string, SectionInfo> = {
  "tong-quan": {
    title: "Tổng quan mua hàng",
    description:
      "Theo dõi kế hoạch mua nguyên liệu, nhà cung cấp và tồn kho.",
  },

  "duyet-ke-hoach": {
    title: "Duyệt kế hoạch mua hàng",
    description:
      "Xem và phê duyệt kế hoạch mua nguyên liệu.",
  },

  "ton-kho-nguyen-lieu": {
    title: "Tồn kho nguyên liệu",
    description:
      "Theo dõi số lượng nguyên liệu hiện có để phục vụ mua hàng.",
  },

  "nha-cung-cap": {
    title: "Nhà cung cấp",
    description:
      "Theo dõi thông tin và đánh giá nhà cung cấp.",
  },
};

const config: DashboardConfig = {
  title: "Bảng Điều Khiển Quản Lý Mua Hàng",

  subtitle:
    "Theo dõi và phê duyệt hoạt động mua nguyên liệu Milano Coffee.",

  roleLabel: "QUẢN LÝ MUA HÀNG",

  menu: [
    {
      id: "tong-quan",
      label: "Tổng quan",
      icon: <PieChartOutlined />,
    },
    {
      id: "duyet-ke-hoach",
      label: "Duyệt kế hoạch mua hàng",
      icon: <FileDoneOutlined />,
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

  stats: [],

  tableTitle: "Quản lý mua hàng",

  columns: [],

  rows: [],

  renderCustomContent: activeMenu => {
    const section = SECTIONS[activeMenu];

    if (!section) {
      return null;
    }

    return (
      <section className="dashboard-panel">
        <div className="dashboard-panel-heading">
          <div>
            <h2>{section.title}</h2>
            <p>{section.description}</p>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          Màn hình này chưa được kết nối với chức năng
          nghiệp vụ.
        </div>
      </section>
    );
  },
};


export default function DashboardPageQLMH({
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