import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileExcelOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import {
  createUserApi,
  deleteUserApi,
  downloadSampleExcelTemplate,
  exportUsersToCsv,
  fetchUsersFromApi,
  parseCsvOrExcelFile,
  updateUserApi,
  type UserAccount,
  type UserCreateInput,
  type UserUpdateInput,
} from "../../services/taiKhoanService";

const PAGE_SIZE = 7;

const ROLES = [
  ["ADMIN", "Quản trị viên"],
  ["QUAN_LY", "Quản lý"],
  ["GIAM_SAT_BAN_HANG", "Giám sát bán hàng"],
  [
    "NHAN_VIEN_KE_HOACH_SAN_XUAT",
    "Nhân viên kế hoạch sản xuất",
  ],
  ["NHAN_VIEN_KHO", "Nhân viên kho"],
  ["NHAN_VIEN_MUA_HANG", "Nhân viên mua hàng"],
] as const;

type ModalType =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "upload"
  | null;

function emptyForm(): UserCreateInput {
  return {
    ma_nguoi_dung: "",
    mat_khau: "",
    ho_ten: "",
    vai_tro: "NHAN_VIEN_KHO",
    trang_thai: "HOAT_DONG",
    email: "",
    so_dien_thoai: "",
    dia_chi: "",
  };
}

function getError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra.";
}

function roleLabel(value: string): string {
  return ROLES.find(role => role[0] === value)?.[1] ?? value;
}

export default function QuanLyTaiKhoanPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<UserCreateInput>(emptyForm());
  const [preview, setPreview] = useState<UserCreateInput[]>([]);

  async function reload(): Promise<void> {
    setLoading(true);

    try {
      const data = await fetchUsersFromApi();
      setUsers(data);
      setError("");
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter(user =>
      [
        user.ma_nguoi_dung,
        user.ho_ten,
        user.vai_tro,
        user.email ?? "",
        user.so_dien_thoai ?? "",
      ].some(value => value.toLowerCase().includes(query))
    );
  }, [users, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE)
  );

  const visiblePage = Math.min(page, totalPages);

  const pageUsers = filteredUsers.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE
  );

  function openCreate(): void {
    setForm(emptyForm());
    setSelected(null);
    setError("");
    setNotice("");
    setModal("create");
  }

  function openEdit(user: UserAccount): void {
    setSelected(user);

    setForm({
      ma_nguoi_dung: user.ma_nguoi_dung,
      mat_khau: "",
      ho_ten: user.ho_ten,
      vai_tro: user.vai_tro,
      trang_thai: user.trang_thai,
      email: user.email ?? "",
      so_dien_thoai: user.so_dien_thoai ?? "",
      dia_chi: user.dia_chi ?? "",
    });

    setError("");
    setNotice("");
    setModal("edit");
  }

  async function handleSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const hoTen = form.ho_ten.trim();

      if (!hoTen) {
        throw new Error("Vui lòng nhập họ và tên.");
      }

      if (modal === "create") {
        const maNguoiDung = form.ma_nguoi_dung.trim();

        if (!maNguoiDung || !form.mat_khau) {
          throw new Error(
            "Vui lòng nhập mã người dùng và mật khẩu."
          );
        }

        await createUserApi({
          ...form,
          ma_nguoi_dung: maNguoiDung,
          ho_ten: hoTen,
        });

        setNotice(`Đã thêm tài khoản ${maNguoiDung}.`);
      } else if (modal === "edit" && selected) {
        const changes: UserUpdateInput = {
          ho_ten: hoTen,
          vai_tro: form.vai_tro,
          trang_thai: form.trang_thai,
          email: form.email,
          so_dien_thoai: form.so_dien_thoai,
          dia_chi: form.dia_chi,
        };

        if (form.mat_khau) {
          changes.mat_khau = form.mat_khau;
        }

        await updateUserApi(selected.ma_nguoi_dung, changes);

        setNotice(
          `Đã cập nhật tài khoản ${selected.ma_nguoi_dung}.`
        );
      }

      setModal(null);
      await reload();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(): Promise<void> {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await deleteUserApi(selected.ma_nguoi_dung);

      setNotice(
        `Đã xóa tài khoản ${selected.ma_nguoi_dung}.`
      );

      setModal(null);
      await reload();
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleChooseFile(file?: File): Promise<void> {
    setPreview([]);
    setError("");

    if (!file) {
      return;
    }

    try {
      const parsed = await parseCsvOrExcelFile(file);
      setPreview(parsed);
    } catch (err) {
      setError(getError(err));
    }
  }

  async function handleImport(): Promise<void> {
    if (preview.length === 0) {
      return;
    }

    setBusy(true);
    setError("");

    let success = 0;
    const failed: string[] = [];
    const total = preview.length;

    for (const account of preview) {
      try {
        await createUserApi(account);
        success++;
      } catch (err) {
        failed.push(
          `${account.ma_nguoi_dung}: ${getError(err)}`
        );
      }
    }

    setBusy(false);
    setPreview([]);
    setModal(null);

    setNotice(`Đã nhập ${success}/${total} tài khoản.`);

    await reload();

    if (failed.length > 0) {
      setError(failed.join(" | "));
    }
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <div>
          <h2>Quản lý tài khoản</h2>
          <p>{users.length} tài khoản trong hệ thống</p>
        </div>

        <div className="dashboard-top-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={openCreate}
          >
            <PlusOutlined />
            <span>Thêm</span>
          </button>

          <button
            type="button"
            className="btn-upload"
            onClick={() => {
              setPreview([]);
              setError("");
              setModal("upload");
            }}
          >
            <UploadOutlined />
            <span>Upload file</span>
          </button>

          <button
            type="button"
            className="btn-excel"
            disabled={filteredUsers.length === 0}
            onClick={() => exportUsersToCsv(filteredUsers)}
          >
            <FileExcelOutlined />
            <span>Xuất excel</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <input
          aria-label="Tìm tài khoản"
          placeholder="Tìm mã, tên, vai trò, email..."
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setPage(1);
          }}
          style={{
            width: "100%",
            maxWidth: 420,
            padding: 9,
          }}
        />

        {notice && <p role="status">{notice}</p>}

        {error && (
          <p role="alert" style={{ color: "#b91c1c" }}>
            {error}
          </p>
        )}
      </div>

      <div className="dashboard-table-wrap">
        <table>
          <thead>
            <tr>
              <th>MÃ NGƯỜI DÙNG</th>
              <th>HỌ VÀ TÊN</th>
              <th>VAI TRÒ PHÂN QUYỀN</th>
              <th>TRẠNG THÁI</th>
              <th className="th-actions">THAO TÁC</th>
            </tr>
          </thead>

          <tbody>
            {!loading &&
              pageUsers.map(user => (
                <tr key={user.ma_nguoi_dung}>
                  <td className="dashboard-code">
                    {user.ma_nguoi_dung}
                  </td>

                  <td>
                    <strong>{user.ho_ten}</strong>
                  </td>

                  <td>{roleLabel(user.vai_tro)}</td>

                  <td>
                    <span
                      className={
                        `dashboard-badge ${
                          user.trang_thai === "HOAT_DONG"
                            ? "success"
                            : "danger"
                        }`
                      }
                    >
                      {user.trang_thai === "HOAT_DONG"
                        ? "Hoạt động"
                        : "Ngưng hoạt động"}
                    </span>
                  </td>

                  <td className="tk-actions-center">
                    <div className="dashboard-action-btns">
                      <button
                        type="button"
                        className="btn-icon btn-view"
                        title="Xem"
                        aria-label={`Xem ${user.ma_nguoi_dung}`}
                        onClick={() => {
                          setSelected(user);
                          setModal("view");
                        }}
                      >
                        <EyeOutlined />
                      </button>

                      <button
                        type="button"
                        className="btn-icon btn-edit"
                        title="Sửa"
                        aria-label={`Sửa ${user.ma_nguoi_dung}`}
                        onClick={() => openEdit(user)}
                      >
                        <EditOutlined />
                      </button>

                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        title="Xóa"
                        aria-label={`Xóa ${user.ma_nguoi_dung}`}
                        onClick={() => {
                          setSelected(user);
                          setModal("delete");
                        }}
                      >
                        <DeleteOutlined />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {(loading || pageUsers.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    textAlign: "center",
                    padding: 20,
                  }}
                >
                  {loading
                    ? "Đang tải..."
                    : "Không có tài khoản nào."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="dashboard-pagination-wrap">
          <span>
            {filteredUsers.length} tài khoản · Trang{" "}
            {visiblePage}/{totalPages}
          </span>

          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-btn"
              disabled={visiblePage === 1}
              onClick={() => setPage(visiblePage - 1)}
            >
              Trước
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => (
                <button
                  type="button"
                  key={index}
                  className={
                    `pagination-btn ${
                      visiblePage === index + 1
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() => setPage(index + 1)}
                >
                  {index + 1}
                </button>
              )
            )}

            <button
              type="button"
              className="pagination-btn"
              disabled={visiblePage === totalPages}
              onClick={() => setPage(visiblePage + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {modal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!busy) {
              setModal(null);
            }
          }}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            onClick={event => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {modal === "create"
                  ? "Thêm tài khoản"
                  : modal === "edit"
                    ? "Sửa tài khoản"
                    : modal === "view"
                      ? "Thông tin tài khoản"
                      : modal === "delete"
                        ? "Xác nhận xóa"
                        : "Upload tài khoản"}
              </h3>

              <button
                type="button"
                className="modal-close-btn"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>

            {(modal === "create" || modal === "edit") && (
              <form onSubmit={handleSave}>
                <div className="modal-body">
                  <div className="modal-grid">
                    <label className="modal-field">
                      Mã người dùng
                      <input
                        required
                        maxLength={20}
                        disabled={modal === "edit"}
                        value={form.ma_nguoi_dung}
                        onChange={event =>
                          setForm({
                            ...form,
                            ma_nguoi_dung: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="modal-field">
                      Họ và tên
                      <input
                        required
                        maxLength={100}
                        value={form.ho_ten}
                        onChange={event =>
                          setForm({
                            ...form,
                            ho_ten: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="modal-field">
                      Vai trò
                      <select
                        value={form.vai_tro}
                        onChange={event =>
                          setForm({
                            ...form,
                            vai_tro: event.target.value,
                          })
                        }
                      >
                        {ROLES.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="modal-field">
                      Trạng thái
                      <select
                        value={form.trang_thai}
                        onChange={event =>
                          setForm({
                            ...form,
                            trang_thai: event.target.value,
                          })
                        }
                      >
                        <option value="HOAT_DONG">
                          Hoạt động
                        </option>
                        <option value="NGUNG_HOAT_DONG">
                          Ngưng hoạt động
                        </option>
                      </select>
                    </label>

                    <label className="modal-field">
                      Email
                      <input
                        type="email"
                        value={form.email ?? ""}
                        onChange={event =>
                          setForm({
                            ...form,
                            email: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="modal-field">
                      Số điện thoại
                      <input
                        value={form.so_dien_thoai ?? ""}
                        onChange={event =>
                          setForm({
                            ...form,
                            so_dien_thoai: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="modal-field full">
                      Địa chỉ
                      <input
                        value={form.dia_chi ?? ""}
                        onChange={event =>
                          setForm({
                            ...form,
                            dia_chi: event.target.value,
                          })
                        }
                      />
                    </label>

                    <label className="modal-field full">
                      {modal === "edit"
                        ? "Mật khẩu mới (để trống nếu không đổi)"
                        : "Mật khẩu"}

                      <input
                        type="password"
                        required={modal === "create"}
                        value={form.mat_khau}
                        onChange={event =>
                          setForm({
                            ...form,
                            mat_khau: event.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={busy}
                  >
                    {busy ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </form>
            )}

            {modal === "view" && selected && (
              <>
                <div className="modal-body">
                  <p>
                    <b>Mã:</b> {selected.ma_nguoi_dung}
                  </p>
                  <p>
                    <b>Họ tên:</b> {selected.ho_ten}
                  </p>
                  <p>
                    <b>Vai trò:</b> {roleLabel(selected.vai_tro)}
                  </p>
                  <p>
                    <b>Trạng thái:</b> {selected.trang_thai}
                  </p>
                  <p>
                    <b>Email:</b> {selected.email || "—"}
                  </p>
                  <p>
                    <b>Số điện thoại:</b>{" "}
                    {selected.so_dien_thoai || "—"}
                  </p>
                  <p>
                    <b>Địa chỉ:</b> {selected.dia_chi || "—"}
                  </p>
                  <p>
                    <b>Người thao tác:</b>{" "}
                    {selected.nguoi_thao_tac || "—"}
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}

            {modal === "delete" && selected && (
              <>
                <div className="modal-body">
                  <p>
                    Bạn có chắc chắn muốn xóa tài khoản{" "}
                    <b>{selected.ma_nguoi_dung}</b>{" "}
                    ({selected.ho_ten})?
                  </p>

                  {selected.ma_nguoi_dung.toLowerCase() ===
                    "admin" && (
                    <p>Không thể xóa tài khoản admin.</p>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    className="btn-danger"
                    disabled={
                      busy ||
                      selected.ma_nguoi_dung.toLowerCase() ===
                        "admin"
                    }
                    onClick={() => void handleDelete()}
                  >
                    {busy ? "Đang xóa..." : "Xóa"}
                  </button>
                </div>
              </>
            )}

            {modal === "upload" && (
              <>
                <div className="modal-body">
                  <button
                    type="button"
                    className="btn-excel-sm"
                    onClick={downloadSampleExcelTemplate}
                  >
                    Tải file CSV mẫu
                  </button>

                  <p>
                    Mật khẩu khởi tạo cho tài khoản
                    upload: 123456.
                  </p>

                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={event =>
                      void handleChooseFile(
                        event.target.files?.[0]
                      )
                    }
                  />

                  <p>
                    {preview.length} tài khoản trong file.
                  </p>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setModal(null)}
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy || preview.length === 0}
                    onClick={() => void handleImport()}
                  >
                    {busy ? "Đang nhập..." : "Nhập tài khoản"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}