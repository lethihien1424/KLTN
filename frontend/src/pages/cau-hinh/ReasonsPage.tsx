import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  Field,
  Feedback,
  FormDrawer,
  ConfirmDialog,
  LoadingState,
  ErrorState,
  useResource,
  useMutation,
} from "../../components/common/PurchaseUI";
import {
  listReasons,
  saveReason,
  changeReasonStatus,
  reasonFunctions,
  type Reason,
} from "../../services/reasonService";
import { SettingsBreadcrumb } from "./SettingsPage";
export default function ReasonsPage() {
  const { can } = useAuth();
  const [search, setSearch] = useState("");
  const [fn, setFn] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const resource = useResource(
    () =>
      listReasons({
        search,
        chuc_nang: fn,
        trang_thai: status,
        page,
        page_size: size,
      }),
    [search, fn, status, page, size],
  );
  const mutation = useMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reason | null>(null);
  const [name, setName] = useState("");
  const [functions, setFunctions] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [active, setActive] = useState(true);
  const [confirm, setConfirm] = useState<Reason | null>(null);
  const start = (r: Reason | null) => {
    setEditing(r);
    setName(r?.ten_ly_do ?? "");
    setFunctions(r?.chuc_nang_ap_dung ?? []);
    setNote(r?.ghi_chu ?? "");
    setActive(!r || r.trang_thai === "DANG_SU_DUNG");
    mutation.setError("");
    setOpen(true);
  };
  const submit = () =>
    void mutation.run(async () => {
      if (!can(editing ? "UPDATE_REASON_CONFIG" : "CREATE_REASON_CONFIG"))
        throw new Error("Bạn chưa có quyền lưu lý do.");
      if (!name.trim()) throw new Error("Vui lòng nhập lý do.");
      if (!functions.length)
        throw new Error("Vui lòng chọn chức năng áp dụng.");
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
      resource.refetch();
    }, "Đã lưu lý do.");
  const data = resource.data;
  return (
    <>
      <SettingsBreadcrumb title="Quản lý lý do" />
      <PageHeader
        title="Quản lý lý do"
        description="Quản lý các lý do sử dụng trong các nghiệp vụ của hệ thống."
        actions={
          can("CREATE_REASON_CONFIG") && (
            <button className="pm-btn primary" onClick={() => start(null)}>
              + Thêm lý do
            </button>
          )
        }
      />
      <Feedback
        error={open || confirm ? "" : mutation.error}
        success={mutation.success}
      />
      <section className="pm-panel">
        <div className="pm-toolbar">
          <Field label="Tìm kiếm">
            <input
              placeholder="Tìm theo tên lý do..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Nhóm áp dụng">
            <select
              value={fn}
              onChange={(e) => {
                setFn(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {reasonFunctions.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              <option value="DANG_SU_DUNG">Đang sử dụng</option>
              <option value="NGUNG_SU_DUNG">Ngừng sử dụng</option>
            </select>
          </Field>
          <button className="pm-btn" onClick={resource.refetch}>
            Làm mới
          </button>
        </div>
        {resource.loading ? (
          <LoadingState />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.refetch} />
        ) : (
          <>
            <DataTable
              rows={data?.items ?? []}
              rowKey={(r) => r.id}
              columns={[
                {
                  key: "code",
                  label: "Mã lý do",
                  render: (r) => r.ma_ly_do,
                },
                { key: "name", label: "Tên lý do", render: (r) => r.ten_ly_do },
                {
                  key: "functions",
                  label: "Nhóm áp dụng",
                  render: (r) => (
                    <div className="pm-actions">
                      {r.chuc_nang_ap_dung.map((f) => (
                        <span key={f} className="pm-badge">
                          {reasonFunctions.find((v) => v.value === f)?.label ?? f}
                        </span>
                      ))}
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Trạng thái",
                  render: (r) =>
                    r.trang_thai === "DANG_SU_DUNG"
                      ? "Đang sử dụng"
                      : "Ngừng sử dụng",
                },
                {
                  key: "actions",
                  label: "Thao tác",
                  render: (r) => (
                    <div className="pm-actions">
                      {can("UPDATE_REASON_CONFIG") && (
                        <button className="pm-link" onClick={() => start(r)}>
                          Sửa
                        </button>
                      )}
                      {can("CHANGE_REASON_CONFIG_STATUS") && (
                        <button
                          className="pm-link"
                          onClick={() => {
                            mutation.setError("");
                            setConfirm(r);
                          }}
                        >
                          {r.trang_thai === "DANG_SU_DUNG"
                            ? "Ngừng sử dụng"
                            : "Kích hoạt lại"}
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
            <div className="pm-toolbar">
              <span>
                Hiển thị{" "}
                {data?.total ? Math.min((page - 1) * size + 1, data.total) : 0}{" "}
                - {Math.min(page * size, data?.total ?? 0)} / {data?.total ?? 0}{" "}
                bản ghi
              </span>
              <button
                className="pm-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Trang trước
              </button>
              <span>{page}</span>
              <button
                className="pm-btn"
                disabled={page * size >= (data?.total ?? 0)}
                onClick={() => setPage((p) => p + 1)}
              >
                Trang sau
              </button>
              <Field label="Số bản ghi / trang">
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50].map((s) => (
                    <option key={s} value={s}>
                      {s} / trang
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </>
        )}
      </section>
      <FormDrawer
        compact
        open={open}
        title={editing ? "Chỉnh sửa lý do" : "Thêm lý do mới"}
        busy={mutation.busy}
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              className="pm-btn"
              onClick={() => setOpen(false)}
              disabled={mutation.busy}
            >
              Hủy
            </button>
            <button
              className="pm-btn primary"
              disabled={
                mutation.busy ||
                !can(editing ? "UPDATE_REASON_CONFIG" : "CREATE_REASON_CONFIG")
              }
              onClick={submit}
            >
              Lưu
            </button>
          </>
        }
      >
        <Field label="Tên lý do *">
          <input
            value={name}
            maxLength={250}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <details open>
          <summary>Nhóm áp dụng *</summary>
          <label>
            <input
              type="checkbox"
              checked={reasonFunctions.every((f) => functions.includes(f.value))}
              onChange={(e) =>
                setFunctions(
                  e.target.checked ? reasonFunctions.map((f) => f.value) : [],
                )
              }
            />
            Chọn tất cả
          </label>
          {reasonFunctions.map((f) => (
            <label key={f.value} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={functions.includes(f.value)}
                onChange={(e) =>
                  setFunctions((values) =>
                    e.target.checked
                      ? [...values, f.value]
                      : values.filter((v) => v !== f.value),
                  )
                }
              />
              {f.label}
            </label>
          ))}
        </details>
        <Field label="Ghi chú">
          <textarea
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <label>
          <input
            type="checkbox"
            role="switch"
            checked={active}
            disabled={Boolean(editing) && !can("CHANGE_REASON_CONFIG_STATUS")}
            onChange={(e) => setActive(e.target.checked)}
          />
          Đang sử dụng
        </label>
        <Feedback error={mutation.error} success="" />
      </FormDrawer>
      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.trang_thai === "DANG_SU_DUNG"
            ? "Ngừng sử dụng lý do"
            : "Kích hoạt lại lý do"
        }
        busy={mutation.busy}
        onClose={() => setConfirm(null)}
        onConfirm={() =>
          void mutation.run(async () => {
            if (!confirm || !can("CHANGE_REASON_CONFIG_STATUS")) return;
            await changeReasonStatus(
              confirm.id,
              confirm.trang_thai === "DANG_SU_DUNG"
                ? "NGUNG_SU_DUNG"
                : "DANG_SU_DUNG",
            );
            setConfirm(null);
            resource.refetch();
          })
        }
      >
        <p>
          Bạn có chắc muốn đổi trạng thái lý do "{confirm?.ten_ly_do}"? Lịch sử
          cũ vẫn giữ nguyên lý do.
        </p>
        <Feedback error={mutation.error} success="" />
      </ConfirmDialog>
    </>
  );
}
