// // // D:\KLTN\KLTN\frontend\src\pages\dashboard\DashboardSupplierMaterials.tsx
// // import { useEffect, useMemo, useState } from "react";
// // import { Bar } from "react-chartjs-2";
// // import PaginationBar from "../../components/common/PaginationBar";
// // import "./chartSetup";
// // import {
// //   fetchSupplierMaterialsStats,
// //   type SupplierMaterialsStatsResponse,
// // } from "../../services/dashboardService";
// // import "../../styles/unifiedDashboard.css";

// // const moneyFormat = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
// // const fmtMoney = (val: number | null | undefined) => (val == null ? "0 ₫" : moneyFormat.format(val));

// // export default function DashboardSupplierMaterials() {
// //   const [data, setData] = useState<SupplierMaterialsStatsResponse | null>(null);
// //   const [loading, setLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string>("");
// //   const [bestPage, setBestPage] = useState(1);
// //   const [bestPageSize, setBestPageSize] = useState(7);
// //   const [worstPage, setWorstPage] = useState(1);
// //   const [worstPageSize, setWorstPageSize] = useState(7);

// //   const loadData = () => {
// //     setLoading(true);
// //     setError("");
// //     fetchSupplierMaterialsStats()
// //       .then(res => setData(res))
// //       .catch(err => setError(err instanceof Error ? err.message : "Không thể tải dữ liệu nguyên liệu cung ứng."))
// //       .finally(() => setLoading(false));
// //   };

// //   useEffect(() => {
// //     loadData();
// //   }, []);

// //   const topSupplied = data?.top_supplied_materials ?? [];
// //   const barSupplyData = {
// //     labels: topSupplied.map(m => m.ten_nguyen_lieu),
// //     datasets: [
// //       {
// //         label: "Số nhà phân phối / NCC cung ứng",
// //         data: topSupplied.map(m => m.so_nha_cung_cap),
// //         backgroundColor: "#2563eb",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   const highestPrice = data?.highest_price_items ?? [];
// //   const bestQuality = data?.best_quality_items ?? [];
// //   const worstOntime = data?.worst_ontime_items ?? [];
// //   const visibleBestQuality = useMemo(() => {
// //     const page = Math.min(bestPage, Math.max(1, Math.ceil(bestQuality.length / bestPageSize)));
// //     return bestQuality.slice((page - 1) * bestPageSize, page * bestPageSize);
// //   }, [bestPage, bestPageSize, bestQuality]);
// //   const visibleWorstOntime = useMemo(() => {
// //     const page = Math.min(worstPage, Math.max(1, Math.ceil(worstOntime.length / worstPageSize)));
// //     return worstOntime.slice((page - 1) * worstPageSize, page * worstPageSize);
// //   }, [worstPage, worstPageSize, worstOntime]);
// //   const barPriceData = {
// //     labels: highestPrice.slice(0, 8).map(i => `${i.ten_nguyen_lieu} (${i.ten_ncc})`),
// //     datasets: [
// //       {
// //         label: "Đơn giá cung ứng (VNĐ/Kg)",
// //         data: highestPrice.slice(0, 8).map(i => i.don_gia),
// //         backgroundColor: "#f59e0b",
// //         borderRadius: 4,
// //       },
// //     ],
// //   };

// //   return (
// //     <div className="ud-container">
// //       <div className="ud-filter-card">
// //         <div className="ud-filter-group">
// //           <span className="ud-filter-label">🚛 Phân tích mạng lưới nguyên liệu cung ứng, báo giá & chất lượng giao hàng</span>
// //         </div>
// //         <button className="ud-btn ud-btn-primary" onClick={loadData}>
// //           🔄 Làm mới
// //         </button>
// //       </div>

// //       {loading && (
// //         <div className="ud-loading-box">
// //           <div className="ud-spinner" />
// //           <p>Đang tải dữ liệu mạng lưới nguyên liệu cung ứng...</p>
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
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <div>
// //                   <h3 className="ud-chart-title">Mức độ cạnh tranh cung ứng của nguyên liệu</h3>
// //                   <div className="ud-chart-subtitle">Nguyên liệu nào có nhiều nhà phân phối / nhà cung cấp báo giá nhất</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={barSupplyData}
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
// //                   <h3 className="ud-chart-title">Các gói nguyên liệu có đơn giá cao nhất</h3>
// //                   <div className="ud-chart-subtitle">So sánh báo giá từ các nhà phân phối khác nhau</div>
// //                 </div>
// //               </div>
// //               <div className="ud-chart-canvas-wrap">
// //                 <Bar
// //                   data={barPriceData}
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

// //           {/* Tables so sánh chất lượng và đúng hạn */}
// //           <div className="ud-charts-grid">
// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">⭐ Chất lượng & Đúng hạn CAO NHẤT</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th>Nguyên liệu</th>
// //                       <th>Nhà phân phối (NCC)</th>
// //                       <th style={{ textAlign: "right" }}>Đơn giá</th>
// //                       <th style={{ textAlign: "right" }}>Chất lượng</th>
// //                       <th style={{ textAlign: "right" }}>Đúng hạn</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {visibleBestQuality.map(i => (
// //                       <tr key={`${i.ma_ncc}-${i.ma_nguyen_lieu}`}>
// //                         <td><strong>{i.ten_nguyen_lieu}</strong></td>
// //                         <td>{i.ten_ncc}</td>
// //                         <td style={{ textAlign: "right" }}>{fmtMoney(i.don_gia)}</td>
// //                         <td style={{ textAlign: "right", color: "#166534", fontWeight: 700 }}>
// //                           {i.ty_le_chat_luong_dat}%
// //                         </td>
// //                         <td style={{ textAlign: "right", color: "#2563eb", fontWeight: 700 }}>
// //                           {i.ty_le_giao_dung_han}%
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //               <PaginationBar total={bestQuality.length} page={bestPage} pageSize={bestPageSize} label="báo giá" onPageChange={setBestPage} onPageSizeChange={size => { setBestPageSize(size); setBestPage(1); }} disabled={loading} />
// //             </div>

// //             <div className="ud-chart-card">
// //               <div className="ud-chart-header">
// //                 <h3 className="ud-chart-title">⚠️ Tỷ lệ đúng hạn / chất lượng THẤP NHẤT (Cần rà soát)</h3>
// //               </div>
// //               <div className="ud-table-wrap">
// //                 <table className="ud-table">
// //                   <thead>
// //                     <tr>
// //                       <th>Nguyên liệu</th>
// //                       <th>Nhà phân phối (NCC)</th>
// //                       <th style={{ textAlign: "right" }}>Đơn giá</th>
// //                       <th style={{ textAlign: "right" }}>Chất lượng</th>
// //                       <th style={{ textAlign: "right" }}>Đúng hạn</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody>
// //                     {visibleWorstOntime.map(i => (
// //                       <tr key={`${i.ma_ncc}-${i.ma_nguyen_lieu}`}>
// //                         <td>{i.ten_nguyen_lieu}</td>
// //                         <td><strong>{i.ten_ncc}</strong></td>
// //                         <td style={{ textAlign: "right" }}>{fmtMoney(i.don_gia)}</td>
// //                         <td style={{ textAlign: "right", color: i.ty_le_chat_luong_dat < 90 ? "#dc2626" : "#475569" }}>
// //                           {i.ty_le_chat_luong_dat}%
// //                         </td>
// //                         <td style={{ textAlign: "right", color: i.ty_le_giao_dung_han < 90 ? "#dc2626" : "#475569", fontWeight: 700 }}>
// //                           {i.ty_le_giao_dung_han}%
// //                         </td>
// //                       </tr>
// //                     ))}
// //                   </tbody>
// //                 </table>
// //               </div>
// //               <PaginationBar total={worstOntime.length} page={worstPage} pageSize={worstPageSize} label="báo giá" onPageChange={setWorstPage} onPageSizeChange={size => { setWorstPageSize(size); setWorstPage(1); }} disabled={loading} />
// //             </div>
// //           </div>
// //         </>
// //       )}
// //     </div>
// //   );
// // }

// import { useState } from "react";
// import {
//   fetchSupplierMaterialsStats,
//   type SupplierMaterialDetailItem,
// } from "../../services/dashboardService";

// import {
//   Choices,
//   Comparison,
//   fmt,
//   StatsFrame,
//   useStats,
// } from "./dashboardUI";

// import "../../styles/unifiedDashboard.css";

// type DetailView =
//   | "highest_price_items"
//   | "lowest_price_items"
//   | "best_quality_items"
//   | "worst_quality_items"
//   | "best_ontime_items"
//   | "worst_ontime_items";

// type NetworkView = "top" | "least";

// const DETAIL_OPTIONS: {
//   value: DetailView;
//   label: string;
// }[] = [
//   {
//     value: "highest_price_items",
//     label: "Đơn giá cao nhất",
//   },
//   {
//     value: "lowest_price_items",
//     label: "Đơn giá thấp nhất",
//   },
//   {
//     value: "best_quality_items",
//     label: "Chất lượng cao nhất",
//   },
//   {
//     value: "worst_quality_items",
//     label: "Chất lượng thấp nhất",
//   },
//   {
//     value: "best_ontime_items",
//     label: "Đúng hạn cao nhất",
//   },
//   {
//     value: "worst_ontime_items",
//     label: "Đúng hạn thấp nhất",
//   },
// ];

// function metricValue(
//   item: SupplierMaterialDetailItem,
//   view: DetailView,
// ): number | null {
//   switch (view) {
//     case "highest_price_items":
//     case "lowest_price_items":
//       return item.don_gia;

//     case "best_quality_items":
//     case "worst_quality_items":
//       return item.ty_le_chat_luong_dat;

//     case "best_ontime_items":
//     case "worst_ontime_items":
//       return item.ty_le_giao_dung_han;
//   }
// }

// export default function DashboardSupplierMaterials() {
//   const resource = useStats(fetchSupplierMaterialsStats);

//   const [network, setNetwork] =
//     useState<NetworkView>("top");

//   const [view, setView] =
//     useState<DetailView>("highest_price_items");

//   // So sánh báo giá và tỷ lệ trong cùng một nguyên liệu.
//   const [materialCode, setMaterialCode] = useState("");

//   const data = resource.data;

//   const summary = data
//     ? network === "top"
//       ? data.top_supplied_materials
//       : data.least_supplied_materials
//     : [];

//   const source = data?.[view] ?? [];

//   const materialOptions = Array.from(
//     new Map(
//       source.map(item => [
//         item.ma_nguyen_lieu,
//         {
//           code: item.ma_nguyen_lieu,
//           name: item.ten_nguyen_lieu,
//         },
//       ]),
//     ).values(),
//   ).sort((a, b) => a.name.localeCompare(b.name, "vi"));

//   const selectedMaterial = materialOptions.some(
//     item => item.code === materialCode,
//   )
//     ? materialCode
//     : materialOptions[0]?.code ?? "";

//   const rows = source.filter(
//     item => item.ma_nguyen_lieu === selectedMaterial,
//   );

//   const isPrice =
//     view === "highest_price_items" ||
//     view === "lowest_price_items";

//   const isQuality =
//     view === "best_quality_items" ||
//     view === "worst_quality_items";

//   const metricLabel = isPrice
//     ? "Đơn giá (VNĐ)"
//     : isQuality
//       ? "Chất lượng đạt (%)"
//       : "Giao đúng hạn (%)";

//   const detailTitle =
//     DETAIL_OPTIONS.find(item => item.value === view)
//       ?.label ?? "Chi tiết cung ứng";

//   // Giữ giá trị 0 hợp lệ; chỉ bỏ giá trị chưa có hoặc không hữu hạn.
//   const chartPoints = rows.flatMap(item => {
//     const value = metricValue(item, view);

//     if (value == null || !Number.isFinite(value)) {
//       return [];
//     }

//     return [{ item, value }];
//   });

//   return (
//     <StatsFrame
//       resource={resource}
//       note="Mức độ cung ứng được đo bằng số nhà cung cấp có báo giá, không phải khối lượng hàng đã giao."
//     >
//       {data && (
//         <>
//           <div className="ud-filter-card">
//             <Choices
//               value={network}
//               options={[
//                 {
//                   value: "top",
//                   label: "Nhiều nhà cung cấp nhất",
//                 },
//                 {
//                   value: "least",
//                   label: "Ít nhà cung cấp nhất",
//                 },
//               ]}
//               onChange={value => {
//                 setNetwork(value === "least" ? "least" : "top");
//               }}
//             />
//           </div>

//           <Comparison
//             title="Mạng lưới nhà cung cấp theo nguyên liệu"
//             labels={summary.map(
//               item => item.ten_nguyen_lieu,
//             )}
//             series={[
//               {
//                 label: "Số nhà cung cấp",
//                 values: summary.map(
//                   item => item.so_nha_cung_cap,
//                 ),
//               },
//             ]}
//           />

//           <Comparison
//             title="Khoảng giá cung ứng theo nguyên liệu"
//             labels={summary.map(item => item.ten_nguyen_lieu)}
//             series={[
//               { label: "Giá thấp nhất (VNĐ)", values: summary.map(item => item.don_gia_thap_nhat) },
//               { label: "Giá cao nhất (VNĐ)", values: summary.map(item => item.don_gia_cao_nhat) },
//             ]}
//           />

//           <div className="ud-filter-card">
//             <Choices
//               value={view}
//               options={DETAIL_OPTIONS}
//               onChange={value => {
//                 const option = DETAIL_OPTIONS.find(
//                   item => item.value === value,
//                 );

//                 if (option) {
//                   setView(option.value);
//                 }
//               }}
//             />

//             {materialOptions.length > 0 && (
//               <label className="ud-filter-label">
//                 Nguyên liệu{" "}
//                 <select
//                   className="ud-select"
//                   value={selectedMaterial}
//                   onChange={event => {
//                     setMaterialCode(event.target.value);
//                   }}
//                 >
//                   {materialOptions.map(item => (
//                     <option
//                       key={item.code}
//                       value={item.code}
//                     >
//                       {item.name}
//                     </option>
//                   ))}
//                 </select>
//               </label>
//             )}
//           </div>

//           <p className="ud-empty-inline">
//             So sánh trong cùng một nguyên liệu, theo
//             danh sách xếp hạng API trả về. Đơn giá cần
//             được khai báo trên cùng cơ sở đơn vị tính.
//             Tỷ lệ chưa có dữ liệu hiển thị “—”.
//           </p>

//           <Comparison
//             title={detailTitle}
//             labels={chartPoints.map(
//               point => point.item.ten_ncc,
//             )}
//             series={[
//               {
//                 label: metricLabel,
//                 values: chartPoints.map(
//                   point => point.value,
//                 ),
//               },
//             ]}
//           />

          
//         </>
//       )}
//     </StatsFrame>
//   );
// }
