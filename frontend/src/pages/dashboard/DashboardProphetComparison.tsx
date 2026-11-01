// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardProphetComparison.tsx
// // import { useEffect, useState } from "react";
// // import { Line, Bar } from "react-chartjs-2";
// // import "./chartSetup";
// // import { CHART_COLORS } from "./chartSetup";
// // import {
// //   fetchProphetComparison,
// //   type ProphetComparisonResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const numberFormat = new Intl.NumberFormat("vi-VN");
// // const fmt = (val: number | null | undefined) => (val == null ? "0" : numberFormat.format(val));

// // export default function DashboardProphetComparison() {
// //   const today = new Date();
// //   const past60Days = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

// //   const [fromDate, setFromDate] = useState<string>(past60Days.toISOString().slice(0, 10));
// //   const [toDate, setToDate] = useState<string>(today.toISOString().slice(0, 10));
// //   const [selectedProduct, setSelectedProduct] = useState<string>("");

// //   const [data, setData] = useState<ProphetComparisonResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchProphetComparison({
// //       from_date: fromDate,
// //       to_date: toDate,
// //       ma_san_pham: selectedProduct || undefined,
// //     })
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu so sánh Prophet."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, [fromDate, toDate, selectedProduct]);

// //   const periods = data?.periods ?? [];

// //   // Biểu đồ đường so sánh: Thực tế vs Prophet
// //   const lineChartData = {
// //     labels: periods.map(p => p.nhan_thoi_gian),
// //     datasets: [
// //       {
// //         label: "Thực tế đơn hàng (Actual)",
// //         data: periods.map(p => p.thuc_te),
// //         borderColor: CHART_COLORS.primary,
// //         backgroundColor: CHART_COLORS.primaryLight,
// //         tension: 0.3,
// //         borderWidth: 3,
// //         pointRadius: 5,
// //         fill: true,
// //       },
// //       {
// //         label: "Dự báo Prophet (Forecast)",
// //         data: periods.map(p => p.du_bao_prophet),
// //         borderColor: CHART_COLORS.purple,
// //         backgroundColor: "transparent",
// //         borderDash: [6, 6],
// //         tension: 0.3,
// //         borderWidth: 3,
// //         pointRadius: 5,
// //       },
// //     ],
// //   };

// //   // Biểu đồ cột thể hiện mức chênh lệch (Delta)
// //   const diffBarData = {
// //     labels: periods.map(p => p.nhan_thoi_gian),
// //     datasets: [
// //       {
// //         label: "Chênh lệch (Thực tế - Dự báo)",
// //         data: periods.map(p => p.chenh_lech),
// //         backgroundColor: periods.map(p => (p.chenh_lech >= 0 ? "#10b981" : "#ef4444")),
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       {/* Bộ lọc ngày & sản phẩm */}
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">Khoảng ngày so sánh:</span>
// //           <span style={{ fontSize: 13, color: "#64748b" }}>Từ</span>
// //           <input
// //             type="date"
// //             className="ud-input"
// //             value={fromDate}
// //             onChange={e => setFromDate(e.target.value)}
// //           />
// //           <span style={{ fontSize: 13, color: "#64748b" }}>Đến</span>
// //           <input
// //             type="date"
// //             className="ud-input"
// //             value={toDate}
// //             onChange={e => setToDate(e.target.value)}
// //           />

// //           <span className="ud-filter-label" style={{ marginLeft: 8 }}>Sản phẩm:</span>
// //           <select
// //             className="ud-select"
// //             value={selectedProduct}
// //             onChange={e => setSelectedProduct(e.target.value)}
// //           >
// //             <option value="">-- Tất cả sản phẩm --</option>
// //             {data?.products.map(p => (
// //               <option key={p.ma_san_pham} value={p.ma_san_pham}>
// //                 {p.ten_san_pham} ({p.ma_san_pham})
// //               </option>
// //             ))}
// //           </select>
// //         </div>

// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Đối soát dữ liệu
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang đối soát giữa đơn hàng thực tế và mô hình Prophet...</p>
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

// //       {data && !loading && (
// //         <>
// //           {/* Thẻ KPI */}
// //           <div className="ud-kpi-grid">
// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng đơn hàng thực tế</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Actual</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#2563eb" }}>
// //                 {fmt(data.summary.tong_thuc_te)}
// //               </p>
// //               <div className="ud-kpi-sub">Số lượng sản phẩm tiêu thụ thực tế</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Mô hình Prophet dự báo</span>
// //                 <span className="ud-kpi-badge ud-badge-info">Forecast</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ color: "#8b5cf6" }}>
// //                 {fmt(data.summary.tong_prophet)}
// //               </p>
// //               <div className="ud-kpi-sub">Kỳ vọng của mô hình học máy</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Chênh lệch tổng thể</span>
// //                 <span
// //                   className={`ud-kpi-badge ${data.summary.tong_chenh_lech >= 0 ? "ud-badge-success" : "ud-badge-danger"}`}
// //                 >
// //                   {data.summary.tong_chenh_lech >= 0 ? "Vượt dự báo" : "Dưới dự báo"}
// //                 </span>
// //               </div>
// //               <p
// //                 className="ud-kpi-value"
// //                 style={{
// //                   color: data.summary.tong_chenh_lech >= 0 ? "#166534" : "#991b1b",
// //                 }}
// //               >
// //                 {data.summary.tong_chenh_lech > 0 ? `+${fmt(data.summary.tong_chenh_lech)}` : fmt(data.summary.tong_chenh_lech)}
// //               </p>
// //               <div className="ud-kpi-sub">
// //                 Tỷ lệ lệch: {data.summary.phan_tram_lech_tong > 0 ? `+${data.summary.phan_tram_lech_tong}` : data.summary.phan_tram_lech_tong}%
// //               </div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Chỉ số sai số mô hình (MAPE)</span>
// //                 <span className="ud-kpi-badge ud-badge-warning">Sai số</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "22px", color: "#d97706" }}>
// //                 {data.summary.mape}%
// //               </p>
// //               <div className="ud-kpi-sub">Sai số tuyệt đối trung bình (MAE): {fmt(data.summary.mae)} sp</div>
// //             </div>
// //           </div>

// //           {/* Biểu đồ */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">So sánh xu hướng: Thực tế vs Prophet</h3>
// //                   <div className="ud-chart-subtitle">Biểu đồ đường biểu diễn đường cong bán hàng và đường dự báo</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Line
// //                   data={lineChartData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { position: "top" },
// //                       tooltip: {
// //                         callbacks: {
// //                           label: context => ` ${context.dataset.label}: ${fmt(context.raw as number)} sp`,
// //                         },
// //                       },
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
// //                   <h3 className="ud-chart-title">Độ lệch từng tuần (Variance Bar)</h3>
// //                   <div className="ud-chart-subtitle">Xanh: Thực tế vượt dự báo | Đỏ: Thực tế thấp hơn dự báo</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={diffBarData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { display: false },
// //                       tooltip: {
// //                         callbacks: {
// //                           label: context => ` Chênh lệch: ${fmt(context.raw as number)} sản phẩm`,
// //                         },
// //                       },
// //                     },
// //                   }}
// //                 />
// //               </div>
// //             </div>
// //           </div>

// //           {/* Bảng so sánh chi tiết */}
// //           <div className="ud-chart-card">
// //             <div className="ud-chart-header">
// //               <div>
// //                 <h3 className="ud-chart-title">Bảng đối soát chi tiết Thực tế & Prophet</h3>
// //                 <div className="ud-chart-subtitle">Số liệu chi tiết từng tuần/khoảng ngày và đánh giá khớp lệnh</div>
// //               </div>
// //             </div>
// //             <div className="ud-table-wrap">
// //               <table className="ud-table">
// //                 <thead>
// //                   <tr>
// //                     <th>Khoảng thời gian</th>
// //                     <th style={{ textAlign: "right" }}>Thực tế</th>
// //                     <th style={{ textAlign: "right" }}>Prophet dự báo</th>
// //                     <th style={{ textAlign: "right" }}>Cận dưới</th>
// //                     <th style={{ textAlign: "right" }}>Cận trên</th>
// //                     <th style={{ textAlign: "right" }}>Chênh lệch</th>
// //                     <th style={{ textAlign: "right" }}>% Lệch</th>
// //                     <th style={{ textAlign: "center" }}>Đánh giá</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {periods.map((p, idx) => (
// //                     <tr key={idx}>
// //                       <td><strong>{p.nhan_thoi_gian}</strong></td>
// //                       <td style={{ textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
// //                         {fmt(p.thuc_te)}
// //                       </td>
// //                       <td style={{ textAlign: "right", fontWeight: 700, color: "#8b5cf6" }}>
// //                         {fmt(p.du_bao_prophet)}
// //                       </td>
// //                       <td style={{ textAlign: "right", color: "#64748b" }}>{p.can_duoi != null ? fmt(p.can_duoi) : "—"}</td>
// //                       <td style={{ textAlign: "right", color: "#64748b" }}>{p.can_tren != null ? fmt(p.can_tren) : "—"}</td>
// //                       <td
// //                         style={{
// //                           textAlign: "right",
// //                           fontWeight: 700,
// //                           color: p.chenh_lech >= 0 ? "#166534" : "#991b1b",
// //                         }}
// //                       >
// //                         {p.chenh_lech > 0 ? `+${fmt(p.chenh_lech)}` : fmt(p.chenh_lech)}
// //                       </td>
// //                       <td style={{ textAlign: "right" }}>
// //                         {p.phan_tram_lech > 0 ? `+${p.phan_tram_lech}` : p.phan_tram_lech}%
// //                       </td>
// //                       <td style={{ textAlign: "center" }}>
// //                         <span
// //                           className={`ud-kpi-badge ${
// //                             p.danh_gia === "VUOT_DU_BAO"
// //                               ? "ud-badge-success"
// //                               : p.danh_gia === "DUOI_DU_BAO"
// //                               ? "ud-badge-danger"
// //                               : "ud-badge-info"
// //                           }`}
// //                         >
// //                           {p.danh_gia === "VUOT_DU_BAO"
// //                             ? "Vượt dự báo"
// //                             : p.danh_gia === "DUOI_DU_BAO"
// //                             ? "Dưới dự báo"
// //                             : "Khớp"}
// //                         </span>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                   {periods.length === 0 && (
// //                     <tr>
// //                       <td colSpan={8} style={{ textAlign: "center", padding: "24px", color: "#94a3b8" }}>
// //                         Chưa có dữ liệu dự báo Prophet và bán hàng trong khoảng ngày đã chọn.
// //                       </td>
// //                     </tr>
// //                   )}
// //                 </tbody>
// //               </table>
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }


// import {
//   useCallback,
//   useEffect,
//   useState,
// } from "react";

// import {
//   fetchProphetComparison,
//   type ProphetComparisonItem,
//   type ProphetProductComparisonItem,
// } from "../../services/dashboardService";

// import {
//   Comparison,
//   fmt,
//   Kpis,
//   StatsFrame,
//   StatsTable,
//   useStats,
//   type Column,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";


// type ProductOption = {
//   code: string;
//   name: string;
// };

// type DateRange = {
//   from: string;
//   to: string;
// };

// function formatInputDate(value: Date): string {
//   const year = value.getFullYear();

//   const month = String(
//     value.getMonth() + 1,
//   ).padStart(2, "0");

//   const day = String(
//     value.getDate(),
//   ).padStart(2, "0");

//   return `${year}-${month}-${day}`;
// }

// function createInitialRange(): DateRange {
//   const today = new Date();
//   const start = new Date(today);

//   start.setDate(
//     start.getDate() - 60,
//   );

//   return {
//     from: formatInputDate(start),
//     to: formatInputDate(today),
//   };
// }

// function signedNumber(value: number): string {
//   return value > 0
//     ? `+${fmt(value)}`
//     : fmt(value);
// }

// const evaluationLabels: Record<string, string> = {
//   VUOT_DU_BAO: "Thực tế cao hơn dự báo",
//   DUOI_DU_BAO: "Thực tế thấp hơn dự báo",
//   KHOP: "Khớp",
// };

// const periodColumns: Column<ProphetComparisonItem>[] = [
//   {
//     title: "Khoảng thời gian",
//     value: item => item.nhan_thoi_gian,
//   },
//   {
//     title: "Thực tế",
//     value: item => fmt(item.thuc_te),
//   },
//   {
//     title: "Dự báo Prophet",
//     value: item => fmt(item.du_bao_prophet),
//   },
//   {
//     title: "Cận dưới",
//     value: item => fmt(item.can_duoi),
//   },
//   {
//     title: "Cận trên",
//     value: item => fmt(item.can_tren),
//   },
//   {
//     title: "Chênh lệch",
//     value: item => signedNumber(item.chenh_lech),
//   },
//   {
//     title: "Lệch so với thực tế (%)",
//     value: item =>
//       item.thuc_te === 0
//         ? "—"
//         : signedNumber(item.phan_tram_lech),
//   },
//   {
//     title: "Đánh giá",
//     value: item =>
//       evaluationLabels[item.danh_gia] ??
//       item.danh_gia,
//   },
// ];

// const productColumns: Column<ProphetProductComparisonItem>[] = [
//   {
//     title: "Mã sản phẩm",
//     value: item => item.ma_san_pham,
//   },
//   {
//     title: "Sản phẩm",
//     value: item => item.ten_san_pham,
//   },
//   {
//     title: "Thực tế",
//     value: item => fmt(item.thuc_te),
//   },
//   {
//     title: "Dự báo Prophet",
//     value: item => fmt(item.du_bao_prophet),
//   },
//   {
//     title: "Chênh lệch",
//     value: item => signedNumber(item.chenh_lech),
//   },
//   {
//     title: "Lệch so với thực tế (%)",
//     value: item =>
//       item.thuc_te === 0
//         ? "—"
//         : signedNumber(item.phan_tram_lech),
//   },
// ];


// export default function DashboardProphetComparison() {
//   const [range, setRange] =
//     useState<DateRange>(createInitialRange);

//   const [selectedProduct, setSelectedProduct] =
//     useState("");

//   const [productOptions, setProductOptions] =
//     useState<ProductOption[]>([]);

//   const fetcher = useCallback(async () => {
//     if (!range.from || !range.to) {
//       throw new Error(
//         "Vui lòng chọn đầy đủ từ ngày và đến ngày.",
//       );
//     }

//     if (range.from > range.to) {
//       throw new Error(
//         "Từ ngày phải nhỏ hơn hoặc bằng đến ngày.",
//       );
//     }

//     return fetchProphetComparison({
//       from_date: range.from,
//       to_date: range.to,
//       ma_san_pham: selectedProduct || undefined,
//     });
//   }, [
//     range.from,
//     range.to,
//     selectedProduct,
//   ]);

//   const resource = useStats(fetcher);
//   const data = resource.data;

//   // Giữ danh sách lựa chọn khi đang lọc một sản phẩm.
//   // Không lấy danh sách bị thu hẹp từ response đã lọc
//   // để thay thế toàn bộ danh sách sản phẩm.
//   useEffect(() => {
//     if (
//       !data ||
//       data.ma_san_pham !== null
//     ) {
//       return;
//     }

//     setProductOptions(
//       data.products.map(item => ({
//         code: item.ma_san_pham,
//         name: item.ten_san_pham,
//       })),
//     );
//   }, [data]);

//   const periods = data?.periods ?? [];

//   const totalDifference =
//     data?.summary.tong_chenh_lech ?? 0;

//   const totalActual =
//     data?.summary.tong_thuc_te ?? 0;

//   return (
//     <div className="ud-container">
//       <div className="ud-filter-card">
//         <div className="ud-filter-group">
//           <label className="ud-filter-group">
//             <span className="ud-filter-label">
//               Từ ngày
//             </span>

//             <input
//               type="date"
//               className="ud-input"
//               value={range.from}
//               onChange={event => {
//                 const from = event.target.value;

//                 setRange(previous => ({
//                   ...previous,
//                   from,
//                 }));
//               }}
//             />
//           </label>

//           <label className="ud-filter-group">
//             <span className="ud-filter-label">
//               Đến ngày
//             </span>

//             <input
//               type="date"
//               className="ud-input"
//               value={range.to}
//               onChange={event => {
//                 const to = event.target.value;

//                 setRange(previous => ({
//                   ...previous,
//                   to,
//                 }));
//               }}
//             />
//           </label>

//           <label className="ud-filter-group">
//             <span className="ud-filter-label">
//               Sản phẩm
//             </span>

//             <select
//               className="ud-select"
//               value={selectedProduct}
//               onChange={event => {
//                 setSelectedProduct(
//                   event.target.value,
//                 );
//               }}
//             >
//               <option value="">
//                 Tất cả sản phẩm trong kết quả đối soát
//               </option>

//               {productOptions.map(item => (
//                 <option
//                   key={item.code}
//                   value={item.code}
//                 >
//                   {item.name} ({item.code})
//                 </option>
//               ))}
//             </select>
//           </label>
//         </div>
//       </div>

//       <StatsFrame
//         resource={resource}
//         note={
//           "Đối chiếu dự báo với số lượng bán thực tế " +
//           "trên đúng các tuần được API trả về. " +
//           "Không thực hiện chạy lại mô hình."
//         }
//       >
//         {data && (
//           periods.length === 0 ? (
//             <div
//               className="ud-empty-box"
//               role="status"
//             >
//               Không có dự báo hợp lệ cho các tuần đã
//               hoàn tất trong khoảng ngày đã chọn.
//               Bạn có thể đổi khoảng ngày hoặc chọn
//               tất cả sản phẩm.
//             </div>
//           ) : (
//             <>
//               <Kpis
//                 items={[
//                   {
//                     label: "Số lượng bán thực tế",
//                     value: fmt(
//                       data.summary.tong_thuc_te,
//                     ),
//                     note: "Trong các tuần được đối soát",
//                   },
//                   {
//                     label: "Tổng dự báo Prophet",
//                     value: fmt(
//                       data.summary.tong_prophet,
//                     ),
//                     note: "Cùng phạm vi với dữ liệu thực tế",
//                   },
//                   {
//                     label: "Chênh lệch thực tế − dự báo",
//                     value: signedNumber(
//                       totalDifference,
//                     ),
//                     note: totalActual > 0
//                       ? (
//                           "Lệch so với thực tế: " +
//                           `${signedNumber(
//                             data.summary.phan_tram_lech_tong,
//                           )}%`
//                         )
//                       : (
//                           "Không tính tỷ lệ khi tổng " +
//                           "thực tế bằng 0"
//                         ),
//                   },
//                   {
//                     label: "MAE theo kết quả đối soát",
//                     value: fmt(
//                       data.summary.mae,
//                     ),
//                     note:
//                       `MAPE theo API: ${fmt(
//                         data.summary.mape,
//                       )}%`,
//                   },
//                 ]}
//               />

//               <Comparison
//                 title="Thực tế và dự báo theo tuần"
//                 labels={periods.map(
//                   item => item.nhan_thoi_gian,
//                 )}
//                 series={[
//                   {
//                     label: "Thực tế",
//                     values: periods.map(
//                       item => item.thuc_te,
//                     ),
//                   },
//                   {
//                     label: "Dự báo Prophet",
//                     values: periods.map(
//                       item => item.du_bao_prophet,
//                     ),
//                   },
//                 ]}
//                 line
//               />

//               <Comparison
//                 title="Chênh lệch thực tế − dự báo theo tuần"
//                 labels={periods.map(
//                   item => item.nhan_thoi_gian,
//                 )}
//                 series={[
//                   {
//                     label: "Chênh lệch",
//                     values: periods.map(
//                       item => item.chenh_lech,
//                     ),
//                   },
//                 ]}
//               />

//               <StatsTable
//                 title="Chi tiết đối soát theo tuần"
//                 rows={periods}
//                 columns={periodColumns}
//                 rowKey={item =>
//                   `${item.tu_ngay}:${item.den_ngay}`
//                 }
//               />

//               <StatsTable
//                 title="Tổng hợp theo sản phẩm"
//                 rows={data.products}
//                 columns={productColumns}
//                 rowKey={item =>
//                   item.ma_san_pham
//                 }
//               />
//             </>
//           )
//         )}
//       </StatsFrame>
//     </div>
//   );
// }