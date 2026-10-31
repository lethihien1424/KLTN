import ActionIconButton from "../../components/common/ActionIconButton";
//D:\KLTN\KLTN\frontend\src\pages\cong-thuc\CongThucPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import ReasonConfirmDialog from "../../components/common/ReasonConfirmDialog";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import { MaterialField } from "../../components/common/EntityFields";
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
  formatDate,
  number,
} from "../../components/common/PurchaseUI";
import {
  listBoms,
  getBom,
  saveBom,
  changeBomStatus,
  type BomInput,
} from "../../services/congThucService";
import type { Bom } from "../../services/purchaseTypes";
import BomQuantification from "./BomQuantification";
import { validateBomRatios } from "../../services/bomQuantities";
import { useBomExcelActions } from "./useBomExcelActions";
import type { ReasonSelection } from "../../services/reasonService";
const blank = (): BomInput => ({
  ma_san_pham: "",
  ten_cong_thuc: "",
  he_so_thu_hoi: "1",
  ty_le_hao_hut: "0",
  trang_thai: "DANG_SU_DUNG",
  chi_tiet: [{ ma_nguyen_lieu: "", ty_le_phoi_tron: "1" }],
});
export default function CongThucPage() {
  const { can } = useAuth();
  const resource = useResource(listBoms);
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [form, setForm] = useState<BomInput>(blank);
  const [detail, setDetail] = useState<Bom | null>(null);
  const [editBom, setEditBom] = useState<Bom | null>(null);
  const [confirm, setConfirm] = useState<Bom | null>(null);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const excel = useBomExcelActions({
    filters: { search: search.trim(), ma_san_pham: product, trang_thai: status },
    loading: resource.loading || Boolean(resource.error), onImported: resource.refetch,
  });
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (r) =>
          (!status || r.trang_thai === status) &&
          (!product || r.ma_san_pham === product) &&
          `${r.ma_cong_thuc} ${r.ten_cong_thuc} ${r.ten_san_pham}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
      ),
    [resource.data, status, search, product],
  );
  const openDetail = (row: Bom, edit = false) =>
    void mutation.run(async () => {
      const value = await getBom(row.ma_cong_thuc);
      if (edit) {
        setEditBom(value);
        setEditId(value.ma_cong_thuc);
        setForm({
          ma_san_pham: value.ma_san_pham,
          ten_cong_thuc: value.ten_cong_thuc,
          he_so_thu_hoi: value.he_so_thu_hoi,
          ty_le_hao_hut: value.ty_le_hao_hut,
          trang_thai: value.trang_thai,
          chi_tiet: value.chi_tiet.map((r) => ({
            ma_nguyen_lieu: r.ma_nguyen_lieu,
            ty_le_phoi_tron: r.ty_le_phoi_tron,
          })),
        });
        setOpen(true);
      } else setDetail(value);
    }, "");
  const total = form.chi_tiet.reduce(
    (sum, r) => sum + Math.round(number(r.ty_le_phoi_tron) * 10000),
    0,
  );
  const statusChanged = Boolean(editId && editBom && form.trang_thai !== editBom.trang_thai);
  const confirmTarget = confirmEdit
    ? form.trang_thai
    : confirm?.trang_thai === "DANG_SU_DUNG" ? "NGUNG_SU_DUNG" : "DANG_SU_DUNG";
  const validateForm = () => {
      if (!can(editId ? "CONG_THUC_UPDATE" : "CONG_THUC_CREATE"))
        throw new Error("Bạn chưa có quyền lưu công thức.");
      if (!form.ten_cong_thuc.trim())
        throw new Error("Tên công thức không được để trống.");
      const ratioError = validateBomRatios(form);
      if (ratioError) throw new Error(ratioError);
      if (statusChanged && !can("CONG_THUC_CONFIRM"))
        throw new Error("Bạn chưa có quyền thay đổi trạng thái công thức.");
  };
  const saveChanges = (reason?: ReasonSelection) => mutation.run(async () => {
      validateForm();
      if (statusChanged && !reason) throw new Error("Vui lòng xác nhận lý do thay đổi trạng thái.");
      const { ma_san_pham, trang_thai, ...update } = form;
      await saveBom(
        { ...(editId ? update : { ...update, trang_thai, ma_san_pham: ma_san_pham?.trim() }),
          ...(statusChanged && reason && editBom ? { thay_doi_trang_thai: {
            ...reason, trang_thai: trang_thai!, trang_thai_cu: editBom.trang_thai,
          } } : {}),
          ten_cong_thuc: form.ten_cong_thuc.trim() },
        editId || undefined,
      );
      setOpen(false);
      setConfirm(null);
      setConfirmEdit(false);
      resource.refetch();
    });
  const save = () => {
    if (mutation.busy) return;
    mutation.setError("");
    mutation.setSuccess("");
    try {
      validateForm();
      if (statusChanged && editBom) {
        setConfirmEdit(true);
        setConfirm(editBom);
      } else void saveChanges();
    } catch (cause) {
      mutation.setError(cause instanceof Error ? cause.message : "Không thể lưu công thức.");
    }
  };
  return (
    <>
      <PageHeader
        title="Công thức BOM"
        description="Quản lý công thức và tỷ lệ nguyên liệu cho từng sản phẩm."
        actions={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "nowrap" }}>
          {excel.buttons}
          {can("CONG_THUC_CREATE") && (
            <button
              className="pm-btn primary"
              onClick={() => {
                setEditId("");
                setEditBom(null);
                setForm(blank());
                mutation.setError("");
                setOpen(true);
              }}
            >
              + Thêm công thức
            </button>
          )}
          </div>
        }
      />
      {excel.dialogs}
      {excel.feedback}
      <div className="pm-cards">
        <SummaryCard
          label="Tổng công thức"
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
          label="Sản phẩm có công thức"
          value={
            resource.data
              ? new Set(resource.data.map((r) => r.ma_san_pham)).size
              : "—"
          }
        />
      </div>
      <Feedback
        error={open || detail || confirm ? "" : mutation.error}
        success={mutation.success}
      />
      <section className="pm-panel">
        <div className="pm-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <FilterSelect
            label="Sản phẩm"
            value={product}
            onChange={setProduct}
            options={[
              { value: "", label: "Tất cả sản phẩm" },
              ...Array.from(
                new Map(
                  (resource.data ?? []).map((r) => [
                    r.ma_san_pham,
                    {
                      value: r.ma_san_pham,
                      label: `${r.ma_san_pham} · ${r.ten_san_pham}`,
                    },
                  ]),
                ).values(),
              ),
            ]}
          />
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
        </div>
        {resource.loading ? (
          <LoadingState />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.refetch} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.ma_cong_thuc}
            onRowClick={(r) => openDetail(r)}
            columns={[
              {
                key: "id",
                label: "Mã công thức",
                render: (r) => r.ma_cong_thuc,
              },
              {
                key: "name",
                label: "Tên công thức",
                render: (r) => r.ten_cong_thuc,
              },
              {
                key: "product",
                label: "Sản phẩm",
                render: (r) => r.ten_san_pham || r.ma_san_pham,
              },
              {
                key: "yield",
                label: "Thu hồi",
                numeric: true,
                render: (r) =>
                  `${formatNumber(number(r.he_so_thu_hoi) * 100)}%`,
              },
              {
                key: "loss",
                label: "Hao hụt",
                numeric: true,
                render: (r) =>
                  `${formatNumber(number(r.ty_le_hao_hut) * 100)}%`,
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
                    <RecordHistoryButton entity="cong-thuc" code={r.ma_cong_thuc} />
                    <ActionIconButton action="view" label="Xem chi tiết" onClick={() => openDetail(r)} />
                    {can("CONG_THUC_UPDATE") && (
                      <ActionIconButton action="edit" label="Chỉnh sửa" disabled={mutation.busy} onClick={() => openDetail(r, true)} />
                    )}
                    {can("CONG_THUC_CONFIRM") && (
                      <ActionIconButton action="status" label="Đổi trạng thái" onClick={() => {
                          mutation.setError("");
                          setConfirmEdit(false);
                          setConfirm(r);
                        }} />
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
        title={editId ? "Cập nhật công thức" : "Thêm công thức BOM"}
        onClose={() => setOpen(false)}
        busy={mutation.busy}
        footer={
          <button
            className="pm-btn primary"
            type="submit"
            form="bom-form"
            disabled={
              mutation.busy ||
              !can(editId ? "CONG_THUC_UPDATE" : "CONG_THUC_CREATE")
            }
          >
            Lưu công thức
          </button>
        }
      >
        <form
          id="bom-form"
          className="pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {!editId && (
            <Field
              label="Mã sản phẩm"
              hint="Nhập mã sản phẩm đã có trong danh mục."
            >
              <input
                required
                maxLength={20}
                value={form.ma_san_pham}
                onChange={(e) =>
                  setForm({ ...form, ma_san_pham: e.target.value })
                }
              />
            </Field>
          )}
          <Field label="Tên công thức">
            <input
              required
              maxLength={100}
              value={form.ten_cong_thuc}
              onChange={(e) =>
                setForm({ ...form, ten_cong_thuc: e.target.value })
              }
            />
          </Field>
          {editId && <Field label="Trạng thái" hint={!can("CONG_THUC_CONFIRM") ? "Bạn chưa có quyền đổi trạng thái công thức." : undefined}>
            <select value={form.trang_thai} disabled={!can("CONG_THUC_CONFIRM")}
              onChange={(event) => setForm({ ...form, trang_thai: event.target.value })}>
              <option value="DANG_SU_DUNG">Đang sử dụng</option>
              <option value="NGUNG_SU_DUNG">Ngưng sử dụng</option>
            </select>
          </Field>}
          <div className="pm-form-grid">
            <Field label="Hệ số thu hồi (0–1)">
              <input
                type="number"
                required
                min="0.0001"
                max="1"
                step="0.0001"
                value={form.he_so_thu_hoi}
                onChange={(e) => {
                  const value = e.target.value;
                  const recovery = Number(value);
                  setForm({ ...form, he_so_thu_hoi: value,
                    ty_le_hao_hut: value && recovery > 0 && recovery <= 1
                      ? (1 - recovery).toFixed(4) : form.ty_le_hao_hut,
                  });
                }}
              />
            </Field>
            <Field label="Tỷ lệ hao hụt (0–1)">
              <input
                type="number"
                required
                min="0"
                max="0.9999"
                step="0.0001"
                value={form.ty_le_hao_hut}
                onChange={(e) =>
                  setForm({ ...form, ty_le_hao_hut: e.target.value })
                }
              />
            </Field>
          </div>
          <h3>Nguyên liệu phối trộn</h3>
          {form.chi_tiet.map((line, index) => (
            <div className="pm-line-item" key={index}>
              <div className="pm-form-grid">
                <MaterialField
                  value={line.ma_nguyen_lieu}
                  onChange={(value) =>
                    setForm({
                      ...form,
                      chi_tiet: form.chi_tiet.map((r, i) =>
                        i === index ? { ...r, ma_nguyen_lieu: value } : r,
                      ),
                    })
                  }
                />
                <Field label="Tỷ lệ phối trộn (0–1)">
                  <input
                    type="number"
                    required
                    min="0.0001"
                    max="1"
                    step="0.0001"
                    value={line.ty_le_phoi_tron}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        chi_tiet: form.chi_tiet.map((r, i) =>
                          i === index
                            ? { ...r, ty_le_phoi_tron: e.target.value }
                            : r,
                        ),
                      })
                    }
                  />
                </Field>
              </div>
              <button
                type="button"
                className="pm-link"
                disabled={form.chi_tiet.length === 1}
                onClick={() =>
                  setForm({
                    ...form,
                    chi_tiet: form.chi_tiet.filter((_, i) => i !== index),
                  })
                }
              >
                Bỏ dòng
              </button>
            </div>
          ))}
          <div className="pm-actions">
            <button
              type="button"
              className="pm-btn"
              onClick={() =>
                setForm({
                  ...form,
                  chi_tiet: [
                    ...form.chi_tiet,
                    { ma_nguyen_lieu: "", ty_le_phoi_tron: "" },
                  ],
                })
              }
            >
              + Thêm nguyên liệu
            </button>
            <strong>Tổng: {formatNumber(total / 100)}%</strong>
          </div>
          {open && <BomQuantification
            productCode={form.ma_san_pham?.trim() ?? ""}
            initialProduct={editBom?.san_pham}
            bom={form}
            editable
            materialNames={Object.fromEntries((editBom?.chi_tiet ?? []).map((row) => [row.ma_nguyen_lieu, row.ten_nguyen_lieu]))}
          />}
          <Feedback error={mutation.error} success="" />
        </form>
      </FormDrawer>
      <FormDrawer
        open={Boolean(detail)}
        title={`Chi tiết ${detail?.ma_cong_thuc ?? ""}`}
        onClose={() => setDetail(null)}
      >
        <dl className="pm-info">
          <div>
            <dt>Tên công thức</dt>
            <dd>{detail?.ten_cong_thuc}</dd>
          </div>
          <div>
            <dt>Sản phẩm</dt>
            <dd>{detail?.ten_san_pham}</dd>
          </div>
          <div>
            <dt>Hệ số thu hồi</dt>
            <dd>{formatNumber(number(detail?.he_so_thu_hoi) * 100)}%</dd>
          </div>
          <div>
            <dt>Hao hụt</dt>
            <dd>{formatNumber(number(detail?.ty_le_hao_hut) * 100)}%</dd>
          </div>
          <div>
            <dt>Cập nhật</dt>
            <dd>{formatDate(detail?.thoi_gian_cap_nhat)}</dd>
          </div>
        </dl>
        <DataTable
          rows={detail?.chi_tiet ?? []}
          rowKey={(r) => r.ma_nguyen_lieu}
          columns={[
            {
              key: "material",
              label: "Nguyên liệu",
              render: (r) => r.ten_nguyen_lieu,
            },
            { key: "unit", label: "Đơn vị", render: (r) => r.don_vi_do_luong },
            {
              key: "ratio",
              label: "Phối trộn",
              numeric: true,
              render: (r) =>
                `${formatNumber(number(r.ty_le_phoi_tron) * 100)}%`,
            },
          ]}
        />
        <p className="pm-help">
          Tổng tỷ lệ phối trộn:{" "}
          {formatNumber(
            (detail?.chi_tiet ?? []).reduce(
              (sum, row) => sum + number(row.ty_le_phoi_tron),
              0,
            ) * 100,
          )}
          %
        </p>
        {detail && <BomQuantification
          productCode={detail.ma_san_pham}
          initialProduct={detail.san_pham}
          bom={detail}
          materialNames={Object.fromEntries(detail.chi_tiet.map((row) => [row.ma_nguyen_lieu, row.ten_nguyen_lieu]))}
        />}
      </FormDrawer>
      <ReasonConfirmDialog
        open={Boolean(confirm)}
        functionCode={"DOI_TRANG_THAI_CONG_THUC"}
        title={confirmEdit ? confirmTarget === "NGUNG_SU_DUNG" ? "Lý do ngừng sử dụng công thức" : "Lý do kích hoạt lại công thức" : "Đổi trạng thái công thức"}
        onClose={() => { setConfirm(null); setConfirmEdit(false); mutation.setError(""); }}
        busy={mutation.busy}
        onConfirm={(reason) => {
          if (confirmEdit) {
            void saveChanges(reason);
            return;
          }
          void mutation.run(async () => {
            if (!confirm || !can("CONG_THUC_CONFIRM")) return;
            await changeBomStatus(
              confirm.ma_cong_thuc,
              confirm.trang_thai === "DANG_SU_DUNG"
                ? "NGUNG_SU_DUNG"
                : "DANG_SU_DUNG",
              reason,
            );
            setConfirm(null);
            resource.refetch();
          });
        }}
      >
        <p><strong>{confirm?.ma_cong_thuc} · {confirmEdit ? form.ten_cong_thuc : confirm?.ten_cong_thuc}</strong></p>
        {confirm && <p><StatusBadge status={confirm.trang_thai} /> → <StatusBadge status={confirmTarget ?? confirm.trang_thai} /></p>}
        <Feedback error={mutation.error} success="" />
      </ReasonConfirmDialog>
    </>
  );
}
