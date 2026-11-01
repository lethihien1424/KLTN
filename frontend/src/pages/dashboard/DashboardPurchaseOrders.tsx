// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardPurchaseOrders.tsx
// // import { useEffect, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import "./chartSetup";
// // import {
// //   fetchPurchaseOrderStats,
// //   type PurchaseOrderStatsResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
// // const moneyFormat = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
// // const fmt = (val: number | null | undefined) => (val == null ? "0" : numberFormat.format(val));
// // const fmtMoney = (val: number | null | undefined) => (val == null ? "0 ₫" : moneyFormat.format(val));

// // export default function DashboardPurchaseOrders() {
// //   const [data, setData] = useState<PurchaseOrderStatsResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchPurchaseOrderStats()
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu đơn mua nguyên liệu."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const topPurchased = data?.top_purchased ?? [];
// //   const barQtyData = {
// //     labels: topPurchased.map(m => m.ten_nguyen_lieu),
// //     datasets: [
// //       {
// //         label: "Khối lượng đặt mua",
// //         data: topPurchased.map(m => m.so_luong_mua),
// //         backgroundColor: "#2563eb",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   const barMoneyData = {
// //     labels: topPurchased.map(m => m.ten_nguyen_lieu),
// //     datasets: [
// //       {
// //         label: "Tổng giá trị mua (VNĐ)",
// //         data: topPurchased.map(m => m.tong_gia_tri),
// //         backgroundColor: "#10b981",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">🛒 Thống kê đơn mua nguyên liệu: Nguyên liệu đặt mua nhiều nhất & ít nhất</span>
// //         </div>
// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang phân tích dữ liệu các đơn mua nguyên liệu...</p>
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
// //                 <span>Tổng giá trị đơn mua</span>
// //                 <span className="ud-kpi-badge ud-badge-success">Đã đặt</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#166534" }}>
// //                 {fmtMoney(data.tong_gia_tri_mua)}
// //               </p>
// //               <div className="ud-kpi-sub">Qua {data.tong_so_don_mua} đơn mua phát sinh</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Nguyên liệu mua NHIỀU NHẤT</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Top 1</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "18px", color: "#2563eb" }}>
// //                 {topPurchased[0]?.ten_nguyen_lieu || "Chưa có"}
// //               </p>
// //               <div className="ud-kpi-sub">
// //                 {topPurchased[0]
// //                   ? `${fmt(topPurchased[0].so_luong_mua)} ${topPurchased[0].don_vi_do_luong} (${fmtMoney(topPurchased[0].tong_gia_tri)})`
// //                   : "0"}
// //               </div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Nguyên liệu mua ÍT NHẤT</span>
// //                 <span className="ud-kpi-badge ud-badge-warning">Ít nhất</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "18px", color: "#92400e" }}>
// //                 {data.least_purchased[0]?.ten_nguyen_lieu || "Chưa có"}
// //               </p>
// //               <div className="ud-kpi-sub">
// //                 {data.least_purchased[0]
// //                   ? `${fmt(data.least_purchased[0].so_luong_mua)} ${data.least_purchased[0].don_vi_do_luong} (${fmtMoney(data.least_purchased[0].tong_gia_tri)})`
// //                   : "0"}
// //               </div>
// //             </div>
// //           </div>

// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Khối lượng đặt mua theo nguyên liệu</h3>
// //                   <div className="ud-chart-subtitle">So sánh sản lượng mua hàng giữa các nguyên liệu</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={barQtyData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: { legend: { display: false } },
// //                     scales: {
// //                       y: {
// //                         beginAtZero: true,
// //                         ticks: { callback: val => fmt(val as number) },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Chi phí mua hàng theo nguyên liệu (VNĐ)</h3>
// //                   <div className="ud-chart-subtitle">Tổng số tiền đã chi trả hoặc phê duyệt cho từng mặt hàng</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={barMoneyData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: { legend: { display: false } },
// //                     scales: {
// //                       y: {
// //                         beginAtZero: true,
// //                         ticks: { callback: val => fmtMoney(val as number) },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Tables */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🟢 Top nguyên liệu đặt mua nhiều nhất</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã NL</th>
// //                       <th>Tên nguyên liệu</th>
// //                       <th style={{ textAlign: "right" }}>Số lượng</th>
// //                       <th style={{ textAlign: "right" }}>Tổng tiền</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.top_purchased.slice(0, 5).map((m, idx) => (
// //                       <tr key={m.ma_nguyen_lieu}>
// //                         <td><span className={`ud-rank-pill ud-rank-${idx + 1}`}>{idx + 1}</span></td>
// //                         <td><code>{m.ma_nguyen_lieu}</code></td>
// //                         <td><strong>{m.ten_nguyen_lieu}</strong></td>
// //                         <td style={{ textAlign: "right" }}>{fmt(m.so_luong_mua)} {m.don_vi_do_luong}</td>
// //                         <td style={{ textAlign: "right", color: "#166534", fontWeight: 700 }}>{fmtMoney(m.tong_gia_tri)}</td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🟠 Nguyên liệu đặt mua ít nhất</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã NL</th>
// //                       <th>Tên nguyên liệu</th>
// //                       <th style={{ textAlign: "right" }}>Số lượng</th>
// //                       <th style={{ textAlign: "right" }}>Tổng tiền</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.least_purchased.slice(0, 5).map((m, idx) => (
// //                       <tr key={m.ma_nguyen_lieu}>
// //                         <td><span className="ud-rank-pill">{idx + 1}</span></td>
// //                         <td><code>{m.ma_nguyen_lieu}</code></td>
// //                         <td>{m.ten_nguyen_lieu}</td>
// //                         <td style={{ textAlign: "right" }}>{fmt(m.so_luong_mua)} {m.don_vi_do_luong}</td>
// //                         <td style={{ textAlign: "right", color: "#64748b" }}>{fmtMoney(m.tong_gia_tri)}</td>
// //                       </tr>
// //                     ))}
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

// import {
//   fetchPurchaseOrderStats,
// } from "../../services/dashboardService";

// import {
//   Choices,
//   Comparison,
//   fmt,
//   money,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";

// type Ranking = "most" | "least";
// type Metric = "quantity" | "value";

// export default function DashboardPurchaseOrders() {
//   const resource = useStats(fetchPurchaseOrderStats);

//   const [unit, setUnit] = useState("");
//   const [ranking, setRanking] = useState<Ranking>("most");
//   const [metric, setMetric] =
//     useState<Metric>("quantity");

//   const data = resource.data;
//   const allPurchased = data?.all_purchased ?? [];

//   const units = Array.from(
//     new Set(
//       allPurchased.map(item => item.don_vi_do_luong),
//     ),
//   ).sort((a, b) => a.localeCompare(b, "vi"));

//   const selectedUnit = units.includes(unit)
//     ? unit
//     : units[0] ?? "";

//   const rows = allPurchased
//     .filter(
//       item => item.don_vi_do_luong === selectedUnit,
//     )
//     .sort((a, b) => {
//       const valueA =
//         metric === "quantity"
//           ? a.so_luong_mua
//           : a.tong_gia_tri;

//       const valueB =
//         metric === "quantity"
//           ? b.so_luong_mua
//           : b.tong_gia_tri;

//       const difference =
//         ranking === "most"
//           ? valueB - valueA
//           : valueA - valueB;

//       return (
//         difference ||
//         a.ten_nguyen_lieu.localeCompare(
//           b.ten_nguyen_lieu,
//           "vi",
//         )
//       );
//     });

//   const chartRows = rows.slice(0, 10);

//   const selectedQuantity = rows.reduce(
//     (sum, item) => sum + item.so_luong_mua,
//     0,
//   );

//   return (
//     <StatsFrame
//       resource={resource}
//       note="Thống kê lượng đặt mua và giá trị đơn mua theo phạm vi API trả về. Giá trị đặt mua không đồng nghĩa với số tiền đã thanh toán."
//     >
//       {data && (
//         <>

//           <div className="ud-filter-card">
//             <div className="ud-filter-group">
//               {units.length > 0 && (
//                 <label className="ud-filter-label">
//                   Đơn vị tính{" "}
//                   <select
//                     className="ud-select"
//                     value={selectedUnit}
//                     onChange={event =>
//                       setUnit(event.target.value)
//                     }
//                   >
//                     {units.map(value => (
//                       <option key={value} value={value}>
//                         {value || "Chưa xác định"}
//                       </option>
//                     ))}
//                   </select>
//                 </label>
//               )}

//               <Choices
//                 value={metric}
//                 options={[
//                   {
//                     value: "quantity",
//                     label: "Theo lượng mua",
//                   },
//                   {
//                     value: "value",
//                     label: "Theo giá trị",
//                   },
//                 ]}
//                 onChange={value =>
//                   setMetric(
//                     value === "value"
//                       ? "value"
//                       : "quantity",
//                   )
//                 }
//               />
//             </div>

//             <Choices
//               value={ranking}
//               options={[
//                 {
//                   value: "most",
//                   label: "Nhiều nhất",
//                 },
//                 {
//                   value: "least",
//                   label: "Ít nhất",
//                 },
//               ]}
//               onChange={value =>
//                 setRanking(
//                   value === "least" ? "least" : "most",
//                 )
//               }
//             />
//           </div>

//           <Comparison
//             title={
//               metric === "quantity"
//                 ? "Lượng đặt mua theo nguyên liệu"
//                 : "Giá trị đặt mua theo nguyên liệu"
//             }
//             labels={chartRows.map(
//               item => item.ten_nguyen_lieu,
//             )}
//             series={[
//               {
//                 label:
//                   metric === "quantity"
//                     ? `Lượng mua (${selectedUnit})`
//                     : "Giá trị mua (VNĐ)",
//                 values: chartRows.map(item =>
//                   metric === "quantity"
//                     ? item.so_luong_mua
//                     : item.tong_gia_tri,
//                 ),
//               },
//             ]}
//           />

//           <p className="ud-empty-inline">
//             Biểu đồ hiển thị tối đa 10 nguyên liệu.
//             Số đơn của từng nguyên liệu có thể trùng
//             nhau vì một đơn mua có nhiều nguyên liệu.
//           </p>

//         </>
//       )}
//     </StatsFrame>
//   );
// }