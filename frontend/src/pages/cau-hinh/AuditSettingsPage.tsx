import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import { PageHeader, Field, LoadingState, ErrorState, FormDrawer, useResource } from "../../components/common/PurchaseUI";
import { api, queryString } from "../../services/apiClient";
import { reasonFunctions } from "../../services/reasonService";
import { SettingsBreadcrumb } from "./SettingsPage";

type Audit = {
  ma_nhat_ky: string;
  thoi_gian: string;
  ma_nguoi_dung: string | null;
  ho_ten: string | null;
  module: string | null;
  chuc_nang: string | null;
  hanh_dong: string;
  ma_doi_tuong: string | null;
  ket_qua: string;
  du_lieu_truoc: Record<string, unknown>;
  du_lieu_sau: Record<string, unknown>;
  mo_ta: string | null;
};
type AuditList = { items: Audit[]; total: number; actors: { ma_nguoi_dung: string; ho_ten: string | null }[] };
const modules = ["Nguyên liệu", "Nhà cung cấp", "Mua hàng", "Duyệt kế hoạch mua hàng"];
const actions: Record<string, string> = {
  TAO_MOI: "Tạo mới", CHINH_SUA: "Chỉnh sửa", CAP_NHAT_TRANG_THAI: "Cập nhật trạng thái",
  DUYET: "Duyệt", TU_CHOI: "Từ chối", NHAN_HANG: "Nhận hàng", NHAP_DU_LIEU: "Nhập dữ liệu", XOA: "Xóa dữ liệu con",
};
const fields: Record<string, string> = {
  ma_nguyen_lieu: "Mã nguyên liệu", ten_nguyen_lieu: "Tên nguyên liệu", don_vi_do_luong: "Đơn vị đo lường",
  ma_ncc: "Mã nhà cung cấp", ten_ncc: "Tên nhà cung cấp", trang_thai: "Trạng thái",
  ma_don_mua: "Mã đơn mua", ma_de_xuat: "Mã đề xuất", so_luong_dat: "Số lượng đặt",
  so_luong_dat_kg: "Số lượng đặt (kg)", so_luong_de_xuat_kg: "Số lượng đề xuất (kg)",
  so_luong_nhan_kg: "Số lượng nhận (kg)", nguoi_tao: "Người tạo", nguoi_duyet: "Người duyệt",
  thoi_gian_duyet: "Thời gian duyệt", ly_do_tu_choi: "Lý do từ chối", ghi_chu: "Ghi chú",
  don_gia: "Đơn giá", tong_tien: "Tổng tiền", thanh_tien: "Thành tiền", don_gia_du_kien: "Đơn giá dự kiến",
  ma_cong_thuc: "Mã công thức", ten_cong_thuc: "Tên công thức", ty_le_phoi_tron: "Tỷ lệ phối trộn",
  ton_kho_thuc_te: "Tồn kho thực tế", so_luong_book: "Số lượng đặt trước", so_luong_ton_kho: "Số lượng tồn kho",
};
const actionLabel = (code: string) => actions[code] ?? reasonFunctions.find((f) => f.value === code)?.label ?? code;
const displayValue = (value: unknown) => value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value);
const timeLabel = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

export type HistoryScope = { entity: string; code: string };

export default function AuditSettingsPage({ scope }: { scope?: HistoryScope } = {}) {
  const [filters, setFilters] = useState({ search: "", module: "", hanh_dong: "", nguoi_thao_tac: "", tu_ngay: "", den_ngay: "" });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [selected, setSelected] = useState<Audit | null>(null);
  const invalidDates = Boolean(filters.tu_ngay && filters.den_ngay && filters.tu_ngay > filters.den_ngay);
  const resource = useResource(() => invalidDates
    ? Promise.reject(new Error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."))
    : api<AuditList>(`${scope ? `/nhat-ky-hoat-dong/doi-tuong/${encodeURIComponent(scope.entity)}/${encodeURIComponent(scope.code)}` : '/nhat-ky-hoat-dong'}${queryString({ ...filters, page, page_size: size })}`),
    [JSON.stringify(filters), page, size, scope?.entity, scope?.code]);
  const changeFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const before = selected?.du_lieu_truoc ?? {};
  const after = selected?.du_lieu_sau ?? {};
  const changedFields = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]));
  let reason: Record<string, unknown> = {};
  try { reason = JSON.parse(selected?.mo_ta ?? "{}"); } catch { /* Legacy free text has no structured reason. */ }
  return (
    <>
      {!scope && <>
        <SettingsBreadcrumb title="Nhật ký hoạt động" />
        <PageHeader title="Nhật ký hoạt động" description="Tra cứu lịch sử thay đổi dữ liệu nghiệp vụ thành công. Thời gian hiển thị theo giờ Việt Nam." actions={<a className="pm-btn" href="#/cau-hinh">← Cấu hình</a>} />
      </>}
      <section className="pm-panel">
        <div className="pm-toolbar">
          <Field label="Tìm kiếm"><input placeholder="Mã đối tượng, mã hoặc tên người thao tác..." value={filters.search} onChange={(e) => changeFilter("search", e.target.value)} /></Field>
          <Field label="Module"><select value={filters.module} onChange={(e) => changeFilter("module", e.target.value)}><option value="">Tất cả</option>{modules.map((name) => <option key={name}>{name}</option>)}</select></Field>
          <Field label="Hành động"><select value={filters.hanh_dong} onChange={(e) => changeFilter("hanh_dong", e.target.value)}><option value="">Tất cả</option>{Object.entries(actions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}{reasonFunctions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}</select></Field>
          <Field label="Người thao tác"><select value={filters.nguoi_thao_tac} onChange={(e) => changeFilter("nguoi_thao_tac", e.target.value)}><option value="">Tất cả</option>{resource.data?.actors?.map((actor) => <option key={actor.ma_nguoi_dung} value={actor.ma_nguoi_dung}>{actor.ho_ten ?? actor.ma_nguoi_dung} ({actor.ma_nguoi_dung})</option>)}</select></Field>
          <Field label="Từ ngày"><input type="date" value={filters.tu_ngay} onChange={(e) => changeFilter("tu_ngay", e.target.value)} /></Field>
          <Field label="Đến ngày"><input type="date" value={filters.den_ngay} onChange={(e) => changeFilter("den_ngay", e.target.value)} /></Field>
          <button className="pm-btn" onClick={resource.refetch}>Làm mới</button>
        </div>
        {resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : <>
          <DataTable rows={resource.data?.items ?? []} rowKey={(r) => r.ma_nhat_ky} pageSize={size} columns={[
            { key: "code", label: "Mã nhật ký", render: (r) => r.ma_nhat_ky },
            { key: "time", label: "Thời gian thao tác", render: (r) => timeLabel(r.thoi_gian) },
            { key: "actor", label: "Người thao tác", render: (r) => <>{r.ho_ten ?? "—"}<div className="pm-small">{r.ma_nguoi_dung ?? "—"}</div></> },
            { key: "module", label: "Module", render: (r) => r.module ?? "—" },
            { key: "function", label: "Chức năng", render: (r) => r.chuc_nang ?? "—" },
            { key: "action", label: "Hành động", render: (r) => actionLabel(r.hanh_dong) },
            { key: "object", label: "Mã đối tượng", render: (r) => r.ma_doi_tuong ?? "—" },
            { key: "result", label: "Kết quả", render: (r) => r.ket_qua === "THANH_CONG" ? "Thành công" : "Thất bại" },
            { key: "detail", label: "Chi tiết", render: (r) => <button className="pm-link" onClick={() => setSelected(r)}>Xem chi tiết</button> },
          ]} />
          <div className="pm-toolbar">
            <span>Tổng {resource.data?.total ?? 0} bản ghi · Mới nhất trước</span>
            <button className="pm-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Trang trước</button>
            <span>Trang {page}</span>
            <button className="pm-btn" disabled={page * size >= (resource.data?.total ?? 0)} onClick={() => setPage((p) => p + 1)}>Trang sau</button>
            <Field label="Số bản ghi / trang"><select value={size} onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}>{[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}</select></Field>
          </div>
        </>}
      </section>
      <FormDrawer open={Boolean(selected)} title="Chi tiết nhật ký hoạt động" onClose={() => setSelected(null)} footer={<button className="pm-btn" onClick={() => setSelected(null)}>Đóng</button>}>
        {selected && <>
          <p><strong>{selected.ma_nhat_ky}</strong> · {timeLabel(selected.thoi_gian)}</p>
          <p>{selected.ho_ten ?? "—"} ({selected.ma_nguoi_dung ?? "—"}) · {actionLabel(selected.hanh_dong)}</p>
          <p>{selected.module ?? "—"} / {selected.chuc_nang ?? "—"} · {selected.ma_doi_tuong ?? "—"}</p>
          <p>Kết quả: {selected.ket_qua === "THANH_CONG" ? "Thành công" : "Thất bại"}</p>
          {Boolean(reason.ly_do) && <p>Lý do: {displayValue(reason.ly_do)}</p>}
          {Boolean(reason.ghi_chu) && <p>Ghi chú: {displayValue(reason.ghi_chu)}</p>}
          {changedFields.length ? <DataTable rows={changedFields} rowKey={(key) => key} pageSize={Math.max(1, changedFields.length)} columns={[
            { key: "field", label: "Trường dữ liệu", render: (key) => fields[key] ?? key },
            { key: "before", label: "Dữ liệu trước", render: (key) => displayValue(before[key]) },
            { key: "after", label: "Dữ liệu sau", render: (key) => displayValue(after[key]) },
          ]} /> : <p>{selected.ket_qua === "THANH_CONG" ? "Bản ghi cũ chưa lưu dữ liệu so sánh trước và sau." : "Thao tác thất bại, không có thay đổi dữ liệu được ghi nhận."}</p>}
        </>}
      </FormDrawer>
    </>
  );
}
