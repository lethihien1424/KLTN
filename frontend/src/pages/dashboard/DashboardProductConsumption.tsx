// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardProductConsumption.tsx
// // import { useEffect, useState } from "react";
// // import { Bar, Doughnut } from "react-chartjs-2";
// // import "./chartSetup";
// // import { CHART_COLORS } from "./chartSetup";
// // import {
// //   fetchProductConsumption,
// //   type ProductConsumptionResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const numberFormat = new Intl.NumberFormat("vi-VN");
// // const moneyFormat = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
// // const fmt = (val: number | null | undefined) => (val == null ? "0" : numberFormat.format(val));
// // const fmtMoney = (val: number | null | undefined) => (val == null ? "0 ₫" : moneyFormat.format(val));

// // export default function DashboardProductConsumption() {
// //   const currentYear = new Date().getFullYear();
// //   const currentMonth = new Date().getMonth() + 1;

// //   const [periodType, setPeriodType] = useState<"tuan" | "thang" | "nam">("thang");
// //   const [year, setYear] = useState<number>(currentYear);
// //   const [month, setMonth] = useState<number>(currentMonth);
// //   const [week, setWeek] = useState<number>(1);

// //   const [data, setData] = useState<ProductConsumptionResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchProductConsumption({
// //       period_type: periodType,
// //       year,
// //       month: periodType === "thang" ? month : undefined,
// //       week: periodType === "tuan" ? week : undefined,
// //     })
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu sản phẩm."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, [periodType, year, month, week]);

// //   const topProducts = data?.top_products ?? [];
// //   const barData = {
// //     labels: topProducts.map(p => p.ten_san_pham),
// //     datasets: [
// //       {
// //         label: "Số lượng bán",
// //         data: topProducts.map(p => p.so_luong_ban),
// //         backgroundColor: CHART_COLORS.palette,
// //         borderRadius: 6,
// //       },
// //     ],
// //   };

// //   const doughnutData = {
// //     labels: topProducts.slice(0, 6).map(p => p.ten_san_pham),
// //     datasets: [
// //       {
// //         data: topProducts.slice(0, 6).map(p => p.so_luong_ban),
// //         backgroundColor: CHART_COLORS.palette.slice(0, 6),
// //         borderWidth: 2,
// //         borderColor: "#ffffff",
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       {/* Bộ lọc thời gian */}
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">Kỳ bán hàng:</span>
// //           <div className="ud-segmented">
// //             <button
// //               className={`ud-segmented-btn ${periodType === "tuan" ? "active" : ""}`}
// //               onClick={() => setPeriodType("tuan")}
// //             >
// //               Theo Tuần
// //             </button>
// //             <button
// //               className={`ud-segmented-btn ${periodType === "thang" ? "active" : ""}`}
// //               onClick={() => setPeriodType("thang")}
// //             >
// //               Theo Tháng
// //             </button>
// //             <button
// //               className={`ud-segmented-btn ${periodType === "nam" ? "active" : ""}`}
// //               onClick={() => setPeriodType("nam")}
// //             >
// //               Theo Năm
// //             </button>
// //           </div>

// //           {periodType === "tuan" && (
// //             <select
// //               className="ud-select"
// //               value={week}
// //               onChange={e => setWeek(Number(e.target.value))}
// //             >
// //               {Array.from({ length: 52 }, (_, i) => i + 1).map(w => (
// //                 <option key={w} value={w}>
// //                   Tuần {w}
// //                 </option>
// //               ))}
// //             </select>
// //           )}

// //           {periodType === "thang" && (
// //             <select
// //               className="ud-select"
// //               value={month}
// //               onChange={e => setMonth(Number(e.target.value))}
// //             >
// //               {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
// //                 <option key={m} value={m}>
// //                   Tháng {m}
// //                 </option>
// //               ))}
// //             </select>
// //           )}

// //           <select
// //             className="ud-select"
// //             value={year}
// //             onChange={e => setYear(Number(e.target.value))}
// //           >
// //             {[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(y => (
// //               <option key={y} value={y}>
// //                 Năm {y}
// //               </option>
// //             ))}
// //           </select>
// //         </div>

// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang tải dữ liệu sản phẩm tiêu thụ...</p>
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
// //           {/* KPI Cards */}
// //           <div className="ud-kpi-grid">
// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng sản phẩm tiêu thụ</span>
// //                 <span className="ud-kpi-badge ud-badge-info">{data.period_label}</span>
// //               </div>
// //               <p className="ud-kpi-value">{fmt(data.summary.tong_so_luong)}</p>
// //               <div className="ud-kpi-sub">Qua {fmt(data.summary.tong_don_hang)} đơn hàng đã đặt</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tổng doanh thu ước tính</span>
// //                 <span className="ud-kpi-badge ud-badge-success">Doanh thu</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "22px", color: "#166534" }}>
// //                 {fmtMoney(data.summary.tong_doanh_thu)}
// //               </p>
// //               <div className="ud-kpi-sub">{data.summary.so_loai_san_pham} dòng sản phẩm kinh doanh</div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Bán chạy nhất (Best-Seller)</span>
// //                 <span className="ud-kpi-badge ud-badge-success">Top 1</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "18px", color: "#0f172a" }}>
// //                 {data.summary.san_pham_ban_chay_nhat?.ten_san_pham || "Chưa có"}
// //               </p>
// //               <div className="ud-kpi-sub">
// //                 {data.summary.san_pham_ban_chay_nhat
// //                   ? `${fmt(data.summary.san_pham_ban_chay_nhat.so_luong_ban)} sản phẩm (${data.summary.san_pham_ban_chay_nhat.ty_le_phan_tram}%)`
// //                   : "0"}
// //               </div>
// //             </div>

// //             <div className="ud-kpi-card">
// //               <div className="ud-kpi-title">
// //                 <span>Tiêu thụ ít nhất</span>
// //                 <span className="ud-kpi-badge ud-badge-warning">Thấp nhất</span>
// //               </div>
// //               <p className="ud-kpi-value" style={{ fontSize: "18px", color: "#92400e" }}>
// //                 {data.summary.san_pham_ban_it_nhat?.ten_san_pham || "Chưa có"}
// //               </p>
// //               <div className="ud-kpi-sub">
// //                 {data.summary.san_pham_ban_it_nhat
// //                   ? `${fmt(data.summary.san_pham_ban_it_nhat.so_luong_ban)} sản phẩm (${data.summary.san_pham_ban_it_nhat.ty_le_phan_tram}%)`
// //                   : "0"}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Charts */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Sản lượng tiêu thụ theo sản phẩm (Top đầu)</h3>
// //                   <div className="ud-chart-subtitle">So sánh số lượng sản phẩm bán ra từ các đơn hàng</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={barData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { display: false },
// //                       tooltip: {
// //                         callbacks: {
// //                           label: context => ` ${fmt(context.raw as number)} sản phẩm`,
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
// //                   <h3 className="ud-chart-title">Cơ cấu tỷ lệ bán các mặt hàng</h3>
// //                   <div className="ud-chart-subtitle">Thị phần tiêu thụ của từng dòng sản phẩm</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap" style={{ display: "flex", justifyContent: "center" }}>
// //                 <Doughnut
// //                   data={doughnutData}
// //                   options={{
// //                     responsive: true,
// //                     maintainAspectRatio: false,
// //                     plugins: {
// //                       legend: { position: "right" },
// //                       tooltip: {
// //                         callbacks: {
// //                           label: context => ` ${context.label}: ${fmt(context.raw as number)} (${topProducts[context.dataIndex]?.ty_le_phan_tram || 0}%)`,
// //                         },
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
// //                 <h3 className="ud-chart-title">🟢 Top 5 sản phẩm bán chạy nhất</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã SP</th>
// //                       <th>Tên sản phẩm</th>
// //                       <th style={{ textAlign: "right" }}>Số lượng</th>
// //                       <th style={{ textAlign: "right" }}>Doanh thu</th>
// //                       <th style={{ textAlign: "right" }}>Tỷ lệ</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.top_products.slice(0, 5).map((p, idx) => (
// //                       <tr key={p.ma_san_pham}>
// //                         <td><span className={`ud-rank-pill ud-rank-${idx + 1}`}>{idx + 1}</span></td>
// //                         <td><code>{p.ma_san_pham}</code></td>
// //                         <td><strong>{p.ten_san_pham}</strong></td>
// //                         <td style={{ textAlign: "right" }}>{fmt(p.so_luong_ban)} {p.don_vi_tinh}</td>
// //                         <td style={{ textAlign: "right", color: "#166534" }}>{fmtMoney(p.doanh_thu)}</td>
// //                         <td style={{ textAlign: "right", color: "#2563eb", fontWeight: 600 }}>{p.ty_le_phan_tram}%</td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">🟠 Top 5 sản phẩm tiêu thụ ít nhất</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th style={{ width: 45 }}>#</th>
// //                       <th>Mã SP</th>
// //                       <th>Tên sản phẩm</th>
// //                       <th style={{ textAlign: "right" }}>Số lượng</th>
// //                       <th style={{ textAlign: "right" }}>Doanh thu</th>
// //                       <th style={{ textAlign: "right" }}>Tỷ lệ</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {data.least_products.slice(0, 5).map((p, idx) => (
// //                       <tr key={p.ma_san_pham}>
// //                         <td><span className="ud-rank-pill">{idx + 1}</span></td>
// //                         <td><code>{p.ma_san_pham}</code></td>
// //                         <td>{p.ten_san_pham}</td>
// //                         <td style={{ textAlign: "right" }}>{fmt(p.so_luong_ban)} {p.don_vi_tinh}</td>
// //                         <td style={{ textAlign: "right" }}>{fmtMoney(p.doanh_thu)}</td>
// //                         <td style={{ textAlign: "right", color: "#94a3b8" }}>{p.ty_le_phan_tram}%</td>
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
// import {
//   useCallback,
//   useState,
// } from "react";

// import { Doughnut } from "react-chartjs-2";

// import {
//   fetchProductConsumption,
// } from "../../services/dashboardService";

// import { CHART_COLORS } from "./chartSetup";

// import {
//   Choices,
//   Comparison,
//   currentISOWeek,
//   fmt,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";


// type PeriodType = "tuan" | "thang" | "nam" | "khoang";

// type PeriodFilter = {
//   type: PeriodType;
//   year: number;
//   month: number;
//   week: number;
//   fromDate: string;
//   toDate: string;
// };

// function weeksInISOYear(year: number): number {
//   const firstDay = new Date(
//     Date.UTC(year, 0, 1),
//   ).getUTCDay();

//   const leapYear =
//     year % 400 === 0 ||
//     (year % 4 === 0 && year % 100 !== 0);

//   return firstDay === 4 ||
//     (firstDay === 3 && leapYear)
//     ? 53
//     : 52;
// }

// function createInitialFilter(): PeriodFilter {
//   const now = new Date();
//   const iso = currentISOWeek();

//   return {
//     type: "thang",
//     year: now.getFullYear(),
//     month: now.getMonth() + 1,
//     week: iso.week,
//     fromDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
//     toDate: new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10),
//   };
// }

// export default function DashboardProductConsumption() {
//   const [filter, setFilter] =
//     useState<PeriodFilter>(createInitialFilter);

//   const [ranking, setRanking] = useState("top");

//   const currentYear = new Date().getFullYear();

//   const years = Array.from(
//     { length: 12 },
//     (_, index) => currentYear + 1 - index,
//   );

//   const maxWeek = weeksInISOYear(filter.year);
//   const selectedWeek = Math.min(filter.week, maxWeek);

//   const fetcher = useCallback(
//     () =>
//       fetchProductConsumption({
//         period_type: filter.type === "khoang" ? undefined : filter.type,
//         year: filter.type === "khoang" ? undefined : filter.year,
//         from_date: filter.type === "khoang" ? filter.fromDate : undefined,
//         to_date: filter.type === "khoang" ? filter.toDate : undefined,
//         month:
//           filter.type === "thang"
//             ? filter.month
//             : undefined,
//         week:
//           filter.type === "tuan"
//             ? selectedWeek
//             : undefined,
//       }),
//     [
//       filter.type,
//       filter.year,
//       filter.month,
//       selectedWeek,
//       filter.fromDate,
//       filter.toDate,
//     ],
//   );

//   const resource = useStats(fetcher);
//   const data = resource.data;

//   const allProducts = data?.all_products ?? [];

//   const rankedProducts = data
//     ? ranking === "least"
//       ? data.least_products
//       : data.top_products
//     : [];

//   const bestSeller =
//     data?.summary.san_pham_ban_chay_nhat;

//   const leastSeller =
//     data && data.summary.tong_so_luong > 0
//       ? data.summary.san_pham_ban_it_nhat
//       : null;

//   const soldProducts = allProducts.filter(
//     product => product.so_luong_ban > 0,
//   );

//   const doughnutData = {
//     labels: soldProducts.map(
//       product => product.ten_san_pham,
//     ),
//     datasets: [
//       {
//         label: "Số lượng bán",
//         data: soldProducts.map(
//           product => product.so_luong_ban,
//         ),
//         backgroundColor: soldProducts.map(
//           (_, index) =>
//             CHART_COLORS.palette[
//               index % CHART_COLORS.palette.length
//             ],
//         ),
//         borderColor: "#ffffff",
//         borderWidth: 2,
//       },
//     ],
//   };

//   function changePeriod(type: PeriodType) {
//     setFilter(previous => ({
//       ...previous,
//       type,
//       week: Math.min(
//         previous.week,
//         weeksInISOYear(previous.year),
//       ),
//     }));
//   }

//   return (
//     <div className="ud-container">
//       <div className="ud-filter-card">
//         <div className="ud-filter-group">
//           <span className="ud-filter-label">
//             Kỳ bán hàng
//           </span>

//           <div
//             className="ud-segmented"
//             role="group"
//             aria-label="Chọn kỳ thống kê sản phẩm"
//           >
//             {[
//               { value: "tuan", label: "Tuần" },
//               { value: "thang", label: "Tháng" },
//               { value: "nam", label: "Năm" },
//             ].map(item => (
//               <button
//                 key={item.value}
//                 type="button"
//                 className={
//                   "ud-segmented-btn" +
//                   (
//                     filter.type === item.value
//                       ? " active"
//                       : ""
//                   )
//                 }
//                 aria-pressed={
//                   filter.type === item.value
//                 }
//                 onClick={() =>
//                   changePeriod(
//                     item.value as PeriodType,
//                   )
//                 }
//               >
//                 {item.label}
//               </button>
//             ))}
//           </div>

//           {filter.type === "khoang" && (
//             <>
//               <label className="ud-filter-group"><span className="ud-filter-label">Từ ngày</span><input className="ud-input" type="date" value={filter.fromDate} max={filter.toDate} onChange={event => setFilter(previous => ({ ...previous, fromDate: event.target.value }))} /></label>
//               <label className="ud-filter-group"><span className="ud-filter-label">Đến ngày</span><input className="ud-input" type="date" value={filter.toDate} min={filter.fromDate} onChange={event => setFilter(previous => ({ ...previous, toDate: event.target.value }))} /></label>
//             </>
//           )}

//           {filter.type === "tuan" && (
//             <label className="ud-filter-group">
//               <span className="ud-filter-label">
//                 Tuần ISO
//               </span>

//               <select
//                 className="ud-select"
//                 value={selectedWeek}
//                 onChange={event => {
//                   const week = Number(
//                     event.target.value,
//                   );

//                   setFilter(previous => ({
//                     ...previous,
//                     week,
//                   }));
//                 }}
//               >
//                 {Array.from(
//                   { length: maxWeek },
//                   (_, index) => index + 1,
//                 ).map(week => (
//                   <option key={week} value={week}>
//                     Tuần {week}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           )}

//           {filter.type === "thang" && (
//             <label className="ud-filter-group">
//               <span className="ud-filter-label">
//                 Tháng
//               </span>

//               <select
//                 className="ud-select"
//                 value={filter.month}
//                 onChange={event => {
//                   const month = Number(
//                     event.target.value,
//                   );

//                   setFilter(previous => ({
//                     ...previous,
//                     month,
//                   }));
//                 }}
//               >
//                 {Array.from(
//                   { length: 12 },
//                   (_, index) => index + 1,
//                 ).map(month => (
//                   <option key={month} value={month}>
//                     Tháng {month}
//                   </option>
//                 ))}
//               </select>
//             </label>
//           )}

//           {filter.type !== "khoang" && <label className="ud-filter-group">
//             <span className="ud-filter-label">
//               {filter.type === "tuan" ? "Năm ISO" : "Năm"}
//             </span>

//             <select
//               className="ud-select"
//               value={filter.year}
//               onChange={event => {
//                 const year = Number(
//                   event.target.value,
//                 );

//                 setFilter(previous => ({
//                   ...previous,
//                   year,
//                   week: Math.min(
//                     previous.week,
//                     weeksInISOYear(year),
//                   ),
//                 }));
//               }}
//             >
//               {years.map(year => (
//                 <option key={year} value={year}>
//                   {year}
//                 </option>
//               ))}
//             </select>
//           </label>}
//         </div>
//       </div>

//       <StatsFrame
//         resource={resource}
//         note={
//           data
//             ? `${data.period_label}: thống kê từ dữ liệu bán hàng.`
//             : "Thống kê sản phẩm theo kỳ bán hàng đã chọn."
//         }
//       >
//         {data && (
//           <>

//             {data.summary.tong_so_luong === 0 ? (
//               <div
//                 className="ud-empty-box"
//                 role="status"
//               >
//                 Không có số lượng bán trong kỳ đã chọn.
//               </div>
//             ) : (
//               <>
//                 <Choices
//                   value={ranking}
//                   onChange={setRanking}
//                   options={[
//                     {
//                       value: "top",
//                       label: "Tiêu thụ nhiều nhất",
//                     },
//                     {
//                       value: "least",
//                       label: "Tiêu thụ ít nhất",
//                     },
//                   ]}
//                 />

//                 <div className="ud-charts-grid">
//                   <Comparison
//                     title={
//                       ranking === "least"
//                         ? "Sản phẩm tiêu thụ ít nhất"
//                         : "Sản phẩm tiêu thụ nhiều nhất"
//                     }
//                     labels={rankedProducts.map(
//                       product =>
//                         product.ten_san_pham,
//                     )}
//                     series={[
//                       {
//                         label: "Số lượng bán",
//                         values: rankedProducts.map(
//                           product =>
//                             product.so_luong_ban,
//                         ),
//                       },
//                     ]}
//                   />

//                   <section className="ud-chart-card">
//                     <h3 className="ud-chart-title">
//                       Cơ cấu số lượng bán
//                     </h3>

//                     <p className="ud-chart-subtitle">
//                       Tỷ trọng trong các sản phẩm có phát sinh bán.
//                     </p>

//                     <div className="ud-chart-canvas-wrap">
//                       <Doughnut
//                         data={doughnutData}
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
//                   </section>
//                 </div>

//               </>
//             )}
//           </>
//         )}
//       </StatsFrame>
//     </div>
//   );
// }
