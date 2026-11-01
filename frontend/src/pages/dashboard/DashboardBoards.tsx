import { useCallback, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { canViewDashboard } from "../../auth/dashboardPolicy";
import { layLichSuDuBao, layChiTietDuBao } from "../../services/duBaoService";
import {
  fetchOrderUsage, fetchMaterialDemandStats, fetchSupplierMaterialsStats,
  fetchSupplierScores, fetchSupplierSuggestionStats, fetchAccountStatistics,
} from "../../services/dashboardService";
import { ChartCard, Frame, finite, useBoardData, useUnit, UnitSelect } from "./DashboardVisuals";

function formatDateInput(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentWeekRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    from: formatDateInput(start),
    to: formatDateInput(end),
  };
}
const getHistory = () => layLichSuDuBao();
function ForecastDetail({ code }: { code: string }) {
  const fetcher = useCallback(() => layChiTietDuBao(code), [code]);
  const resource = useBoardData(fetcher);
  const products = resource.data?.ket_qua ?? [];
  const [selected, setSelected] = useState("");
  const product = products.find(p => p.ma_san_pham === selected) ?? products[0];
  const weeks = product?.ket_qua ?? [];
  return <Frame resource={resource} note={`Kết quả lần dự báo ${code}. Kỳ tham chiếu không phải lượng thực tế tương lai.`}>
    <div className="dv-filters"><label className="dv-field">Sản phẩm<select value={product?.ma_san_pham ?? ""} onChange={e => setSelected(e.target.value)}>{products.map(p => <option key={p.ma_san_pham} value={p.ma_san_pham}>{p.ten_san_pham || p.ma_san_pham}</option>)}</select></label></div>
    <div className="dv-grid">
      <ChartCard title="Dự báo và kỳ tham chiếu theo tuần" kind="line" labels={weeks.map(w => `${w.tu_ngay} – ${w.den_ngay}`)} series={[{ label: "Dự báo", values: weeks.map(w => w.so_luong_du_bao) }, { label: "Kỳ tham chiếu", values: weeks.map(w => w.ky_truoc ?? null) }]} />
      <ChartCard title="Chênh lệch theo tuần" note="Dự báo trừ kỳ tham chiếu; bỏ trống khi chưa có tham chiếu." labels={weeks.map(w => w.tu_ngay)} series={[{ label: "Chênh lệch", values: weeks.map(w => w.ky_truoc == null ? null : w.so_luong_du_bao - w.ky_truoc) }]} />
      <ChartCard title="Nhu cầu theo sản phẩm" labels={products.map(p => p.ten_san_pham || p.ma_san_pham)} series={[{ label: "Lượng dự báo", values: products.map(p => p.tong_du_bao ?? p.ket_qua.reduce((s, w) => s + w.so_luong_du_bao, 0)) }]} horizontal />
      <ChartCard title="Chênh lệch theo sản phẩm" labels={products.map(p => p.ten_san_pham || p.ma_san_pham)} series={[{ label: "Dự báo − tham chiếu", values: products.map(p => p.tong_ky_truoc == null ? null : (p.tong_du_bao ?? p.ket_qua.reduce((s, w) => s + w.so_luong_du_bao, 0)) - p.tong_ky_truoc) }]} horizontal />
    </div>
  </Frame>;
}
export function ForecastBoard() {
  const resource = useBoardData(getHistory);
  const [selected, setSelected] = useState("");
  const history = resource.data ?? [];
  const code = history.some(r => r.ma_lich_su_du_bao === selected) ? selected : history[0]?.ma_lich_su_du_bao ?? "";
  return <Frame resource={resource} note="Chọn mã lịch sử để xem các biểu đồ của cùng một lần dự báo.">
    <label className="dv-field">Mã lần dự báo<select value={code} onChange={e => setSelected(e.target.value)}>{!history.length && <option value="">Chưa có lịch sử</option>}{history.map(r => <option key={r.ma_lich_su_du_bao} value={r.ma_lich_su_du_bao}>{r.ma_lich_su_du_bao} · {new Date(r.thoi_gian_chay).toLocaleString("vi-VN")}</option>)}</select></label>
    {code ? <div className="dv-run" key={code}><ForecastDetail code={code} /></div> : <p className="dv-state">Chưa có lần dự báo nào.</p>}
  </Frame>;
}
function DemandCharts() {
  const resource = useBoardData(fetchMaterialDemandStats);
  const [order, setOrder] = useState("most");
  const all = resource.data?.all_demand ?? [];
  const { units, unit, setUnit } = useUnit(all.map(r => r.don_vi_do_luong));
  const rows = all.filter(r => r.don_vi_do_luong === unit).sort((a, b) => order === "most" ? b.nhu_cau - a.nhu_cau : a.nhu_cau - b.nhu_cau).slice(0, 10);
  return <Frame resource={resource} note="Cân đối theo kết quả dự báo nguyên liệu đã lưu.">
    {!resource.data?.co_du_lieu_du_bao ? <p className="dv-state">{resource.data?.thong_bao || "Chưa có dữ liệu dự báo nguyên liệu."}</p> : <>
      <div className="dv-filters"><UnitSelect values={units} selected={unit} onChange={setUnit} /><label className="dv-field">Nhu cầu<select value={order} onChange={e => setOrder(e.target.value)}><option value="most">Nhiều nhất</option><option value="least">Ít nhất</option></select></label></div>
      <ChartCard title="Nhu cầu, khả dụng, an toàn và cần mua" labels={rows.map(r => r.ten_nguyen_lieu)} series={[{ label: `Nhu cầu (${unit})`, values: rows.map(r => r.nhu_cau) }, { label: "Khả dụng", values: rows.map(r => r.ton_kho_kha_dung) }, { label: "An toàn", values: rows.map(r => r.ton_kho_an_toan) }, { label: "Cần mua", values: rows.map(r => r.luong_can_mua) }]} />
    </>}
  </Frame>;
}
export function ForecastDemandBoard() {
  const { user } = useAuth();
  return <div className="dv-subsections">
    {canViewDashboard(user.permissions, "prophet") && <ForecastBoard />}
    {canViewDashboard(user.permissions, "demand") && <DemandCharts />}
  </div>;
}

export function SalesBoard() {
  const [period, setPeriod] = useState<"tuan" | "thang" | "nam">("thang");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [weekRange, setWeekRange] = useState(currentWeekRange);
  const labels = {
    period: "K\u1ef3 b\u00e1n h\u00e0ng",
    week: "Tu\u1ea7n",
    month: "Th\u00e1ng",
    year: "N\u0103m",
    from: "T\u1eeb ng\u00e0y",
    to: "\u0110\u1ebfn ng\u00e0y",
    productUnit: "\u0110\u01a1n v\u1ecb s\u1ea3n ph\u1ea9m",
    materialUnit: "\u0110\u01a1n v\u1ecb nguy\u00ean li\u1ec7u",
    mostSold: "S\u1ea3n ph\u1ea9m b\u00e1n nhi\u1ec1u nh\u1ea5t",
    leastSold: "S\u1ea3n ph\u1ea9m b\u00e1n \u00edt nh\u1ea5t",
    formula: "C\u00f4ng th\u1ee9c \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng nhi\u1ec1u nh\u1ea5t",
    material: "Nguy\u00ean li\u1ec7u s\u1eed d\u1ee5ng nhi\u1ec1u nh\u1ea5t",
    note: "S\u1ed1 li\u1ec7u s\u1ea3n ph\u1ea9m, c\u00f4ng th\u1ee9c v\u00e0 nguy\u00ean li\u1ec7u \u0111\u01b0\u1ee3c t\u00ednh t\u1eeb \u0111\u01a1n h\u00e0ng.",
    samePeriod: "S\u1ed1 li\u1ec7u \u0111\u01a1n h\u00e0ng c\u00f9ng k\u1ef3",
    estimate: "\u01af\u1edbc t\u00ednh theo s\u1ed1 s\u1ea3n ph\u1ea9m b\u00e1n v\u00e0 h\u1ec7 s\u1ed1 thu h\u1ed3i c\u1ee7a c\u00f4ng th\u1ee9c.",
  };
  const fetcher = useCallback(() => fetchOrderUsage({
    period_type: period,
    year,
    month: period === "thang" ? month : undefined,
    from_date: period === "tuan" ? weekRange.from : undefined,
    to_date: period === "tuan" ? weekRange.to : undefined,
  }), [period, year, month, weekRange.from, weekRange.to]);
  const resource = useBoardData(fetcher);
  const products = resource.data?.products ?? [];
  const formulas = resource.data?.formulas ?? [];
  const materials = resource.data?.materials ?? [];
  const { units, unit, setUnit } = useUnit(products.map(row => row.don_vi_tinh));
  const productRows = products.filter(row => row.don_vi_tinh === unit).sort((a, b) => b.so_luong_ban - a.so_luong_ban);
  const materialUnits = [...new Set(materials.map(row => row.don_vi_do_luong))].sort();
  const [materialUnit, setMaterialUnit] = useState("");
  const selectedMaterialUnit = materialUnits.includes(materialUnit) ? materialUnit : materialUnits[0] ?? "";
  const materialRows = materials.filter(row => row.don_vi_do_luong === selectedMaterialUnit).sort((a, b) => b.so_luong_su_dung - a.so_luong_su_dung);
  return <>
    <div className="dv-filters">
      <label className="dv-field">{labels.period}<select value={period} onChange={event => { const next = event.target.value as typeof period; if (next === "tuan" && period !== "tuan") setWeekRange(currentWeekRange()); setPeriod(next); }}><option value="tuan">{labels.week}</option><option value="thang">{labels.month}</option><option value="nam">{labels.year}</option></select></label>
      {period === "tuan" ? <>
        <label className="dv-field">{labels.from}<input type="date" value={weekRange.from} max={weekRange.to} onChange={event => setWeekRange(previous => ({ ...previous, from: event.target.value }))} /></label>
        <label className="dv-field">{labels.to}<input type="date" value={weekRange.to} min={weekRange.from} onChange={event => setWeekRange(previous => ({ ...previous, to: event.target.value }))} /></label>
      </> : <>
        <label className="dv-field">{labels.year}<select value={year} onChange={event => setYear(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => new Date().getFullYear() + 1 - index).map(value => <option key={value}>{value}</option>)}</select></label>
        {period === "thang" && <label className="dv-field">{labels.month}<select value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => index + 1).map(value => <option key={value}>{value}</option>)}</select></label>}
      </>}
      <label className="dv-field">{labels.productUnit}<select value={unit} onChange={event => setUnit(event.target.value)}>{units.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="dv-field">{labels.materialUnit}<select value={selectedMaterialUnit} onChange={event => setMaterialUnit(event.target.value)}>{materialUnits.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <Frame resource={resource} note={resource.data ? `${resource.data.period_label} · ${labels.samePeriod}` : labels.note}>
      <div className="dv-grid">
        <ChartCard title={labels.mostSold} labels={productRows.slice(0, 8).map(row => row.ten_san_pham)} series={[{ label: `S\u1ed1 l\u01b0\u1ee3ng b\u00e1n (${unit})`, values: productRows.slice(0, 8).map(row => row.so_luong_ban) }]} horizontal />
        <ChartCard title={labels.leastSold} labels={[...productRows].reverse().slice(0, 8).map(row => row.ten_san_pham)} series={[{ label: `S\u1ed1 l\u01b0\u1ee3ng b\u00e1n (${unit})`, values: [...productRows].reverse().slice(0, 8).map(row => row.so_luong_ban) }]} horizontal />
        <ChartCard title={labels.formula} note={labels.estimate} labels={formulas.slice(0, 8).map(row => row.ten_cong_thuc)} series={[{ label: "L\u01b0\u1ee3t c\u00f4ng th\u1ee9c \u01b0\u1edbc t\u00ednh", values: formulas.slice(0, 8).map(row => row.so_luong_cong_thuc_su_dung) }]} horizontal />
        <ChartCard title={labels.material} labels={materialRows.slice(0, 8).map(row => row.ten_nguyen_lieu)} series={[{ label: `L\u01b0\u1ee3ng \u01b0\u1edbc t\u00ednh (${selectedMaterialUnit})`, values: materialRows.slice(0, 8).map(row => row.so_luong_su_dung) }]} horizontal />
      </div>
    </Frame>
  </>;
}

function SupplyCharts() {
  const resource = useBoardData(fetchSupplierMaterialsStats);
  const [metric, setMetric] = useState<"price" | "quality" | "ontime">("price");
  const [material, setMaterial] = useState("");
  const data = resource.data;
  const allItems = data?.all_items?.length
    ? data.all_items
    : [...(data?.highest_price_items ?? []), ...(data?.lowest_price_items ?? []), ...(data?.best_quality_items ?? []), ...(data?.worst_quality_items ?? []), ...(data?.best_ontime_items ?? []), ...(data?.worst_ontime_items ?? [])];
  const uniqueItems = [...new Map(allItems.map(item => [`${item.ma_nguyen_lieu}:${item.ma_ncc}`, item])).values()];
  const materials = [...new Map(uniqueItems.map(item => [item.ma_nguyen_lieu, item.ten_nguyen_lieu])).entries()];
  const selected = materials.some(([code]) => code === material) ? material : materials[0]?.[0] ?? "";
  const rows = uniqueItems.filter(item => item.ma_nguyen_lieu === selected);
  const metricLabels = { price: "Gi\u00e1", quality: "Ch\u1ea5t l\u01b0\u1ee3ng", ontime: "Giao \u0111\u00fang h\u1ea1n" };
  const values = rows.map(item => metric === "price" ? item.don_gia : metric === "quality" ? item.ty_le_chat_luong_dat : item.ty_le_giao_dung_han);
  return <Frame resource={resource} note={"So s\u00e1nh c\u00e1c nh\u00e0 cung c\u1ea5p c\u1ee7a c\u00f9ng m\u1ed9t nguy\u00ean li\u1ec7u."}>
    <div className="dv-filters">
      <label className="dv-field">{"Ch\u1ec9 ti\u00eau"}<select value={metric} onChange={event => setMetric(event.target.value as typeof metric)}><option value="price">{"Gi\u00e1"}</option><option value="quality">{"Ch\u1ea5t l\u01b0\u1ee3ng"}</option><option value="ontime">{"\u0110\u00fang h\u1ea1n"}</option></select></label>
      <label className="dv-field">{"Nguy\u00ean li\u1ec7u"}<select value={selected} onChange={event => setMaterial(event.target.value)}>{materials.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
    </div>
    <ChartCard title={`${metricLabels[metric]} theo nh\u00e0 cung c\u1ea5p`} labels={rows.map(item => item.ten_ncc)} series={[{ label: metricLabels[metric] + (metric === "price" ? " (VN\u0110)" : " (%)"), values }]} percent={metric !== "price"} />
  </Frame>;
}
function ScoreCharts() {
  const resource = useBoardData(fetchSupplierScores);
  const rows = [...(resource.data ?? [])].sort((a, b) => (finite(b.diem_ncc) ?? -Infinity) - (finite(a.diem_ncc) ?? -Infinity));
  return <Frame resource={resource} note={"\u0110i\u1ec3m th\u01b0\u01a1ng m\u1ea1i t\u1ed5ng h\u1ee3p c\u1ee7a nh\u00e0 cung c\u1ea5p."}>
    <ChartCard title={"\u0110i\u1ec3m th\u01b0\u01a1ng m\u1ea1i nh\u00e0 cung c\u1ea5p"} labels={rows.map(row => row.ten_ncc)} series={[{ label: "\u0110i\u1ec3m th\u01b0\u01a1ng m\u1ea1i", values: rows.map(row => finite(row.diem_ncc)) }]} horizontal />
  </Frame>;
}
function SuggestionCharts() {
  const resource = useBoardData(fetchSupplierSuggestionStats);
  const data = resource.data;
  const [mode, setMode] = useState<"top_suggested" | "least_suggested" | "not_suggested">("top_suggested");
  const rows = data?.[mode] ?? [];
  return <Frame resource={resource} note="Tần suất phải lấy từ lịch sử gợi ý thực tế.">
    {!data?.co_du_lieu_lich_su ? <p className="dv-state">{data?.thong_bao || "Chưa có lịch sử gợi ý để thống kê."}</p> : <>
      <div className="dv-filters"><label className="dv-field">Tần suất<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="top_suggested">Gợi ý nhiều nhất</option><option value="least_suggested">Gợi ý ít nhất</option><option value="not_suggested">Không được gợi ý</option></select></label></div>
      <ChartCard title="Tần suất nhà cung cấp được ưu tiên" note={mode === "not_suggested" ? rows.map(r => r.ten_ncc).join(" · ") || "Không có NCC trong danh sách này." : undefined} labels={rows.map(r => r.ten_ncc)} series={[{ label: "Số lần ưu tiên", values: rows.map(r => r.so_lan_goi_y_top1) }]} horizontal />
    </>}
  </Frame>;
}
export function SupplierBoard() {
  const { user } = useAuth();
  const canSeeSupplier = canViewDashboard(user.permissions, "supply") || canViewDashboard(user.permissions, "suppliers");
  const canSeeSuggestions = canViewDashboard(user.permissions, "suggestions");
  return <div className="dv-supplier-grid">
    {canSeeSupplier && <ScoreCharts />}
    {canSeeSupplier && <SupplyCharts />}
    {canSeeSuggestions && <div className="dv-supplier-suggestion"><SuggestionCharts /></div>}
  </div>;
}
function AccountCharts() {
  const resource = useBoardData(fetchAccountStatistics);
  const data = resource.data;
  const roles = [...(data?.vai_tro_distribution ?? [])].sort((a, b) => b.so_luong - a.so_luong);
  return <Frame resource={resource} note="Phân bổ vai trò, trạng thái và các lần đăng nhập thành công gần đây."><div className="dv-grid">
    <ChartCard title="Tài khoản theo vai trò" labels={roles.map(r => r.label)} series={[{ label: "Tài khoản", values: roles.map(r => r.so_luong) }]} horizontal />
    <ChartCard title="Trạng thái tài khoản" kind="donut" labels={["Đang hoạt động", "Ngừng hoạt động"]} series={[{ label: "Tài khoản", values: [data?.dang_hoat_dong ?? 0, data?.ngung_hoat_dong ?? 0] }]} />
  </div><div className="dv-login"><h3>Đăng nhập gần đây</h3><div className="dv-table"><table><thead><tr><th>Tài khoản</th><th>Vai trò</th><th>Thời gian đăng nhập</th></tr></thead><tbody>{(data?.recent_logins ?? []).map((r, i) => <tr key={`${r.ma_nguoi_dung}:${r.thoi_gian_dang_nhap}:${i}`}><td>{r.ten_tai_khoan}</td><td>{r.vai_tro}</td><td>{Number.isFinite(Date.parse(r.thoi_gian_dang_nhap)) ? new Date(r.thoi_gian_dang_nhap).toLocaleString("vi-VN") : "—"}</td></tr>)}{!data?.recent_logins?.length && <tr><td colSpan={3}>Chưa có lịch sử đăng nhập.</td></tr>}</tbody></table></div></div></Frame>;
}
export function AdministrationBoard() {
  const { user } = useAuth();
  return canViewDashboard(user.permissions, "accounts")
    ? <AccountCharts />
    : null;
}
