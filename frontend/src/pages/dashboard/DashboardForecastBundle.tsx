// import { lazy } from "react";
// import { useAuth } from "../../auth/AuthContext";
// import { DashboardPanel } from "./DashboardBundles";
// import "../../styles/unifiedDashboard.css";

// const ProphetComparison = lazy(() => import("./DashboardProphetComparison"));
// const ForecastHistory = lazy(() => import("./DashboardForecastHistory"));

// export default function DashboardForecastBundle() {
//   const { user } = useAuth();
//   const canOpenHistory = (user.permissions ?? []).some(permission =>
//     permission === "du_bao_nhu_cau:XEM" || permission === "lich_su_du_bao:XEM",
//   );
//   return (
//     <div className="ud-dashboard-bundle">
//       <DashboardPanel title="So sánh Prophet với dữ liệu thực tế"><ProphetComparison /></DashboardPanel>
//       {canOpenHistory && <DashboardPanel title="Dashboard theo mã lần dự báo"><ForecastHistory /></DashboardPanel>}
//     </div>
//   );
// }
