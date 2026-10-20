// frontend/src/pages/cau-hinh/ReasonsPage.tsx
import { useState, useEffect } from "react";
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  StopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import {
  listReasons,
  saveReason,
  changeReasonStatus,
  reasonFunctions,
  type Reason,
} from "../../services/reasonService";
import { SettingsBreadcrumb } from "./SettingsPage";
import "./settings.css";

export default function ReasonsPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [fn, setFn] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    items: Reason[];
    total: number;
    page: number;
    page_size: number;
  } | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reason | null>(null);
  const [name, setName] = useState("");
  const [functions, setFunctions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [active, setActive] = useState(true);
  const [confirm, setConfirm] = useState<Reason | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchReasons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listReasons({
        search,
        chuc_nang: fn,
        trang_thai: status,
        page,
        page_size: size,
      });
      setData(res);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể kết nối máy chủ backend. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReasons();
  }, [search, fn, status, page, size]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const startCreate = () => {
    setEditing(null);
    setName("");
    setFunctions(reasonFunctions.map((f) => f.value));
    setNote("");
    setActive(true);
    setFormError("");
    setOpen(true);
  };

  const startEdit = (r: Reason) => {
    setEditing(r);
    setName(r.ten_ly_do ?? "");
    setFunctions(r.chuc_nang_ap_dung ?? []);
    setNote(r.ghi_chu ?? "");
    setActive(r.trang_thai === "DANG_SU_DUNG");
    setFormError("");
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!can(editing ? "UPDATE_REASON_CONFIG" : "CREATE_REASON_CONFIG")) {
      setFormError("Bạn chưa được cấp quyền lưu lý do.");
      return;
    }
    if (!name.trim()) {
      setFormError("Vui lòng nhập tên lý do.");
      return;
    }
    if (!functions.length) {
      setFormError("Vui lòng chọn ít nhất một chức năng áp dụng.");
      return;
    }

    setSubmitting(true);
    try {
      await saveReason(
        {
          ten_ly_do: name.trim(),
          ghi_chu: note.trim() || null,
          trang_thai: active ? "DANG_SU_DUNG" : "NGUNG_SU_DUNG",
          chuc_nang_ap_dung: functions,
        },
        editing?.id,
      );
      setOpen(false);
      showToast(
        "success",
        editing ? "Đã cập nhật lý do thành công." : "Đã thêm lý do mới thành công.",
      );
      void fetchReasons();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Lỗi khi lưu lý do.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirm) return;
    if (!can("CHANGE_REASON_CONFIG_STATUS")) {
      showToast("error", "Bạn chưa được cấp quyền đổi trạng thái lý do.");
      return;
    }

    const newStatus =
      confirm.trang_thai === "DANG_SU_DUNG"
        ? "NGUNG_SU_DUNG"
        : "DANG_SU_DUNG";

    setSubmitting(true);
    try {
      await changeReasonStatus(confirm.id, newStatus);
      setConfirm(null);
      showToast(
        "success",
        `Đã ${
          newStatus === "DANG_SU_DUNG" ? "kích hoạt lại" : "ngừng sử dụng"
        } lý do thành công.`,
      );
      void fetchReasons();
    } catch (err: unknown) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Lỗi khi đổi trạng thái lý do.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const activeCount = items.filter(
    (i) => i.trang_thai === "DANG_SU_DUNG",
  ).length;

  return (
    <div className="ch-page">
      <SettingsBreadcrumb title="Quản lý lý do" />

      {/* Main Card Wrapper */}
      <div className="ch-card-wrapper">
        {/* Header Band */}
        <div className="ch-page-header">
          <div className="ch-header-icon" aria-hidden="true">
            <FileTextOutlined />
          </div>
          <div className="ch-header-text">
            <h2>Quản lý lý do</h2>
            <p>Quản lý các lý do sử dụng trong các nghiệp vụ của hệ thống.</p>
          </div>
          <div className="ch-header-actions">
            <a href="#/cau-hinh" className="ch-btn secondary">
              <ArrowLeftOutlined /> Cấu hình
            </a>
            {can("CREATE_REASON_CONFIG") && (
              <button
                type="button"
                className="ch-btn primary"
                onClick={startCreate}
              >
                <PlusOutlined /> Thêm lý do
              </button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="ch-card-body">
          {/* Quick Stats Ribbon */}
          <div className="ch-stats-ribbon">
            <div className="ch-stat-box">
              <div>
                <div className="ch-stat-number">{total}</div>
                <div className="ch-stat-label">Tổng số lý do</div>
              </div>
            </div>
            <div className="ch-stat-box">
              <div>
                <div className="ch-stat-number" style={{ color: "#15803d" }}>
                  {activeCount}
                </div>
                <div className="ch-stat-label">Đang sử dụng (trang này)</div>
              </div>
            </div>
            <div className="ch-stat-box">
              <div>
                <div className="ch-stat-number" style={{ color: "#64748b" }}>
                  {items.length - activeCount}
                </div>
                <div className="ch-stat-label">Ngừng sử dụng (trang này)</div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div
              className={`ch-error-banner ${
                toast.type === "success"
                  ? "success-theme"
                  : ""
              }`}
              style={
                toast.type === "success"
                  ? {
                      background: "#f0fdf4",
                      borderColor: "#bbf7d0",
                      color: "#166534",
                    }
                  : undefined
              }
            >
              <div className="ch-error-text">
                {toast.type === "success" ? (
                  <CheckCircleOutlined style={{ fontSize: 18 }} />
                ) : (
                  <ExclamationCircleOutlined style={{ fontSize: 18 }} />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                className="ch-modal-close"
                onClick={() => setToast(null)}
              >
                <CloseOutlined />
              </button>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="ch-toolbar">
            <div className="ch-field ch-input-search-wrap">
              <label className="ch-field-label">Tìm kiếm</label>
              <div style={{ position: "relative" }}>
                <SearchOutlined className="ch-search-icon" />
                <input
                  className="ch-input"
                  placeholder="Tìm theo tên lý do..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Nhóm áp dụng</label>
              <select
                className="ch-select"
                value={fn}
                onChange={(e) => {
                  setFn(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả chức năng</option>
                {reasonFunctions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ch-field">
              <label className="ch-field-label">Trạng thái</label>
              <select
                className="ch-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="DANG_SU_DUNG">Đang sử dụng</option>
                <option value="NGUNG_SU_DUNG">Ngừng sử dụng</option>
              </select>
            </div>

            <div className="ch-field" style={{ alignSelf: "flex-end" }}>
              <button
                type="button"
                className="ch-btn secondary"
                onClick={fetchReasons}
                title="Làm mới danh sách"
              >
                <ReloadOutlined spin={loading} /> Làm mới
              </button>
            </div>
          </div>

          {/* Content state handling */}
          {loading && !data ? (
            <div className="ch-empty-state">
              <ReloadOutlined
                spin
                style={{ fontSize: 32, color: "#2563eb", marginBottom: 12 }}
              />
              <h4>Đang kết nối máy chủ và tải danh sách lý do...</h4>
              <p>Vui lòng chờ trong giây lát.</p>
            </div>
          ) : error ? (
            <div className="ch-error-banner">
              <div className="ch-error-text">
                <ExclamationCircleOutlined style={{ fontSize: 20 }} />
                <div>
                  <strong>{error}</strong>
                  <div style={{ fontSize: 12, marginTop: 4, color: "#7f1d1d" }}>
                    Gợi ý: Kiểm tra dịch vụ backend (port 8000) và PostgreSQL đã khởi động.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="ch-btn primary"
                onClick={fetchReasons}
              >
                <ReloadOutlined /> Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="ch-table-wrap">
                <table className="ch-table">
                  <thead>
                    <tr>
                      <th style={{ width: "120px" }}>Mã lý do</th>
                      <th style={{ minWidth: "180px" }}>Tên lý do</th>
                      <th style={{ minWidth: "260px" }}>Nhóm áp dụng</th>
                      <th>Ghi chú</th>
                      <th style={{ width: "140px" }}>Trạng thái</th>
                      <th style={{ width: "170px", textAlign: "right" }}>
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="ch-empty-state">
                            <div className="ch-empty-icon">
                              <FileTextOutlined />
                            </div>
                            <h4>Không tìm thấy lý do nào</h4>
                            <p>
                              Thử tìm kiếm với từ khóa khác hoặc nhấn "+ Thêm lý do" để tạo mới.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      items.map((r) => {
                        const isUsing = r.trang_thai === "DANG_SU_DUNG";
                        return (
                          <tr key={r.id}>
                            <td>
                              <strong
                                style={{
                                  fontFamily: "monospace",
                                  color: "#1e3a8a",
                                }}
                              >
                                {r.ma_ly_do}
                              </strong>
                            </td>
                            <td>
                              <strong style={{ color: "#0f172a" }}>
                                {r.ten_ly_do}
                              </strong>
                            </td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 6,
                                }}
                              >
                                {r.chuc_nang_ap_dung.map((funcCode) => {
                                  const label =
                                    reasonFunctions.find(
                                      (v) => v.value === funcCode,
                                    )?.label ?? funcCode;
                                  const badgeClass = funcCode.includes(
                                    "NGUYEN_LIEU",
                                  )
                                    ? "emerald"
                                    : funcCode.includes("CONG_THUC")
                                    ? "blue"
                                    : "purple";
                                  return (
                                    <span
                                      key={funcCode}
                                      className={`ch-badge ${badgeClass}`}
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td style={{ color: "#64748b" }}>
                              {r.ghi_chu || "—"}
                            </td>
                            <td>
                              <span
                                className={`ch-badge ${
                                  isUsing ? "green" : "gray"
                                }`}
                              >
                                {isUsing ? "Đang sử dụng" : "Ngừng sử dụng"}
                              </span>
                            </td>
                            <td>
                              <div
                                className="ch-actions-cell"
                                style={{ justifyContent: "flex-end" }}
                              >
                                {can("UPDATE_REASON_CONFIG") && (
                                  <button
                                    type="button"
                                    className="ch-action-btn edit"
                                    onClick={() => startEdit(r)}
                                    title="Chỉnh sửa lý do"
                                  >
                                    <EditOutlined /> Sửa
                                  </button>
                                )}
                                {can("CHANGE_REASON_CONFIG_STATUS") && (
                                  <button
                                    type="button"
                                    className="ch-action-btn"
                                    onClick={() => setConfirm(r)}
                                    title={
                                      isUsing
                                        ? "Ngừng sử dụng lý do"
                                        : "Kích hoạt lại lý do"
                                    }
                                  >
                                    {isUsing ? (
                                      <>
                                        <StopOutlined style={{ color: "#dc2626" }} /> Ngừng dùng
                                      </>
                                    ) : (
                                      <>
                                        <CheckOutlined style={{ color: "#16a34a" }} /> Kích hoạt
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="ch-pagination">
                <div>
                  Hiển thị{" "}
                  <strong>
                    {total ? Math.min((page - 1) * size + 1, total) : 0} -{" "}
                    {Math.min(page * size, total)}
                  </strong>{" "}
                  trên tổng số <strong>{total}</strong> bản ghi
                </div>

                <div className="ch-page-controls">
                  <button
                    type="button"
                    className="ch-btn secondary"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </button>

                  <span
                    style={{
                      padding: "0 8px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    Trang {page}
                  </span>

                  <button
                    type="button"
                    className="ch-btn secondary"
                    disabled={page * size >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Trang sau
                  </button>

                  <select
                    className="ch-select"
                    value={size}
                    onChange={(e) => {
                      setSize(Number(e.target.value));
                      setPage(1);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    {[10, 20, 50].map((s) => (
                      <option key={s} value={s}>
                        {s} / trang
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Modal: Add / Edit Reason */}
      {open && (
        <div className="ch-modal-overlay" onClick={() => !submitting && setOpen(false)}>
          <div
            className="ch-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ch-modal-header">
              <h3>{editing ? "Chỉnh sửa lý do" : "Thêm lý do mới"}</h3>
              <button
                type="button"
                className="ch-modal-close"
                disabled={submitting}
                onClick={() => setOpen(false)}
              >
                <CloseOutlined />
              </button>
            </div>

            <form onSubmit={submit}>
              <div className="ch-modal-body">
                {formError && (
                  <div className="ch-error-banner" style={{ margin: 0 }}>
                    <div className="ch-error-text">
                      <ExclamationCircleOutlined />
                      <span>{formError}</span>
                    </div>
                  </div>
                )}

                <div className="ch-field">
                  <label className="ch-field-label">
                    Tên lý do <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    className="ch-input"
                    placeholder="Nhập tên lý do (VD: Chất lượng không đạt)..."
                    value={name}
                    maxLength={250}
                    required
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="ch-field">
                  <label className="ch-field-label">
                    Nhóm chức năng áp dụng <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div className="ch-checkbox-group">
                    <label className="ch-checkbox-label" style={{ fontWeight: 600, borderBottom: "1px solid #e2e8f0", paddingBottom: 6 }}>
                      <input
                        type="checkbox"
                        checked={
                          reasonFunctions.length > 0 &&
                          reasonFunctions.every((f) =>
                            functions.includes(f.value),
                          )
                        }
                        onChange={(e) =>
                          setFunctions(
                            e.target.checked
                              ? reasonFunctions.map((f) => f.value)
                              : [],
                          )
                        }
                      />
                      Chọn tất cả chức năng
                    </label>

                    {reasonFunctions.map((f) => (
                      <label key={f.value} className="ch-checkbox-label">
                        <input
                          type="checkbox"
                          checked={functions.includes(f.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFunctions([...functions, f.value]);
                            } else {
                              setFunctions(
                                functions.filter((v) => v !== f.value),
                              );
                            }
                          }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="ch-field">
                  <label className="ch-field-label">Ghi chú</label>
                  <textarea
                    className="ch-textarea"
                    rows={3}
                    maxLength={2000}
                    placeholder="Nhập ghi chú thêm nếu cần..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                <div className="ch-field">
                  <label className="ch-switch-label">
                    <input
                      type="checkbox"
                      checked={active}
                      disabled={
                        Boolean(editing) &&
                        !can("CHANGE_REASON_CONFIG_STATUS")
                      }
                      onChange={(e) => setActive(e.target.checked)}
                      style={{ width: 16, height: 16, accentColor: "#2563eb" }}
                    />
                    <span>
                      Trạng thái:{" "}
                      <strong>
                        {active ? "Đang sử dụng" : "Ngừng sử dụng"}
                      </strong>
                    </span>
                  </label>
                </div>
              </div>

              <div className="ch-modal-footer">
                <button
                  type="button"
                  className="ch-btn secondary"
                  disabled={submitting}
                  onClick={() => setOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="ch-btn primary"
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu..." : "Lưu lý do"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog: Change Status */}
      {confirm && (
        <div
          className="ch-modal-overlay"
          onClick={() => !submitting && setConfirm(null)}
        >
          <div
            className="ch-modal-card"
            style={{ maxWidth: 440 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ch-modal-header">
              <h3>
                {confirm.trang_thai === "DANG_SU_DUNG"
                  ? "Ngừng sử dụng lý do"
                  : "Kích hoạt lại lý do"}
              </h3>
              <button
                type="button"
                className="ch-modal-close"
                disabled={submitting}
                onClick={() => setConfirm(null)}
              >
                <CloseOutlined />
              </button>
            </div>

            <div className="ch-modal-body">
              <p style={{ margin: 0, fontSize: 14 }}>
                Bạn có chắc chắn muốn{" "}
                <strong>
                  {confirm.trang_thai === "DANG_SU_DUNG"
                    ? "ngừng sử dụng"
                    : "kích hoạt lại"}
                </strong>{" "}
                lý do <strong>"{confirm.ten_ly_do}"</strong> ({confirm.ma_ly_do})?
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12.5,
                  color: "#64748b",
                }}
              >
                Các dữ liệu lịch sử đã ghi nhận lý do này sẽ không bị ảnh hưởng.
              </p>
            </div>

            <div className="ch-modal-footer">
              <button
                type="button"
                className="ch-btn secondary"
                disabled={submitting}
                onClick={() => setConfirm(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className={`ch-btn ${
                  confirm.trang_thai === "DANG_SU_DUNG"
                    ? "danger-outline"
                    : "primary"
                }`}
                disabled={submitting}
                onClick={handleToggleStatus}
              >
                {submitting
                  ? "Đang xử lý..."
                  : confirm.trang_thai === "DANG_SU_DUNG"
                  ? "Xác nhận ngừng dùng"
                  : "Xác nhận kích hoạt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
