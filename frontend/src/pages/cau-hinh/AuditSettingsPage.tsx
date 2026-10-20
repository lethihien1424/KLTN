//D:\KLTN\KLTN\frontend\src\pages\cau-hinh\AuditSettingsPage.tsx
import { useState, useEffect, useCallback } from "react";
import { api, queryString } from "../../services/apiClient";
import { reasonFunctions } from "../../services/reasonService";
import { SettingsBreadcrumb } from "./SettingsPage";
import { HistoryOutlined, ArrowLeftOutlined, ReloadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import "./settings.css";

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
  const [filters, setFilters] = useState({
    search: "", module: "", hanh_dong: "", nguoi_thao_tac: "", tu_ngay: "", den_ngay: "",
  });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [selected, setSelected] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AuditList | null>(null);

  const invalidDates = Boolean(filters.tu_ngay && filters.den_ngay && filters.tu_ngay > filters.den_ngay);

  const fetchData = useCallback(async () => {
    if (invalidDates) {
      setError("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = `${scope
        ? `/nhat-ky-hoat-dong/doi-tuong/${encodeURIComponent(scope.entity)}/${encodeURIComponent(scope.code)}`
        : "/nhat-ky-hoat-dong"}${queryString({ ...filters, page, page_size: size })}`;
      const result = await api<AuditList>(url);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [filters, page, size, scope, invalidDates]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="ch-page">
      {!scope && (
        <>
          <SettingsBreadcrumb title="Nhật ký hoạt động" />
          <div className="ch-card-wrapper" style={{ marginBottom: 16 }}>
            <div className="ch-page-header">
              <div className="ch-header-icon" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }} aria-hidden="true">
                <HistoryOutlined />
              </div>
              <div className="ch-header-text">
                <h2>Nhật ký hoạt động</h2>
                <p>Tra cứu lịch sử thay đổi dữ liệu nghiệp vụ thành công. Thời gian hiển thị theo giờ Việt Nam.</p>
              </div>
              <div className="ch-header-actions">
                <a className="ch-btn secondary" href="#/cau-hinh">
                  <ArrowLeftOutlined /> Cấu hình
                </a>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filter card */}
      <div className="ch-card-wrapper">
        <div className="ch-card-body">
          <div className="ch-toolbar">
            <div className="ch-field ch-input-search-wrap">
              <label className="ch-field-label">Tìm kiếm</label>
              <div style={{ position: "relative" }}>
                <input
                  className="ch-input"
                  placeholder="Mã đối tượng, mã hoặc tên người thao tác..."
                  value={filters.search}
                  onChange={(e) => changeFilter("search", e.target.value)}
                />
              </div>
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Module</label>
              <select className="ch-select" value={filters.module} onChange={(e) => changeFilter("module", e.target.value)}>
                <option value="">Tất cả</option>
                {modules.map((name) => <option key={name}>{name}</option>)}
              </select>
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Hành động</label>
              <select className="ch-select" value={filters.hanh_dong} onChange={(e) => changeFilter("hanh_dong", e.target.value)}>
                <option value="">Tất cả</option>
                {Object.entries(actions).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                {reasonFunctions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Người thao tác</label>
              <select className="ch-select" value={filters.nguoi_thao_tac} onChange={(e) => changeFilter("nguoi_thao_tac", e.target.value)}>
                <option value="">Tất cả</option>
                {data?.actors?.map((actor) => (
                  <option key={actor.ma_nguoi_dung} value={actor.ma_nguoi_dung}>
                    {actor.ho_ten ?? actor.ma_nguoi_dung} ({actor.ma_nguoi_dung})
                  </option>
                ))}
              </select>
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Từ ngày</label>
              <input type="date" className="ch-input" value={filters.tu_ngay} onChange={(e) => changeFilter("tu_ngay", e.target.value)} />
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Đến ngày</label>
              <input type="date" className="ch-input" value={filters.den_ngay} onChange={(e) => changeFilter("den_ngay", e.target.value)} />
            </div>

            <div className="ch-field" style={{ alignSelf: "flex-end" }}>
              <button className="ch-btn secondary" onClick={() => void fetchData()} disabled={loading}>
                <ReloadOutlined spin={loading} /> Làm mới
              </button>
            </div>
          </div>

          {invalidDates && (
            <div className="ch-error-banner" style={{ marginBottom: 0 }}>
              <div className="ch-error-text">
                <ExclamationCircleOutlined style={{ fontSize: 18 }} />
                <span>Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data card */}
      <div className="ch-card-wrapper">
        <div className="ch-card-body" style={{ padding: "0 0 16px" }}>
          {loading ? (
            <div className="ch-empty-state">
              <ReloadOutlined spin style={{ fontSize: 32, color: "#7c3aed", marginBottom: 12 }} />
              <h4>Đang tải nhật ký hoạt động...</h4>
              <p>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : error ? (
            <div style={{ padding: "16px 24px" }}>
              <div className="ch-error-banner">
                <div className="ch-error-text">
                  <ExclamationCircleOutlined style={{ fontSize: 20 }} />
                  <div>
                    <strong>{error}</strong>
                    <div style={{ fontSize: 12, marginTop: 4, color: "#7f1d1d" }}>
                      Gợi ý: Kiểm tra dịch vụ backend (port 8000) đã khởi động.
                    </div>
                  </div>
                </div>
                <button type="button" className="ch-btn primary" onClick={() => void fetchData()}>
                  <ReloadOutlined /> Thử lại
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ch-table-wrap" style={{ borderRadius: 0, border: "none", borderBottom: "1px solid #e2e8f0" }}>
                <table className="ch-table">
                  <thead>
                    <tr>
                      <th>Mã nhật ký</th>
                      <th>Thời gian thao tác</th>
                      <th>Người thao tác</th>
                      <th>Module</th>
                      <th>Chức năng</th>
                      <th>Hành động</th>
                      <th>Mã đối tượng</th>
                      <th>Kết quả</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={9}>
                          <div className="ch-empty-state">
                            <div className="ch-empty-icon"><HistoryOutlined /></div>
                            <h4>Không có nhật ký nào</h4>
                            <p>Thử thay đổi bộ lọc hoặc khoảng thời gian.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((r) => (
                        <tr key={r.ma_nhat_ky}>
                          <td>
                            <strong style={{ fontFamily: "monospace", color: "#1e3a8a", fontSize: 12 }}>
                              {r.ma_nhat_ky}
                            </strong>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>{timeLabel(r.thoi_gian)}</td>
                          <td>
                            <strong style={{ color: "#0f172a" }}>{r.ho_ten ?? "—"}</strong>
                            {r.ma_nguoi_dung && (
                              <div style={{ fontSize: 12, color: "#64748b" }}>{r.ma_nguoi_dung}</div>
                            )}
                          </td>
                          <td>{r.module ?? "—"}</td>
                          <td>{r.chuc_nang ?? "—"}</td>
                          <td>{actionLabel(r.hanh_dong)}</td>
                          <td>
                            <code style={{ fontSize: 12, color: "#1e3a8a" }}>{r.ma_doi_tuong ?? "—"}</code>
                          </td>
                          <td>
                            <span className={`ch-badge ${r.ket_qua === "THANH_CONG" ? "green" : "gray"}`}>
                              {r.ket_qua === "THANH_CONG" ? "Thành công" : "Thất bại"}
                            </span>
                          </td>
                          <td>
                            <div className="ch-actions-cell">
                              <button className="ch-action-btn edit" onClick={() => setSelected(r)}>
                                Xem chi tiết
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="ch-pagination" style={{ padding: "12px 24px" }}>
                <span>Tổng {total} bản ghi · Mới nhất trước</span>
                <div className="ch-page-controls">
                  <button
                    className="ch-btn secondary"
                    style={{ height: 34 }}
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trang trước
                  </button>
                  <span style={{ padding: "0 8px", fontWeight: 600, color: "#0f172a" }}>Trang {page}</span>
                  <button
                    className="ch-btn secondary"
                    style={{ height: 34 }}
                    disabled={page * size >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Trang sau
                  </button>
                  <select
                    className="ch-select"
                    style={{ height: 34, width: "auto" }}
                    value={size}
                    onChange={(e) => { setSize(Number(e.target.value)); setPage(1); }}
                  >
                    {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / trang</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="ch-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="ch-modal-card" style={{ maxWidth: 680 }}>
            <div className="ch-modal-header">
              <h3>Chi tiết nhật ký hoạt động</h3>
              <button className="ch-modal-close" onClick={() => setSelected(null)} aria-label="Đóng">✕</button>
            </div>
            <div className="ch-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gap: 8 }}>
                <p style={{ margin: 0 }}>
                  <strong>{selected.ma_nhat_ky}</strong> · {timeLabel(selected.thoi_gian)}
                </p>
                <p style={{ margin: 0 }}>
                  {selected.ho_ten ?? "—"} ({selected.ma_nguoi_dung ?? "—"}) · {actionLabel(selected.hanh_dong)}
                </p>
                <p style={{ margin: 0 }}>
                  {selected.module ?? "—"} / {selected.chuc_nang ?? "—"} · {selected.ma_doi_tuong ?? "—"}
                </p>
                <p style={{ margin: 0 }}>
                  Kết quả:{" "}
                  <span className={`ch-badge ${selected.ket_qua === "THANH_CONG" ? "green" : "gray"}`}>
                    {selected.ket_qua === "THANH_CONG" ? "Thành công" : "Thất bại"}
                  </span>
                </p>
                {Boolean(reason.ly_do) && <p style={{ margin: 0 }}>Lý do: {displayValue(reason.ly_do)}</p>}
                {Boolean(reason.ghi_chu) && <p style={{ margin: 0 }}>Ghi chú: {displayValue(reason.ghi_chu)}</p>}
              </div>

              {changedFields.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: "#0f172a" }}>Dữ liệu thay đổi</div>
                  <div className="ch-table-wrap">
                    <table className="ch-table">
                      <thead>
                        <tr>
                          <th>Trường dữ liệu</th>
                          <th>Dữ liệu trước</th>
                          <th>Dữ liệu sau</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changedFields.map((key) => (
                          <tr key={key}>
                            <td><strong>{fields[key] ?? key}</strong></td>
                            <td style={{ color: "#b91c1c" }}>{displayValue(before[key])}</td>
                            <td style={{ color: "#15803d" }}>{displayValue(after[key])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {changedFields.length === 0 && (
                <p style={{ marginTop: 12, color: "#64748b" }}>
                  {selected.ket_qua === "THANH_CONG"
                    ? "Bản ghi cũ chưa lưu dữ liệu so sánh trước và sau."
                    : "Thao tác thất bại, không có thay đổi dữ liệu được ghi nhận."}
                </p>
              )}
            </div>
            <div className="ch-modal-footer">
              <button className="ch-btn secondary" onClick={() => setSelected(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
