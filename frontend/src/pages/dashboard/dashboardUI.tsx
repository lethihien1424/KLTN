// import {
//   useEffect,
//   useRef,
//   useState,
//   type ReactNode,
// } from "react";
// import SharedDataTable from "../../components/common/SharedDataTable";

// import {
//   Bar,
//   Line,
// } from "react-chartjs-2";

// import {
//   CHART_COLORS,
// } from "./chartSetup";

// import "../../styles/unifiedDashboard.css";


// // ==================== ĐỊNH DẠNG SỐ ====================

// const numberFormatter = new Intl.NumberFormat(
//   "vi-VN",
//   {
//     maximumFractionDigits: 2,
//   },
// );

// const moneyFormatter = new Intl.NumberFormat(
//   "vi-VN",
//   {
//     style: "currency",
//     currency: "VND",
//     maximumFractionDigits: 0,
//   },
// );

// export function fmt(
//   value: number | string | null | undefined,
// ): string {
//   if (value == null) {
//     return "—";
//   }

//   const number = Number(value);

//   if (!Number.isFinite(number)) {
//     return "—";
//   }

//   return numberFormatter.format(number);
// }

// export function money(value: number): string {
//   if (!Number.isFinite(value)) {
//     return "—";
//   }

//   return moneyFormatter.format(value);
// }


// // ==================== TUẦN ISO HIỆN TẠI ====================

// export function currentISOWeek(): {
//   year: number;
//   week: number;
// } {
//   const now = new Date();

//   const day = new Date(
//     Date.UTC(
//       now.getFullYear(),
//       now.getMonth(),
//       now.getDate(),
//     ),
//   );

//   // Thứ Năm quyết định năm của tuần ISO.
//   day.setUTCDate(
//     day.getUTCDate() +
//     4 -
//     (day.getUTCDay() || 7),
//   );

//   const year = day.getUTCFullYear();

//   const firstDayOfYear = Date.UTC(
//     year,
//     0,
//     1,
//   );

//   const elapsedDays =
//     (day.getTime() - firstDayOfYear) /
//     86_400_000;

//   const week = Math.ceil(
//     (elapsedDays + 1) / 7,
//   );

//   return {
//     year,
//     week,
//   };
// }


// // ==================== TẢI DỮ LIỆU ====================

// export function useStats<T>(
//   fetcher: () => Promise<T>,
// ) {
//   const [data, setData] = useState<T | null>(null);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [revision, setRevision] = useState(0);

//   const requestId = useRef(0);

//   useEffect(() => {
//     const currentRequest = ++requestId.current;

//     setData(null);
//     setError("");
//     setLoading(true);

//     async function load(): Promise<void> {
//       try {
//         const result = await fetcher();

//         if (
//           currentRequest !== requestId.current
//         ) {
//           return;
//         }

//         setData(result);
//       } catch (cause) {
//         if (
//           currentRequest !== requestId.current
//         ) {
//           return;
//         }

//         setError(
//           cause instanceof Error
//             ? cause.message
//             : "Không tải được thống kê.",
//         );
//       } finally {
//         if (
//           currentRequest === requestId.current
//         ) {
//           setLoading(false);
//         }
//       }
//     }

//     void load();

//     return () => {
//       // Không cập nhật state bằng kết quả request cũ
//       // sau khi đổi nguồn dữ liệu hoặc unmount.
//       requestId.current += 1;
//     };
//   }, [fetcher, revision]);

//   return {
//     data,
//     error,
//     loading,
//     reload: () => {
//       setRevision(previous => previous + 1);
//     },
//   };
// }


// // ==================== KHUNG TRẠNG THÁI ====================

// type StatsResource = {
//   loading: boolean;
//   error: string;
//   reload: () => void;
// };

// type StatsFrameProps = {
//   resource: StatsResource;
//   children: ReactNode;
//   note?: string;
// };

// export function StatsFrame({
//   resource,
//   children,
//   note,
// }: StatsFrameProps) {
//   return (
//     <div className="ud-container">
//       <div className="ud-filter-card ud-stats-note-card">
//         <p className="ud-filter-label">
//           {note ??
//             "Thống kê từ dữ liệu đã ghi nhận trong hệ thống"}
//         </p>

//         <button
//           type="button"
//           className="ud-btn"
//           disabled={resource.loading}
//           onClick={resource.reload}
//         >
//           Làm mới
//         </button>
//       </div>

//       {resource.loading ? (
//         <div
//           className="ud-loading-box"
//           role="status"
//         >
//           Đang tải dữ liệu…
//         </div>
//       ) : resource.error ? (
//         <div
//           className="ud-empty-box"
//           role="alert"
//         >
//           {resource.error}
//         </div>
//       ) : (
//         children
//       )}
//     </div>
//   );
// }


// // ==================== THẺ SỐ LIỆU ====================

// type KpiItem = {
//   label: string;
//   value: ReactNode;
//   note?: string;
// };

// type KpisProps = {
//   items: KpiItem[];
// };

// export function Kpis({
//   items,
// }: KpisProps) {
//   return (
//     <div className="ud-kpi-grid">
//       {items.map(item => (
//         <article
//           key={item.label}
//           className="ud-kpi-card"
//         >
//           <div className="ud-kpi-title">
//             {item.label}
//           </div>

//           <p className="ud-kpi-value">
//             {item.value}
//           </p>

//           {item.note && (
//             <p className="ud-kpi-sub">
//               {item.note}
//             </p>
//           )}
//         </article>
//       ))}
//     </div>
//   );
// }


// // ==================== BIỂU ĐỒ CỘT / ĐƯỜNG ====================

// type ComparisonSeries = {
//   label: string;
//   values: number[];
// };

// type ComparisonProps = {
//   title: string;
//   labels: string[];
//   series: ComparisonSeries[];
//   line?: boolean;
// };

// export function Comparison({
//   title,
//   labels,
//   series,
//   line = false,
// }: ComparisonProps) {
//   const data = {
//     labels,
//     datasets: series.map((item, index) => {
//       const color =
//         CHART_COLORS.palette[
//           index % CHART_COLORS.palette.length
//         ];

//       return {
//         label: item.label,
//         data: item.values,
//         backgroundColor: color,
//         borderColor: color,
//         borderWidth: line ? 2 : 0,
//         borderRadius: 3,
//         tension: 0.15,
//         pointRadius: 2,
//       };
//     }),
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,

//     plugins: {
//       legend: {
//         display: series.length > 1,
//       },
//     },

//     scales: {
//       y: {
//         beginAtZero: true,
//       },
//     },
//   };

//   return (
//     <section className="ud-chart-card">
//       <h3 className="ud-chart-title">
//         {title}
//       </h3>

//       {labels.length > 0 ? (
//         <div className="ud-chart-canvas-wrap">
//           {line ? (
//             <Line
//               data={data}
//               options={options}
//             />
//           ) : (
//             <Bar
//               data={data}
//               options={options}
//             />
//           )}
//         </div>
//       ) : (
//         <p className="ud-empty-inline">
//           Chưa có dữ liệu.
//         </p>
//       )}
//     </section>
//   );
// }


// // ==================== BẢNG THỐNG KÊ ====================

// export type Column<T> = {
//   title: string;
//   value: (row: T) => ReactNode;
// };

// type StatsTableProps<T> = {
//   title: string;
//   rows: T[];
//   columns: Column<T>[];
//   rowKey: (row: T) => string;
// };

// export function StatsTable<T>({
//   title,
//   rows,
//   columns,
//   rowKey,
// }: StatsTableProps<T>) {
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(7);

//   useEffect(() => {
//     setPage(1);
//   }, [rows.length]);

//   return (
//     <section className="ud-chart-card">
//       <h3 className="ud-chart-title">
//         {title}
//       </h3>
//       <SharedDataTable
//         rows={rows}
//         columns={columns.map((column, index) => ({
//           key: `column-${index}`,
//           title: column.title,
//           render: column.value,
//         }))}
//         rowKey={rowKey}
//         total={rows.length}
//         page={page}
//         pageSize={pageSize}
//         onPageChange={setPage}
//         onPageSizeChange={size => { setPageSize(size); setPage(1); }}
//         emptyMessage="Chưa có dữ liệu."
//       />
//     </section>
//   );
// }


// // ==================== DANH SÁCH LỰA CHỌN ====================

// type ChoiceOption = {
//   value: string;
//   label: string;
// };

// type ChoicesProps = {
//   value: string;
//   options: ChoiceOption[];
//   onChange: (value: string) => void;
// };

// export function Choices({
//   value,
//   options,
//   onChange,
// }: ChoicesProps) {
//   return (
//     <label className="ud-filter-group">
//       <span className="ud-filter-label">
//         Xem theo
//       </span>

//       <select
//         className="ud-select"
//         value={value}
//         onChange={event => {
//           onChange(event.target.value);
//         }}
//       >
//         {options.map(option => (
//           <option
//             key={option.value}
//             value={option.value}
//           >
//             {option.label}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }
