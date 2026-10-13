import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import {
  MaterialField,
  SupplierField,
} from "../../components/common/EntityFields";
import {
  PageHeader,
  SearchInput,
  FormDrawer,
  Field,
  LoadingState,
  ErrorState,
  Feedback,
  useResource,
  useMutation,
  formatNumber,
  formatMoney,
  number,
} from "../../components/common/PurchaseUI";
import { listMappings, saveMapping } from "../../services/nhaCungCapService";
import type { Mapping } from "../../services/purchaseTypes";
const values = [
  "don_gia_nguyen_lieu",
  "so_luong_ton_kho",
  "so_luong_book",
  "so_luong_xuat",
  "lead_time_ngay",
  "ty_le_chat_luong_dat",
  "ty_le_giao_dung_han",
  "ty_le_giao_du",
] as const;
const labels = [
  "Đơn giá (VND)",
  "Tồn kho NCC",
  "Đã book",
  "Đã xuất",
  "Lead time (ngày)",
  "Tỷ lệ chất lượng đạt (0–1)",
  "Tỷ lệ đúng hạn (0–1)",
  "Tỷ lệ giao đủ (0–1)",
];
const blank = (supplier: string): Record<string, string> => ({
  ma_ncc: supplier,
  ma_nguyen_lieu: "",
  don_gia_nguyen_lieu: "",
  so_luong_ton_kho: "0",
  so_luong_book: "0",
  so_luong_xuat: "0",
  lead_time_ngay: "1",
  ty_le_chat_luong_dat: "1",
  ty_le_giao_dung_han: "1",
  ty_le_giao_du: "1",
});
export default function NguyenLieuNhaCungCapPage({
  supplier = "",
}: {
  supplier?: string;
}) {
  const { can } = useAuth();
  const resource = useResource(
    () => listMappings(supplier || undefined),
    [supplier],
  );
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState("");
  const [form, setForm] = useState<Record<string, string>>(() =>
    blank(supplier),
  );
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter((r) =>
        `${r.ma_nguyen_lieu} ${r.ten_nguyen_lieu} ${r.ten_ncc}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  const edit = (r?: Mapping) => {
    setEditing(r?.ma_nguyen_lieu_ncc ?? "");
    setForm(
      r
        ? Object.fromEntries(
            ["ma_ncc", "ma_nguyen_lieu", ...values].map((k) => [
              k,
              String(r[k as keyof Mapping]),
            ]),
          )
        : blank(supplier),
    );
    mutation.setError("");
    setOpen(true);
  };
  const save = () =>
    void mutation.run(async () => {
      if (!can(editing ? "NGUYEN_LIEU_NCC_UPDATE" : "NGUYEN_LIEU_NCC_CREATE"))
        throw new Error("Bạn chưa có quyền lưu dữ liệu cung ứng.");
      if (
        number(form.so_luong_book) > number(form.so_luong_ton_kho) ||
        number(form.so_luong_xuat) > number(form.so_luong_ton_kho)
      )
        throw new Error("Số lượng book và xuất không được vượt tồn kho NCC.");
      const payload: Record<string, string | number> = {
        ...Object.fromEntries(values.map((k) => [k, form[k]])),
        lead_time_ngay: number(form.lead_time_ngay),
      };
      if (!editing) {
        payload.ma_ncc = form.ma_ncc.trim();
        payload.ma_nguyen_lieu = form.ma_nguyen_lieu.trim();
      }
      await saveMapping(payload, editing || undefined);
      setOpen(false);
      resource.refetch();
    });
  return (
    <>
      <PageHeader
        title="Nguyên liệu cung ứng"
        description={
          supplier
            ? `Danh mục cung ứng của ${supplier}.`
            : "Quản lý giá, tồn kho, thời gian giao và chất lượng theo nhà cung cấp."
        }
        actions={
          <>
            {supplier && (
              <a className="pm-btn" href="#/nha-cung-cap">
                ← Nhà cung cấp
              </a>
            )}
            {can("NGUYEN_LIEU_NCC_CREATE") && (
              <button className="pm-btn primary" onClick={() => edit()}>
                + Thêm nguyên liệu cung ứng
              </button>
            )}
          </>
        }
      />
      <Feedback error={open ? "" : mutation.error} success={mutation.success} />
      <section className="pm-panel">
        <div className="pm-toolbar">
          <SearchInput value={search} onChange={setSearch} />
        </div>
        {resource.loading ? (
          <LoadingState />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.refetch} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.ma_nguyen_lieu_ncc}
            columns={[
              {
                key: "material",
                label: "Nguyên liệu",
                render: (r) => (
                  <>
                    <strong>{r.ten_nguyen_lieu}</strong>
                    <div className="pm-small">
                      {r.ma_nguyen_lieu} · {r.don_vi_do_luong}
                    </div>
                  </>
                ),
              },
              {
                key: "supplier",
                label: "Nhà cung cấp",
                render: (r) => r.ten_ncc,
              },
              {
                key: "price",
                label: "Đơn giá",
                numeric: true,
                render: (r) => formatMoney(r.don_gia_nguyen_lieu),
              },
              {
                key: "stock",
                label: "Tồn kho",
                numeric: true,
                render: (r) => formatNumber(r.so_luong_ton_kho),
              },
              {
                key: "book",
                label: "Book / xuất",
                numeric: true,
                render: (r) =>
                  `${formatNumber(r.so_luong_book)} / ${formatNumber(r.so_luong_xuat)}`,
              },
              {
                key: "available",
                label: "Khả dụng",
                numeric: true,
                render: (r) =>
                  formatNumber(
                    number(r.so_luong_ton_kho) - number(r.so_luong_book),
                  ),
              },
              {
                key: "lead",
                label: "Lead time",
                render: (r) => `${r.lead_time_ngay} ngày`,
              },
              {
                key: "quality",
                label: "Chất lượng",
                numeric: true,
                render: (r) =>
                  `${formatNumber(number(r.ty_le_chat_luong_dat) * 100)}%`,
              },
              {
                key: "ontime",
                label: "Đúng hạn / đủ",
                numeric: true,
                render: (r) =>
                  `${formatNumber(number(r.ty_le_giao_dung_han) * 100)}% / ${formatNumber(number(r.ty_le_giao_du) * 100)}%`,
              },
              {
                key: "actions",
                label: "",
                render: (r) => (<div className="pm-actions">
                  <RecordHistoryButton entity="nguyen-lieu-nha-cung-cap" code={r.ma_nguyen_lieu_ncc} />
                  {can("NGUYEN_LIEU_NCC_UPDATE") && (
                    <button className="pm-link" onClick={() => edit(r)}>
                      Sửa
                    </button>
                  )}
                </div>),
              },
            ]}
          />
        )}
      </section>
      <FormDrawer
        open={open}
        title={
          editing
            ? "Cập nhật nguyên liệu cung ứng"
            : "Thêm nguyên liệu cung ứng"
        }
        onClose={() => setOpen(false)}
        busy={mutation.busy}
        footer={
          <button
            className="pm-btn primary"
            type="submit"
            form="mapping-form"
            disabled={
              mutation.busy ||
              !can(
                editing ? "NGUYEN_LIEU_NCC_UPDATE" : "NGUYEN_LIEU_NCC_CREATE",
              )
            }
          >
            Lưu cung ứng
          </button>
        }
      >
        <form
          id="mapping-form"
          className="pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="pm-form-grid">
            <SupplierField
              disabled={Boolean(editing || supplier)}
              value={form.ma_ncc}
              onChange={(v) => setForm({ ...form, ma_ncc: v })}
            />
            <MaterialField
              disabled={Boolean(editing)}
              value={form.ma_nguyen_lieu}
              onChange={(v) => setForm({ ...form, ma_nguyen_lieu: v })}
            />
          </div>
          <div className="pm-form-grid">
            {values.map((key, i) => (
              <Field key={key} label={labels[i]}>
                <input
                  type="number"
                  required
                  min={i === 0 ? ".01" : i === 4 ? "1" : "0"}
                  max={i >= 5 ? "1" : undefined}
                  step={i === 4 ? "1" : i >= 5 ? ".0001" : ".01"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <Feedback error={mutation.error} success="" />
        </form>
      </FormDrawer>
    </>
  );
}
