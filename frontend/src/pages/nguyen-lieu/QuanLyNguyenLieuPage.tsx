//D:\KLTN\KLTN\frontend\src\pages\nguyen-lieu\QuanLyNguyenLieuPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import ReasonConfirmDialog from "../../components/common/ReasonConfirmDialog";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
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
} from "../../components/common/PurchaseUI";
import {
  listMaterials,
  createMaterial,
  updateMaterial,
  changeMaterialStatus,
} from "../../services/nguyenLieuService";
import type { Material } from "../../services/purchaseTypes";
const blank: Material = {
  ma_nguyen_lieu: "",
  ten_nguyen_lieu: "",
  don_vi_do_luong: "kg",
  trang_thai: "DANG_SU_DUNG",
};
export default function QuanLyNguyenLieuPage() {
  const { can } = useAuth();
  const resource = useResource(listMaterials);
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<Material>(blank);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<Material | null>(null);
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (row) =>
          (!status || row.trang_thai === status) &&
          `${row.ma_nguyen_lieu} ${row.ten_nguyen_lieu}`
            .toLocaleLowerCase("vi")
            .includes(search.toLocaleLowerCase("vi")),
      ),
    [resource.data, search, status],
  );
  const edit = (row?: Material) => {
    setEditing(Boolean(row));
    setForm(row ? { ...row } : { ...blank });
    mutation.setError("");
    setOpen(true);
  };
  const save = () =>
    void mutation.run(async () => {
      if (!can(editing ? "NGUYEN_LIEU_UPDATE" : "NGUYEN_LIEU_CREATE"))
        throw new Error("Bạn chưa có quyền thực hiện thao tác này.");
      if (
        !form.ten_nguyen_lieu.trim() ||
        !form.don_vi_do_luong.trim() ||
        !form.ma_nguyen_lieu.trim()
      )
        throw new Error("Vui lòng nhập đủ mã, tên và đơn vị.");
      if (editing)
        await updateMaterial(form.ma_nguyen_lieu, {
          ten_nguyen_lieu: form.ten_nguyen_lieu.trim(),
          don_vi_do_luong: form.don_vi_do_luong.trim(),
        });
      else
        await createMaterial({
          ...form,
          ma_nguyen_lieu: form.ma_nguyen_lieu.trim(),
          ten_nguyen_lieu: form.ten_nguyen_lieu.trim(),
          don_vi_do_luong: form.don_vi_do_luong.trim(),
        });
      setOpen(false);
      resource.refetch();
    });
  return (
    <>
      <PageHeader
        title="Nguyên liệu"
        description="Quản lý danh mục nguyên liệu dùng trong sản xuất và mua hàng."
        actions={
          can("NGUYEN_LIEU_CREATE") && (
            <button className="pm-btn primary" onClick={() => edit()}>
              + Thêm nguyên liệu
            </button>
          )
        }
      />
      <div className="pm-cards">
        <SummaryCard
          label="Tổng nguyên liệu"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Đang sử dụng"
          value={
            resource.data?.filter((r) => r.trang_thai === "DANG_SU_DUNG")
              .length ?? "—"
          }
        />
        <SummaryCard
          label="Ngưng sử dụng"
          value={
            resource.data?.filter((r) => r.trang_thai === "NGUNG_SU_DUNG")
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
              { value: "DANG_SU_DUNG", label: "Đang sử dụng" },
              { value: "NGUNG_SU_DUNG", label: "Ngưng sử dụng" },
            ]}
          />
          <button className="pm-btn" onClick={resource.refetch}>
            Làm mới
          </button>
        </div>
        {resource.loading ? (
          <LoadingState />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.refetch} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.ma_nguyen_lieu}
            columns={[
              {
                key: "code",
                label: "Mã nguyên liệu",
                render: (r) => r.ma_nguyen_lieu,
              },
              {
                key: "name",
                label: "Tên nguyên liệu",
                render: (r) => <strong>{r.ten_nguyen_lieu}</strong>,
              },
              {
                key: "unit",
                label: "Đơn vị",
                render: (r) => r.don_vi_do_luong,
              },
              {
                key: "status",
                label: "Trạng thái",
                render: (r) => <StatusBadge status={r.trang_thai} />,
              },
              {
                key: "actions",
                label: "Thao tác",
                render: (r) => (
                  <div className="pm-actions">
                    <RecordHistoryButton entity="nguyen-lieu" code={r.ma_nguyen_lieu} />
                    {can("NGUYEN_LIEU_UPDATE") && (
                      <button className="pm-link" onClick={() => edit(r)}>
                        Sửa
                      </button>
                    )}
                    {can("NGUYEN_LIEU_CHANGE_STATUS") && (
                      <button
                        className="pm-link"
                        onClick={() => {
                          mutation.setError("");
                          setConfirm(r);
                        }}
                      >
                        Đổi trạng thái
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
        title={editing ? "Cập nhật nguyên liệu" : "Thêm nguyên liệu"}
        onClose={() => setOpen(false)}
        busy={mutation.busy}
        footer={
          <button
            className="pm-btn primary"
            type="submit"
            form="material-form"
            disabled={
              mutation.busy ||
              !can(editing ? "NGUYEN_LIEU_UPDATE" : "NGUYEN_LIEU_CREATE")
            }
          >
            Lưu nguyên liệu
          </button>
        }
      >
        <form
          id="material-form"
          className="pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Mã nguyên liệu">
            <input
              required
              maxLength={20}
              disabled={editing}
              value={form.ma_nguyen_lieu}
              onChange={(e) =>
                setForm({ ...form, ma_nguyen_lieu: e.target.value })
              }
            />
          </Field>
          <Field label="Tên nguyên liệu">
            <input
              required
              maxLength={100}
              value={form.ten_nguyen_lieu}
              onChange={(e) =>
                setForm({ ...form, ten_nguyen_lieu: e.target.value })
              }
            />
          </Field>
          <Field label="Đơn vị đo lường">
            <input
              required
              maxLength={20}
              value={form.don_vi_do_luong}
              onChange={(e) =>
                setForm({ ...form, don_vi_do_luong: e.target.value })
              }
            />
          </Field>
          <Field label="Trạng thái">
            <select
              disabled={editing}
              value={form.trang_thai}
              onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}
            >
              <option value="DANG_SU_DUNG">Đang sử dụng</option>
              <option value="NGUNG_SU_DUNG">Ngưng sử dụng</option>
            </select>
          </Field>
          <Feedback error={mutation.error} success="" />
        </form>
      </FormDrawer>
      <ReasonConfirmDialog
        open={Boolean(confirm)}
        functionCode={"DOI_TRANG_THAI_NGUYEN_LIEU"}
        title="Đổi trạng thái nguyên liệu"
        onClose={() => setConfirm(null)}
        busy={mutation.busy}
        onConfirm={(reason) =>
          void mutation.run(async () => {
            if (!confirm || !can("NGUYEN_LIEU_CHANGE_STATUS")) return;
            await changeMaterialStatus(
              confirm.ma_nguyen_lieu,
              confirm.trang_thai === "DANG_SU_DUNG"
                ? "NGUNG_SU_DUNG"
                : "DANG_SU_DUNG",
              reason,
            );
            setConfirm(null);
            resource.refetch();
          })
        }
      >
        <p>
          {confirm?.ten_nguyen_lieu}: chuyển sang{" "}
          {confirm?.trang_thai === "DANG_SU_DUNG"
            ? "ngưng sử dụng"
            : "đang sử dụng"}
          ?
        </p>
        <Feedback error={mutation.error} success="" />
      </ReasonConfirmDialog>
    </>
  );
}
