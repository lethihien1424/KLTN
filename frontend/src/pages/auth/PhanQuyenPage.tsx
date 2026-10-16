////  D:\KLTN\KLTN\frontend\src\pages\auth\PhanQuyenPage.tsx
////  D:\KLTN\KLTN\frontend\src\pages\auth\PhanQuyenPage.tsx
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

import {
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import {
  createPermissionGroup,
  deletePermissionGroup,
  exportPermissionGroups,
  getPermissionCatalog,
  getPermissionGroup,
  getPermissionGroups,
  updatePermissionGroup,
  type PermissionCatalog,
  type PermissionGroup,
  type PermissionInput,
} from "../../services/phanQuyenService";

import {
  fetchUsersFromApi,
  type UserAccount,
} from "../../services/taiKhoanService";

// CSS nằm trong public/PhanQuyen.css, được nạp bằng thẻ link trong
// index.html. Tiền tố pqx- cho trang danh sách, pqm- cho popup.

type Mode = "create" | "edit" | "view";

type Notice = {
  type: "success" | "error";
  text: string;
};

const ROLE_SHORT_NAMES: Record<string, string> = {
  ADMIN: "ADMIN",
  QUAN_LY_BAN_HANG: "QLBH",
  QUAN_LY_MUA_HANG: "QLMH",
  NHAN_VIEN_BAN_HANG: "NVBH",
  NHAN_VIEN_MUA_HANG: "NVMH",
};

const ACTION_ORDER = [
  "XEM",
  "THEM",
  "SUA",
  "XOA",
  "DUYET",
  "TU_CHOI",
  "CHAY_DU_BAO",
  "NHAP_FILE",
  "XUAT_EXCEL",
];

const ADMIN_REQUIRED_KEYS = new Set([
  "phan_quyen:XEM",
  "phan_quyen:THEM",
  "phan_quyen:SUA",
  "phan_quyen:XOA",
  "tai_khoan:XEM",
  "tai_khoan:THEM",
  "tai_khoan:SUA",
  "tai_khoan:XOA",
]);

function permissionKey(
  feature: string,
  action: string,
): string {
  return `${feature}:${action}`;
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "Không thể thực hiện thao tác. Vui lòng thử lại.";
}

function formatDate(value: string): string {
  const date = new Date(value);

  return Number.isFinite(date.getTime())
    ? date.toLocaleString("vi-VN")
    : "—";
}

function TriCheckbox({
  checked,
  partial = false,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  partial?: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = partial && !checked;
    }
  }, [checked, partial]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      onChange={onChange}
    />
  );
}

function Modal({
  title,
  subtitle,
  busy,
  onClose,
  children,
  bare = false,
}: {
  title: string;
  subtitle: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
  bare?: boolean;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    // Ưu tiên phần tử có data-autofocus (ví dụ nút Hủy ở hộp xóa).
    const preferred =
      dialogRef.current?.querySelector<HTMLElement>(
        "[data-autofocus]",
      );

    (preferred ?? dialogRef.current)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, []);

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (!busy) onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const elements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled), " +
          "textarea:not(:disabled), select:not(:disabled), " +
          '[tabindex="0"]',
      ) || [],
    ).filter(element => element.offsetParent !== null);

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (!first || !last) {
      event.preventDefault();
      return;
    }

    if (
      event.shiftKey &&
      (
        document.activeElement === first ||
        document.activeElement === dialogRef.current
      )
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (
        document.activeElement === last ||
        document.activeElement === dialogRef.current
      )
    ) {
      event.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className="pqm-overlay"
      onMouseDown={event => {
        // Bấm ra ngoài vùng popup thì đóng (trừ lúc đang xử lý).
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={
          "pqm-modal" + (bare ? " pqm-modal-confirm" : "")
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {bare ? (
          <h2 id={titleId} className="pqm-sr-only">
            {title}
          </h2>
        ) : (
          <header className="pqm-head">
            <div>
              <h2 id={titleId}>{title}</h2>
              <p>{subtitle}</p>
            </div>

            <button
              type="button"
              className="pqm-close"
              aria-label="Đóng"
              disabled={busy}
              onClick={onClose}
            >
              <CloseOutlined />
            </button>
          </header>
        )}

        {children}
      </div>
    </div>,
    document.body,
  );
}


export default function PhanQuyenPage() {
  const [catalog, setCatalog] =
    useState<PermissionCatalog | null>(null);

  const [groups, setGroups] =
    useState<PermissionGroup[]>([]);

  const [accounts, setAccounts] =
    useState<UserAccount[] | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [accountError, setAccountError] = useState("");
  const [refresh, setRefresh] = useState(0);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 7;
  const [featureSearch, setFeatureSearch] = useState("");

  const [mode, setMode] = useState<Mode | null>(null);
  const [editing, setEditing] =
    useState<PermissionGroup | null>(null);
  const [deleting, setDeleting] =
    useState<PermissionGroup | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [selected, setSelected] =
    useState<Set<string>>(new Set());

  const [rolesOpen, setRolesOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [openingId, setOpeningId] =
    useState<string | null>(null);

  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  const operationRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setLoadError("");
    setAccountError("");

    async function load() {
      const results = await Promise.allSettled([
        getPermissionCatalog(controller.signal),
        getPermissionGroups(controller.signal),
        fetchUsersFromApi(),
      ]);

      if (controller.signal.aborted) return;

      const [catalogResult, groupsResult, accountsResult] =
        results;

      const errors: string[] = [];

      if (catalogResult.status === "fulfilled") {
        setCatalog(catalogResult.value);
      } else {
        errors.push(errorMessage(catalogResult.reason));
      }

      if (groupsResult.status === "fulfilled") {
        setGroups(groupsResult.value);
      } else {
        errors.push(errorMessage(groupsResult.reason));
      }

      if (accountsResult.status === "fulfilled") {
        setAccounts(accountsResult.value);
      } else {
        setAccountError(
          "Chưa tải được thống kê tài khoản. " +
          "Bạn vẫn có thể quản lý quyền.",
        );
      }

      setLoadError([...new Set(errors)].join(" "));
      setLoading(false);
    }

    void load();

    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (!notice || notice.type !== "success") return;

    const timer = window.setTimeout(
      () => setNotice(null),
      5000,
    );

    return () => window.clearTimeout(timer);
  }, [notice]);

  const actions = catalog
    ? [...catalog.thao_tac].sort(
        (a, b) =>
          ACTION_ORDER.indexOf(a.ma) -
          ACTION_ORDER.indexOf(b.ma),
      )
    : [];

  const filteredGroups = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return groups.filter(group =>
      !keyword ||
      `${group.ma} ${group.ten_quyen} ${group.dien_giai || ""}`
        .toLocaleLowerCase("vi")
        .includes(keyword),
    );
  }, [groups, search]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleGroups = filteredGroups.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const countAll = groups.length;
  const countRoles = catalog?.vai_tro.length ?? 5;
  const totalAccounts = accounts?.length ?? 0;
  const activeAccounts = (accounts ?? []).filter(account => {
    const state = String((account as unknown as { trang_thai?: string }).trang_thai ?? "");
    return state === "HOAT_DONG";
  }).length;
  const inactiveAccounts = (accounts ?? []).filter(account => {
    const state = String((account as unknown as { trang_thai?: string }).trang_thai ?? "");
    return state === "NGUNG_HOAT_DONG";
  }).length;


  const visibleFeatures =
    catalog?.chuc_nang.filter(feature =>
      `${feature.ma} ${feature.ten}`
        .toLocaleLowerCase("vi")
        .includes(
          featureSearch.trim().toLocaleLowerCase("vi"),
        ),
    ) || [];

  // Toàn bộ quyền trong danh mục, không phụ thuộc tìm kiếm.
  const allKeys =
    catalog?.chuc_nang.flatMap(feature =>
      feature.thao_tac.map(action =>
        permissionKey(feature.ma, action),
      ),
    ) || [];

  const allSelected =
    allKeys.length > 0 &&
    allKeys.every(key => selected.has(key));

  const selectedActionCount = allKeys.filter(
    key => selected.has(key),
  ).length;

  const selectedFeatureCount =
    catalog?.chuc_nang.filter(feature =>
      feature.thao_tac.some(action =>
        selected.has(permissionKey(feature.ma, action)),
      ),
    ).length || 0;

  const isView = mode === "view";
  const roleAccountCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const account of accounts ?? []) {
      const role = String((account as unknown as { vai_tro?: string }).vai_tro ?? "");
      if (role) counts[role] = (counts[role] ?? 0) + 1;
    }
    return counts;
  }, [accounts]);
  const appliesToAdmin = roles.includes("ADMIN");
  const adminRoleLocked =
    editing?.vai_tro.includes("ADMIN") || false;

  function roleName(code: string) {
    return (
      catalog?.vai_tro.find(role => role.ma === code)?.ten ||
      code
    );
  }

  function notify(type: Notice["type"], text: string) {
    if (mountedRef.current) {
      setNotice({ type, text });
    }
  }

  function closeEditor() {
    if (operationRef.current) return;

    setMode(null);
    setEditing(null);
    setRolesOpen(false);
    setFormError("");
  }

  function openCreate() {
    if (
      !catalog ||
      loading ||
      loadError ||
      operationRef.current
    ) {
      return;
    }

    setEditing(null);
    setName("");
    setDescription("");
    setRoles([]);
    setSelected(new Set());
    setRolesOpen(false);
    setFeatureSearch("");
    setFormError("");
    setMode("create");
  }

  async function openGroup(
    group: PermissionGroup,
    nextMode: Mode,
  ) {
    if (
      operationRef.current ||
      !catalog ||
      loading ||
      loadError
    ) {
      return;
    }

    operationRef.current = true;
    setOpeningId(group.ma);

    try {
      const detail = await getPermissionGroup(group.ma);

      if (!mountedRef.current) return;

      setEditing(detail);
      setName(detail.ten_quyen);
      setDescription(detail.dien_giai || "");
      setRoles([...detail.vai_tro]);

      setSelected(
        new Set(
          detail.chi_tiet.map(item =>
            permissionKey(item.chuc_nang, item.thao_tac),
          ),
        ),
      );

      setRolesOpen(false);
      setFeatureSearch("");
      setFormError("");
      setMode(nextMode);
    } catch (cause) {
      notify("error", errorMessage(cause));
    } finally {
      operationRef.current = false;

      if (mountedRef.current) {
        setOpeningId(null);
      }
    }
  }

  function isProtected(key: string) {
    return (
      appliesToAdmin &&
      ADMIN_REQUIRED_KEYS.has(key)
    );
  }

  function normalizeSelection(
    source: Set<string>,
  ): Set<string> {
    const result = new Set(source);

    // Giữ các quyền thiết yếu cho nhóm áp dụng Admin.
    if (appliesToAdmin) {
      ADMIN_REQUIRED_KEYS.forEach(key => result.add(key));
    }

    // Có thao tác khác thì phải có XEM.
    for (const feature of catalog?.chuc_nang || []) {
      const hasOtherAction = feature.thao_tac.some(
        action =>
          action !== "XEM" &&
          result.has(permissionKey(feature.ma, action)),
      );

      if (
        hasOtherAction &&
        feature.thao_tac.includes("XEM")
      ) {
        result.add(permissionKey(feature.ma, "XEM"));
      }
    }

    return result;
  }

  function toggleRole(role: string) {
    if (isView || operationRef.current) return;

    if (role === "ADMIN" && adminRoleLocked) {
      return;
    }

    const nextRoles = roles.includes(role)
      ? roles.filter(item => item !== role)
      : [...roles, role];

    setRoles(nextRoles);

    if (nextRoles.includes("ADMIN")) {
      setSelected(previous => {
        const next = new Set(previous);

        ADMIN_REQUIRED_KEYS.forEach(key => next.add(key));

        return next;
      });
    }
  }

  function removeKey(
    selection: Set<string>,
    key: string,
  ) {
    if (isProtected(key)) return;

    selection.delete(key);

    // Bỏ XEM thì bỏ các thao tác còn lại của chức năng.
    if (key.endsWith(":XEM")) {
      const featureCode = key.slice(0, -4);

      const feature = catalog?.chuc_nang.find(
        item => item.ma === featureCode,
      );

      feature?.thao_tac.forEach(action => {
        const relatedKey = permissionKey(
          featureCode,
          action,
        );

        if (!isProtected(relatedKey)) {
          selection.delete(relatedKey);
        }
      });
    }
  }

  function togglePermission(
    featureCode: string,
    action: string,
  ) {
    if (isView || operationRef.current) return;

    const key = permissionKey(featureCode, action);

    if (isProtected(key)) return;

    setSelected(previous => {
      const next = new Set(previous);

      if (previous.has(key)) {
        removeKey(next, key);
      } else {
        next.add(key);
      }

      return normalizeSelection(next);
    });
  }

  // Dùng cho chọn cả hàng, cả cột hoặc toàn bộ danh mục.
  function toggleKeys(keys: string[]) {
    if (
      isView ||
      operationRef.current ||
      keys.length === 0
    ) {
      return;
    }

    setSelected(previous => {
      const next = new Set(previous);
      const remove = keys.every(key => previous.has(key));

      for (const key of keys) {
        if (remove) {
          removeKey(next, key);
        } else {
          next.add(key);
        }
      }

      return normalizeSelection(next);
    });
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      operationRef.current ||
      isView ||
      !catalog ||
      !mode
    ) {
      return;
    }

    if (!name.trim()) {
      setFormError("Vui lòng nhập tên quyền.");
      return;
    }

    // Mở rộng lựa chọn thành các cặp quyền cụ thể.
    // Không gửi ALL vì backend hiện tại không hỗ trợ mã đó.
    const normalized = normalizeSelection(selected);

    const input: PermissionInput = {
      ten_quyen: name.trim(),
      dien_giai: description.trim() || null,
      vai_tro: [...roles],

      chi_tiet: catalog.chuc_nang.flatMap(feature =>
        feature.thao_tac
          .filter(action =>
            normalized.has(
              permissionKey(feature.ma, action),
            ),
          )
          .map(action => ({
            chuc_nang: feature.ma,
            thao_tac: action,
          })),
      ),
    };

    const updating = mode === "edit";

    if (updating && !editing) {
      setFormError(
        "Chưa có thông tin nhóm quyền cần cập nhật.",
      );
      return;
    }

    operationRef.current = true;
    setBusy(true);
    setFormError("");

    try {
      if (updating && editing) {
        await updatePermissionGroup(editing.ma, input);
      } else {
        await createPermissionGroup(input);
      }

      if (!mountedRef.current) return;

      setMode(null);
      setEditing(null);

      notify(
        "success",
        updating
          ? "Cập nhật quyền thành công."
          : "Thêm quyền thành công.",
      );

      setRefresh(value => value + 1);
    } catch (cause) {
      if (mountedRef.current) {
        setFormError(errorMessage(cause));
      }

      notify("error", errorMessage(cause));
    } finally {
      operationRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  async function handleDelete() {
    if (
      !deleting ||
      !deleting.duoc_xoa ||
      operationRef.current
    ) {
      return;
    }

    operationRef.current = true;
    setBusy(true);
    setFormError("");

    try {
      await deletePermissionGroup(deleting.ma);

      if (!mountedRef.current) return;

      setDeleting(null);
      notify("success", "Xóa nhóm quyền thành công.");
      setRefresh(value => value + 1);
    } catch (cause) {
      if (mountedRef.current) {
        setFormError(errorMessage(cause));
      }

      notify("error", errorMessage(cause));
    } finally {
      operationRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  async function handleExport() {
    if (
      !catalog ||
      loading ||
      loadError ||
      operationRef.current
    ) {
      return;
    }

    operationRef.current = true;
    setBusy(true);

    try {
      await exportPermissionGroups(
        visibleGroups,
        catalog,
      );

      notify("success", "Đã xuất danh sách quyền.");
    } catch (cause) {
      notify("error", errorMessage(cause));
    } finally {
      operationRef.current = false;

      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  const listDisabled =
    loading ||
    busy ||
    openingId !== null;

  return (
    <section className="pqx-page" aria-busy={loading}>
      {/* Một thẻ lớn: header sát mép trên -> tab -> nội dung */}
      <div className="pqx-card">
        <div className="pqx-header">
          <div className="pqx-header-icon" aria-hidden="true">
            <SafetyCertificateOutlined />
          </div>
          <div className="pqx-header-text">
            <h2>Phân quyền</h2>
            <p>Chọn chức năng, thao tác và vai trò áp dụng cho từng nhóm quyền.</p>
          </div>
        </div>

        <div className="pqx-tabs" role="tablist" aria-label="Danh sách quyền">
          <button type="button" role="tab" aria-selected="true" className="pqx-tab">
            Danh sách quyền
            <span className="pqx-tab-badge">{countAll}</span>
          </button>
        </div>

        <div className="pqx-body">
          <div className="pqx-stats">
            <div className="pqx-stat">
              <span className="pqx-stat-title">Tổng tài khoản</span>
              <strong className="pqx-stat-value blue">{accounts === null ? "—" : totalAccounts}</strong>
              <span className="pqx-stat-desc">Tài khoản đã lưu trong hệ thống</span>
            </div>
            <div className="pqx-stat">
              <span className="pqx-stat-title">Đang hoạt động</span>
              <strong className="pqx-stat-value green">{accounts === null ? "—" : activeAccounts}</strong>
              <span className="pqx-stat-desc">Tài khoản được phép đăng nhập</span>
            </div>
            <div className="pqx-stat">
              <span className="pqx-stat-title">Ngừng hoạt động</span>
              <strong className="pqx-stat-value orange">{accounts === null ? "—" : inactiveAccounts}</strong>
              <span className="pqx-stat-desc">Tài khoản đã ngừng truy cập</span>
            </div>
            <div className="pqx-stat">
              <span className="pqx-stat-title">Vai trò hiện hành</span>
              <strong className="pqx-stat-value purple">{countRoles}</strong>
              <span className="pqx-stat-desc">Nhóm vai trò của hệ thống</span>
            </div>
          </div>

          {accountError && (
            <p className="pqx-note">{accountError}</p>
          )}

          {loadError && (
            <div className="pqx-error" role="alert">
              {loadError}
            </div>
          )}

          {/* Danh sách: tiêu đề bên trái, các nút bên phải */}
          <div className="pqx-section-head">
            <div>
              <h3>Danh sách quyền</h3>
              <p>{countAll} nhóm quyền trong hệ thống</p>
            </div>

            <div className="pqx-toolbar">
              <button
                type="button"
                className="pqx-btn-secondary"
                disabled={
                  listDisabled ||
                  !catalog ||
                  Boolean(loadError) ||
                  filteredGroups.length === 0
                }
                onClick={() => void handleExport()}
              >
                <DownloadOutlined /> Xuất Excel
              </button>

              <button
                type="button"
                className="pqx-btn-primary"
                disabled={
                  listDisabled ||
                  !catalog ||
                  Boolean(loadError)
                }
                onClick={openCreate}
              >
                <PlusOutlined /> Thêm quyền
              </button>
            </div>
          </div>

          {/* Bộ lọc và tìm kiếm */}
          <div className="pqx-filter">
            <div className="pqx-search">
              <SearchOutlined className="pqx-search-icon" />
              <input
                aria-label="Tìm nhóm quyền"
                placeholder="Tìm tên quyền, mã hoặc diễn giải..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <button
              type="button"
              className="pqx-btn-reload"
              title="Làm mới"
              aria-label="Làm mới"
              disabled={listDisabled}
              onClick={() => setRefresh(value => value + 1)}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </div>

          {/* Bảng dữ liệu */}
          <div className="pqx-table-wrap">
            <table className="pqx-table">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Tên quyền</th>
                  <th style={{ width: "35%" }}>Diễn giải</th>
                  <th style={{ width: "25%" }}>Vai trò áp dụng</th>
                  <th style={{ width: "15%", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="pqx-empty">
                      Đang tải danh sách quyền...
                    </td>
                  </tr>
                ) : !visibleGroups.length ? (
                  <tr>
                    <td colSpan={4} className="pqx-empty">
                      {loadError
                        ? "Chưa tải được danh sách. Nhấn Làm mới để thử lại."
                        : search.trim()
                          ? "Không tìm thấy nhóm quyền phù hợp."
                          : "Chưa có nhóm quyền. Nhấn Thêm quyền để bắt đầu."}
                    </td>
                  </tr>
                ) : (
                  visibleGroups.map(group => (
                    <tr key={group.ma}>
                      <td>
                        <div className="pqx-name">
                          <strong>{group.ten_quyen}</strong>
                          <span>
                            {group.ma} · {group.chi_tiet.length} thao tác
                          </span>
                        </div>
                      </td>

                      <td className="pqx-desc">
                        {group.dien_giai || "Chưa có diễn giải"}
                      </td>

                      <td>
                        <div className="pqx-tags">
                          {group.vai_tro.length === 0 ? (
                            <span className="pqx-muted">Chưa áp dụng</span>
                          ) : (
                            group.vai_tro.map(role => (
                              <span
                                key={role}
                                className="pqx-tag"
                                title={roleName(role)}
                              >
                                {ROLE_SHORT_NAMES[role] || role}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: "center" }}>
                        <div className="pqx-actions">
                          <button
                            type="button"
                            className="pqx-action"
                            title="Xem"
                            aria-label={`Xem ${group.ten_quyen}`}
                            disabled={
                              listDisabled ||
                              !catalog ||
                              Boolean(loadError)
                            }
                            onClick={() => void openGroup(group, "view")}
                          >
                            <EyeOutlined />
                          </button>

                          <button
                            type="button"
                            className="pqx-action"
                            title="Sửa"
                            aria-label={`Sửa ${group.ten_quyen}`}
                            disabled={
                              listDisabled ||
                              !catalog ||
                              Boolean(loadError)
                            }
                            onClick={() => void openGroup(group, "edit")}
                          >
                            <EditOutlined />
                          </button>

                          <button
                            type="button"
                            className="pqx-action danger"
                            title={
                              group.duoc_xoa
                                ? "Xóa"
                                : "Không được xóa nhóm quyền Admin"
                            }
                            aria-label={`Xóa ${group.ten_quyen}`}
                            disabled={
                              listDisabled ||
                              !group.duoc_xoa
                            }
                            onClick={() => {
                              setFormError("");
                              setDeleting(group);
                            }}
                          >
                            <DeleteOutlined />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <footer className="pqx-pagination">
            <span>
              {filteredGroups.length
                ? `Hiển thị ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                    currentPage * PAGE_SIZE,
                    filteredGroups.length
                  )} / ${filteredGroups.length} nhóm quyền`
                : "0 nhóm quyền"}
            </span>
            <div className="pqx-page-nav">
              <button
                type="button"
                className="pqx-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Trước
              </button>
              <span className="pqx-page-info">
                Trang {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                className="pqx-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Sau
              </button>
            </div>
          </footer>
        </div>
      </div>

      {mode && catalog && (
        <Modal
          title={
            mode === "create"
              ? "Thêm quyền mới"
              : mode === "edit"
                ? "Chỉnh sửa quyền"
                : "Xem chi tiết quyền"
          }
          subtitle={
            isView
              ? "Chỉ xem, không thể chỉnh sửa trong chế độ này"
              : "Chọn vai trò áp dụng, chức năng và thao tác được phép"
          }
          busy={busy}
          onClose={closeEditor}
        >
          <form
            className={`pqm-form${isView ? " pqm-locked" : ""}`}
            onSubmit={handleSave}
          >
            <div className="pqm-body">
              <section className="pqm-card">
                <div className="pqm-card-head">
                  <h3>Thông tin quyền</h3>

                  {editing && (
                    <span className="pqm-tag">
                      {editing.ma}
                    </span>
                  )}
                </div>

                <div className="pqm-grid">
                  <label className="pqm-field">
                    <span>
                      Tên quyền{" "}
                      {!isView && (
                        <b className="pqm-required">*</b>
                      )}
                    </span>

                    <input
                      value={name}
                      maxLength={100}
                      required={!isView}
                      readOnly={isView}
                      disabled={busy || isView}
                      placeholder="Nhập tên quyền"
                      onChange={event =>
                        setName(event.target.value)
                      }
                    />
                  </label>

                  <label className="pqm-field">
                    <span>Diễn giải</span>

                    <textarea
                      value={description}
                      rows={2}
                      readOnly={isView}
                      disabled={busy || isView}
                      placeholder="Nhập diễn giải về nhóm quyền"
                      onChange={event =>
                        setDescription(event.target.value)
                      }
                    />
                  </label>
                </div>
              </section>

              <section className="pqm-card">
                <button
                  type="button"
                  className="pqm-role-toggle"
                  aria-expanded={rolesOpen}
                  onClick={() => setRolesOpen(value => !value)}
                >
                  <DownOutlined
                    className={
                      rolesOpen
                        ? "pqm-chevron-open"
                        : "pqm-chevron"
                    }
                  />
                  <strong>Áp dụng cho vai trò</strong>
                  <span className="pqm-role-toggle-count">{roles.length === 0 ? "Chưa chọn" : `${roles.length} vai trò đã chọn`}</span>
                </button>

                {rolesOpen && (
                  <div className="pqm-role-grid">
                    {catalog.vai_tro.map(role => (
                      <label
                        key={role.ma}
                        className={
                          "pqm-role-item" +
                          (
                            roles.includes(role.ma)
                              ? " is-selected"
                              : ""
                          )
                        }
                      >
                        <input
                          type="checkbox"
                          checked={roles.includes(role.ma)}
                          disabled={
                            isView ||
                            busy ||
                            (
                              role.ma === "ADMIN" &&
                              adminRoleLocked
                            )
                          }
                          onChange={() => toggleRole(role.ma)}
                        />

                        <div>
                          <strong>{role.ten}</strong>
                          <small>
                            {accounts === null
                              ? "Đang tải tài khoản"
                              : `${roleAccountCounts[role.ma] ?? 0} tài khoản`}
                          </small>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {appliesToAdmin && rolesOpen && (
                  <p className="pqm-note">
                    Các quyền quản trị thiết yếu được giữ cố định cho Admin.
                  </p>
                )}
              </section>

              <section className="pqm-card">
                <div className="pqm-matrix-head">
                  <div>
                    <h3>Chức năng và thao tác</h3>
                    <p>
                      {isView
                        ? "Các thao tác nhóm quyền này đang được dùng"
                        : "Tick thao tác nào thì quyền này được dùng thao tác đó"}
                    </p>
                  </div>

                  <div className="pqm-matrix-tools">
                    <input
                      className="pqm-feature-search"
                      aria-label="Tìm chức năng"
                      placeholder="Tìm chức năng..."
                      value={featureSearch}
                      onChange={event =>
                        setFeatureSearch(event.target.value)
                      }
                    />

                    {!isView && (
                      <label className="pqm-select-all">
                        <TriCheckbox
                          label="Chọn tất cả chức năng và thao tác"
                          checked={allSelected}
                          partial={selectedActionCount > 0}
                          disabled={busy}
                          onChange={() => toggleKeys(allKeys)}
                        />
                        Tất cả
                      </label>
                    )}
                  </div>
                </div>

                <div className="pqm-table-scroll">
                  <table className="pqm-matrix">
                    <thead>
                      <tr>
                        <th>Chức năng</th>

                        {actions.map(action => {
                          const keys = visibleFeatures
                            .filter(feature =>
                              feature.thao_tac.includes(action.ma),
                            )
                            .map(feature =>
                              permissionKey(feature.ma, action.ma),
                            );

                          return (
                            <th key={action.ma}>
                              <span>{action.ten}</span>

                              <TriCheckbox
                                label={`Chọn cột ${action.ten}`}
                                checked={
                                  keys.length > 0 &&
                                  keys.every(key => selected.has(key))
                                }
                                partial={keys.some(key =>
                                  selected.has(key),
                                )}
                                disabled={
                                  isView ||
                                  busy ||
                                  keys.length === 0
                                }
                                onChange={() => toggleKeys(keys)}
                              />
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody>
                      {visibleFeatures.map(feature => {
                        const featureKeys =
                          feature.thao_tac.map(action =>
                            permissionKey(feature.ma, action),
                          );

                        const featureChecked =
                          featureKeys.length > 0 &&
                          featureKeys.every(key =>
                            selected.has(key),
                          );

                        const featurePartial =
                          featureKeys.some(key =>
                            selected.has(key),
                          );

                        return (
                          <tr key={feature.ma}>
                            <td>
                              <label className="pqm-feature-select">
                                <TriCheckbox
                                  label={
                                    `Chọn tất cả thao tác của ${feature.ten}`
                                  }
                                  checked={featureChecked}
                                  partial={featurePartial}
                                  disabled={isView || busy}
                                  onChange={() =>
                                    toggleKeys(featureKeys)
                                  }
                                />

                                <span>{feature.ten}</span>
                              </label>
                            </td>

                            {actions.map(action => {
                              const key = permissionKey(
                                feature.ma,
                                action.ma,
                              );

                              const supported =
                                feature.thao_tac.includes(action.ma);

                              const protectedPermission =
                                isProtected(key);

                              return (
                                <td key={action.ma}>
                                  {supported ? (
                                    <input
                                      type="checkbox"
                                      checked={selected.has(key)}
                                      aria-label={
                                        `${feature.ten}: ${action.ten}`
                                      }
                                      title={
                                        protectedPermission
                                          ? "Quyền quản trị thiết yếu"
                                          : `${feature.ten}: ${action.ten}`
                                      }
                                      disabled={
                                        isView ||
                                        busy ||
                                        protectedPermission
                                      }
                                      onChange={() =>
                                        togglePermission(
                                          feature.ma,
                                          action.ma,
                                        )
                                      }
                                    />
                                  ) : (
                                    <span className="pqm-dash">
                                      —
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}

                      {visibleFeatures.length === 0 && (
                        <tr>
                          <td
                            colSpan={actions.length + 1}
                            className="pqm-empty"
                          >
                            Không tìm thấy chức năng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {isView && editing && (
                <section className="pqm-card">
                  <div className="pqm-card-head">
                    <h3>Thông tin ghi nhận</h3>
                  </div>

                  <dl className="pqm-audit">
                    <div>
                      <dt>Người tạo</dt>
                      <dd>{editing.nguoi_tao || "—"}</dd>
                    </div>

                    <div>
                      <dt>Người cập nhật</dt>
                      <dd>{editing.nguoi_cap_nhat || "—"}</dd>
                    </div>

                    <div>
                      <dt>Thời gian tạo</dt>
                      <dd>
                        {formatDate(editing.thoi_gian_tao)}
                      </dd>
                    </div>

                    <div>
                      <dt>Thời gian cập nhật</dt>
                      <dd>
                        {formatDate(editing.thoi_gian_cap_nhat)}
                      </dd>
                    </div>
                  </dl>
                </section>
              )}

              {formError && (
                <div className="pqm-error" role="alert">
                  {formError}
                </div>
              )}
            </div>

            <footer className="pqm-footer">
              <span>
                Đang chọn {selectedFeatureCount}/{catalog.chuc_nang.length} chức năng
              </span>

              <div>
                <button
                  type="button"
                  className="pqm-button"
                  disabled={busy}
                  onClick={closeEditor}
                >
                  {isView ? "Đóng" : "Hủy"}
                </button>

                {!isView && (
                  <button
                    type="submit"
                    className="pqm-button pqm-primary"
                    disabled={busy}
                  >
                    {busy ? "Đang lưu..." : "Lưu quyền"}
                  </button>
                )}
              </div>
            </footer>
          </form>
        </Modal>
      )}

      {/* Hộp xác nhận xóa: gọn, có icon, tên nhóm quyền và 2 nút cùng hàng */}
      {deleting && (
        <Modal
          title="Xóa nhóm quyền"
          subtitle=""
          bare
          busy={busy}
          onClose={() => {
            if (!operationRef.current) {
              setDeleting(null);
            }
          }}
        >
          <div className="pqx-confirm-body">
            <span className="pqx-confirm-icon" aria-hidden="true">
              <DeleteOutlined />
            </span>

            <h3 className="pqx-confirm-title">Xóa nhóm quyền?</h3>

            <div className="pqx-confirm-name">
              {deleting.ma} · {deleting.ten_quyen}
            </div>

            <p className="pqx-confirm-text">
              {deleting.vai_tro.length > 0
                ? `Vai trò ${deleting.vai_tro
                    .map(role => ROLE_SHORT_NAMES[role] || role)
                    .join(", ")} sẽ mất quyền này. Không thể hoàn tác.`
                : "Không thể hoàn tác."}
            </p>

            {formError && (
              <div className="pqx-confirm-error" role="alert">
                {formError}
              </div>
            )}
          </div>

          <div className="pqx-confirm-actions">
            <button
              type="button"
              data-autofocus
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Hủy
            </button>

            <button
              type="button"
              className="pqx-danger"
              disabled={busy || !deleting.duoc_xoa}
              onClick={() => void handleDelete()}
            >
              <DeleteOutlined /> {busy ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </Modal>
      )}

      {notice &&
        createPortal(
          <div
            className={`pqx-toast ${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <div>
              <strong>
                {notice.type === "error"
                  ? "Thông báo"
                  : "Thành công"}
              </strong>
              <p>{notice.text}</p>
            </div>

            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => setNotice(null)}
            >
              <CloseOutlined />
            </button>
          </div>,
          document.body,
        )}
    </section>
  );
}