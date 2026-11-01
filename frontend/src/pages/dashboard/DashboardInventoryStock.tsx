// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardInventoryStock.tsx
// // import { useEffect, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import "./chartSetup";
// // import {
// //   fetchInventoryStockStats,
// //   type InventoryStockStatsResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
// // const fmt = (val: number | null | undefined) => (val == null ? "0" : numberFormat.format(val));

// // export default function DashboardInventoryStock() {
// //   const [data, setData] = useState<InventoryStockStatsResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchInventoryStockStats()
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu tồn kho & book."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const topBooked = data?.top_booked ?? [];
// //   const bookedBarData = {
// //     labels: topBooked.slice(0, 8).map(i => i.ten_nguyen_lieu),
// //     datasets: [
// //       {
// //         label: "Lượng nguyên liệu đã book",
// //         data: topBooked.slice(0, 8).map(i => i.so_luong_book),
// //         backgroundColor: "#f59e0b",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   const topActual = data?.top_actual_stock ?? [];
// //   const stockCompareData = {
// //     labels: topActual.slice(0, 8).map(i => i.ten_nguyen_lieu),
// //     datasets: [
// //       {
// //         label: "Tồn kho thực tế",
// //         data: topActual.slice(0, 8).map(i => i.ton_kho_thuc_te),
// //         backgroundColor: "#2563eb",
// //         borderRadius: 4,
// //       },
// //       {
// //         label: "Lượng đã book",
// //         data: topActual.slice(0, 8).map(i => i.so_luong_book),
// //         backgroundColor: "#f59e0b",
// //         borderRadius: 4,
// //       },
// //       {
// //         label: "Mức tồn an toàn",
// //         data: topActual.slice(0, 8).map(i => i.ton_kho_an_toan),
// //         backgroundColor: "#10b981",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">📦 Giám sát lượng nguyên liệu đã Book & Tồn kho thực tế</span>
// //         </div>
// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang kiểm tra dữ liệu tồn kho và số lượng book...</p>
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
// //                 <span>Tổng lượng đã Book</span>
// //                 <span className="ud-kpi-badge ud-badge-warning">Đang giữ hàng</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#d97706" }}>
// //                 {fmt(data.tong_luong_book)}
// //               </p>
// //               <div className="ud-kpi-sub">Nguyên liệu được phân bổ cho kế hoạch / đơn hàng</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng tồn kho thực tế</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Thực tế</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#2563eb" }}>
// //                 {fmt(data.tong_ton_thuc_te)}
// //               </p>
// //               <div className="ud-kpi-sub">Tổng lượng nguyên liệu nằm trong kho</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Nguyên liệu cảnh báo thiếu</span>
// //                 <span className="ud-kpi-badge ud-badge-danger">Báo động</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#dc2626" }}>
// //                 {data.alerts.length} <span style={{ fontSize: 16 }}>/ {data.tong_nguyen_lieu}</span>
// //               </p>
// //               <div className="ud-kpi-sub">Khả dụng dưới mức tồn an toàn</div>
// //             </div>
// //           </div>

// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Top nguyên liệu được Book sử dụng nhiều nhất</h3>
// //                   <div className="ud-chart-subtitle">Lượng nguyên liệu đang được đặt trước phục vụ sản xuất</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={bookedBarData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { display: false },
// //                     },
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
// //                   <h3 className="ud-chart-title">Đối chiếu: Tồn thực tế vs Đã Book vs Tồn an toàn</h3>
// //                   <div className="ud-chart-subtitle">So sánh đa chiều các chỉ số tồn kho của từng nguyên liệu</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={stockCompareData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { position: "top" },
// //                     },
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
// //           </div>

// //           {/* Tables */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🟢 Top nguyên liệu tồn kho thực tế nhiều nhất</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã NL</th>
// //                       <th>Tên nguyên liệu</th>
// //                       <th style={{ textAlign: "right" }}>Tồn thực tế</th>
// //                       <th style={{ textAlign: "right" }}>Đã Book</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.top_actual_stock.slice(0, 5).map((i, idx) => (
// //                       <tr key={i.ma_nguyen_lieu}>
// //                         <td><span className={`ud-rank-pill ud-rank-${idx + 1}`}>{idx + 1}</span></td>
// //                         <td><code>{i.ma_nguyen_lieu}</code></td>
// //                         <td><strong>{i.ten_nguyen_lieu}</strong></td>
// //                         <td style={{ textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
// //                           {fmt(i.ton_kho_thuc_te)} {i.don_vi_do_luong}
// //                         </td>
// //                         <td style={{ textAlign: "right", color: "#d97706" }}>
// //                           {fmt(i.so_luong_book)} {i.don_vi_do_luong}
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🟠 Nguyên liệu tồn kho thực tế ít nhất (Cần lưu ý)</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã NL</th>
// //                       <th>Tên nguyên liệu</th>
// //                       <th style={{ textAlign: "right" }}>Tồn thực tế</th>
// //                       <th style={{ textAlign: "right" }}>An toàn</th>
// //                       <th style={{ textAlign: "center" }}>Tình trạng</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.least_actual_stock.slice(0, 5).map((i, idx) => (
// //                       <tr key={i.ma_nguyen_lieu}>
// //                         <td><span className="ud-rank-pill">{idx + 1}</span></td>
// //                         <td><code>{i.ma_nguyen_lieu}</code></td>
// //                         <td>{i.ten_nguyen_lieu}</td>
// //                         <td style={{ textAlign: "right", fontWeight: 700, color: i.ton_kho_kha_dung < i.ton_kho_an_toan ? "#dc2626" : "#334155" }}>
// //                           {fmt(i.ton_kho_thuc_te)} {i.don_vi_do_luong}
// //                         </td>
// //                         <td style={{ textAlign: "right" }}>{fmt(i.ton_kho_an_toan)}</td>
// //                         <td style={{ textAlign: "center" }}>
// //                           <span className={`ud-kpi-badge ${i.muc_do_canh_bao === "KHAN_CAP" ? "ud-badge-danger" : i.muc_do_canh_bao === "CANH_BAO" ? "ud-badge-warning" : "ud-badge-success"}`}>
// //                             {i.muc_do_canh_bao === "KHAN_CAP" ? "Khẩn cấp" : i.muc_do_canh_bao === "CANH_BAO" ? "Thiếu an toàn" : "An toàn"}
// //                           </span>
// //                         </td>
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
//   fetchInventoryStockStats,
//   type InventoryStockItem,
// } from "../../services/dashboardService";

// import {
//   Choices,
//   Comparison,
//   fmt,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";

// type StockMode =
//   | "top_booked"
//   | "least_booked"
//   | "top_actual_stock"
//   | "least_actual_stock"
//   | "alerts";

// const MODE_OPTIONS: {
//   value: StockMode;
//   label: string;
// }[] = [
//   {
//     value: "top_booked",
//     label: "Book nhiều nhất",
//   },
//   {
//     value: "least_booked",
//     label: "Book ít nhất",
//   },
//   {
//     value: "top_actual_stock",
//     label: "Tồn nhiều nhất",
//   },
//   {
//     value: "least_actual_stock",
//     label: "Tồn ít nhất",
//   },
//   {
//     value: "alerts",
//     label: "Cảnh báo tồn kho",
//   },
// ];

// const ALERT_LABELS: Record<
//   InventoryStockItem["muc_do_canh_bao"],
//   string
// > = {
//   KHAN_CAP: "Khẩn cấp",
//   CANH_BAO: "Cần bổ sung",
//   AN_TOAN: "An toàn",
// };

// const ALERT_CLASSES: Record<
//   InventoryStockItem["muc_do_canh_bao"],
//   string
// > = {
//   KHAN_CAP: "ud-badge-danger",
//   CANH_BAO: "ud-badge-warning",
//   AN_TOAN: "ud-badge-success",
// };

// export default function DashboardInventoryStock() {
//   const resource = useStats(fetchInventoryStockStats);

//   const [mode, setMode] =
//     useState<StockMode>("top_booked");

//   const [unit, setUnit] = useState("");

//   const data = resource.data;
//   const source = data?.[mode] ?? [];

//   const units = Array.from(
//     new Set(
//       source.map(item => item.don_vi_do_luong),
//     ),
//   ).sort((a, b) => a.localeCompare(b, "vi"));

//   const selectedUnit = units.includes(unit)
//     ? unit
//     : units[0] ?? "";

//   const rows = source.filter(
//     item => item.don_vi_do_luong === selectedUnit,
//   );

//   const chartRows = rows.slice(0, 10);

//   const title =
//     MODE_OPTIONS.find(item => item.value === mode)
//       ?.label ?? "Tồn kho nguyên liệu";

//   const urgentCount =
//     data?.alerts.filter(
//       item => item.muc_do_canh_bao === "KHAN_CAP",
//     ).length ?? 0;

//   return (
//     <StatsFrame
//       resource={resource}
//       note="Lượng book là lượng giữ chỗ cho nhu cầu hoặc kế hoạch, không phải lượng đã xuất kho hay tiêu hao thực tế."
//     >
//       {data && (
//         <>

//           <div className="ud-filter-card">
//             <Choices
//               value={mode}
//               options={MODE_OPTIONS}
//               onChange={value => {
//                 const option = MODE_OPTIONS.find(
//                   item => item.value === value,
//                 );

//                 if (option) {
//                   setMode(option.value);
//                 }
//               }}
//             />

//             {units.length > 0 && (
//               <label className="ud-filter-label">
//                 Đơn vị tính{" "}
//                 <select
//                   className="ud-select"
//                   value={selectedUnit}
//                   onChange={event =>
//                     setUnit(event.target.value)
//                   }
//                 >
//                   {units.map(value => (
//                     <option key={value} value={value}>
//                       {value || "Chưa xác định"}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//             )}
//           </div>

//           <p className="ud-empty-inline">
//             Xếp hạng theo danh sách API trả về.
//             Biểu đồ chỉ so sánh nguyên liệu cùng đơn vị
//             tính; hiển thị tối đa 10 nguyên liệu.
//           </p>

//           <Comparison
//             title={`${title}${
//               selectedUnit
//                 ? ` (${selectedUnit})`
//                 : ""
//             }`}
//             labels={chartRows.map(
//               item => item.ten_nguyen_lieu,
//             )}
//             series={[
//               {
//                 label: "Tồn thực tế",
//                 values: chartRows.map(
//                   item => item.ton_kho_thuc_te,
//                 ),
//               },
//               {
//                 label: "Đã book",
//                 values: chartRows.map(
//                   item => item.so_luong_book,
//                 ),
//               },
//               {
//                 label: "Khả dụng",
//                 values: chartRows.map(
//                   item => item.ton_kho_kha_dung,
//                 ),
//               },
//               {
//                 label: "Tồn an toàn",
//                 values: chartRows.map(
//                   item => item.ton_kho_an_toan,
//                 ),
//               },
//             ]}
//           />

//         </>
//       )}
//     </StatsFrame>
//   );
// }