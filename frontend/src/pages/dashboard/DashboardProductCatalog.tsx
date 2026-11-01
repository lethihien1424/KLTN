// import { useCallback } from "react";
// import { Bar, Doughnut } from "react-chartjs-2";
// import { getProducts, type Product } from "../../services/sanPhamService";
// import { CHART_COLORS } from "./chartSetup";
// import { Comparison, fmt, money, StatsFrame, useStats } from "./dashboardUI";
// import "../../styles/unifiedDashboard.css";

// async function getAllProducts(): Promise<Product[]> {
//   const rows: Product[] = [];
//   let page = 1;
//   let total = Number.POSITIVE_INFINITY;
//   while (rows.length < total) {
//     const result = await getProducts(
//       { search: "", nhom: "", trang_thai: "" },
//       page,
//       100,
//     );
//     total = result.total;
//     rows.push(...result.items);
//     if (result.items.length === 0 || rows.length >= total) break;
//     page += 1;
//   }
//   return rows;
// }

// export default function DashboardProductCatalog() {
//   const fetcher = useCallback(() => getAllProducts(), []);
//   const resource = useStats(fetcher);
//   const products = resource.data ?? [];
//   const active = products.filter(item => item.trang_thai === "DANG_KINH_DOANH").length;
//   const inactive = products.length - active;
//   const groups = new Map<string, number>();
//   products.forEach(item => {
//     const group = item.nhom_san_pham?.trim() || "Chưa phân nhóm";
//     groups.set(group, (groups.get(group) ?? 0) + 1);
//   });
//   const groupRows = [...groups.entries()]
//     .map(([name, count]) => ({ name, count }))
//     .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
//   const prices = [...products].sort((a, b) => Number(a.don_gia) - Number(b.don_gia));
//   const lowPrices = prices.slice(0, 4).map(item => ({ ...item, priceGroup: "Thấp" }));
//   const lowCodes = new Set(lowPrices.map(item => item.ma_san_pham));
//   const highPrices = [...prices].reverse()
//     .filter(item => !lowCodes.has(item.ma_san_pham))
//     .slice(0, 4)
//     .map(item => ({ ...item, priceGroup: "Cao" }));
//   const chartPrices = [...lowPrices, ...highPrices];

//   return (
//     <StatsFrame resource={resource} note="Thống kê theo danh mục sản phẩm đang lưu trong hệ thống.">
//       {resource.data && (
//         <>
//           <div className="ud-charts-grid">
//             <section className="ud-chart-card">
//               <div className="ud-chart-header"><div><h3 className="ud-chart-title">Sản phẩm giá thấp nhất và cao nhất</h3><p className="ud-chart-subtitle">Xanh lá: nhóm giá thấp · xanh dương: nhóm giá cao · đơn giá VNĐ.</p></div></div>
//               {chartPrices.length ? <div className="ud-chart-canvas-wrap"><Bar data={{
//                 labels: chartPrices.map(item => item.ten_san_pham),
//                 datasets: [{ label: "Đơn giá (VNĐ)", data: chartPrices.map(item => Number(item.don_gia)), backgroundColor: chartPrices.map(item => item.priceGroup === "Thấp" ? CHART_COLORS.secondary : CHART_COLORS.primary), borderRadius: 5 }],
//               }} options={{ responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => money(Number(context.raw)) } } }, scales: { x: { beginAtZero: true, ticks: { callback: value => money(Number(value)) } } } }} /></div> : <p className="ud-empty-inline">Chưa có dữ liệu giá.</p>}
//             </section>
//             <section className="ud-chart-card">
//               <div className="ud-chart-header"><div><h3 className="ud-chart-title">Trạng thái kinh doanh</h3><p className="ud-chart-subtitle">Số sản phẩm đang bán và đã ngừng bán.</p></div></div>
//               <div className="ud-chart-canvas-wrap"><Doughnut data={{ labels: ["Đang kinh doanh", "Ngừng kinh doanh"], datasets: [{ data: [active, inactive], backgroundColor: [CHART_COLORS.secondary, CHART_COLORS.danger], borderColor: "#fff", borderWidth: 2 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} /></div>
//             </section>
//           </div>
//           <Comparison title="Số lượng sản phẩm theo nhóm" labels={groupRows.map(item => item.name)} series={[{ label: "Sản phẩm", values: groupRows.map(item => item.count) }]} />
//         </>
//       )}
//     </StatsFrame>
//   );
// }
