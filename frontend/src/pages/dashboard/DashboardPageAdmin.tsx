/// D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardPageAdmin.tsx
import { useEffect, useState } from "react";

import {
  HistoryOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  UserOutlined,
} from "@ant-design/icons";

import DashboardBase, {
  type DashboardConfig,
} from "../../components/dashboard/DashboardBase";

import type { User } from "../../services/authService";

import {
  ACCOUNT_ROLES,
  fetchUsersFromApi,
  type UserAccount,
} from "../../services/taiKhoanService";

import QuanLyTaiKhoanPage from "../tai-khoan/QuanLyTaiKhoanPage";

type Props = {
  user: User;
  onLogout: () => void | Promise<void>;
};

const ROLE_COLORS = [
  "#2563eb",
  "#8b5cf6",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
];

export default function DashboardPageAdmin({
  user,
  onLogout,
}: Props) {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    fetchUsersFromApi()
      .then(data => {
        if (!cancelled) {
          setAccounts(data);
          setLoaded(true);
        }
      })
      .catch(cause => {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể tải thống kê tài khoản.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshVersion]);

  const activeAccounts = accounts.filter(
    account => account.trang_thai === "HOAT_DONG",
  );

  const inactiveCount = accounts.filter(
    account => account.trang_thai === "NGUNG_HOAT_DONG",
  ).length;

  const roleGroups: {
  label: string;
  count: number;
  color: string;
}[] = ACCOUNT_ROLES.map((role, index) => ({
  label: role.label,
  count: activeAccounts.filter(
    account => account.vai_tro === role.value,
  ).length,
  color: ROLE_COLORS[index] ?? "#94a3b8",
}));

const otherActiveCount = activeAccounts.filter(
  account =>
    !ACCOUNT_ROLES.some(
      role => role.value === account.vai_tro,
    ),
).length;

if (otherActiveCount > 0) {
  roleGroups.push({
    label: "Vai trò khác",
    count: otherActiveCount,
    color: "#94a3b8",
  });
}

  const radius = 76;
  const circumference = 2 * Math.PI * radius;

  let accumulatedLength = 0;

  const segments = roleGroups.map(group => {
    const length =
      activeAccounts.length > 0
        ? (group.count / activeAccounts.length) * circumference
        : 0;

    const segment = {
      ...group,
      length,
      offset: accumulatedLength,
    };

    accumulatedLength += length;
    return segment;
  });

  const activePercent =
    accounts.length > 0
      ? Math.round((activeAccounts.length / accounts.length) * 100)
      : 0;

  const displayCount = (value: number): string =>
    loaded ? String(value) : "—";

  const config: DashboardConfig = {
    title: "Bảng Điều Khiển Quản Trị",

    subtitle:
      "Tổng quan tài khoản, vai trò và trạng thái truy cập hệ thống.",

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
        label: "Tổng tài khoản",
        value: displayCount(accounts.length),
        note: "Tài khoản đã lưu trong hệ thống",
        color: "blue",
      },
      {
        label: "Đang hoạt động",
        value: displayCount(activeAccounts.length),
        note: "Tài khoản được phép đăng nhập",
        color: "green",
      },
      {
        label: "Ngưng hoạt động",
        value: displayCount(inactiveCount),
        note: "Tài khoản đã ngừng truy cập",
        color: "orange",
      },
      {
        label: "Vai trò hiện hành",
        value: String(ACCOUNT_ROLES.length),
        note: "Nhóm vai trò của hệ thống",
        color: "purple",
      },
    ],

    tableTitle: "Tổng quan hệ thống",
    columns: [],
    rows: [],

    renderCustomContent: activeMenu => {
      if (activeMenu === "quan-ly-tai-khoan") {
        return <QuanLyTaiKhoanPage />;
      }

      if (activeMenu === "tong-quan") {
        return (
          <section aria-busy={loading}>
            <style>{`
              .admin-overview-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 20px;
              }

              .admin-overview-head h2 {
                margin: 0 0 5px;
                color: #17243b;
                font-size: 21px;
              }

              .admin-overview-head p {
                margin: 0;
                color: #64748b;
                font-size: 13px;
              }

              .admin-refresh {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 9px 14px;
                border: 1px solid #dbe3ee;
                border-radius: 9px;
                background: white;
                color: #334155;
                font: inherit;
                font-size: 13px;
                cursor: pointer;
                white-space: nowrap;
              }

              .admin-refresh:disabled {
                opacity: .5;
                cursor: not-allowed;
              }

              .admin-refresh:focus-visible {
                outline: 3px solid #bfdbfe;
                outline-offset: 2px;
              }

              .admin-chart-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 20px;
              }

              .admin-chart-card {
                min-width: 0;
                padding: 23px;
                border: 1px solid #e3eaf3;
                border-radius: 14px;
                background: white;
                box-shadow: 0 2px 5px rgba(23, 36, 59, .03);
              }

              .admin-chart-card h3 {
                margin: 0 0 6px;
                color: #17243b;
                font-size: 16px;
              }

              .admin-chart-description {
                margin: 0;
                color: #94a3b8;
                font-size: 12px;
              }

              .admin-donut-wrap {
                display: grid;
                place-items: center;
                padding: 14px 0;
              }

              .admin-donut {
                display: block;
                width: 220px;
                max-width: 100%;
                height: auto;
              }

              .admin-chart-legend {
                display: grid;
                gap: 11px;
                margin: 0;
                padding: 0;
                list-style: none;
              }

              .admin-chart-legend li {
                display: flex;
                align-items: center;
                gap: 9px;
                color: #475569;
                font-size: 12px;
              }

              .admin-legend-dot {
                width: 9px;
                height: 9px;
                flex-shrink: 0;
                border-radius: 3px;
              }

              .admin-chart-legend strong {
                margin-left: auto;
                color: #17243b;
              }

              .admin-status-summary {
                margin: 28px 0;
                padding: 21px;
                border-radius: 12px;
                background: #f0fdf4;
              }

              .admin-status-summary strong {
                display: block;
                color: #15803d;
                font-size: 36px;
                line-height: 1.2;
              }

              .admin-status-summary span {
                display: block;
                margin-top: 7px;
                color: #4b7c60;
                font-size: 12px;
              }

              .admin-bar-item {
                margin-top: 22px;
              }

              .admin-bar-label {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 9px;
                color: #475569;
                font-size: 13px;
              }

              .admin-bar-label strong {
                color: #17243b;
              }

              .admin-bar-track {
                height: 12px;
                overflow: hidden;
                border-radius: 999px;
                background: #f1f5f9;
              }

              .admin-bar-fill {
                height: 100%;
                border-radius: inherit;
              }

              .admin-chart-note {
                margin: 25px 0 0;
                padding-top: 15px;
                border-top: 1px solid #edf1f7;
                color: #94a3b8;
                font-size: 12px;
                line-height: 1.7;
              }

              .admin-overview-error {
                margin-bottom: 16px;
                padding: 13px 16px;
                border: 1px solid #fecaca;
                border-radius: 9px;
                background: #fef2f2;
                color: #b91c1c;
                font-size: 13px;
              }

              .admin-overview-empty {
                padding: 45px 20px;
                border: 1px solid #e3eaf3;
                border-radius: 14px;
                background: white;
                color: #64748b;
                text-align: center;
              }

              @media (max-width: 900px) {
                .admin-chart-grid {
                  grid-template-columns: 1fr;
                }
              }

              @media (max-width: 480px) {
                .admin-overview-head {
                  align-items: flex-start;
                  flex-direction: column;
                }

                .admin-chart-card {
                  padding: 18px;
                }
              }
            `}</style>

            <div className="admin-overview-head">
              <div>
                <h2>Tổng quan hệ thống</h2>
                <p>
                  Theo dõi cơ cấu vai trò và trạng thái tài khoản.
                </p>
              </div>

              <button
                type="button"
                className="admin-refresh"
                disabled={loading}
                onClick={() =>
                  setRefreshVersion(version => version + 1)
                }
              >
                <ReloadOutlined spin={loading} />
                {loading ? "Đang tải..." : "Làm mới"}
              </button>
            </div>

            {error && (
              <div className="admin-overview-error" role="alert">
                {error}
              </div>
            )}

            {!loaded ? (
              <div className="admin-overview-empty" role="status">
                {loading
                  ? "Đang tải số liệu tổng quan..."
                  : "Chưa tải được số liệu. Nhấn Làm mới để thử lại."}
              </div>
            ) : (
              <div className="admin-chart-grid">
                <article className="admin-chart-card">
                  <h3>Cơ cấu vai trò</h3>
                  <p className="admin-chart-description">
                    Phân bố các tài khoản đang hoạt động.
                  </p>

                  <div className="admin-donut-wrap">
                    <svg
                      className="admin-donut"
                      viewBox="0 0 220 220"
                      role="img"
                      aria-label={
                        "Biểu đồ vai trò: " +
                        roleGroups
                          .map(group => `${group.label}: ${group.count}`)
                          .join(", ")
                      }
                    >
                      <circle
                        cx="110"
                        cy="110"
                        r={radius}
                        fill="none"
                        stroke="#f1f5f9"
                        strokeWidth="25"
                      />

                      {segments
                        .filter(segment => segment.count > 0)
                        .map(segment => (
                          <circle
                            key={segment.label}
                            cx="110"
                            cy="110"
                            r={radius}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth="25"
                            strokeDasharray={
                              `${segment.length} ${circumference}`
                            }
                            strokeDashoffset={-segment.offset}
                            transform="rotate(-90 110 110)"
                          >
                            <title>
                              {segment.label}: {segment.count} tài khoản
                            </title>
                          </circle>
                        ))}

                      <text
                        x="110"
                        y="107"
                        textAnchor="middle"
                        fill="#17243b"
                        fontSize="32"
                        fontWeight="700"
                      >
                        {activeAccounts.length}
                      </text>

                      <text
                        x="110"
                        y="130"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="11"
                      >
                        Đang hoạt động
                      </text>
                    </svg>
                  </div>

                  <ul className="admin-chart-legend">
                    {roleGroups.map(group => (
                      <li key={group.label}>
                        <span
                          className="admin-legend-dot"
                          style={{ backgroundColor: group.color }}
                          aria-hidden="true"
                        />
                        <span>{group.label}</span>
                        <strong>{group.count}</strong>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="admin-chart-card">
                  <h3>Trạng thái tài khoản</h3>
                  <p className="admin-chart-description">
                    So sánh tài khoản hoạt động và ngưng hoạt động.
                  </p>

                  <div className="admin-status-summary">
                    <strong>{activePercent}%</strong>
                    <span>
                      tài khoản đang hoạt động trong tổng số{" "}
                      {accounts.length} tài khoản
                    </span>
                  </div>

                  <div className="admin-bar-item">
                    <div className="admin-bar-label">
                      <span>Đang hoạt động</span>
                      <strong>{activeAccounts.length}</strong>
                    </div>

                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{
                          width: `${
                            accounts.length > 0
                              ? (activeAccounts.length / accounts.length) * 100
                              : 0
                          }%`,
                          backgroundColor: "#22c55e",
                        }}
                      />
                    </div>
                  </div>

                  <div className="admin-bar-item">
                    <div className="admin-bar-label">
                      <span>Ngưng hoạt động</span>
                      <strong>{inactiveCount}</strong>
                    </div>

                    <div className="admin-bar-track">
                      <div
                        className="admin-bar-fill"
                        style={{
                          width: `${
                            accounts.length > 0
                              ? (inactiveCount / accounts.length) * 100
                              : 0
                          }%`,
                          backgroundColor: "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  <p className="admin-chart-note">
                    Tài khoản ngưng hoạt động vẫn được lưu trong hệ
                    thống để giữ thông tin và lịch sử liên quan.
                  </p>
                </article>
              </div>
            )}
          </section>
        );
      }

      const placeholders: Record<
        string,
        { title: string; description: string }
      > = {
        "phan-quyen": {
          title: "Phân quyền",
          description: "Quản lý vai trò và quyền truy cập hệ thống.",
        },
        "quan-ly-san-pham": {
          title: "Quản lý sản phẩm",
          description: "Danh sách sản phẩm của hệ thống.",
        },
        "xem-nhat-ky-hoat-dong": {
          title: "Nhật ký hoạt động",
          description: "Các thao tác được ghi nhận trong hệ thống.",
        },
      };

      const content = placeholders[activeMenu];

      if (!content) {
        return null;
      }

      return (
        <section className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <h2>{content.title}</h2>
              <p>{content.description}</p>
            </div>
          </div>

          <div style={{ padding: 20 }}>
            Chức năng đang được hoàn thiện.
          </div>
        </section>
      );
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