///D:\KLTN\KLTN\frontend\src\components\dashboard\DashboardBase.tsx
import { useState } from "react";
import type { ReactNode } from "react";

import type { User } from "../../services/authService";

import DuBaoNhuCauPage from "../../pages/du-bao/DuBaoNhuCauPage";

import "../../../public/Dashboard.css";
import "../../../public/QuanLyTaiKhoan.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export type DashboardItem = {
  id: string;
  label: string;
  icon?: string | ReactNode;
  badge?: string | number;
};

export type StatItem = {
  label: string;
  value: string;
  note: string;
  color: "blue" | "green" | "orange" | "purple";
};

export type TableColumn = {
  key: string;
  label: string;
};

export type TableRowData = {
  code: string;
  [key: string]: any;
};

export type DashboardConfig = {
  title: string;
  subtitle: string;
  roleLabel: string;
  menu: DashboardItem[];
  stats: StatItem[];
  tableTitle: string;
  columns?: TableColumn[];
  rows: TableRowData[];
  topActions?: ReactNode;
  renderCustomContent?: (
    activeMenu: string,
  ) => ReactNode;
};

type Props = {
  user: User;
  config: DashboardConfig;
  onLogout: () => void | Promise<void>;
};

const FORECAST_ROLES = new Set([
  "ADMIN",
  "QUAN_LY_BAN_HANG",
  "NHAN_VIEN_BAN_HANG",
  "NHAN_VIEN_MUA_HANG",
]);

export default function DashboardBase({
  user,
  config,
  onLogout,
}: Props) {
  const [activeMenu, setActiveMenu] = useState(
    config.menu[0]?.id ?? "",
  );

  const [search, setSearch] = useState("");

  const selected = config.menu.find(
    (item) => item.id === activeMenu,
  );

  const isOverview =
    activeMenu === config.menu[0]?.id;

  const isForecast =
    activeMenu === "du-bao-nhu-cau";

  const canForecast = FORECAST_ROLES.has(
    user.vai_tro,
  );

  const defaultColumns: TableColumn[] = [
    { key: "code", label: "Mã" },
    { key: "name", label: "Nội dung" },
    { key: "detail", label: "Thông tin" },
    { key: "status", label: "Trạng thái" },
  ];

  const columns =
    config.columns ?? defaultColumns;

  const query = search
    .trim()
    .toLocaleLowerCase("vi");

  const rows = config.rows.filter((row) => {
    if (!query) {
      return true;
    }

    return Object.values(row).some((value) =>
      String(value)
        .toLocaleLowerCase("vi")
        .includes(query),
    );
  });

  const customContent = isForecast
    ? null
    : config.renderCustomContent?.(activeMenu);

  const chartData = {
    labels: [
      "Tháng 5",
      "Tháng 6",
      "Tháng 7",
      "Tháng 8",
      "Tháng 9",
      "T10 (Dự báo)",
      "T11 (Dự báo)",
    ],
    datasets: [
      {
        label: "Nhu cầu dự báo (Tấn)",
        data: [
          12.0,
          13.8,
          14.2,
          14.9,
          15.2,
          16.8,
          17.5,
        ],
        borderColor: "#2563eb",
        backgroundColor:
          "rgba(37, 99, 235, 0.08)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Tiêu thụ thực tế (Tấn)",
        data: [
          12.5,
          13.5,
          14.0,
          15.1,
          15.2,
          null,
          null,
        ],
        borderColor: "#16a34a",
        backgroundColor:
          "rgba(22, 163, 74, 0.08)",
        tension: 0.3,
        borderDash: [5, 5],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            family: "Segoe UI",
            size: 12,
          },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "#f1f5f9",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  function selectMenu(menuId: string) {
    setActiveMenu(menuId);
    setSearch("");
  }

  function renderTableCell(
    row: TableRowData,
    column: TableColumn,
  ): ReactNode {
    const value = row[column.key];

    if (column.key === "code") {
      return (
        <td
          key={column.key}
          className="dashboard-code"
        >
          {value}
        </td>
      );
    }

    if (column.key === "status") {
      const isWarning =
        value === "Chờ duyệt" ||
        value === "Cần bổ sung" ||
        value === "Chờ xác nhận";

      const isDanger =
        value === "NGUNG_HOAT_DONG" ||
        value === "Ngưng hoạt động";

      const badgeClass = isDanger
        ? "danger"
        : isWarning
          ? "warning"
          : "success";

      return (
        <td key={column.key}>
          <span
            className={`dashboard-badge ${badgeClass}`}
          >
            {value}
          </span>
        </td>
      );
    }

    if (column.key === "actions") {
      if (
        typeof row.renderActions === "function"
      ) {
        return (
          <td key={column.key}>
            {row.renderActions(row)}
          </td>
        );
      }

      const hasView =
        typeof row.onView === "function";

      const hasEdit =
        typeof row.onEdit === "function";

      const hasDelete =
        typeof row.onDelete === "function";

      if (hasView || hasEdit || hasDelete) {
        return (
          <td key={column.key}>
            <div className="dashboard-action-btns">
              {hasView && (
                <button
                  type="button"
                  className="btn-icon btn-view"
                  title="Xem"
                  onClick={() => row.onView(row)}
                >
                  <EyeOutlined />
                </button>
              )}

              {hasEdit && (
                <button
                  type="button"
                  className="btn-icon btn-edit"
                  title="Sửa"
                  onClick={() => row.onEdit(row)}
                >
                  <EditOutlined />
                </button>
              )}

              {hasDelete && (
                <button
                  type="button"
                  className="btn-icon btn-delete"
                  title="Xóa"
                  onClick={() => row.onDelete(row)}
                >
                  <DeleteOutlined />
                </button>
              )}
            </div>
          </td>
        );
      }

      return (
        <td key={column.key}>
          <div className="dashboard-action-btns">
            <button
              type="button"
              className="btn-approve"
              disabled={
                typeof row.onApprove !== "function"
              }
              title={
                typeof row.onApprove === "function"
                  ? "Duyệt kế hoạch"
                  : "Chưa kết nối chức năng duyệt"
              }
              onClick={() => {
                if (
                  typeof row.onApprove === "function"
                ) {
                  row.onApprove(row);
                }
              }}
            >
              <CheckOutlined
                style={{ marginRight: 4 }}
              />
              Duyệt
            </button>

            <button
              type="button"
              className="btn-reject"
              disabled={
                typeof row.onReject !== "function"
              }
              title={
                typeof row.onReject === "function"
                  ? "Từ chối kế hoạch"
                  : "Chưa kết nối chức năng từ chối"
              }
              onClick={() => {
                if (
                  typeof row.onReject === "function"
                ) {
                  row.onReject(row);
                }
              }}
            >
              <CloseOutlined
                style={{ marginRight: 4 }}
              />
              Từ chối
            </button>
          </div>
        </td>
      );
    }

    if (
      column.key === "name" ||
      column.key === "creator"
    ) {
      return (
        <td key={column.key}>
          <strong>{value}</strong>
        </td>
      );
    }

    return (
      <td key={column.key}>{value}</td>
    );
  }

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div
            className="dashboard-brand-icon"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />

              <path
                d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"
                fill="white"
              />

              <path
                d="M6 2v3M10 2v3M14 2v3"
                stroke="white"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          <div className="dashboard-brand-text">
            <strong>MILANO</strong>
            <small>FORECAST SYSTEM</small>
          </div>
        </div>

        <div className="dashboard-brand-divider" />

        <nav aria-label="Menu chính">
          {config.menu.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                item.id === activeMenu
                  ? "dashboard-nav-item active"
                  : "dashboard-nav-item"
              }
              aria-current={
                item.id === activeMenu
                  ? "page"
                  : undefined
              }
              onClick={() =>
                selectMenu(item.id)
              }
            >
              <span
                className="dashboard-nav-icon"
                aria-hidden="true"
              >
                {item.icon ?? "•"}
              </span>

              <span className="dashboard-nav-label">
                {item.label}
              </span>

              {item.badge !== undefined &&
                item.badge !== null && (
                  <span className="dashboard-nav-badge">
                    {item.badge}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="dashboard-logout"
          onClick={onLogout}
        >
          <LogoutOutlined />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="dashboard-search">
            <SearchOutlined
              className="dashboard-search-icon"
            />

            <input
              type="text"
              aria-label="Tìm kiếm dữ liệu trong bảng"
              placeholder={
                isForecast
                  ? "Lọc sản phẩm trong trang dự báo"
                  : "Tìm kiếm..."
              }
              value={search}
              disabled={isForecast}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="dashboard-topbar-right">
            <button
              type="button"
              className="dashboard-notif-btn"
              title="Thông báo"
            >
              <BellOutlined />
              <span className="dashboard-notif-dot" />
            </button>

            <div className="dashboard-user">
              <div
                className="dashboard-user-avatar"
                title={user.ho_ten}
              >
                <UserOutlined />
              </div>

              <div className="dashboard-user-info">
                <span className="dashboard-user-name">
                  {user.ho_ten}
                </span>

                <span className="dashboard-user-role-badge">
                  {config.roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {isForecast ? (
            canForecast ? (
              <DuBaoNhuCauPage />
            ) : (
              <section className="dashboard-panel">
                <div className="dashboard-panel-heading">
                  <div>
                    <h2>Không có quyền truy cập</h2>
                    <p>
                      Tài khoản không có quyền
                      chạy dự báo nhu cầu.
                    </p>
                  </div>
                </div>
              </section>
            )
          ) : (
            <>
              <div className="dashboard-heading">
                <div>
                  <h1>
                    {isOverview
                      ? config.title
                      : selected?.label}
                  </h1>

                  <p>{config.subtitle}</p>
                </div>

                <span className="dashboard-demo-label">
                  Hệ thống dự báo nhu cầu
                </span>
              </div>

              <div className="dashboard-stats">
                {config.stats.map((item) => (
                  <article
                    key={item.label}
                    className={`dashboard-stat ${item.color}`}
                  >
                    <p>{item.label}</p>
                    <strong>{item.value}</strong>
                    <small>{item.note}</small>
                  </article>
                ))}
              </div>

              {isOverview && (
                <section className="dashboard-panel dashboard-chart-section">
                  <div className="dashboard-chart-header">
                    <h3>
                      📊 Biểu đồ Dự Báo Nhu Cầu
                      Nguyên Liệu (Chart.js)
                    </h3>

                    <p>
                      So sánh nhu cầu nguyên liệu
                      cà phê thực tế và kết quả
                      dự báo qua các tháng
                    </p>
                  </div>

                  <div className="dashboard-chart-body">
                    <Line
                      data={chartData}
                      options={chartOptions}
                    />
                  </div>
                </section>
              )}

              {customContent != null ? (
                customContent
              ) : (
                <section className="dashboard-panel">
                  <div className="dashboard-panel-heading">
                    <div>
                      <h2>
                        {isOverview
                          ? config.tableTitle
                          : selected?.label}
                      </h2>

                      <p>
                        Danh sách dữ liệu quản lý
                        trong hệ thống
                      </p>
                    </div>

                    <div className="dashboard-top-actions">
                      {config.topActions ?? (
                        <a
                          href="#view-all"
                          className="dashboard-view-all"
                          onClick={(event) =>
                            event.preventDefault()
                          }
                        >
                          Xem tất cả
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="dashboard-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {columns.map((column) => (
                            <th key={column.key}>
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.code}>
                            {columns.map((column) =>
                              renderTableCell(
                                row,
                                column,
                              ),
                            )}
                          </tr>
                        ))}

                        {rows.length === 0 && (
                          <tr>
                            <td
                              colSpan={columns.length}
                              className="dashboard-empty-row"
                            >
                              {search
                                ? `Không tìm thấy dữ liệu phù hợp với từ khóa "${search}".`
                                : "Chưa có dữ liệu."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}