// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardSupplierScore.tsx
// // import { useEffect, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import "./chartSetup";
// // import { CHART_COLORS } from "./chartSetup";
// // import {
// //   fetchSupplierScores,
// //   type SupplierPerformanceItem,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
// // const fmt = (val: number | null | undefined) => (val == null ? "—" : numberFormat.format(val));

// // export default function DashboardSupplierScore() {
// //   const [suppliers, setSuppliers] = useState<SupplierPerformanceItem[]>([]);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchSupplierScores()
// //       .then(res => setSuppliers(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu nhà cung cấp."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const totalSuppliers = suppliers.length;
// //   const scoredSuppliers = suppliers.filter(s => s.diem_ncc != null);
// //   const avgScore =
// //     scoredSuppliers.length > 0
// //       ? scoredSuppliers.reduce((acc, s) => acc + Number(s.diem_ncc), 0) / scoredSuppliers.length
// //       : 0;

// //   const excellentCount = suppliers.filter(s => s.xep_loai === "XUAT_SAC").length;

// //   // Biểu đồ cột: Thang điểm NCC
// //   const scoreBarData = {
// //     labels: suppliers.map(s => s.ten_ncc),
// //     datasets: [
// //       {
// //         label: "Điểm điều kiện thương mại (Thang 100)",
// //         data: suppliers.map(s => (s.diem_ncc != null ? Number(s.diem_ncc) : 0)),
// //         backgroundColor: suppliers.map(s => {
// //           const score = Number(s.diem_ncc || 0);
// //           if (score >= 80) return "#10b981";
// //           if (score >= 65) return "#2563eb";
// //           if (score >= 50) return "#f59e0b";
// //           return "#ef4444";
// //         }),
// //         borderRadius: 6,
// //       },
// //     ],
// //   };

// //   // Biểu đồ nhóm: Giao đúng hạn vs Giao đủ
// //   const deliveryBarData = {
// //     labels: suppliers.map(s => s.ten_ncc),
// //     datasets: [
// //       {
// //         label: "Tỷ lệ giao đúng hạn (%)",
// //         data: suppliers.map(s => (s.ty_le_giao_dung_han_thuc_te != null ? Number(s.ty_le_giao_dung_han_thuc_te) : 0)),
// //         backgroundColor: "#2563eb",
// //         borderRadius: 4,
// //       },
// //       {
// //         label: "Tỷ lệ giao đủ hàng (%)",
// //         data: suppliers.map(s => (s.ty_le_giao_du_thuc_te != null ? Number(s.ty_le_giao_du_thuc_te) : 0)),
// //         backgroundColor: "#10b981",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       {/* Header bar */}
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">🏢 Thống kê nhà cung cấp & Đánh giá năng lực đối tác</span>
// //         </div>
// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang tải bảng điểm và hiệu suất nhà cung cấp...</p>
// //         </div>
// //       )}

// //       {error && !loading && (
// //         <div className="ud-empty-box" style={{ color: "#ef4444" }}>
// //           <p>⚠️ {error}</p>
// //           <button className="ud-btn" onClick={loadData}>
// //             Thử lại
// //           </button>
// //         </div>
// //       )}

// //       {!loading && !error && (
// //         <>
// //           {/* KPI */}
// //           <div className="ud-kpi-grid">
// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng số nhà cung cấp</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Đối tác</span>
// //               </div>
// //               <p className="ud-kpi-value">{totalSuppliers}</p>
// //               <div className="ud-kpi-sub">Đang duy trì quan hệ hợp tác</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Điểm trung bình hệ thống</span>
// //                 <span className="ud-kpi-badge ud-badge-success">Thang 100</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#2563eb" }}>
// //                 {fmt(avgScore)} <span style={{ fontSize: 16 }}>/ 100</span>
// //               </p>
// //               <div className="ud-kpi-sub">Dựa trên điều kiện thương mại & hiệu suất</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Nhà cung cấp Xuất sắc</span>
// //                 <span className="ud-kpi-badge ud-badge-success">≥ 80 điểm</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#166534" }}>
// //                 {excellentCount}
// //               </p>
// //               <div className="ud-kpi-sub">Ưu tiên phân bổ đơn mua nguyên liệu</div>
// //             </div>
// //           </div>

// //           {/* Charts */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Thang điểm đánh giá nhà cung cấp</h3>
// //                   <div className="ud-chart-subtitle">Xanh lá: Xuất sắc (≥80) | Xanh dương: Tốt (≥65) | Vàng/Đỏ: Cần cải thiện</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={scoreBarData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { display: false },
// //                       tooltip: {
// //                         callbacks: {
// //                           label: ctx => ` Điểm: ${fmt(ctx.raw as number)} / 100`,
// //                         },
// //                       },
// //                     },
// //                     scales: {
// //                       y: {
// //                         beginAtZero: true,
// //                         max: 100,
// //                         ticks: { stepSize: 20 },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Hiệu suất giao hàng thực tế (%)</h3>
// //                   <div className="ud-chart-subtitle">So sánh tỷ lệ giao đúng hạn và tỷ lệ giao đủ hàng</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={deliveryBarData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { position: "top" },
// //                       tooltip: {
// //                         callbacks: {
// //                           label: ctx => ` ${ctx.dataset.label}: ${fmt(ctx.raw as number)}%`,
// //                         },
// //                       },
// //                     },
// //                     scales: {
// //                       y: {
// //                         beginAtZero: true,
// //                         max: 100,
// //                         ticks: { callback: val => `${val}%` },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Bảng nhà cung cấp */}
// //           <div className="ud-chart-card">
// //             <div className="ud-chart-header">
// //               <div>
// //                 <h3 className="ud-chart-title">Bảng xếp hạng và thang điểm chi tiết NCC</h3>
// //                 <div className="ud-chart-subtitle">Thông tin chi tiết điểm và tỷ lệ giao hàng thực tế</div>
// //               </div>
// //             </div>
// //             <div className="ud-table-wrap">
// //               <table className="ud-table">
// //                 <thead>
// //                   <tr>
// //                     <th style={{ width: 45 }}>#</th>
// //                     <th>Mã NCC</th>
// //                     <th>Tên nhà cung cấp</th>
// //                     <th style={{ textAlign: "right" }}>Điểm NCC</th>
// //                     <th style={{ textAlign: "right" }}>Giao đúng hạn</th>
// //                     <th style={{ textAlign: "right" }}>Giao đủ</th>
// //                     <th style={{ textAlign: "center" }}>Phân loại</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {suppliers.map((s, idx) => (
// //                     <tr key={s.ma_ncc}>
// //                       <td><span className={`ud-rank-pill ud-rank-${idx + 1}`}>{idx + 1}</span></td>
// //                       <td><code>{s.ma_ncc}</code></td>
// //                       <td><strong>{s.ten_ncc}</strong></td>
// //                       <td style={{ textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
// //                         {s.diem_ncc != null ? fmt(Number(s.diem_ncc)) : "—"}
// //                       </td>
// //                       <td style={{ textAlign: "right" }}>
// //                         {s.ty_le_giao_dung_han_thuc_te != null ? `${fmt(Number(s.ty_le_giao_dung_han_thuc_te))}%` : "—"}
// //                       </td>
// //                       <td style={{ textAlign: "right" }}>
// //                         {s.ty_le_giao_du_thuc_te != null ? `${fmt(Number(s.ty_le_giao_du_thuc_te))}%` : "—"}
// //                       </td>
// //                       <td style={{ textAlign: "center" }}>
// //                         <span
// //                           className={`ud-kpi-badge ${
// //                             s.xep_loai === "XUAT_SAC"
// //                               ? "ud-badge-success"
// //                               : s.xep_loai === "TOT"
// //                               ? "ud-badge-info"
// //                               : s.xep_loai === "TRUNG_BINH"
// //                               ? "ud-badge-warning"
// //                               : "ud-badge-danger"
// //                           }`}
// //                         >
// //                           {s.xep_loai === "XUAT_SAC"
// //                             ? "Xuất sắc"
// //                             : s.xep_loai === "TOT"
// //                             ? "Tốt"
// //                             : s.xep_loai === "TRUNG_BINH"
// //                             ? "Trung bình"
// //                             : "Yếu"}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }


// import { useState } from "react";
// import { Bar } from "react-chartjs-2";

// import {
//   fetchSupplierScores,
//   type SupplierPerformanceItem,
// } from "../../services/dashboardService";

// import { CHART_COLORS } from "./chartSetup";

// import {
//   Choices,
//   Comparison,
//   fmt,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";

// type Ranking = "highest" | "lowest";

// const RATING_LABELS: Record<
//   SupplierPerformanceItem["xep_loai"],
//   string
// > = {
//   XUAT_SAC: "Xuất sắc",
//   TOT: "Tốt",
//   TRUNG_BINH: "Trung bình",
//   YEU: "Yếu",
// };

// const RATING_CLASSES: Record<
//   SupplierPerformanceItem["xep_loai"],
//   string
// > = {
//   XUAT_SAC: "ud-badge-success",
//   TOT: "ud-badge-info",
//   TRUNG_BINH: "ud-badge-warning",
//   YEU: "ud-badge-danger",
// };

// function toNumber(
//   value: string | null | undefined,
// ): number | null {
//   if (value == null || value.trim() === "") {
//     return null;
//   }

//   const result = Number(value);

//   return Number.isFinite(result) ? result : null;
// }

// function percentage(
//   value: string | null | undefined,
// ): string {
//   const result = toNumber(value);

//   return result == null ? "—" : `${fmt(result)}%`;
// }

// export default function DashboardSupplierScore() {
//   const resource = useStats(fetchSupplierScores);

//   const [ranking, setRanking] =
//     useState<Ranking>("highest");

//   const suppliers = resource.data ?? [];

//   const scored = suppliers.flatMap(item => {
//     const score = toNumber(item.diem_ncc);

//     return score == null ? [] : [{ item, score }];
//   });

//   const averageScore =
//     scored.length > 0
//       ? scored.reduce(
//           (sum, entry) => sum + entry.score,
//           0,
//         ) / scored.length
//       : null;

//   const ranked = [...suppliers].sort((a, b) => {
//     const scoreA = toNumber(a.diem_ncc);
//     const scoreB = toNumber(b.diem_ncc);

//     // Đưa nhà cung cấp chưa có điểm xuống cuối.
//     if (scoreA == null && scoreB != null) return 1;
//     if (scoreA != null && scoreB == null) return -1;

//     if (scoreA != null && scoreB != null) {
//       const difference =
//         ranking === "highest"
//           ? scoreB - scoreA
//           : scoreA - scoreB;

//       if (difference !== 0) return difference;
//     }

//     return (
//       a.ten_ncc.localeCompare(b.ten_ncc, "vi") ||
//       a.ma_ncc.localeCompare(b.ma_ncc)
//     );
//   });

//   const scoreChartRows = ranked.flatMap(item => {
//     const score = toNumber(item.diem_ncc);

//     return score == null ? [] : [{ item, score }];
//   }).slice(0, 10);

//   const deliveryRows = ranked
//     .filter(
//       item =>
//         toNumber(item.ty_le_giao_dung_han_thuc_te) !=
//           null ||
//         toNumber(item.ty_le_giao_du_thuc_te) != null,
//     )
//     .slice(0, 10);

//   return (
//     <StatsFrame
//       resource={resource}
//       note="Điểm thương mại và hiệu suất giao hàng được lấy từ API. Chỉ tính điểm trung bình trên nhà cung cấp đã có điểm."
//     >
//       {resource.data && (
//         <>

//           <div className="ud-filter-card">
//             <Choices
//               value={ranking}
//               options={[
//                 {
//                   value: "highest",
//                   label: "Điểm cao nhất",
//                 },
//                 {
//                   value: "lowest",
//                   label: "Điểm thấp nhất",
//                 },
//               ]}
//               onChange={value =>
//                 setRanking(
//                   value === "lowest"
//                     ? "lowest"
//                     : "highest",
//                 )
//               }
//             />

//             <span className="ud-empty-inline">
//               Biểu đồ hiển thị tối đa 10 nhà cung cấp.
//             </span>
//           </div>

//           <div className="ud-charts-grid">
//             <Comparison
//               title="Điểm đánh giá nhà cung cấp"
//               labels={scoreChartRows.map(
//                 entry => entry.item.ten_ncc,
//               )}
//               series={[
//                 {
//                   label: "Điểm nhà cung cấp",
//                   values: scoreChartRows.map(
//                     entry => entry.score,
//                   ),
//                 },
//               ]}
//             />

//             <section className="ud-chart-card">
//               <div className="ud-chart-header">
//                 <div>
//                   <h3 className="ud-chart-title">
//                     Hiệu suất giao hàng thực tế
//                   </h3>

//                   <p className="ud-chart-subtitle">
//                     Chỉ số chưa có dữ liệu được để trống,
//                     không quy đổi thành 0%.
//                   </p>
//                 </div>
//               </div>

//               {deliveryRows.length > 0 ? (
//                 <div className="ud-chart-canvas-wrap">
//                   <Bar
//                     data={{
//                       labels: deliveryRows.map(
//                         item => item.ten_ncc,
//                       ),
//                       datasets: [
//                         {
//                           label: "Giao đúng hạn (%)",
//                           data: deliveryRows.map(item =>
//                             toNumber(
//                               item.ty_le_giao_dung_han_thuc_te,
//                             ),
//                           ),
//                           backgroundColor:
//                             CHART_COLORS.primary,
//                           borderRadius: 4,
//                         },
//                         {
//                           label: "Giao đủ (%)",
//                           data: deliveryRows.map(item =>
//                             toNumber(
//                               item.ty_le_giao_du_thuc_te,
//                             ),
//                           ),
//                           backgroundColor:
//                             CHART_COLORS.secondary,
//                           borderRadius: 4,
//                         },
//                       ],
//                     }}
//                     options={{
//                       responsive: true,
//                       maintainAspectRatio: false,
//                       plugins: {
//                         legend: {
//                           position: "bottom",
//                         },
//                       },
//                       scales: {
//                         y: {
//                           beginAtZero: true,
//                           suggestedMax: 100,
//                           ticks: {
//                             callback: value =>
//                               `${fmt(value)}%`,
//                           },
//                         },
//                       },
//                     }}
//                   />
//                 </div>
//               ) : (
//                 <p className="ud-empty-inline">
//                   Chưa có dữ liệu hiệu suất giao hàng.
//                 </p>
//               )}
//             </section>
//           </div>

//         </>
//       )}
//     </StatsFrame>
//   );
// }