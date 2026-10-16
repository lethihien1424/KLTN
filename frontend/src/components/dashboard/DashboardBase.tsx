/// frontend/src/components/dashboard/DashboardBase.tsx
import {

  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,

  type ReactNode,

} from "react";

import {

  BellOutlined,
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UserOutlined,

} from "@ant-design/icons";

import {

  Chart as ChartJS,

  CategoryScale,

  LinearScale,

  PointElement,

  LineElement,

  Tooltip,

  Legend,

  Filler,

} from "chart.js";

import { Line } from "react-chartjs-2";

import type { User } from "../../services/authService";

import {

  getMyPermissions,

  type PermissionDetail,

} from "../../services/phanQuyenService";

import DuBaoNhuCauPage from "../../pages/du-bao/DuBaoNhuCauPage";

import LichSuDuBaoPage from "../../pages/du-bao/LichSuDuBaoPage";
import DanhGiaMoHinhPage from "../../pages/du-bao/DanhGiaMoHinhPage";
import PhanQuyenPage from "../../pages/auth/PhanQuyenPage";

import DuLieuBanHangPage from "../../pages/ban-hang/DuLieuBanHangPage";

import QuanLyTaiKhoanPage from "../../pages/tai-khoan/QuanLyTaiKhoanPage";

import SanPhamPage from "../../pages/san-pham/SanPhamPage";


import "../../../public/Dashboard.css";

import "../../../public/QuanLyTaiKhoan.css";

ChartJS.register(

  CategoryScale,

  LinearScale,

  PointElement,

  LineElement,

  Tooltip,

  Legend,

  Filler,

);

export type DashboardItem = {

  id: string;

  label: string;

  icon?: string | ReactNode;

  badge?: string | number;

  permission?: string;

};

export type StatItem = {

  label: string;

  value: string;

  note: string;

  color: "blue" | "green" | "orange" | "purple";

  permission?: string;

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

  tablePermission?: string;

  overviewPermission?: string;

  renderCustomContent?: (

    activeMenu: string,

  ) => ReactNode;

};

type PermissionContextValue = {

  loading: boolean;

  can: (

    feature: string,

    action?: string,

  ) => boolean;

  refreshPermissions: () => void;

};

const PermissionContext =

  createContext<PermissionContextValue>({

    loading: true,

    can: () => false,

    refreshPermissions: () => {},

  });

export function useDashboardPermissions() {

  return useContext(PermissionContext);

}

const FEATURES = [

  ["quan-ly-tai-khoan", "Quản lý tài khoản", "tai_khoan"],

  ["phan-quyen", "Phân quyền", "phan_quyen"],

  ["nhat-ky-hoat-dong", "Nhật ký hoạt động", "nhat_ky_hoat_dong"],

  ["quan-ly-san-pham", "Quản lý sản phẩm", "san_pham"],

  ["nhap-du-lieu-ban-hang", "Dữ liệu bán hàng", "du_lieu_ban_hang"],

  ["du-bao-nhu-cau", "Dự báo nhu cầu", "du_bao_nhu_cau"],

  ["lich-su-du-bao", "Lịch sử dự báo", "lich_su_du_bao"],
  ["danh-gia-mo-hinh", "Đánh giá mô hình", "danh_gia_mo_hinh"],
  ["xem-ke-hoach-mua-hang", "Kế hoạch mua hàng", "ke_hoach_mua_hang"],

  ["don-mua-nguyen-lieu", "Đơn mua nguyên liệu", "don_mua_nguyen_lieu"],

  ["quan-ly-nguyen-lieu", "Quản lý nguyên liệu", "nguyen_lieu"],

  ["ton-kho-nguyen-lieu", "Tồn kho nguyên liệu", "ton_kho_nguyen_lieu"],

  ["nha-cung-cap", "Nhà cung cấp", "nha_cung_cap"],

  ["nguyen-lieu-nha-cung-cap", "Nguyên liệu của nhà cung cấp", "nguyen_lieu_nha_cung_cap"],

  ["quan-ly-cong-thuc-bom", "Công thức BOM", "cong_thuc"],

  ["quan-ly-ti-le-hao-hut", "Tỉ lệ hao hụt", "ti_le_hao_hut"],

  ["nhu-cau-nguyen-lieu", "Nhu cầu nguyên liệu", "nhu_cau_nguyen_lieu"],

  ["de-xuat-nhap-hang", "Đề xuất nhập hàng", "de_xuat_nhap_hang"],

  ["goi-y-nha-cung-cap", "Gợi ý nhà cung cấp", "goi_y_nha_cung_cap"],

] as const;

const MENU_FEATURES: Record<string, string> =

  Object.fromEntries(

    FEATURES.map(([id, , feature]) => [

      id,

      feature,

    ]),

  );

Object.assign(MENU_FEATURES, {

  "quan-tri-tai-khoan": "tai_khoan",

  "xem-nhat-ky-hoat-dong": "nhat_ky_hoat_dong",

  "lap-ke-hoach-mua-hang": "ke_hoach_mua_hang",

  "duyet-ke-hoach": "ke_hoach_mua_hang",

  "nhap-du-lieu-mua-hang": "don_mua_nguyen_lieu",

  "xem-ton-kho": "ton_kho_nguyen_lieu",

  "xem-thong-tin-nha-cung-cap": "nha_cung_cap",

  "xem-de-xuat-nhap-hang": "de_xuat_nhap_hang",

});

const FEATURE_ICONS: Record<string, ReactNode> = {

  tai_khoan: <UserOutlined />,

  phan_quyen: <SafetyCertificateOutlined />,

  san_pham: <ShoppingOutlined />,

};

function featureOf(

  item: DashboardItem,

): string {

  return (

    item.permission ||

    MENU_FEATURES[item.id] ||

    ""

  );

}

function cell(

  value: unknown,

): ReactNode {

  if (value == null) {

    return "—";

  }

  if (typeof value === "boolean") {

    return value ? "Có" : "Không";

  }

  return String(value);

}

const CHART = {

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

      data: [12, 13.8, 14.2, 14.9, 15.2, 16.8, 17.5],

      borderColor: "#2563eb",

      backgroundColor: "rgba(37,99,235,.08)",

      tension: 0.3,

      fill: true,

    },

    {

      label: "Tiêu thụ thực tế (Tấn)",

      data: [12.5, 13.5, 14, 15.1, 15.2, null, null],

      borderColor: "#16a34a",

      borderDash: [5, 5],

      tension: 0.3,

    },

  ],

};

export default function DashboardBase({

  user,

  config,

  onLogout,

}: {

  user: User;

  config: DashboardConfig;

  onLogout: () => void | Promise<void>;

}) {

  const [activeMenu, setActiveMenu] =

    useState("tong-quan");

  const [search, setSearch] = useState("");

  const [permissions, setPermissions] =

    useState<PermissionDetail[]>([]);

  const [permissionLoading, setPermissionLoading] =

    useState(true);

  const [permissionError, setPermissionError] =

    useState("");

  const [permissionVersion, setPermissionVersion] =

    useState(0);

  const [permissionOwner, setPermissionOwner] =

    useState("");

  const [forecastVisited, setForecastVisited] =

    useState(false);

  const [logoutLoading, setLogoutLoading] =

    useState(false);

  const [logoutError, setLogoutError] =

    useState("");

  const ownerKey = JSON.stringify([

    user.ma_nguoi_dung,

    user.vai_tro,

  ]);

  const ready =

    permissionOwner === ownerKey &&

    !permissionLoading &&

    !permissionError;

  const refreshPermissions = useCallback(

    () => setPermissionVersion(value => value + 1),

    [],

  );

  useEffect(() => {

    const controller = new AbortController();

    setPermissionLoading(true);

    setPermissionError("");

    getMyPermissions(controller.signal)

      .then(result => {

        if (controller.signal.aborted) {

          return;

        }

        if (

          result.ma_nguoi_dung !== user.ma_nguoi_dung ||

          result.vai_tro !== user.vai_tro ||

          !Array.isArray(result.chi_tiet) ||

          !result.chi_tiet.every(

            detail =>

              typeof detail.chuc_nang === "string" &&

              typeof detail.thao_tac === "string",

          )

        ) {

          throw new Error(

            "Thông tin quyền không hợp lệ.",

          );

        }

        setPermissions(result.chi_tiet);

        setPermissionOwner(ownerKey);

      })

      .catch(cause => {

        if (!controller.signal.aborted) {

          setPermissions([]);

          setPermissionOwner("");

          setPermissionError(

            cause instanceof Error

              ? cause.message

              : "Không tải được quyền truy cập.",

          );

        }

      })

      .finally(() => {

        if (!controller.signal.aborted) {

          setPermissionLoading(false);

        }

      });

    return () => controller.abort();

  }, [

    ownerKey,

    user.ma_nguoi_dung,

    user.vai_tro,

    permissionVersion,

  ]);

  useEffect(() => {

    window.addEventListener(

      "focus",

      refreshPermissions,

    );

    window.addEventListener(

      "milano:permissions-changed",

      refreshPermissions,

    );

    return () => {

      window.removeEventListener(

        "focus",

        refreshPermissions,

      );

      window.removeEventListener(

        "milano:permissions-changed",

        refreshPermissions,

      );

    };

  }, [refreshPermissions]);

  useEffect(() => {

    setActiveMenu("tong-quan");

    setSearch("");

    setForecastVisited(false);

  }, [ownerKey]);

  const selectedPermissions = useMemo(

    () =>

      new Set(

        permissions.map(

          item =>

            `${item.chuc_nang}:${item.thao_tac}`,

        ),

      ),

    [permissions],

  );

  const can = useCallback(

    (

      feature: string,

      action = "XEM",

    ) =>

      Boolean(

        ready &&

        selectedPermissions.has(

          `${feature}:${action}`,

        ),

      ),

    [ready, selectedPermissions],

  );

  const visibleMenu =

    useMemo<DashboardItem[]>(() => {

      const overview: DashboardItem =

        config.menu.find(

          item => item.id === "tong-quan",

        ) ?? {

          id: "tong-quan",

          label: "Tổng quan",

          icon: <PieChartOutlined />,

        };

      const candidates: DashboardItem[] =

        config.menu.filter(

          item => item.id !== "tong-quan",

        );

      const existing = new Set(

        candidates.map(featureOf),

      );

      for (

        const [id, label, permission] of FEATURES

      ) {

        if (!existing.has(permission)) {

          candidates.push({

            id,

            label,

            permission,

            icon: FEATURE_ICONS[permission] ?? <FileTextOutlined />,

          });

          existing.add(permission);

        }

      }

      return [

        overview,

        ...candidates.filter(

          item =>

            Boolean(featureOf(item)) &&

            can(featureOf(item), "XEM"),

        ),

      ];

    }, [config.menu, can]);

  useEffect(() => {

    if (

      ready &&

      !visibleMenu.some(

        item => item.id === activeMenu,

      )

    ) {

      setActiveMenu("tong-quan");

      setSearch("");

    }

  }, [

    ready,

    visibleMenu,

    activeMenu,

  ]);

  const selected = visibleMenu.find(

    item => item.id === activeMenu,

  );

  const feature = selected

    ? featureOf(selected)

    : "";

  const overview =

    activeMenu === "tong-quan";

  const isForecast =

    feature === "du_bao_nhu_cau";

  const overviewPermission =

    config.overviewPermission ||

    config.tablePermission ||

    (

      config.menu.some(

        item => featureOf(item) === "tai_khoan",

      )

        ? "tai_khoan"

        : ""

    );

  const hasView = permissions.some(

    item => item.thao_tac === "XEM",

  );

  const stats = config.stats.filter(

    item =>

      Boolean(

        item.permission ||

        overviewPermission,

      ) &&

      can(

        item.permission ||

        overviewPermission,

      ),

  );

  const tableFeature = overview

    ? config.tablePermission || ""

    : feature;

  const tableAllowed =

    Boolean(tableFeature) &&

    can(tableFeature) &&

    (

      overview ||

      config.menu.some(

        item => item.id === activeMenu,

      )

    );

  const columns = config.columns ?? [

    { key: "code", label: "Mã" },

    { key: "name", label: "Nội dung" },

    { key: "detail", label: "Thông tin" },

    { key: "status", label: "Trạng thái" },

  ];

  const rows = tableAllowed

    ? config.rows.filter(row =>

        Object.values(row).some(

          value =>

            (

              typeof value === "string" ||

              typeof value === "number"

            ) &&

            String(value)

              .toLocaleLowerCase("vi")

              .includes(

                search

                  .trim()

                  .toLocaleLowerCase("vi"),

              ),

        ),

      )

    : [];

  let content: ReactNode = null;

  if (ready && !isForecast) {
    if (feature === "du_lieu_ban_hang" && can("du_lieu_ban_hang", "XEM")) {
      content = <DuLieuBanHangPage />;
    } else if (feature === "lich_su_du_bao" && can("lich_su_du_bao", "XEM")) {
      content = <LichSuDuBaoPage />;
    } else if (feature === "danh_gia_mo_hinh" && can("danh_gia_mo_hinh", "XEM")) {
       content = <DanhGiaMoHinhPage />;
    } else if (feature === "san_pham" && can("san_pham", "XEM")) {
      content = <SanPhamPage />;
    } else if (feature === "phan_quyen" && can("phan_quyen", "XEM")) {
      content = <PhanQuyenPage />;
    } else {
      if (
        !overview ||
        (hasView && (!overviewPermission || can(overviewPermission)))
      ) {
        content = config.renderCustomContent?.(activeMenu) ?? null;
      }

      if (!overview && content == null && feature === "tai_khoan" && can("tai_khoan", "XEM")) {
        content = <QuanLyTaiKhoanPage />;
      }
    }
  }

  function selectMenu(id: string) {

    const item = visibleMenu.find(

      entry => entry.id === id,

    );

    if (!item) {

      return;

    }

    if (

      featureOf(item) === "du_bao_nhu_cau"

    ) {

      setForecastVisited(true);

    }

    if (

      feature === "phan_quyen" &&

      featureOf(item) !== "phan_quyen"

    ) {

      refreshPermissions();

    }

    setActiveMenu(id);

    setSearch("");

  }

  async function handleLogout() {

    if (logoutLoading) {

      return;

    }

    setLogoutLoading(true);

    setLogoutError("");

    try {

      await onLogout();

    } catch (cause) {

      setLogoutError(

        cause instanceof Error

          ? cause.message

          : "Không thể đăng xuất.",

      );

      setLogoutLoading(false);

    }

  }

  function renderCell(

    row: TableRowData,

    column: TableColumn,

  ) {

    const value = row[column.key];

    if (column.key === "actions") {

      if (

        typeof row.renderActions === "function"

      ) {

        return (

          <td key={column.key}>

            {row.renderActions(row, {

              can: (action: string) =>

                can(tableFeature, action),

            })}

          </td>

        );

      }

      const actions = [

        {

          action: "XEM",

          label: "Xem",

          icon: <EyeOutlined />,

          handler: row.onView,

        },

        {

          action: "SUA",

          label: "Sửa",

          icon: <EditOutlined />,

          handler: row.onEdit,

        },

        {

          action: "XOA",

          label: "Xóa",

          icon: <DeleteOutlined />,

          handler: row.onDelete,

        },

        {

          action: "DUYET",

          label: "Duyệt",

          icon: <CheckOutlined />,

          handler: row.onApprove,

        },

        {

          action: "TU_CHOI",

          label: "Từ chối",

          icon: <CloseOutlined />,

          handler: row.onReject,

        },

      ];

      return (

        <td key={column.key}>

          <div className="dashboard-action-btns">

            {actions

              .filter(

                item =>

                  can(

                    tableFeature,

                    item.action,

                  ) &&

                  typeof item.handler === "function",

              )

              .map(item => (

                <button

                  type="button"

                  className="btn-icon"

                  key={item.action}

                  title={item.label}

                  aria-label={item.label}

                  onClick={() =>

                    item.handler(row)

                  }

                >

                  {item.icon}

                </button>

              ))}

          </div>

        </td>

      );

    }

    if (column.key === "status") {

      const danger = [

        "NGUNG_HOAT_DONG",

        "Ngưng hoạt động",

      ].includes(String(value));

      const warning = [

        "Chờ duyệt",

        "Chờ xác nhận",

        "Cần bổ sung",

        "CHO_GIAO_HANG",

      ].includes(String(value));

      return (

        <td key={column.key}>

          <span

            className={

              "dashboard-badge " +

              (

                danger

                  ? "danger"

                  : warning

                    ? "warning"

                    : "success"

              )

            }

          >

            {cell(value)}

          </span>

        </td>

      );

    }

    return (

      <td

        key={column.key}

        className={

          column.key === "code"

            ? "dashboard-code"

            : undefined

        }

      >

        {["name", "creator"].includes(column.key)

          ? <strong>{cell(value)}</strong>

          : cell(value)}

      </td>

    );

  }

  return (

    <PermissionContext.Provider

      value={{

        loading: !ready,

        can,

        refreshPermissions,

      }}

    >

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

            {visibleMenu.map(item => (

              <button

                type="button"

                key={item.id}

                className={

                  "dashboard-nav-item" +

                  (

                    item.id === activeMenu

                      ? " active"

                      : ""

                  )

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

                <span className="dashboard-nav-icon">

                  {item.icon ??

                    <FileTextOutlined />}

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

            disabled={logoutLoading}

            onClick={() =>

              void handleLogout()

            }

          >

            <LogoutOutlined />

            <span>

              {logoutLoading

                ? "Đang đăng xuất..."

                : "Đăng xuất"}

            </span>

          </button>

          {logoutError && (

            <p role="alert">

              {logoutError}

            </p>

          )}

        </aside>

        <div className="dashboard-content">

          <header className="dashboard-topbar">

            <div className="dashboard-search">

              <SearchOutlined

                className="dashboard-search-icon"

              />

              <input

                aria-label="Tìm kiếm dữ liệu trong bảng"

                placeholder="Tìm kiếm..."

                value={search}

                disabled={

                  !ready ||

                  isForecast ||

                  content != null ||

                  !tableAllowed

                }

                onChange={event =>

                  setSearch(event.target.value)

                }

              />

            </div>

            <div className="dashboard-topbar-right">

              <button

                type="button"

                className="dashboard-notif-btn"

                title="Tải lại quyền truy cập"

                aria-label="Tải lại quyền truy cập"

                disabled={permissionLoading}

                onClick={refreshPermissions}

              >

                <ReloadOutlined

                  spin={permissionLoading}

                />

              </button>

              <button

                type="button"

                className="dashboard-notif-btn"

                title="Thông báo"

                aria-label="Thông báo"

              >

                <BellOutlined />

                <span className="dashboard-notif-dot" />

              </button>

              <div className="dashboard-user">

                <div className="dashboard-user-avatar">

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

            {!ready && (

              <section className="dashboard-panel">

                <div className="dashboard-panel-heading">

                  <div>

                    <h2>

                      {permissionError

                        ? "Chưa tải được quyền truy cập"

                        : "Đang tải quyền truy cập"}

                    </h2>

                    <p

                      role={

                        permissionError

                          ? "alert"

                          : "status"

                      }

                    >

                      {permissionError ||

                        "Vui lòng chờ trong giây lát..."}

                    </p>

                  </div>

                  {permissionError && (

                    <button

                      type="button"

                      onClick={refreshPermissions}

                    >

                      Thử lại

                    </button>

                  )}

                </div>

              </section>

            )}

            {forecastVisited &&

              (

                !ready ||

                can("du_bao_nhu_cau")

              ) && (

                <div

                  hidden={

                    !ready ||

                    !isForecast ||

                    !can("du_bao_nhu_cau")

                  }

                >

                  <DuBaoNhuCauPage mode="du-bao" />

                </div>

              )}

            {ready && !isForecast && (

              <>

                {content == null && (

                  <div className="dashboard-heading">

                    <div>

                      <h1>

                        {overview

                          ? config.title

                          : selected?.label}

                      </h1>

                      <p>

                        {feature === "san_pham"

                          ? (

                              "Quản lý mã sản phẩm, nhóm hàng, " +

                              "khối lượng, đơn giá và trạng thái kinh doanh."

                            )

                          : config.subtitle}

                      </p>

                    </div>

                    <span className="dashboard-demo-label">

                      Hệ thống dự báo nhu cầu

                    </span>

                  </div>

                )}

                {overview && stats.length > 0 && (

                  <div className="dashboard-stats">

                    {stats.map(item => (

                      <article

                        key={item.label}

                        className={

                          `dashboard-stat ${item.color}`

                        }

                      >

                        <p>{item.label}</p>

                        <strong>{item.value}</strong>

                        <small>{item.note}</small>

                      </article>

                    ))}

                  </div>

                )}

                {overview &&

                  can("du_bao_nhu_cau") && (

                    <section className="dashboard-panel dashboard-chart-section">

                      <div className="dashboard-chart-header">

                        <h3>

                          Biểu đồ dự báo nhu cầu nguyên liệu

                        </h3>

                        <p>

                          So sánh tiêu thụ thực tế và dự báo.

                          Số liệu biểu đồ hiện là dữ liệu minh họa.

                        </p>

                      </div>

                      <div className="dashboard-chart-body">

                        <Line

                          data={CHART}

                          options={{

                            responsive: true,

                            maintainAspectRatio: false,

                          }}

                        />

                      </div>

                    </section>

                  )}

                {content != null ? (

                  content

                ) : tableAllowed ? (

                  <section className="dashboard-panel">

                    <div className="dashboard-panel-heading">

                      <div>

                        <h2>

                          {overview

                            ? config.tableTitle

                            : selected?.label}

                        </h2>

                        <p>

                          Danh sách dữ liệu quản lý trong hệ thống

                        </p>

                      </div>

                      <div className="dashboard-top-actions">

                        {config.topActions}

                      </div>

                    </div>

                    <div className="dashboard-table-wrap">

                      <table>

                        <thead>

                          <tr>

                            {columns.map(column => (

                              <th key={column.key}>

                                {column.label}

                              </th>

                            ))}

                          </tr>

                        </thead>

                        <tbody>

                          {rows.map(row => (

                            <tr key={row.code}>

                              {columns.map(column =>

                                renderCell(

                                  row,

                                  column,

                                ),

                              )}

                            </tr>

                          ))}

                          {rows.length === 0 && (

                            <tr>

                              <td

                                colSpan={

                                  Math.max(

                                    columns.length,

                                    1,

                                  )

                                }

                                className="dashboard-empty-row"

                              >

                                {search

                                  ? "Không tìm thấy dữ liệu phù hợp."

                                  : "Chưa có dữ liệu."}

                              </td>

                            </tr>

                          )}

                        </tbody>

                      </table>

                    </div>

                  </section>

                ) : !overview ? (

                  <section className="dashboard-panel">

                    <div className="dashboard-panel-heading">

                      <div>

                        <h2>{selected?.label}</h2>

                        <p>

                          Bạn có quyền xem chức năng này.

                          Màn hình nghiệp vụ chưa được

                          kết nối trong frontend.

                        </p>

                      </div>

                    </div>

                  </section>

                ) : !hasView ? (

                  <section className="dashboard-panel">

                    <div className="dashboard-panel-heading">

                      <div>

                        <h2>Chưa có quyền xem dữ liệu</h2>

                        <p>

                          Vui lòng liên hệ người quản lý phân quyền.

                        </p>

                      </div>

                    </div>

                  </section>

                ) : null}

              </>

            )}

          </main>

        </div>

      </div>

    </PermissionContext.Provider>

  );

}