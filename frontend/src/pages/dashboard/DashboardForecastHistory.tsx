// import { useEffect, useState } from "react";
// import { Bar, Line } from "react-chartjs-2";
// import {
//   layChiTietDuBao,
//   layLichSuDuBao,
//   type DuBaoResponse,
//   type LichSuDuBao,
// } from "../../services/duBaoService";
// import { CHART_COLORS } from "./chartSetup";
// import { fmt, Kpis, StatsTable } from "./dashboardUI";
// import "../../styles/unifiedDashboard.css";

// export default function DashboardForecastHistory() {
//   const [history, setHistory] = useState<LichSuDuBao[]>([]);
//   const [selectedCode, setSelectedCode] = useState("");
//   const [selectedCodeProduct, setSelectedCodeProduct] = useState("");
//   const [detail, setDetail] = useState<DuBaoResponse | null>(null);
//   const [loadingHistory, setLoadingHistory] = useState(true);
//   const [loadingDetail, setLoadingDetail] = useState(false);
//   const [error, setError] = useState("");
//   const [historyError, setHistoryError] = useState("");

//   useEffect(() => {
//     const controller = new AbortController();
//     setLoadingHistory(true);
//     layLichSuDuBao(controller.signal)
//       .then(rows => {
//         setHistory(rows);
//         setSelectedCode(current => current || rows[0]?.ma_lich_su_du_bao || "");
//         setHistoryError("");
//       })
//       .catch(cause => {
//         if (!controller.signal.aborted) setHistoryError(cause instanceof Error ? cause.message : "Không tải được lịch sử dự báo.");
//       })
//       .finally(() => { if (!controller.signal.aborted) setLoadingHistory(false); });
//     return () => controller.abort();
//   }, []);

//   useEffect(() => {
//     if (!selectedCode) {
//       setDetail(null);
//       return;
//     }
//     const controller = new AbortController();
//     setLoadingDetail(true);
//     setError("");
//     layChiTietDuBao(selectedCode, controller.signal)
//       .then(result => setDetail(result))
//       .catch(cause => {
//         if (!controller.signal.aborted) {
//           setDetail(null);
//           setError(cause instanceof Error ? cause.message : "Không tải được kết quả dự báo.");
//         }
//       })
//       .finally(() => { if (!controller.signal.aborted) setLoadingDetail(false); });
//     return () => controller.abort();
//   }, [selectedCode]);

//   useEffect(() => setSelectedCodeProduct(""), [selectedCode]);

//   const products = detail?.ket_qua ?? [];
//   const productTotals = products.map(product => ({
//     code: product.ma_san_pham,
//     name: product.ten_san_pham || product.ma_san_pham,
//     forecast: product.tong_du_bao ?? product.ket_qua.reduce((sum, week) => sum + week.so_luong_du_bao, 0),
//     baseline: product.tong_ky_truoc,
//     difference: product.chenh_lech,
//   })).sort((a, b) => b.forecast - a.forecast);
//   const totalForecast = productTotals.reduce((sum, item) => sum + item.forecast, 0);
//   const totalBaseline = productTotals.reduce((sum, item) => sum + (item.baseline ?? 0), 0);
//   const baselineCount = productTotals.filter(item => item.baseline != null).length;
//   const selectedProduct = products.find(item => item.ma_san_pham === selectedCodeProduct) ?? products[0] ?? null;
//   const chartProduct = selectedProduct ?? products[0] ?? null;
//   const weekly = chartProduct?.ket_qua ?? [];

//   return (
//     <div className="ud-container ud-forecast-run">
//       <div className="ud-filter-card">
//         <label className="ud-filter-group">
//           <span className="ud-filter-label">Mã lần dự báo</span>
//           <select className="ud-select" value={selectedCode} onChange={event => setSelectedCode(event.target.value)} disabled={loadingHistory || history.length === 0}>
//             {history.length === 0 && <option value="">Chưa có lịch sử</option>}
//             {history.map(item => <option key={item.ma_lich_su_du_bao} value={item.ma_lich_su_du_bao}>{item.ma_lich_su_du_bao} · {new Date(item.thoi_gian_chay).toLocaleString("vi-VN")}</option>)}
//           </select>
//         </label>
//         {detail && <span className="ud-history-meta">{detail.tong_san_pham} sản phẩm · chạy {new Date(detail.thoi_gian_chay).toLocaleString("vi-VN")}</span>}
//       </div>

//       {loadingHistory && <div className="ud-loading-box" role="status">Đang tải lịch sử dự báo…</div>}
//       {historyError && <div className="ud-empty-box" role="alert">{historyError}</div>}
//       {!loadingHistory && !historyError && history.length === 0 && <div className="ud-empty-box" role="status">Chưa có lần dự báo nào được lưu.</div>}
//       {loadingDetail && <div className="ud-loading-box" role="status">Đang tải dashboard cho lần dự báo…</div>}
//       {error && <div className="ud-empty-box" role="alert">{error}</div>}
//       {detail && !loadingDetail && (
//         <>
//           <Kpis items={[
//             { label: "Tổng nhu cầu dự báo", value: fmt(totalForecast), note: "Cộng theo sản phẩm trong lần chạy đã chọn." },
//             { label: "Sản phẩm dự báo", value: fmt(products.length) },
//             { label: "Chênh lệch với kỳ tham chiếu", value: baselineCount ? fmt(totalForecast - totalBaseline) : "—", note: baselineCount ? "Chỉ cộng các sản phẩm có dữ liệu tham chiếu." : "Lần chạy này không có dữ liệu kỳ tham chiếu." },
//             { label: "Số tuần", value: fmt(detail.so_tuan_du_bao) },
//           ]} />
//           <div className="ud-filter-card">
//             <label className="ud-filter-group">
//               <span className="ud-filter-label">Sản phẩm xem chi tiết</span>
//               <select className="ud-select" value={chartProduct?.ma_san_pham ?? ""} onChange={event => setSelectedCodeProduct(event.target.value)}>
//                 {products.map(item => <option key={item.ma_san_pham} value={item.ma_san_pham}>{item.ten_san_pham || item.ma_san_pham} ({item.ma_san_pham})</option>)}
//               </select>
//             </label>
//             <span className="ud-empty-inline">Màu xanh: dự báo · màu cam: kỳ tham chiếu</span>
//           </div>
//           <div className="ud-charts-grid">
//             <section className="ud-chart-card">
//               <div className="ud-chart-header"><div><h3 className="ud-chart-title">Dự báo và kỳ tham chiếu theo tuần</h3><p className="ud-chart-subtitle">{chartProduct?.ten_san_pham || chartProduct?.ma_san_pham || "Sản phẩm"}</p></div></div>
//               {weekly.length ? <div className="ud-chart-canvas-wrap"><Line data={{ labels: weekly.map(item => `${item.tu_ngay} – ${item.den_ngay}`), datasets: [
//                 { label: "Lượng dự báo", data: weekly.map(item => item.so_luong_du_bao), borderColor: CHART_COLORS.primary, backgroundColor: CHART_COLORS.primaryLight, tension: 0.25, fill: true },
//                 ...(weekly.some(item => item.ky_truoc != null) ? [{ label: "Kỳ tham chiếu", data: weekly.map(item => item.ky_truoc ?? 0), borderColor: CHART_COLORS.orange, backgroundColor: CHART_COLORS.warningLight, tension: 0.25 }] : []),
//               ] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true } } }} /></div> : <p className="ud-empty-inline">Lần chạy chưa có chi tiết theo tuần.</p>}
//             </section>
//             <section className="ud-chart-card">
//               <div className="ud-chart-header"><div><h3 className="ud-chart-title">Sản phẩm có nhu cầu dự báo cao</h3><p className="ud-chart-subtitle">Tối đa 10 sản phẩm trong lần chạy.</p></div></div>
//               {productTotals.length ? <div className="ud-chart-canvas-wrap"><Bar data={{ labels: productTotals.slice(0, 10).map(item => item.name), datasets: [{ label: "Lượng dự báo", data: productTotals.slice(0, 10).map(item => item.forecast), backgroundColor: CHART_COLORS.palette, borderRadius: 5 }] }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }} /></div> : <p className="ud-empty-inline">Lần chạy chưa có sản phẩm.</p>}
//             </section>
//           </div>
//           <StatsTable title="Chênh lệch dự báo theo sản phẩm" rows={productTotals} rowKey={item => item.code} columns={[
//             { title: "Mã sản phẩm", value: item => item.code },
//             { title: "Sản phẩm", value: item => item.name },
//             { title: "Lượng dự báo", value: item => fmt(item.forecast) },
//             { title: "Kỳ tham chiếu", value: item => fmt(item.baseline) },
//             { title: "Chênh lệch", value: item => fmt(item.difference) },
//           ]} />
//         </>
//       )}
//     </div>
//   );
// }
