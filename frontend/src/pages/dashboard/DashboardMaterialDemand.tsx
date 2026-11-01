// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardMaterialDemand.tsx
// // import { useEffect, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import "./chartSetup";
// // import {
// //   fetchMaterialDemandStats,
// //   type MaterialDemandStatsResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
// // const fmt = (val: number | null | undefined) => (val == null ? "0" : numberFormat.format(val));

// // export default function DashboardMaterialDemand() {
// //   const [data, setData] = useState<MaterialDemandStatsResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchMaterialDemandStats()
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu nhu cầu nguyên liệu."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const topDemand = data?.top_demand ?? [];
// //   const barData = {
// //     labels: topDemand.slice(0, 8).map(m => m.ten_nguyen_lieu),
// //     datasets: [
// //       {
// //         label: "Nhu cầu dự báo",
// //         data: topDemand.slice(0, 8).map(m => m.nhu_cau),
// //         backgroundColor: "#2563eb",
// //         borderRadius: 4,
// //       },
// //       {
// //         label: "Tồn khả dụng",
// //         data: topDemand.slice(0, 8).map(m => m.ton_kho_kha_dung),
// //         backgroundColor: "#10b981",
// //         borderRadius: 4,
// //       },
// //       {
// //         label: "Tồn an toàn",
// //         data: topDemand.slice(0, 8).map(m => m.ton_kho_an_toan),
// //         backgroundColor: "#f59e0b",
// //         borderRadius: 4,
// //       },
// //       {
// //         label: "Lượng cần mua thêm",
// //         data: topDemand.slice(0, 8).map(m => m.luong_can_mua),
// //         backgroundColor: "#ef4444",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">📈 Cân đối nhu cầu nguyên liệu: Nhu cầu dự báo - Khả dụng - An toàn - Cần mua</span>
// //         </div>
// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang tính toán cân đối nhu cầu nguyên liệu...</p>
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
// //                 <span>Tổng nhu cầu dự báo</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Dự báo</span>
// //               </div>
// //               <p className="ud-kpi-value">{fmt(data.tong_nhu_cau)}</p>
// //               <div className="ud-kpi-sub">Quy đổi từ kế hoạch sản xuất / dự báo</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng lượng CẦN MUA THÊM</span>
// //                 <span className="ud-kpi-badge ud-badge-danger">Đề xuất</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#dc2626" }}>
// //                 {fmt(data.tong_can_mua)}
// //               </p>
// //               <div className="ud-kpi-sub">Khối lượng cần kích hoạt mua hàng</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Nhu cầu lớn nhất</span>
// //                 <span className="ud-kpi-badge ud-badge-success">Top 1</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "18px", color: "#166534" }}>
// //                 {topDemand[0]?.ten_nguyen_lieu || "Chưa có"}
// //               </p>
// //               <div className="ud-kpi-sub">
// //                 {topDemand[0] ? `${fmt(topDemand[0].nhu_cau)} ${topDemand[0].don_vi_do_luong}` : "0"}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="ud-chart-card">
// //             <div className="ud-chart-header">
// //               <div>
// //                 <h3 className="ud-chart-title">Biểu đồ cân đối đa thông số nhu cầu nguyên liệu</h3>
// //                 <div className="ud-chart-subtitle">So sánh trực quan: Nhu cầu - Tồn khả dụng - Tồn an toàn - Lượng cần mua thêm</div>
// //               </div>
// //             </div>
// //             <div className="ud-chart-canvas-wrap">
// //               <Bar
// //                 data={barData}
// //                 options={{
// //                   responsive: true,
// //                   maintainAspectRatio: false,
// //                   plugins: {
// //                     legend: { position: "top" },
// //                   },
// //                   scales: {
// //                     y: {
// //                       beginAtZero: true,
// //                       ticks: { callback: val => fmt(val as number) },
// //                     },
// //                   },
// //                 }}
// //               />
// //             </div>
// //           </div>

// //           {/* Table */}
// //           <div className="ud-chart-card">
// //             <div className="ud-chart-header">
// //               <h3 className="ud-chart-title">Bảng thông số chi tiết nhu cầu nguyên liệu</h3>
// //             </div>
// //             <div className="ud-table-wrap">
// //               <table className="ud-table">
// //                 <thead>
// //                   <tr>
// //                     <th>Mã NL</th>
// //                     <th>Tên nguyên liệu</th>
// //                     <th>ĐVT</th>
// //                     <th style={{ textAlign: "right" }}>Nhu cầu</th>
// //                     <th style={{ textAlign: "right" }}>Khả dụng</th>
// //                     <th style={{ textAlign: "right" }}>An toàn</th>
// //                     <th style={{ textAlign: "right" }}>Cần mua thêm</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {data.all_demand.slice(0, 10).map(m => (
// //                     <tr key={m.ma_nguyen_lieu}>
// //                       <td><code>{m.ma_nguyen_lieu}</code></td>
// //                       <td><strong>{m.ten_nguyen_lieu}</strong></td>
// //                       <td>{m.don_vi_do_luong}</td>
// //                       <td style={{ textAlign: "right", color: "#2563eb", fontWeight: 700 }}>{fmt(m.nhu_cau)}</td>
// //                       <td style={{ textAlign: "right", color: "#166534" }}>{fmt(m.ton_kho_kha_dung)}</td>
// //                       <td style={{ textAlign: "right", color: "#d97706" }}>{fmt(m.ton_kho_an_toan)}</td>
// //                       <td style={{ textAlign: "right", color: m.luong_can_mua > 0 ? "#dc2626" : "#475569", fontWeight: 700 }}>
// //                         {m.luong_can_mua > 0 ? `+${fmt(m.luong_can_mua)}` : "0"}
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

// import {
//   fetchMaterialDemandStats,
// } from "../../services/dashboardService";

// import {
//   Choices,
//   Comparison,
//   fmt,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";

// type Ranking = "most" | "least";
// type ChartType = "bar" | "line";

// export default function DashboardMaterialDemand() {
//   const resource = useStats(fetchMaterialDemandStats);

//   const [unit, setUnit] = useState("");
//   const [ranking, setRanking] = useState<Ranking>("most");
//   const [chartType, setChartType] =
//     useState<ChartType>("bar");

//   const data = resource.data;
//   const allDemand = data?.all_demand ?? [];

//   const units = Array.from(
//     new Set(
//       allDemand.map(item => item.don_vi_do_luong),
//     ),
//   ).sort((a, b) => a.localeCompare(b, "vi"));

//   const selectedUnit = units.includes(unit)
//     ? unit
//     : units[0] ?? "";

//   const rows = allDemand
//     .filter(
//       item => item.don_vi_do_luong === selectedUnit,
//     )
//     .sort((a, b) => {
//       const difference =
//         ranking === "most"
//           ? b.nhu_cau - a.nhu_cau
//           : a.nhu_cau - b.nhu_cau;

//       return (
//         difference ||
//         a.ten_nguyen_lieu.localeCompare(
//           b.ten_nguyen_lieu,
//           "vi",
//         )
//       );
//     });

//   const chartRows = rows.slice(0, 10);

//   const totalDemand = rows.reduce(
//     (sum, item) => sum + item.nhu_cau,
//     0,
//   );

//   const totalPurchase = rows.reduce(
//     (sum, item) => sum + item.luong_can_mua,
//     0,
//   );

//   const purchaseCount = rows.filter(
//     item => item.luong_can_mua > 0,
//   ).length;

//   return (
//     <StatsFrame
//       resource={resource}
//       note="Cân đối nhu cầu nguyên liệu theo kết quả dự báo do API cung cấp. Các tổng lượng chỉ cộng trong cùng đơn vị tính."
//     >
//       {data && (
//         <>
//           {!data.co_du_lieu_du_bao ? (
//             <div className="ud-empty-box" role="status">
//               <h2>Chưa có dữ liệu nhu cầu dự báo</h2>

//               <p>
//                 {data.thong_bao ||
//                   "Chưa có kết quả dự báo nguyên liệu phù hợp để thống kê."}
//               </p>
//             </div>
//           ) : (
//             <>
//               {data.thong_bao && (
//                 <p className="ud-empty-inline">
//                   {data.thong_bao}
//                 </p>
//               )}

//               {data.ma_lich_su_du_bao && (
//                 <p className="ud-empty-inline">
//                   Lần dự báo: {data.ma_lich_su_du_bao}
//                 </p>
//               )}

//               <div className="ud-filter-card">
//                 <div className="ud-filter-group">
//                   {units.length > 0 && (
//                     <label className="ud-filter-label">
//                       Đơn vị tính{" "}
//                       <select
//                         className="ud-select"
//                         value={selectedUnit}
//                         onChange={event =>
//                           setUnit(event.target.value)
//                         }
//                       >
//                         {units.map(value => (
//                           <option
//                             key={value}
//                             value={value}
//                           >
//                             {value || "Chưa xác định"}
//                           </option>
//                         ))}
//                       </select>
//                     </label>
//                   )}

//                   <Choices
//                     value={ranking}
//                     options={[
//                       {
//                         value: "most",
//                         label: "Nhu cầu nhiều nhất",
//                       },
//                       {
//                         value: "least",
//                         label: "Nhu cầu ít nhất",
//                       },
//                     ]}
//                     onChange={value =>
//                       setRanking(
//                         value === "least"
//                           ? "least"
//                           : "most",
//                       )
//                     }
//                   />
//                 </div>

//                 <Choices
//                   value={chartType}
//                   options={[
//                     {
//                       value: "bar",
//                       label: "Biểu đồ cột",
//                     },
//                     {
//                       value: "line",
//                       label: "Biểu đồ đường",
//                     },
//                   ]}
//                   onChange={value =>
//                     setChartType(
//                       value === "line" ? "line" : "bar",
//                     )
//                   }
//                 />
//               </div>


//               <Comparison
//                 title="Cân đối nhu cầu nguyên liệu"
//                 line={chartType === "line"}
//                 labels={chartRows.map(
//                   item => item.ten_nguyen_lieu,
//                 )}
//                 series={[
//                   {
//                     label: "Nhu cầu dự báo",
//                     values: chartRows.map(
//                       item => item.nhu_cau,
//                     ),
//                   },
//                   {
//                     label: "Tồn khả dụng",
//                     values: chartRows.map(
//                       item => item.ton_kho_kha_dung,
//                     ),
//                   },
//                   {
//                     label: "Tồn an toàn",
//                     values: chartRows.map(
//                       item => item.ton_kho_an_toan,
//                     ),
//                   },
//                   {
//                     label: "Cần mua",
//                     values: chartRows.map(
//                       item => item.luong_can_mua,
//                     ),
//                   },
//                 ]}
//               />

//               <p className="ud-empty-inline">
//                 Biểu đồ hiển thị tối đa 10 nguyên liệu.
//                 Biểu đồ đường so sánh giữa các nguyên
//                 liệu, không biểu diễn diễn biến theo thời gian.
//               </p>

//             </>
//           )}
//         </>
//       )}
//     </StatsFrame>
//   );
// }