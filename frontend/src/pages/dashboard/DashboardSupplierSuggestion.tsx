// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardSupplierSuggestion.tsx
// // import { useEffect, useState } from "react";
// // import { Bar, Doughnut } from "react-chartjs-2";
// // import "./chartSetup";
// // import { CHART_COLORS } from "./chartSetup";
// // import {
// //   fetchSupplierSuggestionStats,
// //   type SupplierSuggestionStatsResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // export default function DashboardSupplierSuggestion() {
// //   const [data, setData] = useState<SupplierSuggestionStatsResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchSupplierSuggestionStats()
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu gợi ý NCC."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const topSuggested = data?.top_suggested ?? [];
// //   const barData = {
// //     labels: topSuggested.map(s => s.ten_ncc),
// //     datasets: [
// //       {
// //         label: "Số lần được thuật toán xếp gợi ý ưu tiên",
// //         data: topSuggested.map(s => s.so_lan_goi_y_top1),
// //         backgroundColor: CHART_COLORS.palette,
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   const doughnutData = {
// //     labels: ["Được gợi ý ưu tiên", "Không được gợi ý"],
// //     datasets: [
// //       {
// //         data: [data?.so_ncc_duoc_goi_y || 0, data?.so_ncc_khong_goi_y || 0],
// //         backgroundColor: ["#10b981", "#ef4444"],
// //         borderWidth: 2,
// //         borderColor: "#ffffff",
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">💡 Đánh giá tần suất gợi ý nhà cung cấp tối ưu tự động</span>
// //         </div>
// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang tính toán ma trận gợi ý nhà cung cấp...</p>
// //         </div>
// //       )}

// //       {error && !loading && (
// //         <div className="ud-empty-box" style={{ color: "#ef4444" }}>
// //           <p>⚠️ {error}</p>
// //           <button className="ud-btn" onClick={loadData}>Thử lại</button>
// //         </div>
// //       )}

// //       {data && !loading && (
// //         <>
// //           <div className="ud-kpi-grid">
// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng đối tác NCC</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Hệ thống</span>
// //               </div>
// //               <p className="ud-kpi-value">{data.tong_ncc}</p>
// //               <div className="ud-kpi-sub">Đối tác trong danh bạ quản lý</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Được thuật toán gợi ý</span>
// //                 <span className="ud-kpi-badge ud-badge-success">Đạt chuẩn</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#166534" }}>
// //                 {data.so_ncc_duoc_goi_y}
// //               </p>
// //               <div className="ud-kpi-sub">Có khả năng cung ứng và điểm số tốt</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>KHÔNG được gợi ý</span>
// //                 <span className="ud-kpi-badge ud-badge-danger">Cần xem xét</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#991b1b" }}>
// //                 {data.so_ncc_khong_goi_y}
// //               </p>
// //               <div className="ud-kpi-sub">Chưa có nguyên liệu hoặc điểm đánh giá thấp</div>
// //             </div>
// //           </div>

// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Nhà cung cấp được gợi ý nhiều nhất</h3>
// //                   <div className="ud-chart-subtitle">Ưu tiên dựa trên điểm thương mại, khả năng giao và báo giá</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={barData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: { legend: { display: false } },
// //                     scales: {
// //                       y: {
// //                         beginAtZero: true,
// //                         ticks: { stepSize: 1 },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Tỷ lệ NCC được hệ thống đề xuất</h3>
// //                   <div className="ud-chart-subtitle">Tỷ lệ đối tác đủ điều kiện lọt vào danh sách đề xuất tự động</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap" style={{ display: "flex", justifyContent: "center" }}>
// //                 <Doughnut
// //                   data={doughnutData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: { legend: { position: "bottom" } },
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Tables */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🟢 Top NCC được gợi ý nhiều nhất</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã NCC</th>
// //                       <th>Tên nhà cung cấp</th>
// //                       <th style={{ textAlign: "right" }}>Điểm NCC</th>
// //                       <th style={{ textAlign: "right" }}>Số NL cung ứng</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.top_suggested.slice(0, 5).map((s, idx) => (
// //                       <tr key={s.ma_ncc}>
// //                         <td><span className={`ud-rank-pill ud-rank-${idx + 1}`}>{idx + 1}</span></td>
// //                         <td><code>{s.ma_ncc}</code></td>
// //                         <td><strong>{s.ten_ncc}</strong></td>
// //                         <td style={{ textAlign: "right", color: "#166534", fontWeight: 700 }}>
// //                           {s.diem_ncc ?? "—"}
// //                         </td>
// //                         <td style={{ textAlign: "right" }}>{s.so_nguyen_lieu_cung_ung} loại</td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🔴 Danh sách NCC KHÔNG được gợi ý</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th>Mã NCC</th>
// //                       <th>Tên nhà cung cấp</th>
// //                       <th style={{ textAlign: "right" }}>Điểm</th>
// //                       <th style={{ textAlign: "center" }}>Lý do</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.not_suggested.slice(0, 5).map(s => (
// //                       <tr key={s.ma_ncc}>
// //                         <td><code>{s.ma_ncc}</code></td>
// //                         <td>{s.ten_ncc}</td>
// //                         <td style={{ textAlign: "right" }}>{s.diem_ncc ?? "0"}</td>
// //                         <td style={{ textAlign: "center" }}>
// //                           <span className="ud-kpi-badge ud-badge-danger">
// //                             {s.so_nguyen_lieu_cung_ung === 0 ? "Chưa có mặt hàng" : "Điểm thấp"}
// //                           </span>
// //                         </td>
// //                       </tr>
// //                     ))}
// //                     {data.not_suggested.length === 0 && (
// //                       <tr>
// //                         <td colSpan={4} style={{ textAlign: "center", padding: "20px", color: "#166534" }}>
// //                           Tất cả đối tác đều đang đủ điều kiện gợi ý nhập hàng!
// //                         </td>
// //                       </tr>
// //                     )}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }

// import { useState } from "react";
// import { Doughnut } from "react-chartjs-2";

// import {
//   fetchSupplierSuggestionStats,
// } from "../../services/dashboardService";

// import { CHART_COLORS } from "./chartSetup";

// import {
//   Choices,
//   Comparison,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";

// type SuggestionMode = "top" | "least" | "none";

// const MODE_OPTIONS: {
//   value: SuggestionMode;
//   label: string;
// }[] = [
//   {
//     value: "top",
//     label: "Gợi ý nhiều nhất",
//   },
//   {
//     value: "least",
//     label: "Gợi ý ít nhất",
//   },
//   {
//     value: "none",
//     label: "Không được gợi ý",
//   },
// ];

// export default function DashboardSupplierSuggestion() {
//   const resource = useStats(fetchSupplierSuggestionStats);

//   const [mode, setMode] =
//     useState<SuggestionMode>("top");

//   const data = resource.data;

//   const rows = data
//     ? mode === "top"
//       ? data.top_suggested
//       : mode === "least"
//         ? data.least_suggested
//         : data.not_suggested
//     : [];

//   const chartRows = rows.slice(0, 10);

//   const title =
//     MODE_OPTIONS.find(item => item.value === mode)
//       ?.label ?? "Gợi ý nhà cung cấp";

//   const suggestedCount = data?.so_ncc_duoc_goi_y;
//   const notSuggestedCount = data?.so_ncc_khong_goi_y;

//   const hasDistribution =
//     suggestedCount != null &&
//     notSuggestedCount != null &&
//     Number.isFinite(suggestedCount) &&
//     Number.isFinite(notSuggestedCount) &&
//     suggestedCount >= 0 &&
//     notSuggestedCount >= 0 &&
//     suggestedCount + notSuggestedCount > 0;

//   return (
//     <StatsFrame
//       resource={resource}
//       note="Tần suất ưu tiên được thống kê từ lịch sử gợi ý đã lưu; không suy ra từ điểm nhà cung cấp hoặc số nguyên liệu cung ứng."
//     >
//       {data && (
//         <>

//           {!data.co_du_lieu_lich_su ? (
//             <div className="ud-empty-box" role="status">
//               <h2>Chưa có dữ liệu lịch sử gợi ý</h2>

//               <p>
//                 {data.thong_bao ||
//                   "Cần lưu lịch sử kết quả gợi ý để thống kê nhà cung cấp được ưu tiên nhiều nhất, ít nhất và chưa được ưu tiên."}
//               </p>
//             </div>
//           ) : (
//             <>
//               {data.thong_bao && (
//                 <p className="ud-empty-inline">
//                   {data.thong_bao}
//                 </p>
//               )}

//               <div className="ud-filter-card">
//                 <Choices
//                   value={mode}
//                   options={MODE_OPTIONS}
//                   onChange={value => {
//                     const option = MODE_OPTIONS.find(
//                       item => item.value === value,
//                     );

//                     if (option) {
//                       setMode(option.value);
//                     }
//                   }}
//                 />

//                 <span className="ud-empty-inline">
//                   Biểu đồ hiển thị tối đa 10 nhà cung cấp.
//                 </span>
//               </div>

//               <div className="ud-charts-grid">
//                 {mode !== "none" && (
//                   <Comparison
//                     title={title}
//                     labels={chartRows.map(
//                       item => item.ten_ncc,
//                     )}
//                     series={[
//                       {
//                         label: "Số lần được ưu tiên",
//                         values: chartRows.map(
//                           item => item.so_lan_goi_y_top1,
//                         ),
//                       },
//                     ]}
//                   />
//                 )}

//                 <section className="ud-chart-card">
//                   <div className="ud-chart-header">
//                     <div>
//                       <h3 className="ud-chart-title">
//                         Phân bổ nhà cung cấp được ưu tiên
//                       </h3>

//                       <p className="ud-chart-subtitle">
//                         Theo số nhà cung cấp, không phải
//                         tỷ trọng số lần gợi ý.
//                       </p>
//                     </div>
//                   </div>

//                   {hasDistribution ? (
//                     <div className="ud-chart-canvas-wrap">
//                       <Doughnut
//                         data={{
//                           labels: [
//                             "Được ưu tiên",
//                             "Chưa được ưu tiên",
//                           ],
//                           datasets: [
//                             {
//                               data: [
//                                 suggestedCount ?? 0,
//                                 notSuggestedCount ?? 0,
//                               ],
//                               backgroundColor: [
//                                 CHART_COLORS.secondary,
//                                 CHART_COLORS.slate,
//                               ],
//                               borderColor: "#ffffff",
//                               borderWidth: 2,
//                             },
//                           ],
//                         }}
//                         options={{
//                           responsive: true,
//                           maintainAspectRatio: false,
//                           plugins: {
//                             legend: {
//                               position: "bottom",
//                             },
//                           },
//                         }}
//                       />
//                     </div>
//                   ) : (
//                     <p className="ud-empty-inline">
//                       Chưa đủ dữ liệu để biểu diễn tỷ lệ.
//                     </p>
//                   )}
//                 </section>
//               </div>

//             </>
//           )}
//         </>
//       )}
//     </StatsFrame>
//   );
// }