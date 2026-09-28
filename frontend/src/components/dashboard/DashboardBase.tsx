///D:\KLTN\KLTN\frontend\src\components\dashboard\DashboardBase.tsx
import React, { useState } from "react";
import type { User } from "../../services/authService";
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
  Filler
);

export type DashboardItem = {
  id: string;
  label: string;
  icon?: string | React.ReactNode;
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
  topActions?: React.ReactNode;
  /** Return a ReactNode to fully replace the table panel for a given activeMenu id, or null/undefined to use the default table */
  renderCustomContent?: (activeMenu: string) => React.ReactNode | null;
};

type Props = {
  user: User;
  config: DashboardConfig;
  onLogout: () => void | Promise<void>;
};

export default function DashboardBase({ user, config, onLogout }: Props) {
  const [activeMenu, setActiveMenu] = useState(config.menu[0]?.id ?? "");
  const [search, setSearch] = useState("");

  const selected = config.menu.find((item) => item.id === activeMenu);

  const defaultColumns: TableColumn[] = [
    { key: "code", label: "Mã" },
    { key: "name", label: "Nội dung" },
    { key: "detail", label: "Thông tin" },
    { key: "status", label: "Trạng thái" },
  ];

  const columns = config.columns || defaultColumns;

  const rows = config.rows.filter((row) => {
    const query = search.trim().toLocaleLowerCase("vi");
    if (!query) return true;
    return Object.values(row).some((value) =>
      String(value).toLocaleLowerCase("vi").includes(query)
    );
  });

  const chartData = {
    labels: ["Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "T10 (Dự báo)", "T11 (Dự báo)"],
    datasets: [
      {
        label: "Nhu cầu dự báo (Tấn)",
        data: [12.0, 13.8, 14.2, 14.9, 15.2, 16.8, 17.5],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Tiêu thụ thực tế (Tấn)",
        data: [12.5, 13.5, 14.0, 15.1, 15.2, null, null],
        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.08)",
        tension: 0.3,
        borderDash: [5, 5],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const, labels: { font: { family: "Segoe UI", size: 12 } } },
      tooltip: { mode: "index" as const, intersect: false },
    },
    scales: {
      y: { beginAtZero: false, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false } },
    },
  };

  // Check if current menu has custom content
  const customContent = config.renderCustomContent
    ? config.renderCustomContent(activeMenu)
    : null;

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar ── */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="currentColor" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" fill="white" stroke="currentColor" />
              <path d="M6 2v3M10 2v3M14 2v3" stroke="white" strokeWidth="1.8" />
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
              className={item.id === activeMenu ? "dashboard-nav-item active" : "dashboard-nav-item"}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="dashboard-nav-icon" aria-hidden="true">{item.icon || "•"}</span>
              <span className="dashboard-nav-label">{item.label}</span>
              {item.badge !== undefined && item.badge !== null && (
                <span className="dashboard-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <button type="button" className="dashboard-logout" onClick={onLogout}>
          <LogoutOutlined />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* ── Main Content ── */}
      <div className="dashboard-content">
        {/* Topbar */}
        <header className="dashboard-topbar">
          <div className="dashboard-search">
            <SearchOutlined className="dashboard-search-icon" />
            <input
              type="text"
              aria-label="Tìm kiếm"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="dashboard-topbar-right">
            <button type="button" className="dashboard-notif-btn" title="Thông báo">
              <BellOutlined />
              <span className="dashboard-notif-dot" />
            </button>
            <div className="dashboard-user">
              <div className="dashboard-user-avatar" title={user.ho_ten}>
                <UserOutlined />
              </div>
              <div className="dashboard-user-info">
                <span className="dashboard-user-name">{user.ho_ten}</span>
                <span className="dashboard-user-role-badge">{config.roleLabel}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="dashboard-main">
          <div className="dashboard-heading">
            <div>
              <h1>{activeMenu === config.menu[0]?.id ? config.title : selected?.label}</h1>
              <p>{config.subtitle}</p>
            </div>
            <span className="dashboard-demo-label">Hệ thống dự báo nhu cầu</span>
          </div>

          <div className="dashboard-stats">
            {config.stats.map((item) => (
              <article key={item.label} className={`dashboard-stat ${item.color}`}>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </div>

          {/* Chart – only on overview tab */}
          {activeMenu === config.menu[0]?.id && (
            <section className="dashboard-panel dashboard-chart-section">
              <div className="dashboard-chart-header">
                <h3>📊 Biểu đồ Dự Báo Nhu Cầu Nguyên Liệu (Chart.js)</h3>
                <p>So sánh nhu cầu nguyên liệu cà phê thực tế và kết quả dự báo AI qua các tháng</p>
              </div>
              <div className="dashboard-chart-body">
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>
          )}

          {/* Custom content OR default table */}
          {customContent != null ? (
            customContent
          ) : (
            <section className="dashboard-panel">
              <div className="dashboard-panel-heading">
                <div>
                  <h2>
                    {activeMenu === config.menu[0]?.id ? config.tableTitle : selected?.label}
                  </h2>
                  <p>Danh sách dữ liệu quản lý trong hệ thống</p>
                </div>
                <div className="dashboard-top-actions">
                  {config.topActions ? (
                    config.topActions
                  ) : (
                    <a
                      href="#view-all"
                      className="dashboard-view-all"
                      onClick={(e) => e.preventDefault()}
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
                      {columns.map((col) => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.code}>
                        {columns.map((col) => {
                          const val = row[col.key];

                          if (col.key === "code") {
                            return <td key={col.key} className="dashboard-code">{val}</td>;
                          }

                          if (col.key === "status") {
                            const isWarning = val === "Chờ duyệt" || val === "Cần bổ sung" || val === "Chờ xác nhận";
                            const isDanger = val === "NGUNG_HOAT_DONG" || val === "Ngưng hoạt động";
                            return (
                              <td key={col.key}>
                                <span className={`dashboard-badge ${isDanger ? "danger" : isWarning ? "warning" : "success"}`}>
                                  {val}
                                </span>
                              </td>
                            );
                          }

                          if (col.key === "actions") {
                            if (row.renderActions) {
                              return <td key={col.key}>{row.renderActions(row)}</td>;
                            }
                            if (row.onView || row.onEdit || row.onDelete) {
                              return (
                                <td key={col.key}>
                                  <div className="dashboard-action-btns">
                                    {row.onView && (
                                      <button type="button" className="btn-icon btn-view" title="Xem" onClick={() => row.onView(row)}>
                                        <EyeOutlined />
                                      </button>
                                    )}
                                    {row.onEdit && (
                                      <button type="button" className="btn-icon btn-edit" title="Sửa" onClick={() => row.onEdit(row)}>
                                        <EditOutlined />
                                      </button>
                                    )}
                                    {row.onDelete && (
                                      <button type="button" className="btn-icon btn-delete" title="Xóa" onClick={() => row.onDelete(row)}>
                                        <DeleteOutlined />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={col.key}>
                                <div className="dashboard-action-btns">
                                  <button type="button" className="btn-approve" onClick={() => alert(`Đã phê duyệt ${row.code}`)}>
                                    <CheckOutlined style={{ marginRight: 4 }} /> Duyệt
                                  </button>
                                  <button type="button" className="btn-reject" onClick={() => alert(`Đã từ chối ${row.code}`)}>
                                    <CloseOutlined style={{ marginRight: 4 }} /> Từ chối
                                  </button>
                                </div>
                              </td>
                            );
                          }

                          if (col.key === "name" || col.key === "creator") {
                            return <td key={col.key}><strong>{val}</strong></td>;
                          }

                          return <td key={col.key}>{val}</td>;
                        })}
                      </tr>
                    ))}

                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={columns.length} className="dashboard-empty-row">
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
        </main>
      </div>
    </div>
  );
}
