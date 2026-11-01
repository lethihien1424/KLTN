// // D:\KLTN\KLTN\frontend\src\pages\dashboard\UnifiedDashboardPage.tsx
// import { useState, useMemo, type ReactNode } from "react";
// import { useAuth } from "../../auth/AuthContext";

// // Import tất cả các file dashboard riêng biệt
// import DashboardProductConsumption from "./DashboardProductConsumption";
// import DashboardOrderStats from "./DashboardOrderStats";
// import DashboardProphetComparison from "./DashboardProphetComparison";
// import DashboardFormulaBom from "./DashboardFormulaBom";
// import DashboardInventoryStock from "./DashboardInventoryStock";
// import DashboardSupplierMaterials from "./DashboardSupplierMaterials";
// import DashboardSupplierScore from "./DashboardSupplierScore";
// import DashboardSupplierSuggestion from "./DashboardSupplierSuggestion";
// import DashboardMaterialDemand from "./DashboardMaterialDemand";
// import DashboardPurchaseOrders from "./DashboardPurchaseOrders";
// import DashboardAccountStatus from "./DashboardAccountStatus";
// import DashboardConfigAudit from "./DashboardConfigAudit";
// import DashboardNguyenLieuUsage from "./DashboardNguyenLieuUsage";
// import DashboardInventoryAlerts from "./DashboardInventoryAlerts";

// import "../../styles/unifiedDashboard.css";

// interface DashboardItem {
//   id: string;
//   title: string;
//   shortTitle: string;
//   icon: string;
//   category: "ban_hang" | "kho_nguyen_lieu" | "nha_cung_cap" | "mua_hang" | "he_thong";
//   categoryLabel: string;
//   component: ReactNode;
//   allowed: boolean;
// }

// export default function UnifiedDashboardPage() {
//   const { user, can } = useAuth();

//   const isAdmin = useMemo(() => {
//     const roleCode = String(user?.vai_tro || user?.role?.ma_vai_tro || "").toUpperCase();
//     const roleName = String(user?.role?.ten_vai_tro || "").toUpperCase();
//     const isSuperUser = String(user?.ma_nguoi_dung || "").toLowerCase() === "admin";
//     const hasAdminRole =
//       roleCode === "ADMIN" ||
//       roleName.includes("ADMIN") ||
//       roleName.includes("QUẢN TRỊ");
//     const hasAdminPerms =
//       (can("tai_khoan:XEM") && can("phan_quyen:XEM")) ||
//       (can("USER_VIEW") && can("ROLE_VIEW")) ||
//       Boolean(user?.permissions?.includes("*")) ||
//       Boolean(user?.permissions?.includes("admin"));

//     return isSuperUser || hasAdminRole || hasAdminPerms;
//   }, [user, can]);

//   // ==================== MA TRẬN PHÂN QUYỀN DASHBOARD ====================
//   // 1. Quản lý sản phẩm: xem được dashboard sản phẩm tiêu thụ
//   const canSanPham = useMemo(() => {
//     return isAdmin || can("san_pham:XEM") || can("du_lieu_ban_hang:XEM") || can("du_bao_nhu_cau:XEM") || can("SAN_PHAM_VIEW");
//   }, [isAdmin, can]);

//   // 2. Dữ liệu đơn hàng: xem được dashboard đơn hàng
//   const canDonHang = useMemo(() => {
//     return isAdmin || can("du_lieu_ban_hang:XEM") || can("du_bao_nhu_cau:XEM") || can("IMPORT_DON_HANG");
//   }, [isAdmin, can]);

//   // 3. Dự báo: xem được dashboard so sánh Prophet vs thực tế
//   const canProphet = useMemo(() => {
//     return isAdmin || can("du_bao_nhu_cau:XEM") || can("danh_gia_mo_hinh:XEM") || can("lich_su_du_bao:XEM") || can("DU_BAO_VIEW");
//   }, [isAdmin, can]);

//   // 4. Công thức BOM: nguyên liệu dùng trong công thức nhiều nhất, ít nhất, chưa dùng
//   const canCongThuc = useMemo(() => {
//     return isAdmin || can("cong_thuc:XEM") || can("CONG_THUC_VIEW");
//   }, [isAdmin, can]);

//   // 5. Tồn kho nguyên liệu: lượng đã book, tồn thực tế, cảnh báo tồn kho
//   const canTonKho = useMemo(() => {
//     return (
//       isAdmin ||
//       can("ton_kho_nguyen_lieu:XEM") ||
//       can("nhu_cau_nguyen_lieu:XEM") ||
//       can("don_mua_nguyen_lieu:XEM") ||
//       can("TON_KHO_VIEW")
//     );
//   }, [isAdmin, can]);

//   // 6. Nguyên liệu cung ứng: xem nguyên liệu cung ứng bởi NPP nào, đơn giá lớn nhất/nhỏ nhất, chất lượng, đúng hạn
//   const canNguyenLieuCungUng = useMemo(() => {
//     return isAdmin || can("nguyen_lieu_nha_cung_cap:XEM") || can("NGUYEN_LIEU_NCC_VIEW");
//   }, [isAdmin, can]);

//   // 7. Nhà cung cấp, hiệu suất NCC: dashboard điểm thương mại NCC
//   const canNCC = useMemo(() => {
//     return (
//       isAdmin ||
//       can("nha_cung_cap:XEM") ||
//       can("hieu_suat_nha_cung_cap:XEM") ||
//       can("goi_y_nha_cung_cap:XEM") ||
//       can("NHA_CUNG_CAP_VIEW") ||
//       can("NHA_CUNG_CAP_PERFORMANCE_VIEW")
//     );
//   }, [isAdmin, can]);

//   // 8. Gợi ý NCC: dashboard NCC được gợi ý nhiều nhất, ít nhất, không được gợi ý
//   const canGoiYNCC = useMemo(() => {
//     return isAdmin || can("goi_y_nha_cung_cap:XEM") || can("GOI_Y_NHA_CUNG_CAP_VIEW");
//   }, [isAdmin, can]);

//   // 9. Nhu cầu nguyên liệu: xem tồn kho + dự báo nhu cầu nhiều nhất/ít nhất, biểu đồ đường/cột nhu cầu, khả dụng, an toàn
//   const canNhuCauNL = useMemo(() => {
//     return isAdmin || can("nhu_cau_nguyen_lieu:XEM") || can("don_mua_nguyen_lieu:XEM") || can("NHU_CAU_NGUYEN_LIEU_VIEW");
//   }, [isAdmin, can]);

//   // 10. Đơn mua NL: đơn mua cho nguyên liệu nào nhiều nhất, ít nhất
//   const canDonMua = useMemo(() => {
//     return (
//       isAdmin ||
//       can("don_mua_nguyen_lieu:XEM") ||
//       can("don_mua_nguyen_lieu:DUYET") ||
//       can("DON_MUA_VIEW")
//     );
//   }, [isAdmin, can]);

//   // 11. Quản lý tài khoản: vai trò nào nhiều nhất, tài khoản hoạt động/ngừng hoạt động
//   const canTaiKhoan = useMemo(() => {
//     return isAdmin || can("tai_khoan:XEM") || can("USER_VIEW");
//   }, [isAdmin, can]);

//   // 12. Cấu hình: nhật ký hoạt động, thao tác nhiều nhất, chức năng, tỷ lệ thành công
//   const canCauHinh = useMemo(() => {
//     return (
//       isAdmin ||
//       can("quan_ly_ly_do:XEM") ||
//       can("nhat_ky_hoat_dong:XEM") ||
//       can("VIEW_REASON_CONFIG") ||
//       can("VIEW_AUDIT_LOG")
//     );
//   }, [isAdmin, can]);

//   // Danh mục tất cả các dashboard độc lập
//   const allDashboards: DashboardItem[] = useMemo(() => [
//     {
//       id: "san_pham",
//       title: "Sản phẩm tiêu thụ nhiều nhất / ít nhất",
//       shortTitle: "Sản phẩm tiêu thụ",
//       icon: "☕",
//       category: "ban_hang",
//       categoryLabel: "Bán hàng & Sản phẩm",
//       component: <DashboardProductConsumption />,
//       allowed: canSanPham,
//     },
//     {
//       id: "don_hang",
//       title: "Thống kê đơn hàng (Đơn hàng lớn nhất / nhỏ nhất)",
//       shortTitle: "Dữ liệu đơn hàng",
//       icon: "🧾",
//       category: "ban_hang",
//       categoryLabel: "Bán hàng & Sản phẩm",
//       component: <DashboardOrderStats />,
//       allowed: canDonHang,
//     },
//     {
//       id: "prophet",
//       title: "So sánh đối soát đơn hàng với mô hình Prophet",
//       shortTitle: "So sánh Prophet",
//       icon: "📈",
//       category: "ban_hang",
//       categoryLabel: "Bán hàng & Sản phẩm",
//       component: <DashboardProphetComparison />,
//       allowed: canProphet,
//     },
//     {
//       id: "cong_thuc",
//       title: "Công thức BOM & Tần suất sử dụng nguyên liệu",
//       shortTitle: "Công thức BOM",
//       icon: "🧪",
//       category: "kho_nguyen_lieu",
//       categoryLabel: "Nguyên liệu & Tồn kho",
//       component: <DashboardFormulaBom />,
//       allowed: canCongThuc,
//     },
//     {
//       id: "ton_kho",
//       title: "Tồn kho thực tế & Lượng nguyên liệu đã Book",
//       shortTitle: "Tồn kho & Book",
//       icon: "📦",
//       category: "kho_nguyen_lieu",
//       categoryLabel: "Nguyên liệu & Tồn kho",
//       component: <DashboardInventoryStock />,
//       allowed: canTonKho,
//     },
//     {
//       id: "canh_bao_kho",
//       title: "Cảnh báo mức tồn kho an toàn & khẩn cấp",
//       shortTitle: "Cảnh báo tồn kho",
//       icon: "⚠️",
//       category: "kho_nguyen_lieu",
//       categoryLabel: "Nguyên liệu & Tồn kho",
//       component: <DashboardInventoryAlerts />,
//       allowed: canTonKho,
//     },
//     {
//       id: "nguyen_lieu_cung_ung",
//       title: "Nguyên liệu cung ứng, Báo giá & Chất lượng giao hàng",
//       shortTitle: "Nguyên liệu cung ứng",
//       icon: "🚛",
//       category: "nha_cung_cap",
//       categoryLabel: "Nhà cung cấp & Đối tác",
//       component: <DashboardSupplierMaterials />,
//       allowed: canNguyenLieuCungUng,
//     },
//     {
//       id: "nha_cung_cap",
//       title: "Điểm thương mại & Thang điểm đánh giá Nhà cung cấp",
//       shortTitle: "Điểm thương mại NCC",
//       icon: "🏢",
//       category: "nha_cung_cap",
//       categoryLabel: "Nhà cung cấp & Đối tác",
//       component: <DashboardSupplierScore />,
//       allowed: canNCC,
//     },
//     {
//       id: "goi_y_ncc",
//       title: "Tần suất xếp hạng & Gợi ý Nhà cung cấp tối ưu",
//       shortTitle: "Gợi ý NCC",
//       icon: "💡",
//       category: "nha_cung_cap",
//       categoryLabel: "Nhà cung cấp & Đối tác",
//       component: <DashboardSupplierSuggestion />,
//       allowed: canGoiYNCC,
//     },
//     {
//       id: "nhu_cau_nl",
//       title: "Nhu cầu nguyên liệu dự báo (Nhu cầu - Khả dụng - An toàn - Cần mua)",
//       shortTitle: "Nhu cầu nguyên liệu",
//       icon: "📊",
//       category: "mua_hang",
//       categoryLabel: "Mua hàng & Đề xuất",
//       component: <DashboardMaterialDemand />,
//       allowed: canNhuCauNL,
//     },
//     {
//       id: "don_mua",
//       title: "Đơn mua nguyên liệu (Khối lượng & Chi phí theo nguyên liệu)",
//       shortTitle: "Đơn mua nguyên liệu",
//       icon: "🛒",
//       category: "mua_hang",
//       categoryLabel: "Mua hàng & Đề xuất",
//       component: <DashboardPurchaseOrders />,
//       allowed: canDonMua,
//     },
//     {
//       id: "tai_khoan",
//       title: "Trạng thái tài khoản & Cơ cấu phân quyền vai trò",
//       shortTitle: "Tài khoản & Vai trò",
//       icon: "👥",
//       category: "he_thong",
//       categoryLabel: "Hệ thống & Cấu hình",
//       component: <DashboardAccountStatus />,
//       allowed: canTaiKhoan,
//     },
//     {
//       id: "cau_hinh",
//       title: "Nhật ký kiểm toán hoạt động & Cấu hình vận hành",
//       shortTitle: "Nhật ký cấu hình",
//       icon: "⚙️",
//       category: "he_thong",
//       categoryLabel: "Hệ thống & Cấu hình",
//       component: <DashboardConfigAudit />,
//       allowed: canCauHinh,
//     },
//   ], [
//     canSanPham,
//     canDonHang,
//     canProphet,
//     canCongThuc,
//     canTonKho,
//     canNguyenLieuCungUng,
//     canNCC,
//     canGoiYNCC,
//     canNhuCauNL,
//     canDonMua,
//     canTaiKhoan,
//     canCauHinh,
//   ]);

//   // Danh sách các dashboard được phép
//   const authorizedDashboards = useMemo(
//     () => allDashboards.filter(d => d.allowed),
//     [allDashboards],
//   );

//   const isFewDashboards = authorizedDashboards.length <= 2;

//   // Quản lý tab đang chọn: 'all' hoặc id của dashboard
//   const [activeTab, setActiveTab] = useState<string>("all");

//   // Thu gọn / mở rộng các dashboard khi ở chế độ xem tất cả
//   const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

//   const toggleCollapse = (id: string) => {
//     setCollapsedMap(prev => ({ ...prev, [id]: !prev[id] }));
//   };

//   const currentTab = useMemo(() => {
//     if (activeTab === "all") return "all";
//     if (authorizedDashboards.some(d => d.id === activeTab)) return activeTab;
//     return "all";
//   }, [activeTab, authorizedDashboards]);

//   if (authorizedDashboards.length === 0) {
//     return (
//       <div className="ud-container" style={{ maxWidth: 700, margin: "60px auto" }}>
//         <div className="ud-empty-box">
//           <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
//           <h2 style={{ margin: "0 0 8px 0", color: "#1e293b", fontSize: 20 }}>
//             Tài khoản chưa được phân quyền truy cập Dashboard
//           </h2>
//           <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
//             Vui lòng liên hệ Quản trị viên để được cấp quyền cho các phân hệ tương ứng (Sản phẩm, Đơn hàng, Dự báo, Tồn kho, Nhà cung cấp,...).
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className="ud-container"
//       style={{
//         maxWidth: isFewDashboards ? "1100px" : "100%",
//         margin: isFewDashboards ? "0 auto" : "0",
//       }}
//     >
//       {/* Header Banner */}
//       <div className="ud-header">
//         <div>
//           <h1 className="ud-header-title">
//             <span>📊</span> Hệ Thống Bảng Điều Khiển Tích Hợp
//           </h1>
//           <p className="ud-header-desc">
//             Hiển thị tự động theo phân quyền của <strong>{user?.ho_ten || user?.ma_nguoi_dung || "Người dùng"}</strong>
//           </p>
//         </div>

//         <div className="ud-header-badges">
//           <span className="ud-role-badge">
//             👤 Vai trò: {user.vai_tro || "Người dùng"}
//           </span>
//           <span className="ud-role-badge" style={{ background: "rgba(16, 185, 129, 0.2)", borderColor: "#10b981" }}>
//             ✓ {authorizedDashboards.length} Dashboard khả dụng
//           </span>
//         </div>
//       </div>

//       {/* Tabs navigation nếu có từ 2 dashboard trở lên */}
//       {authorizedDashboards.length > 1 && (
//         <div className="ud-tabs-bar">
//           <button
//             className={`ud-tab-btn ${currentTab === "all" ? "active" : ""}`}
//             onClick={() => setActiveTab("all")}
//           >
//             <span>📑</span>
//             <span>Tổng hợp tất cả</span>
//             <span className="ud-tab-badge">{authorizedDashboards.length}</span>
//           </button>

//           {authorizedDashboards.map(d => (
//             <button
//               key={d.id}
//               className={`ud-tab-btn ${currentTab === d.id ? "active" : ""}`}
//               onClick={() => setActiveTab(d.id)}
//             >
//               <span>{d.icon}</span>
//               <span>{d.shortTitle}</span>
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Nội dung Dashboard */}
//       {currentTab === "all" ? (
//         <div style={{ display: "flex", flexDirection: "column", gap: isFewDashboards ? 24 : 20 }}>
//           {authorizedDashboards.map(d => {
//             const isCollapsed = Boolean(collapsedMap[d.id]);
//             return (
//               <section
//                 key={d.id}
//                 style={{
//                   background: "#ffffff",
//                   borderRadius: 14,
//                   padding: isFewDashboards ? "24px 28px" : "18px 22px",
//                   border: "1px solid #e2e8f0",
//                   boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
//                   transition: "all 0.2s ease",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: isCollapsed ? 0 : 16,
//                     paddingBottom: isCollapsed ? 0 : 12,
//                     borderBottom: isCollapsed ? "none" : "1px solid #f1f5f9",
//                   }}
//                 >
//                   <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                     <span style={{ fontSize: 20 }}>{d.icon}</span>
//                     <div>
//                       <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
//                         {d.title}
//                       </h2>
//                       <span style={{ fontSize: 12, color: "#64748b" }}>{d.categoryLabel}</span>
//                     </div>
//                   </div>

//                   <div style={{ display: "flex", gap: 8 }}>
//                     <button
//                       className="ud-btn"
//                       onClick={() => toggleCollapse(d.id)}
//                       style={{ padding: "4px 10px", fontSize: 12 }}
//                     >
//                       {isCollapsed ? "Mở rộng ▾" : "Thu gọn ▴"}
//                     </button>
//                     <button
//                       className="ud-btn"
//                       onClick={() => setActiveTab(d.id)}
//                       style={{ padding: "4px 10px", fontSize: 12 }}
//                     >
//                       Toàn màn hình ↗
//                     </button>
//                   </div>
//                 </div>

//                 {!isCollapsed && <div>{d.component}</div>}
//               </section>
//             );
//           })}
//         </div>
//       ) : (
//         <div>
//           {authorizedDashboards
//             .filter(d => d.id === currentTab)
//             .map(d => (
//               <div
//                 key={d.id}
//                 style={{
//                   background: "#ffffff",
//                   borderRadius: 14,
//                   padding: "24px 28px",
//                   border: "1px solid #e2e8f0",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: 16,
//                     paddingBottom: 12,
//                     borderBottom: "1px solid #f1f5f9",
//                   }}
//                 >
//                   <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                     <span style={{ fontSize: 24 }}>{d.icon}</span>
//                     <div>
//                       <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
//                         {d.title}
//                       </h2>
//                       <span style={{ fontSize: 12, color: "#64748b" }}>{d.categoryLabel}</span>
//                     </div>
//                   </div>

//                   <button
//                     className="ud-btn"
//                     onClick={() => setActiveTab("all")}
//                     style={{ fontSize: 12 }}
//                   >
//                     ← Về danh sách tổng hợp
//                   </button>
//                 </div>

//                 {d.component}
//               </div>
//             ))}
//         </div>
//       )}
//     </div>
//   );
// }
import { Component, lazy, Suspense, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { canViewDashboard, dashboardRouteGroup, type DashboardId } from "../../auth/dashboardPolicy";
import "../../styles/dashboardBoards.css";

const definitions = [
  { id: "orders", title: "Tiêu thụ theo đơn hàng", description: "Sản phẩm, công thức và nguyên liệu tính từ đơn hàng", members: ["orders"], Page: lazy(() => import("./DashboardBoards").then(m => ({ default: m.SalesBoard }))) },
  { id: "prophet", title: "Dự báo và nhu cầu nguyên liệu", description: "Kết quả Prophet và nhu cầu nguyên liệu theo quyền", members: ["prophet", "demand"], Page: lazy(() => import("./DashboardBoards").then(m => ({ default: m.ForecastDemandBoard }))) },
  { id: "supply", title: "Nguyên liệu cung ứng và điểm nhà cung cấp", description: "Báo giá, chất lượng, giao hàng và điểm thương mại", members: ["supply", "suppliers", "suggestions"], Page: lazy(() => import("./DashboardBoards").then(m => ({ default: m.SupplierBoard }))) },
  { id: "accounts", title: "Thời gian đăng nhập", description: "Vai trò và danh sách lần đăng nhập gần đây", members: ["accounts"], Page: lazy(() => import("./DashboardBoards").then(m => ({ default: m.AdministrationBoard }))) },
] as const;
class SectionError extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="dv-state dv-error" role="alert">Không thể hiển thị khu vực này. <button type="button" onClick={() => window.location.reload()}>Tải lại trang</button></div> : this.props.children; }
}
export default function UnifiedDashboardPage({ only }: { only?: DashboardId }) {
  const { user, refreshPermissions } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const group = only ? dashboardRouteGroup[only] ?? only : undefined;
  const authorized = !only || canViewDashboard(user.permissions, only);
  const visible = authorized ? definitions.filter(d => (!group || d.id === group) && d.members.some(id => canViewDashboard(user.permissions, id))) : [];
  async function refresh() { if (busy) return; setBusy(true); setError(""); try { await refreshPermissions(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không cập nhật được quyền."); } finally { setBusy(false); } }
  return <div className="dv-overview">
    <header className="dv-page-heading"><div><h1>{only ? visible[0]?.title ?? "Dashboard" : "Tổng quan hoạt động"}</h1><p>Các biểu đồ theo chức năng được cấp quyền</p></div><button type="button" disabled={busy} onClick={() => void refresh()}>{busy ? "Đang cập nhật…" : "Cập nhật quyền"}</button></header>
    {error && <p className="dv-error" role="alert">{error}</p>}
    {!visible.length && <p className="dv-state">Bạn chưa được cấp quyền xem dashboard tương ứng.</p>}
    <div className="dv-boards">{visible.map(({ id, title, description, Page }, index) => <section className={`dv-board dv-board-${id}`} key={`${user.ma_nguoi_dung}:${id}`} aria-labelledby={`board-${id}`}>
      <header className="dv-board-heading"><span className="dv-board-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h2 id={`board-${id}`}>{title}</h2><p>{description}</p></div></header>
      <SectionError><Suspense fallback={<p className="dv-state" role="status">Đang tải biểu đồ…</p>}><Page /></Suspense></SectionError>
    </section>)}</div>
  </div>;
}
