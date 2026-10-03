////D:\KLTN\KLTN\frontend\src\pages\tai-khoan\QuanLyTaiKhoanPage.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  ACCOUNT_ROLES,
  createUserApi,
  deleteUserApi,
  downloadSampleExcelTemplate,
  exportUsersToExcel,
  fetchUserApi,
  fetchUsersFromApi,
  parseCsvOrExcelFile,
  roleLabel,
  statusLabel,
  updateUserApi,
  type AccountRole,
  type AccountStatus,
  type ImportRow,
  type UserAccount,
  type UserCreateInput,
  type UserUpdateInput,
} from "../../services/taiKhoanService";

import { getMe } from "../../services/authService";
import "../../../public/QuanLyTaiKhoan.css";

type ModalType = "create" | "edit" | "view" | "delete" | "upload";
type FormState = {
  ho_ten: string;
  mat_khau: string;
  vai_tro: string;
  trang_thai: AccountStatus;
  email: string;
  so_dien_thoai: string;
  dia_chi: string;
};

const PAGE_SIZE = 7;

function emptyForm(): FormState {
  return {
    ho_ten: "",
    mat_khau: "",
    vai_tro: "NHAN_VIEN_BAN_HANG",
    trang_thai: "HOAT_DONG",
    email: "",
    so_dien_thoai: "",
    dia_chi: "",
  };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "Có lỗi xảy ra.";
}

function formatDate(value?: string | null): string {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`tk-badge ${value === "HOAT_DONG" ? "is-active" : "is-inactive"}`}>
      <span />
      {statusLabel(value)}
    </span>
  );
}

export default function QuanLyTaiKhoanPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalType | null>(null);
  const [selected, setSelected] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fileName, setFileName] = useState("");
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importReport, setImportReport] = useState<string[]>([]);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const busyRef = useRef(false);

  async function refresh(): Promise<void> {
    setLoading(true);
    setError("");

    try {
      setUsers(await fetchUsersFromApi());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    void getMe().then(user => setCurrentId(user.ma_nguoi_dung)).catch(() => {});
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (modal && dialog && !dialog.open) dialog.showModal();
  }, [modal]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return users.filter(user => {
      const content = [
        user.ma_nguoi_dung,
        user.ho_ten,
        roleLabel(user.vai_tro),
        user.email,
        user.so_dien_thoai,
      ].join(" ").toLocaleLowerCase("vi");

      return (
        (!keyword || content.includes(keyword)) &&
        (!roleFilter || user.vai_tro === roleFilter) &&
        (!statusFilter || user.trang_thai === statusFilter)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  function closeModal(): void {
    if (busyRef.current) return;
    dialogRef.current?.close();
    setModal(null);
    setModalError("");
  }

  function beginBusy(): boolean {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    return true;
  }

  function endBusy(): void {
    busyRef.current = false;
    setBusy(false);
  }

  function openCreate(): void {
    setSelected(null);
    setForm(emptyForm());
    setModalError("");
    setModal("create");
  }

  async function openUser(
    kind: "view" | "edit" | "delete",
    user: UserAccount,
  ): Promise<void> {
    if (!beginBusy()) return;
    setError("");

    try {
      const detail = await fetchUserApi(user.ma_nguoi_dung);
      setSelected(detail);
      setForm({
        ho_ten: detail.ho_ten,
        mat_khau: "",
        vai_tro: detail.vai_tro,
        trang_thai: detail.trang_thai as AccountStatus,
        email: detail.email || "",
        so_dien_thoai: detail.so_dien_thoai || "",
        dia_chi: detail.dia_chi || "",
      });
      setModalError("");
      setModal(kind);
    } catch (err) {
      setError(errorText(err));
    } finally {
      endBusy();
    }
  }

  function setField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ): void {
    setForm(previous => ({ ...previous, [field]: value }));
  }

  async function handleSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!beginBusy()) return;
    setModalError("");

    try {
      if (!form.ho_ten.trim()) throw new Error("Vui lòng nhập họ và tên.");

      if (modal === "create" && !form.mat_khau) {
        throw new Error("Vui lòng nhập mật khẩu khởi tạo.");
      }

      if (
        form.mat_khau &&
        new TextEncoder().encode(form.mat_khau).length > 72
      ) {
        throw new Error("Mật khẩu tối đa 72 byte.");
      }

      const common = {
        ho_ten: form.ho_ten.trim(),
        trang_thai: form.trang_thai,
        email: form.email.trim() || null,
        so_dien_thoai: form.so_dien_thoai.trim() || null,
        dia_chi: form.dia_chi.trim() || null,
      };

      if (modal === "create") {
        const payload: UserCreateInput = {
          ...common,
          vai_tro: form.vai_tro as AccountRole,
          mat_khau: form.mat_khau,
        };

        const created = await createUserApi(payload);
        setNotice(`Đã tạo tài khoản ${created.ma_nguoi_dung}.`);
      } else if (modal === "edit" && selected) {
        const payload: UserUpdateInput = { ...common };

        // Vai trò cũ không được gửi lại nếu không thay đổi.
        if (form.vai_tro !== selected.vai_tro) {
          payload.vai_tro = form.vai_tro as AccountRole;
        }

        if (form.mat_khau) payload.mat_khau = form.mat_khau;

        await updateUserApi(selected.ma_nguoi_dung, payload);
        setNotice(`Đã cập nhật tài khoản ${selected.ma_nguoi_dung}.`);
      }

      endBusy();
      closeModal();
      await refresh();
    } catch (err) {
      setModalError(errorText(err));
    } finally {
      endBusy();
    }
  }

  async function handleDelete(): Promise<void> {
    if (!selected || !beginBusy()) return;
    setModalError("");

    try {
      await deleteUserApi(selected.ma_nguoi_dung);
      setNotice(`Đã xóa tài khoản ${selected.ma_nguoi_dung}.`);
      endBusy();
      closeModal();
      await refresh();
    } catch (err) {
      setModalError(errorText(err));
    } finally {
      endBusy();
    }
  }

  async function chooseFile(file?: File): Promise<void> {
    if (!file || !beginBusy()) return;
    setModalError("");
    setImportRows([]);
    setImportReport([]);
    setFileName(file.name);

    try {
      setImportRows(await parseCsvOrExcelFile(file));
    } catch (err) {
      setModalError(errorText(err));
    } finally {
      endBusy();
    }
  }

  async function handleImport(): Promise<void> {
    if (!importRows.length || !beginBusy()) return;
    setModalError("");

    const failed: ImportRow[] = [];
    const report: string[] = [];
    let success = 0;

    try {
      for (const row of importRows) {
        try {
          const created = await createUserApi(row.input);
          success++;
          report.push(`Dòng ${row.rowNumber}: đã tạo ${created.ma_nguoi_dung}.`);
        } catch (err) {
          failed.push(row);
          report.push(`Dòng ${row.rowNumber}: ${errorText(err)}`);
        }
      }

      // Chỉ giữ dòng thất bại để thử lại, không gửi lại dòng đã thành công.
      setImportRows(failed);
      setImportReport(report);
      setNotice(`Đã tạo ${success} tài khoản; ${failed.length} dòng chưa thành công.`);
      await refresh();
    } finally {
      endBusy();
    }
  }

  async function download(kind: "export" | "sample"): Promise<void> {
    if (!beginBusy()) return;
    setModalError("");
    setError("");

    try {
      if (kind === "export") {
        await exportUsersToExcel(filtered);
      } else {
        await downloadSampleExcelTemplate();
      }
    } catch (err) {
      if (modal) setModalError(errorText(err));
      else setError(errorText(err));
    } finally {
      endBusy();
    }
  }

  const protectedUser =
    selected?.ma_nguoi_dung.toLowerCase() === "admin" ||
    selected?.ma_nguoi_dung === currentId;

  const legacyRole =
    !ACCOUNT_ROLES.some(role => role.value === form.vai_tro);

  const modalTitle = {
    create: "Thêm tài khoản",
    edit: "Cập nhật tài khoản",
    view: "Thông tin tài khoản",
    delete: "Xóa tài khoản",
    upload: "Nhập tài khoản từ file",
  };

  function detail(label: string, value?: string | null) {
    return (
      <div className="tk-detail">
        <dt>{label}</dt>
        <dd>{value || "Chưa có thông tin"}</dd>
      </div>
    );
  }

  return (
    <section className="tk-page">
      <header className="tk-heading">

        <div className="tk-toolbar">
          <button className="tk-btn" disabled={busy} onClick={() => void download("export")}>
            <FileExcelOutlined /> Xuất Excel
          </button>
          <button
            className="tk-btn"
            disabled={busy}
            onClick={() => {
              setFileName("");
              setImportRows([]);
              setImportReport([]);
              setModalError("");
              setModal("upload");
            }}
          >
            <UploadOutlined /> Upload file
          </button>
          <button className="tk-btn tk-primary" disabled={busy} onClick={openCreate}>
            <PlusOutlined /> Thêm tài khoản
          </button>
        </div>
      </header>

{(notice || error) && (
  <div className="tk-toast-wrap">
    <div
      className={`tk-toast ${error ? "tk-toast-error" : "tk-toast-success"}`}
      role={error ? "alert" : "status"}
    >
      <span className="tk-toast-icon" aria-hidden="true">
        {error ? "!" : "✓"}
      </span>

      <div className="tk-toast-content">
        <strong>
          {error ? "Thao tác chưa hoàn tất" : "Thao tác thành công"}
        </strong>

        <p>{error || notice}</p>
      </div>

      <button
        type="button"
        className="tk-toast-close"
        aria-label="Đóng thông báo"
        onClick={() => {
          setNotice("");
          setError("");
        }}
      >
        ×
      </button>
    </div>
  </div>
)}

      <div className="tk-list">
        <div className="tk-filters">
          <div className="tk-search">
            <SearchOutlined />
            <input
              aria-label="Tìm tài khoản"
              placeholder="Tìm mã, họ tên, email, số điện thoại..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <select aria-label="Lọc vai trò" value={roleFilter} onChange={event => setRoleFilter(event.target.value)}>
            <option value="">Tất cả vai trò</option>
            {ACCOUNT_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
            {Array.from(new Set(users.map(user => user.vai_tro)))
              .filter(role => !ACCOUNT_ROLES.some(item => item.value === role))
              .map(role => <option key={role} value={role}>{roleLabel(role)}</option>)}
          </select>

          <select aria-label="Lọc trạng thái" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="HOAT_DONG">Hoạt động</option>
            <option value="NGUNG_HOAT_DONG">Ngưng hoạt động</option>
          </select>

          <button className="tk-icon-btn" title="Làm mới" aria-label="Làm mới" disabled={busy || loading} onClick={() => void refresh()}>
            <ReloadOutlined />
          </button>
        </div>

        <div className="tk-table-scroll">
          <table className="tk-table">
            <thead>
              <tr>
                <th>Tài khoản</th>
                <th>Vai trò</th>
                <th>Thông tin liên hệ</th>
                <th>Trạng thái</th>
                <th className="tk-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="tk-empty">Đang tải tài khoản...</td></tr>
              ) : !visible.length ? (
                <tr><td colSpan={5} className="tk-empty">Không có tài khoản phù hợp.</td></tr>
              ) : visible.map(user => (
                <tr key={user.ma_nguoi_dung}>
                  <td>
                    <div className="tk-person">
                      <span className="tk-avatar">{user.ho_ten.trim().charAt(0).toUpperCase()}</span>
                      <div><strong>{user.ho_ten}</strong><small>{user.ma_nguoi_dung}</small></div>
                    </div>
                  </td>
                  <td>{roleLabel(user.vai_tro)}</td>
                  <td><div className="tk-contact"><span>{user.email || "Chưa có email"}</span><small>{user.so_dien_thoai || "Chưa có số điện thoại"}</small></div></td>
                  <td><StatusBadge value={user.trang_thai} /></td>
                  <td>
                    <div className="tk-actions">
                      <button className="tk-icon-btn" title="Xem chi tiết" aria-label={`Xem ${user.ma_nguoi_dung}`} disabled={busy} onClick={() => void openUser("view", user)}><EyeOutlined /></button>
                      <button className="tk-icon-btn" title="Cập nhật" aria-label={`Sửa ${user.ma_nguoi_dung}`} disabled={busy} onClick={() => void openUser("edit", user)}><EditOutlined /></button>
                      <button className="tk-icon-btn tk-delete-icon" title="Xóa" aria-label={`Xóa ${user.ma_nguoi_dung}`} disabled={busy || user.ma_nguoi_dung.toLowerCase() === "admin" || user.ma_nguoi_dung === currentId} onClick={() => void openUser("delete", user)}><DeleteOutlined /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="tk-pagination">
          <span>
            {filtered.length
              ? `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} / ${filtered.length} tài khoản`
              : "0 tài khoản"}
          </span>
          <div>
            <button className="tk-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Trước</button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button className="tk-btn" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Sau</button>
          </div>
        </footer>
      </div>

      {modal && (
        <dialog
          ref={dialogRef}
          className="tk-dialog"
          aria-labelledby="tk-modal-title"
          onCancel={event => {
            event.preventDefault();
            closeModal();
          }}
        >
          <div className="tk-modal-head">
            <div>
              <span className="tk-eyebrow">MILANO COFFEE</span>
              <h3 id="tk-modal-title">{modalTitle[modal]}</h3>
            </div>
            <button className="tk-icon-btn" aria-label="Đóng" disabled={busy} onClick={closeModal}>✕</button>
          </div>

          {modalError && <div className="tk-message tk-error tk-modal-message" role="alert">{modalError}</div>}

          {(modal === "create" || modal === "edit") && (
            <form onSubmit={event => void handleSave(event)}>
              <div className="tk-modal-body">
                <div className="tk-info">
                  {modal === "create"
                    ? "Mã tài khoản được hệ thống tự sinh theo vai trò sau khi lưu."
                    : `Mã tài khoản: ${selected?.ma_nguoi_dung}. Mã được giữ nguyên khi cập nhật.`}
                </div>

                <p className="tk-hint">Các trường có <b className="tk-required">*</b> là bắt buộc.</p>
                <h4 className="tk-section-title">Thông tin tài khoản</h4>

                <div className="tk-form-grid">
                  <label className="tk-field">
                    <span>Họ và tên <b className="tk-required">*</b></span>
                    <input required maxLength={100} autoComplete="name" value={form.ho_ten} onChange={event => setField("ho_ten", event.target.value)} />
                  </label>
                  <label className="tk-field">
                    <span>Vai trò <b className="tk-required">*</b></span>
                    <select required disabled={Boolean(protectedUser)} value={form.vai_tro} onChange={event => setField("vai_tro", event.target.value)}>
                      {legacyRole && <option value={form.vai_tro} disabled>{roleLabel(form.vai_tro)}</option>}
                      {ACCOUNT_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </label>
                  <label className="tk-field">
                    <span>Trạng thái <b className="tk-required">*</b></span>
                    <select required disabled={Boolean(protectedUser)} value={form.trang_thai} onChange={event => setField("trang_thai", event.target.value as AccountStatus)}>
                      <option value="HOAT_DONG">Hoạt động</option>
                      <option value="NGUNG_HOAT_DONG">Ngưng hoạt động</option>
                    </select>
                  </label>
                  <label className="tk-field">
                    <span>{modal === "create" ? "Mật khẩu khởi tạo" : "Mật khẩu mới"} {modal === "create" && <b className="tk-required">*</b>}</span>
                    <input type="password" autoComplete="new-password" required={modal === "create"} maxLength={72} value={form.mat_khau} onChange={event => setField("mat_khau", event.target.value)} />
                    <small>{modal === "edit" ? "Để trống để giữ mật khẩu hiện tại." : "Mật khẩu được backend băm trước khi lưu."}</small>
                  </label>
                </div>

                <h4 className="tk-section-title">Thông tin liên hệ</h4>
                <div className="tk-form-grid">
                  <label className="tk-field">
                    <span>Email</span>
                    <input type="email" maxLength={100} autoComplete="email" value={form.email} onChange={event => setField("email", event.target.value)} />
                  </label>
                  <label className="tk-field">
                    <span>Số điện thoại</span>
                    <input type="tel" maxLength={20} autoComplete="tel" value={form.so_dien_thoai} onChange={event => setField("so_dien_thoai", event.target.value)} />
                  </label>
                  <label className="tk-field tk-full">
                    <span>Địa chỉ</span>
                    <textarea rows={2} maxLength={255} autoComplete="street-address" value={form.dia_chi} onChange={event => setField("dia_chi", event.target.value)} />
                  </label>
                </div>
              </div>
              <div className="tk-modal-footer">
                <button type="button" className="tk-btn" disabled={busy} onClick={closeModal}>Hủy</button>
                <button type="submit" className="tk-btn tk-primary" disabled={busy}>{busy ? "Đang lưu..." : modal === "create" ? "Tạo tài khoản" : "Lưu thay đổi"}</button>
              </div>
            </form>
          )}

          {modal === "view" && selected && (
            <>
              <div className="tk-modal-body">
                <div className="tk-profile">
                  <span className="tk-avatar tk-avatar-large"><UserOutlined /></span>
                  <div><h4>{selected.ho_ten}</h4><p>{selected.ma_nguoi_dung} · {roleLabel(selected.vai_tro)}</p><StatusBadge value={selected.trang_thai} /></div>
                </div>
                <h4 className="tk-section-title">Thông tin liên hệ</h4>
                <dl className="tk-details">
                  {detail("Email", selected.email)}
                  {detail("Số điện thoại", selected.so_dien_thoai)}
                  {detail("Địa chỉ", selected.dia_chi)}
                </dl>
                <h4 className="tk-section-title">Thông tin hệ thống</h4>
                <dl className="tk-details">
                  {detail("Mã tài khoản", selected.ma_nguoi_dung)}
                  {detail("Vai trò", roleLabel(selected.vai_tro))}
                  {detail("Trạng thái", statusLabel(selected.trang_thai))}
                  {detail("Người thao tác", selected.nguoi_thao_tac)}
                  {detail("Thời gian tạo", formatDate(selected.thoi_gian_tao))}
                  {detail("Cập nhật gần nhất", formatDate(selected.thoi_gian_cap_nhat))}
                </dl>
              </div>
              <div className="tk-modal-footer"><button className="tk-btn" onClick={closeModal}>Đóng</button></div>
            </>
          )}

          {modal === "delete" && selected && (
            <>
              <div className="tk-modal-body">
                <div className="tk-warning">
                  <DeleteOutlined />
                  <div><strong>Xác nhận xóa tài khoản</strong><p>Tài khoản sẽ bị xóa khỏi hệ thống. Thao tác này không thể hoàn tác trên giao diện.</p></div>
                </div>
                <dl className="tk-details">
                  {detail("Mã tài khoản", selected.ma_nguoi_dung)}
                  {detail("Họ và tên", selected.ho_ten)}
                  {detail("Vai trò", roleLabel(selected.vai_tro))}
                </dl>
                <p className="tk-hint">Nếu cần giữ người thực hiện trong lịch sử, hãy cập nhật trạng thái thành “Ngưng hoạt động” thay vì xóa.</p>
              </div>
              <div className="tk-modal-footer">
                <button className="tk-btn" disabled={busy} onClick={closeModal}>Hủy</button>
                <button className="tk-btn tk-danger" disabled={busy || Boolean(protectedUser)} onClick={() => void handleDelete()}>{busy ? "Đang xóa..." : "Xóa tài khoản"}</button>
              </div>
            </>
          )}

          {modal === "upload" && (
            <>
              <div className="tk-modal-body">
                <div className="tk-info">Không nhập mã tài khoản trong file. Mã được backend tự sinh cho từng dòng khi tạo.</div>
                <div className="tk-upload-intro">
                  <p>Bắt buộc: <b>ho_ten, mat_khau, vai_tro, trang_thai</b>. Ba cột liên hệ có thể để trống.</p>
                  <button className="tk-btn" disabled={busy} onClick={() => void download("sample")}><FileExcelOutlined /> Tải file mẫu</button>
                </div>
                <label className={`tk-dropzone ${busy ? "is-disabled" : ""}`}>
                  <UploadOutlined />
                  <strong>Chọn file Excel hoặc CSV</strong>
                  <span>.xlsx / .csv · Tối đa 10 MB</span>
                  <input type="file" accept=".xlsx,.csv" disabled={busy} onChange={event => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void chooseFile(file);
                  }} />
                </label>
                {fileName && <p className="tk-file-name">{fileName}</p>}
                {!!importRows.length && (
                  <>
                    <p className="tk-hint">{importRows.length} dòng đang chờ tạo. Mật khẩu không hiển thị trong bảng xem trước.</p>
                    <div className="tk-preview">
                      <table className="tk-table">
                        <thead><tr><th>Dòng</th><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th></tr></thead>
                        <tbody>{importRows.slice(0, 20).map(row => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.input.ho_ten}</td><td>{roleLabel(row.input.vai_tro)}</td><td>{statusLabel(row.input.trang_thai)}</td></tr>)}</tbody>
                      </table>
                    </div>
                    {importRows.length > 20 && <p className="tk-hint">Đang xem trước 20 dòng đầu.</p>}
                  </>
                )}
                {!!importReport.length && <div className="tk-import-report" role="status">{importReport.map((text, index) => <p key={index}>{text}</p>)}</div>}
              </div>
              <div className="tk-modal-footer">
                <button className="tk-btn" disabled={busy} onClick={closeModal}>Đóng</button>
                <button className="tk-btn tk-primary" disabled={busy || !importRows.length} onClick={() => void handleImport()}>{busy ? "Đang xử lý..." : `Tạo ${importRows.length} tài khoản`}</button>
              </div>
            </>
          )}
        </dialog>
      )}
    </section>
  );
}