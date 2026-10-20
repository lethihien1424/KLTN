//D:\KLTN\KLTN\frontend\src\pages\nha-cung-cap\NhaCungCapPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import ReasonConfirmDialog from "../../components/common/ReasonConfirmDialog";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import { navigate } from "../../routes/navigation";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  SearchInput,
  FilterSelect,
  FormDrawer,
  Field,
  ConfirmDialog,
  LoadingState,
  ErrorState,
  Feedback,
  useResource,
  useMutation,
  formatNumber,
} from "../../components/common/PurchaseUI";
import {
  listSuppliers,
  saveSupplier,
  changeSupplierStatus,
  scoreSupplier,
} from "../../services/nhaCungCapService";
import type { Supplier } from "../../services/purchaseTypes";
export default function NhaCungCapPage() {
  const { can } = useAuth();
  const resource = useResource(listSuppliers);
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState<{
    row?: Supplier;
    action: "status" | "score";
  } | null>(null);
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (r) =>
          (!status || r.trang_thai === status) &&
          `${r.ma_ncc} ${r.ten_ncc}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [resource.data, search, status],
  );
  const edit = (row?: Supplier) => {
    setEditing(row ?? null);
    setName(row?.ten_ncc ?? "");
    mutation.setError("");
    setOpen(true);
  };
  return (
    <>
      <PageHeader
        title="Nhà cung cấp"
        description="Danh mục đối tác, điều kiện cung ứng và hiệu suất giao hàng."
        actions={
          <>
            {can("NHA_CUNG_CAP_PERFORMANCE_VIEW") && (
              <a className="pm-btn" href="#/hieu-suat">
                Xem hiệu suất
              </a>
            )}
            {can("NHA_CUNG_CAP_CREATE") && (
              <button className="pm-btn primary" onClick={() => edit()}>
                + Thêm nhà cung cấp
              </button>
            )}
          </>
        }
      />
      <div className="pm-cards">
        <SummaryCard
          label="Tổng nhà cung cấp"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Đang hoạt động"
          value={
            resource.data?.filter((r) => r.trang_thai === "DANG_HOAT_DONG")
              .length ?? "—"
          }
        />
        <SummaryCard
          label="Đã có điểm thương mại"
          value={
            resource.data?.filter((r) => r.diem_dieu_kien_thuong_mai !== null)
              .length ?? "—"
          }
        />
      </div>
      <Feedback
        error={open || confirm ? "" : mutation.error}
        success={mutation.success}
      />
      <section className="pm-panel">
        <div className="pm-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "Tất cả" },
              { value: "DANG_HOAT_DONG", label: "Đang hoạt động" },
              { value: "NGUNG_HOAT_DONG", label: "Ngưng hoạt động" },
            ]}
          />
          {can("NHA_CUNG_CAP_SCORE") && (
            <button
              className="pm-btn"
              onClick={() => {
                mutation.setError("");
                setConfirm({ action: "score" });
              }}
            >
              Tính điểm tất cả
            </button>
          )}
        </div>
        {resource.loading ? (
          <LoadingState />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.refetch} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.ma_ncc}
            onRowClick={(r) => navigate(`/nha-cung-cap/${r.ma_ncc}`)}
            columns={[
              { key: "id", label: "Mã NCC", render: (r) => r.ma_ncc },
              {
                key: "name",
                label: "Tên nhà cung cấp",
                render: (r) => <strong>{r.ten_ncc}</strong>,
              },
              {
                key: "status",
                label: "Trạng thái",
                render: (r) => <StatusBadge status={r.trang_thai} />,
              },
              {
                key: "score",
                label: "Điểm thương mại",
                numeric: true,
                render: (r) => formatNumber(r.diem_dieu_kien_thuong_mai),
              },
              {
                key: "ontime",
                label: "Đúng hạn thực tế",
                numeric: true,
                render: (r) =>
                  r.ty_le_giao_dung_han_thuc_te === null
                    ? "Chưa có dữ liệu"
                    : `${formatNumber(r.ty_le_giao_dung_han_thuc_te)}%`,
              },
              {
                key: "full",
                label: "Giao đủ thực tế",
                numeric: true,
                render: (r) =>
                  r.ty_le_giao_du_thuc_te === null
                    ? "Chưa có dữ liệu"
                    : `${formatNumber(r.ty_le_giao_du_thuc_te)}%`,
              },
              {
                key: "actions",
                label: "Thao tác",
                render: (r) => (
                  <div className="pm-actions">
                    <RecordHistoryButton entity="nha-cung-cap" code={r.ma_ncc} />
                    {can("NGUYEN_LIEU_NCC_VIEW") && (
                      <button
                        className="pm-link"
                        onClick={() =>
                          navigate("/nha-cung-cap/cung-ung", { ncc: r.ma_ncc })
                        }
                      >
                        Nguyên liệu
                      </button>
                    )}
                    {can("NHA_CUNG_CAP_UPDATE") && (
                      <button className="pm-link" onClick={() => edit(r)}>
                        Sửa
                      </button>
                    )}
                    {can("NHA_CUNG_CAP_CHANGE_STATUS") && (
                      <button
                        className="pm-link"
                        onClick={() => {
                          mutation.setError("");
                          setConfirm({ row: r, action: "status" });
                        }}
                      >
                        Trạng thái
                      </button>
                    )}
                    {can("NHA_CUNG_CAP_SCORE") && (
                      <button
                        className="pm-link"
                        onClick={() => {
                          mutation.setError("");
                          setConfirm({ row: r, action: "score" });
                        }}
                      >
                        Tính điểm
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>
      <FormDrawer
        open={open}
        title={editing ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp"}
        onClose={() => setOpen(false)}
        busy={mutation.busy}
        footer={
          <button
            className="pm-btn primary"
            type="submit"
            form="supplier-form"
            disabled={
              mutation.busy ||
              !can(editing ? "NHA_CUNG_CAP_UPDATE" : "NHA_CUNG_CAP_CREATE")
            }
          >
            Lưu nhà cung cấp
          </button>
        }
      >
        <form
          id="supplier-form"
          className="pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            void mutation.run(async () => {
              if (!can(editing ? "NHA_CUNG_CAP_UPDATE" : "NHA_CUNG_CAP_CREATE"))
                throw new Error("Bạn chưa có quyền lưu nhà cung cấp.");
              if (!name.trim())
                throw new Error("Tên nhà cung cấp không được để trống.");
              await saveSupplier(name.trim(), editing?.ma_ncc);
              setOpen(false);
              resource.refetch();
            });
          }}
        >
          <Field label="Tên nhà cung cấp">
            <input
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Feedback error={mutation.error} success="" />
        </form>
      </FormDrawer>
      <ReasonConfirmDialog
        open={Boolean(confirm)}
        functionCode={confirm?.action === "score" ? undefined : "DOI_TRANG_THAI_NHA_CUNG_CAP"}
        title={
          confirm?.action === "score"
            ? "Tính lại điểm nhà cung cấp"
            : "Đổi trạng thái nhà cung cấp"
        }
        onClose={() => setConfirm(null)}
        busy={mutation.busy}
        onConfirm={(reason) =>
          void mutation.run(async () => {
            if (!confirm) return;
            if (confirm.action === "score") {
              if (!can("NHA_CUNG_CAP_SCORE"))
                throw new Error("Bạn chưa có quyền tính điểm.");
              await scoreSupplier(confirm.row?.ma_ncc);
            } else {
              if (!can("NHA_CUNG_CAP_CHANGE_STATUS") || !confirm.row)
                throw new Error("Bạn chưa có quyền đổi trạng thái.");
              await changeSupplierStatus(
                confirm.row.ma_ncc,
                confirm.row.trang_thai === "DANG_HOAT_DONG"
                  ? "NGUNG_HOAT_DONG"
                  : "DANG_HOAT_DONG",
              reason,
              );
            }
            setConfirm(null);
            resource.refetch();
          })
        }
      >
        <p>
          {confirm?.action === "score"
            ? `Cập nhật điểm và tỷ lệ giao hàng từ dữ liệu hiện có cho ${confirm.row?.ten_ncc ?? "tất cả nhà cung cấp"}?`
            : `Đổi trạng thái hoạt động của ${confirm?.row?.ten_ncc}?`}
        </p>
        <Feedback error={mutation.error} success="" />
      </ReasonConfirmDialog>
    </>
  );
}
