import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import ActionIconButton from "../../components/common/ActionIconButton";
import DataTable from "../../components/common/DataTable";
import { PageHeader, SearchInput, FilterSelect, Field, FormDrawer, LoadingState, ErrorState, EmptyState,
  useResource, formatDate, formatNumber } from "../../components/common/PurchaseUI";
import { listDeliveryReceipts, getDeliveryReceipt, formatDeliveryMoney, receiptNumber, type DeliveryReceipt, type ReceiptFilters } from "../../services/deliveryService";
import { useDeliveryExcel } from "../nha-cung-cap/useDeliveryExcel";
import SupplierDeliveryDetail from "../nha-cung-cap/SupplierDeliveryDetail";
import { useReceiptPriceExcel } from './useReceiptPriceExcel';
import { navigate, useLocation } from "../../routes/navigation";
import { listSuppliers } from "../../services/nhaCungCapService";

const sourceLabel = (r: DeliveryReceipt) => r.nguon === "LICH_SU" ? "Quá khứ · không cộng kho" : "Nhận kho thực tế";
const timingLabel = (r: DeliveryReceipt) => r.dung_han === null ? "Chưa có hàng giao" : r.dung_han ? "Đúng hạn" : "Trễ hạn";

export function ReceiptDetail({ code, onClose }: { code: string; onClose: () => void }) {
  const { can } = useAuth();
  const resource = useResource(() => getDeliveryReceipt(code), [code]);
  const [supplier, setSupplier] = useState("");
  const row = resource.data;
  return <>
    <FormDrawer open title={row ? `Chi tiết lần nhập · ${receiptNumber(row)}` : "Chi tiết lần nhập"} onClose={onClose}>
      {resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : row && <>
        <p><strong>Phiếu nhận:</strong> {receiptNumber(row)} · {sourceLabel(row)}</p>
        <p><strong>Đơn mua:</strong> {row.ma_don_mua && can("DON_MUA_VIEW") ? <a className="pm-link" href={`#/don-mua/${encodeURIComponent(row.ma_don_mua)}`}>{row.ma_don_mua}</a> : row.ma_don_mua || row.ma_don_cu} {row.lan_giao_cu && `· Đợt ${row.lan_giao_cu}`}</p>
        <p><strong>Nhà cung cấp:</strong> {row.ten_ncc} ({row.ma_ncc})</p>
        <p>Ngày dự kiến: {formatDate(row.ngay_du_kien_giao)} · Ngày nhận thực tế: {formatDate(row.ngay_giao_thuc_te)}</p>
        <p>{row.hoan_tat ? "Đã chốt đơn" : "Còn giao tiếp"} · {timingLabel(row)} của đợt này.</p>
        <p><strong>Người xác nhận:</strong> {row.ten_nguoi_xac_nhan} ({row.nguoi_xac_nhan})</p>
        <p><strong>Ghi chú:</strong> {row.ghi_chu || "—"}</p>
        {row.nguon === "LICH_SU" && <p className="pm-help">Dữ liệu quá khứ dùng để đánh giá NCC; không cộng tồn hiện tại và không có giao dịch tồn kho.</p>}
        {row.chi_tiet.some((line) => line.so_luong_dat_chat_luong === null) && <p className="pm-help">Có nguyên liệu chưa có kết quả kiểm định chất lượng. Số chấp nhận nhập kho không được coi là số đạt chất lượng.</p>}
        <p className="pm-help">Số đặt là số của đơn; số giao và số chấp nhận là của riêng đợt này. Tồn trước/sau lấy từ giao dịch kho liên kết và hiển thị theo đơn vị tồn kho.</p>
        <DataTable rows={row.chi_tiet} rowKey={(line) => line.id} columns={[
          { key: "material", label: "Nguyên liệu", render: (line) => <>{line.ten_nguyen_lieu}<div className="pm-small">{line.ma_nguyen_lieu} · {line.don_vi}</div></> },
          { key: "ordered", label: "Số đặt", numeric: true, render: (line) => formatNumber(line.so_luong_dat) },
          { key: "delivered", label: "Số giao", numeric: true, render: (line) => formatNumber(line.so_luong_giao) },
          { key: "accepted", label: "Chấp nhận nhập kho", numeric: true, render: (line) => `${formatNumber(line.so_luong_nhap_kho)} ${line.don_vi}` },
          { key: "price", label: "Đơn giá", numeric: true, render: (line) => <>{formatDeliveryMoney(line.don_gia_mua)}{line.don_gia_mua != null && <div className="pm-small">VND/{line.don_vi_don_gia}</div>}</> },
          { key: "amount", label: "Thành tiền", numeric: true, render: (line) => formatDeliveryMoney(line.thanh_tien) },
          { key: "quality", label: "Chất lượng đạt / không đạt", render: (line) => line.so_luong_dat_chat_luong === null ? "Chưa có kết quả" : `${formatNumber(line.so_luong_dat_chat_luong)} / ${formatNumber(line.so_luong_khong_dat)} ${line.don_vi}` },
          { key: "before", label: "Tồn trước", render: (line) => line.ton_truoc === null ? "Không có lịch sử kho" : `${formatNumber(line.ton_truoc)} ${line.don_vi_ton_kho}` },
          { key: "after", label: "Tồn sau", render: (line) => line.ton_sau === null ? "Không có lịch sử kho" : `${formatNumber(line.ton_sau)} ${line.don_vi_ton_kho}` },
          { key: "reason", label: "Lý do", render: (line) => line.ly_do || "—" },
          { key: "actions", label: "Tham khảo", render: (line) => can("GOI_Y_NHA_CUNG_CAP_VIEW") && <a className="pm-link" href={`#/goi-y?material=${encodeURIComponent(line.ma_nguyen_lieu)}`}>Gợi ý NCC</a> },
        ]} />
        <p><strong>Tổng giá trị nhập:</strong> {formatDeliveryMoney(row.tong_gia_tri_nhap)}</p>
        {can("NHA_CUNG_CAP_PERFORMANCE_VIEW") && <button className="pm-btn" onClick={() => setSupplier(row.ma_ncc)}>Hiệu suất nhà cung cấp</button>}
      </>}
    </FormDrawer>
    {supplier && <SupplierDeliveryDetail code={supplier} onClose={() => setSupplier("")} />}
  </>;
}

export default function LichSuNhapNguyenLieuPage() {
  const { can } = useAuth();
  const { params } = useLocation();
  const ma_ncc = params.get("ma_ncc") ?? "";
  const response = useResource(async () => ({ ma_ncc, rows: await listDeliveryReceipts({ ma_ncc }) }), [ma_ncc]);
  // Keep a previous supplier's response hidden while the URL filter is changing.
  const resource = { ...response,
    data: response.data?.ma_ncc === ma_ncc ? response.data.rows : null,
    loading: response.loading || (!response.error && response.data?.ma_ncc !== ma_ncc),
  };
  const canViewSuppliers = can("NHA_CUNG_CAP_VIEW");
  const supplierOptions = useResource(async () => {
    // History-only users can still choose suppliers represented in receipt history.
    const rows = canViewSuppliers ? await listSuppliers() : await listDeliveryReceipts();
    return Array.from(new Map(rows.map((row) => [row.ma_ncc, row.ten_ncc])));
  }, [canViewSuppliers]);
  const [detail, setDetail] = useState("");
  useEffect(() => setDetail(""), [ma_ncc]);
  const [draftFilters, setFilters] = useState<Omit<ReceiptFilters, "ma_ncc">>({ search: "", ngay_nhan_tu: "", ngay_nhan_den: "", ma_nguyen_lieu: "", ma_don_mua: "" });
  const filters: ReceiptFilters = { ...draftFilters, ma_ncc };
  const change = (key: keyof ReceiptFilters, value: string) => {
    if (key === "ma_ncc") {
      const next = new URLSearchParams(params);
      if (value) next.set("ma_ncc", value); else next.delete("ma_ncc");
      navigate("/lich-su-nhap-nguyen-lieu", Object.fromEntries(next));
    } else setFilters((old) => ({ ...old, [key]: value }));
  };
  const invalidDates = Boolean(filters.ngay_nhan_tu && filters.ngay_nhan_den && filters.ngay_nhan_tu > filters.ngay_nhan_den);
  const excel = useDeliveryExcel(resource.refetch, { filters, loading: resource.loading || Boolean(resource.error) || invalidDates });
  const priceExcel = useReceiptPriceExcel(resource.refetch, filters, resource.loading || Boolean(resource.error) || invalidDates);
  const suppliers = useMemo(() => {
    const options = new Map(supplierOptions.data ?? []);
    for (const row of resource.data ?? []) options.set(row.ma_ncc, row.ten_ncc);
    if (ma_ncc && !options.has(ma_ncc)) options.set(ma_ncc, ma_ncc);
    return Array.from(options);
  }, [supplierOptions.data, resource.data, ma_ncc]);
  const materials = useMemo(() => Array.from(new Map((resource.data ?? []).flatMap((r) => r.chi_tiet.map((line) => [line.ma_nguyen_lieu, line.ten_nguyen_lieu] as const)))), [resource.data]);
  const rows = useMemo(() => (resource.data ?? []).filter((r) => {
    const term = filters.search.trim().toLowerCase();
    return (!term || [r.ma_phieu_nhap, r.ma_phieu_nhan, r.ma_don_mua, r.ma_don_cu, r.ma_ncc, r.ten_ncc,
      ...r.chi_tiet.flatMap((line) => [line.ma_nguyen_lieu, line.ten_nguyen_lieu])].some((v) => v?.toLowerCase().includes(term))) &&
      (!filters.ngay_nhan_tu || r.ngay_giao_thuc_te >= filters.ngay_nhan_tu) &&
      (!filters.ngay_nhan_den || r.ngay_giao_thuc_te <= filters.ngay_nhan_den) &&
      (!filters.ma_ncc || r.ma_ncc === filters.ma_ncc) &&
      (!filters.ma_nguyen_lieu || r.chi_tiet.some((line) => line.ma_nguyen_lieu === filters.ma_nguyen_lieu)) &&
      (!filters.ma_don_mua.trim() || (r.ma_don_mua || r.ma_don_cu) === filters.ma_don_mua.trim()) &&
      (!filters.ma_phieu_nhap?.trim() || r.ma_phieu_nhap === filters.ma_phieu_nhap.trim());
  }), [resource.data, filters]);
  return <>
    <PageHeader title="Lịch sử nhập nguyên liệu" description="Theo dõi từng lần nhà cung cấp giao hàng và số lượng chấp nhận nhập kho." actions={<>{excel.buttons}{priceExcel.button}</>} />
    {excel.feedback}
    {priceExcel.feedback}
    <section className="pm-panel">
      <div className="pm-toolbar">
        <SearchInput value={filters.search} onChange={(v) => change("search", v)} />
        <Field label="Mã phiếu nhận"><input placeholder="PN0001" value={filters.ma_phieu_nhap || ""} onChange={(e) => change("ma_phieu_nhap", e.target.value)} /></Field>
        <Field label="Ngày nhận từ"><input type="date" value={filters.ngay_nhan_tu} onChange={(e) => change("ngay_nhan_tu", e.target.value)} /></Field>
        <Field label="Ngày nhận đến"><input type="date" value={filters.ngay_nhan_den} onChange={(e) => change("ngay_nhan_den", e.target.value)} /></Field>
        <FilterSelect label="Nhà cung cấp" value={filters.ma_ncc} onChange={(v) => change("ma_ncc", v)} options={[{ value: "", label: "Tất cả NCC" }, ...suppliers.map(([value, label]) => ({ value, label: `${value} · ${label}` }))]} />
        <FilterSelect label="Nguyên liệu" value={filters.ma_nguyen_lieu} onChange={(v) => change("ma_nguyen_lieu", v)} options={[{ value: "", label: "Tất cả nguyên liệu" }, ...materials.map(([value, label]) => ({ value, label: `${value} · ${label}` }))]} />
        <Field label="Mã đơn mua"><input value={filters.ma_don_mua} onChange={(e) => change("ma_don_mua", e.target.value)} placeholder="Mã đơn mua hoặc đơn cũ" /></Field>
        <button className="pm-btn" onClick={resource.refetch}>Làm mới</button>
      </div>
      <p className="pm-help">Mỗi dòng là một phiếu nhận. Tổng thực nhận cộng riêng từng đơn vị và gồm toàn bộ nguyên liệu của phiếu. Dữ liệu quá khứ được đánh dấu và không cộng vào tồn kho hiện tại.</p>
      {invalidDates ? <p role="alert">Ngày nhận từ không được sau ngày nhận đến.</p> : resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : ma_ncc && resource.data?.length === 0 ? <EmptyState title="Nhà cung cấp này chưa có lịch sử nhập hàng" /> : <DataTable key={ma_ncc} rows={rows} rowKey={(r) => r.ma_phieu_nhan} columns={[
        { key: "code", label: "Mã phiếu nhận", render: (r) => <>{receiptNumber(r)}<div className="pm-small">{sourceLabel(r)}</div></> },
        { key: "date", label: "Ngày nhận", render: (r) => formatDate(r.ngay_giao_thuc_te) },
        { key: "supplier", label: "Nhà cung cấp", render: (r) => <>{r.ten_ncc}<div className="pm-small">{r.ma_ncc}</div></> },
        { key: "order", label: "Mã đơn mua", render: (r) => r.ma_don_mua || r.ma_don_cu },
        { key: "materials", label: "Số nguyên liệu", numeric: true, render: (r) => r.so_nguyen_lieu },
        { key: "total", label: "Tổng thực nhận", render: (r) => r.tong_thuc_nhan.map((t) => <div key={t.don_vi}>{formatNumber(t.so_luong)} {t.don_vi}</div>) },
        { key: "value", label: "Tổng giá trị nhập", numeric: true, render: (r) => formatDeliveryMoney(r.tong_gia_tri_nhap) },
        { key: "status", label: "Trạng thái giao hàng", render: (r) => <><span className={`pm-badge ${r.hoan_tat ? "success" : "warning"}`}>{r.hoan_tat ? "Đã chốt" : "Còn giao tiếp"}</span><div className="pm-small">{timingLabel(r)}</div></> },
        { key: "actions", label: "Thao tác", render: (r) => <ActionIconButton action="view" label="Chi tiết lần nhập" onClick={() => setDetail(r.ma_phieu_nhan)} /> },
      ]} />}
    </section>
    {excel.dialogs}
    {priceExcel.dialog}
    {detail && <ReceiptDetail key={detail} code={detail} onClose={() => setDetail("")} />}
  </>;
}
