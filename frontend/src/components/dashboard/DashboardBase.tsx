import React, { useState } from "react";
import type { User } from "../../services/authService";
import "../../../public/Dashboard.css";

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
};

type Props = {
  user: User;
  config: DashboardConfig;
  onLogout: () => void | Promise<void>;
};

export default function DashboardBase({
  user,
  config,
  onLogout,
}: Props) {
  const [activeMenu, setActiveMenu] = useState(
    config.menu[0]?.id ?? ""
  );
  const [search, setSearch] = useState("");

  const selected = config.menu.find(
    (item) => item.id === activeMenu
  );

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

  // Chart.js Data configuration for Coffee Demand Forecast
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
      legend: {
        position: "top" as const,
        labels: {
          font: { family: "Segoe UI", size: 12 },
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
        grid: { color: "#f1f5f9" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  return (
    <div className="dashboard-shell">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <div className="dashboard-brand-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
              <path
                d="M10 5c-2 2 2 3 0 5M16 4c-2 2 2 3 0 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M6 13h17v7a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-7Z"
                fill="currentColor"
              />
              <path
                d="M23 15h2a3 3 0 0 1 0 6h-2M4 28h23"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="dashboard-brand-text">
            <strong>MILANO COFFEE</strong>
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
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="dashboard-nav-icon" aria-hidden="true">
                {item.icon || "•"}
              </span>
              <span className="dashboard-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <button
          type="button"
          className="dashboard-logout"
          onClick={onLogout}
        >
          <LogoutOutlined style={{ marginRight: 8 }} />
          Đăng xuất
        </button>
      </aside>

      {/* Main Content Area */}
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
            <button
              type="button"
              className="dashboard-notif-btn"
              title="Thông báo"
            >
              <BellOutlined />
              <span className="dashboard-notif-dot" />
            </button>

            <div className="dashboard-user">
              <div className="dashboard-user-avatar" title={user.ho_ten}>
                <UserOutlined />
              </div>

              <div className="dashboard-user-info">
                <span className="dashboard-user-name">{user.ho_ten}</span>
                <span className="dashboard-user-role-badge">

                  {config.roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main View */}
        <main className="dashboard-main">
          <div className="dashboard-heading">
            <div>
              <h1>
                {activeMenu === config.menu[0]?.id
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

          {/* Chart.js Forecast Chart Section */}
          {activeMenu === config.menu[0]?.id && (
            <section className="dashboard-panel" style={{ marginBottom: 20, padding: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                  📊 Biểu đồ Dự Báo Nhu Cầu Nguyên Liệu (Chart.js)
                </h3>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
                  So sánh nhu cầu nguyên liệu cà phê thực tế và kết quả dự báo AI qua các tháng
                </p>
              </div>
              <div style={{ height: 250 }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </section>
          )}

          <section className="dashboard-panel">
            <div className="dashboard-panel-heading">
              <div>
                <h2>
                  {activeMenu === config.menu[0]?.id
                    ? config.tableTitle
                    : selected?.label}
                </h2>
                <p>Danh sách dữ liệu quản lý trong hệ thống</p>
              </div>
              <a href="#view-all" className="dashboard-view-all" onClick={(e) => e.preventDefault()}>
                Xem tất cả
              </a>
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
                          return (
                            <td key={col.key} className="dashboard-code">
                              {val}
                            </td>
                          );
                        }

                        if (col.key === "status") {
                          const isWarning = val === "Chờ duyệt" || val === "Cần bổ sung" || val === "Chờ xác nhận";
                          return (
                            <td key={col.key}>
                              <span
                                className={`dashboard-badge ${
                                  isWarning ? "warning" : "success"
                                }`}
                              >
                                {val}
                              </span>
                            </td>
                          );
                        }

                        if (col.key === "actions") {
                          return (
                            <td key={col.key}>
                              <div className="dashboard-action-btns">
                                <button
                                  type="button"
                                  className="btn-approve"
                                  onClick={() => alert(`Đã phê duyệt ${row.code}`)}
                                >
                                  <CheckOutlined style={{ marginRight: 4 }} />
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  className="btn-reject"
                                  onClick={() => alert(`Đã từ chối ${row.code}`)}
                                >
                                  <CloseOutlined style={{ marginRight: 4 }} />
                                  Từ chối
                                </button>
                              </div>
                            </td>
                          );
                        }


                        if (col.key === "name" || col.key === "creator") {
                          return (
                            <td key={col.key}>
                              <strong>{val}</strong>
                            </td>
                          );
                        }

                        return <td key={col.key}>{val}</td>;
                      })}
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: "center", padding: "24px" }}>
                        Không tìm thấy dữ liệu phù hợp với từ khóa "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
