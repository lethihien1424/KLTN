import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type DependencyList,
  type ReactNode,
  type ReactElement,
} from "react";
import { AppstoreOutlined } from "@ant-design/icons";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="db-heading pm-heading">
      <span className="db-heading-icon" aria-hidden="true">
        <AppstoreOutlined />
      </span>
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="pm-actions">{actions}</div>
    </header>
  );
}
export function SummaryCard({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: string;
}) {
  return (
    <article className="pm-summary">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>
  );
}
const statusNames: Record<string, string> = {
  CHO_DUYET: "Chờ duyệt",
  CHUA_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
  DA_NHAN_HANG: "Đã nhận hàng",
  DANG_SU_DUNG: "Đang sử dụng",
  NGUNG_SU_DUNG: "Ngưng sử dụng",
  DANG_HOAT_DONG: "Đang hoạt động",
  NGUNG_HOAT_DONG: "Ngưng hoạt động",
  CAN_NHAP: "Cần nhập",
  BINH_THUONG: "Bình thường",
};
export function StatusBadge({ status }: { status: string }) {
  const tone = ["CHO_DUYET", "CHUA_DUYET", "CAN_NHAP"].includes(status)
    ? "warning"
    : ["TU_CHOI", "NGUNG_SU_DUNG", "NGUNG_HOAT_DONG"].includes(status)
      ? "muted"
      : "success";
  return (
    <span className={`pm-badge ${tone}`}>{statusNames[status] ?? status}</span>
  );
}
export function LoadingState() {
  return (
    <div className="pm-empty" role="status">
      <span className="pm-spinner" />
      Đang tải dữ liệu…
    </div>
  );
}
export function EmptyState({
  title = "Chưa có dữ liệu",
  description = "Dữ liệu sẽ xuất hiện tại đây khi được tạo.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="pm-empty">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div className="pm-error" role="alert">
      <span>{message}</span>
      {retry && (
        <button className="pm-btn" onClick={retry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Tìm theo mã hoặc tên…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="pm-search">
      <span>Tìm kiếm</span>
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="pm-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-labelledby"?: string;
          "aria-describedby"?: string;
        }>,
        {
          "aria-labelledby": id,
          "aria-describedby": hint ? `${id}-hint` : undefined,
        },
      )
    : children;
  return (
    <label className="pm-field">
      <span id={id}>{label}</span>
      {control}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </label>
  );
}
export function StatusTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="pm-tabs" aria-label="Lọc trạng thái">
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === value}
          className={key === value ? "active" : ""}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function FormDrawer({
  open,
  title,
  children,
  onClose,
  footer,
  busy = false,
  compact = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  busy?: boolean;
  compact?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={`pm-dialog ${compact ? "compact" : "drawer"}`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="pm-dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="pm-dialog-body">{open && children}</div>
      {footer && <footer className="pm-dialog-footer">{footer}</footer>}
    </dialog>
  );
}
export function ConfirmDialog({
  open,
  title,
  children,
  onClose,
  onConfirm,
  busy,
  confirmLabel = "Xác nhận",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
  confirmLabel?: string;
}) {
  return (
    <FormDrawer
      compact
      open={open}
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button className="pm-btn" disabled={busy} onClick={onClose}>
            Hủy
          </button>
          <button
            className="pm-btn primary"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </>
      }
    >
      {children}
    </FormDrawer>
  );
}
export function useResource<T>(
  load: () => Promise<T>,
  dependencies: DependencyList = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  const refetch = () => setVersion((value) => value + 1);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    load()
      .then((value) => {
        if (!cancelled) setData(value);
      })
      .catch((cause) => {
        if (!cancelled) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version, ...dependencies]);
  return { data, setData, loading, error, refetch };
}
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function run(
    action: () => Promise<void>,
    message = "Đã lưu thay đổi.",
  ) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, success, setError, setSuccess, run };
}
export function Feedback({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <>
      {error && <ErrorState message={error} />}
      {success && (
        <div className="pm-success" role="status">
          {success}
        </div>
      )}
    </>
  );
}
export const errorMessage = (cause: unknown) =>
  cause instanceof Error
    ? cause.message
    : "Không thể xử lý yêu cầu. Vui lòng thử lại.";
export const number = (value: string | number | null | undefined) =>
  value == null || value === "" ? 0 : Number(value);
export const formatNumber = (value: string | number | null | undefined) =>
  value == null || value === ""
    ? "—"
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(
        Number(value),
      );
export const formatMoney = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value));
export const formatDate = (value?: string | null) =>
  !value
    ? "—"
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(
        new Date(value.length === 10 ? value + "T00:00:00+07:00" : value),
      );
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
