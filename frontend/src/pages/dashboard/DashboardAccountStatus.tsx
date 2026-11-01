// //D:\KLTN_3110\KLTN\frontend\src\pages\dashboard\DashboardAccountStatus.tsx
// import { Doughnut } from "react-chartjs-2";
// import { CHART_COLORS } from "./chartSetup";
// import { fetchAccountStatistics } from "../../services/dashboardService";
// import { StatsFrame, StatsTable, useStats } from "./dashboardUI";
// import "../../styles/unifiedDashboard.css";

// export default function DashboardAccountStatus() {
//   const resource = useStats(fetchAccountStatistics);
//   const data = resource.data;
//   const roles = [...(data?.vai_tro_distribution ?? [])].sort((a, b) => b.so_luong - a.so_luong || a.label.localeCompare(b.label, "vi"));
//   const loginRows = data?.recent_logins ?? [];
//   return (
//     <StatsFrame resource={resource} note="Ph\u00e2n b\u1ed5 t\u00e0i kho\u1ea3n theo vai tr\u00f2 v\u00e0 c\u00e1c l\u1ea7n \u0111\u0103ng nh\u1eadp th\u00e0nh c\u00f4ng g\u1ea7n \u0111\u00e2y.">
//       {data && <>
//         <section className="ud-chart-card">
//           <h3 className="ud-chart-title">S\u1ed1 t\u00e0i kho\u1ea3n theo vai tr\u00f2</h3>
//           <p className="ud-chart-subtitle">M\u1ed7i m\u00e0u l\u00e0 m\u1ed9t vai tr\u00f2; ch\u00fa gi\u1ea3i hi\u1ec3n s\u1ed1 t\u00e0i kho\u1ea3n.</p>
//           <div className="ud-chart-canvas-wrap">
//             <Doughnut
//               data={{
//                 labels: roles.map(item => item.label),
//                 datasets: [{
//                   data: roles.map(item => item.so_luong),
//                   backgroundColor: roles.map((_, index) => CHART_COLORS.palette[index % CHART_COLORS.palette.length]),
//                   borderColor: "#fff",
//                   borderWidth: 2,
//                 }],
//               }}
//               options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }}
//             />
//           </div>
//         </section>
//         <StatsTable title="T\u00e0i kho\u1ea3n \u0111\u0103ng nh\u1eadp g\u1ea7n \u0111\u00e2y" rows={loginRows} rowKey={item => `${item.ma_nguoi_dung}:${item.thoi_gian_dang_nhap}`} columns={[
//           { title: "T\u00ean t\u00e0i kho\u1ea3n", value: item => item.ten_tai_khoan },
//           { title: "M\u00e3 ng\u01b0\u1eddi d\u00f9ng", value: item => item.ma_nguoi_dung },
//           { title: "Vai tr\u00f2", value: item => item.vai_tro },
//           { title: "Th\u1eddi gian \u0111\u0103ng nh\u1eadp", value: item => new Date(item.thoi_gian_dang_nhap).toLocaleString("vi-VN") },
//           { title: "\u0110\u00e3 \u0111\u0103ng nh\u1eadp", value: item => { const elapsed = Math.max(0, Date.now() - new Date(item.thoi_gian_dang_nhap).getTime()); const minutes = Math.floor(elapsed / 60000); return minutes < 1 ? "V\u1eeba xong" : minutes < 60 ? `${minutes} ph\u00fat tr\u01b0\u1edbc` : minutes < 1440 ? `${Math.floor(minutes / 60)} gi\u1edd tr\u01b0\u1edbc` : `${Math.floor(minutes / 1440)} ng\u00e0y tr\u01b0\u1edbc`; } },
//         ]} />
//       </>}
//     </StatsFrame>
//   );
// }
