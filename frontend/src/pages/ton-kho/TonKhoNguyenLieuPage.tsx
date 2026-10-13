import RecordHistoryButton from "../../components/common/RecordHistoryButton";
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
  LoadingState,
  ErrorState,
  Feedback,
  useResource,
  useMutation,
  formatNumber,
  formatDate,
  number,
  today,
} from "../../components/common/PurchaseUI";
import {
  listStocks,
  stockHistory,
  saveStock,
  type StockInput,
} from "../../services/tonKhoService";
import type { Stock } from "../../services/purchaseTypes";
const blank = (): StockInput => ({
  ma_nguyen_lieu: "",
  ngay_ghi_nhan: today(),
  ton_kho_thuc_te: "0",
  so_luong_book: "0",
  ton_kho_an_toan: "0",
  ton_kho_toi_da: "0",
  trang_thai: "DANG_SU_DUNG",
});
export default function TonKhoNguyenLieuPage() {
  const { can } = useAuth();
  const resource = useResource(listStocks);
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Stock | undefined>();
  const [form, setForm] = useState<StockInput>(blank);
  const [history, setHistory] = useState<{ id: string; rows: Stock[] } | null>(
    null,
  );
  const low = (r: Stock) =>
    number(r.ton_kho_kha_dung) < number(r.ton_kho_an_toan);
  const totalsByUnit = Object.entries(
    (resource.data ?? []).reduce<Record<string, number>>((sum, r) => {
      sum[r.don_vi_do_luong] =
        (sum[r.don_vi_do_luong] ?? 0) + number(r.ton_kho_thuc_te);
      return sum;
    }, {}),
  )
    .map(([unit, total]) => `${formatNumber(total)} ${unit}`)
    .join(" · ");
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (r) =>
          (!status || (status === "CAN_NHAP") === low(r)) &&
          (!date || r.ngay_ghi_nhan === date) &&
          `${r.ma_nguyen_lieu} ${r.ten_nguyen_lieu}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [resource.data, search, status, date],
  );
  const edit = (row?: Stock) => {
    setEditing(row);
    setForm(
      row
        ? {
            ton_kho_thuc_te: row.ton_kho_thuc_te,
            so_luong_book: row.so_luong_book,
            ton_kho_an_toan: row.ton_kho_an_toan,
            ton_kho_toi_da: row.ton_kho_toi_da,
            trang_thai: row.trang_thai,
          }
        : blank(),
    );
    mutation.setError("");
    setOpen(true);
  };
  const save = () =>
    void mutation.run(async () => {
      if (!can(editing ? "TON_KHO_UPDATE" : "TON_KHO_CREATE"))
        throw new Error("Bạn chưa có quyền lưu tồn kho.");
      if (number(form.ton_kho_toi_da) < number(form.ton_kho_an_toan))
        throw new Error("Tồn kho tối đa phải lớn hơn hoặc bằng tồn an toàn.");
      await saveStock(form, editing);
      setOpen(false);
      resource.refetch();
    });
  return (
    <>
      <PageHeader
        title="Tồn kho nguyên liệu"
        description="Theo dõi bản ghi tồn kho mới nhất của từng nguyên liệu."
        actions={
          can("TON_KHO_CREATE") && (
            <button className="pm-btn primary" onClick={() => edit()}>
              + Ghi nhận tồn kho
            </button>
          )
        }
      />
      <div className="pm-cards">
        <SummaryCard
          label="Nguyên liệu có tồn kho"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Dưới mức an toàn"
          value={resource.data?.filter(low).length ?? "—"}
        />
        <SummaryCard
          label="Trong mức an toàn"
          value={resource.data?.filter((r) => !low(r)).length ?? "—"}
        />
        <SummaryCard
          label="Tổng tồn thực tế"
          value={resource.data ? totalsByUnit || "0" : "—"}
          note="Tổng riêng theo đơn vị đo lường"
        />
      </div>
      <Feedback error={open ? "" : mutation.error} success={mutation.success} />
      <section className="pm-panel">
        <div className="pm-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <FilterSelect
            label="Mức tồn"
            value={status}
            onChange={setStatus}
            options={[
              { value: "", label: "Tất cả" },
              { value: "CAN_NHAP", label: "Cần nhập" },
              { value: "BINH_THUONG", label: "Bình thường" },
            ]}
          />
          <Field label="Ngày bản ghi mới nhất">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
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
          <DataTable
            rows={rows}
            rowKey={(r) => r.ma_nguyen_lieu}
            columns={[
              { key: "id", label: "Mã NL", render: (r) => r.ma_nguyen_lieu },
              {
                key: "name",
                label: "Nguyên liệu",
                render: (r) => (
                  <>
                    {r.ten_nguyen_lieu}
                    <div className="pm-small">{r.don_vi_do_luong}</div>
                  </>
                ),
              },
              ...(
                [
                  "ton_kho_thuc_te",
                  "so_luong_book",
                  "ton_kho_kha_dung",
                  "ton_kho_an_toan",
                  "ton_kho_toi_da",
                ] as const
              ).map((key, i) => ({
                key,
                label: ["Thực tế", "Đã book", "Khả dụng", "An toàn", "Tối đa"][
                  i
                ],
                numeric: true,
                render: (r: Stock) => formatNumber(r[key]),
              })),
              {
                key: "date",
                label: "Ngày ghi nhận",
                render: (r) => formatDate(r.ngay_ghi_nhan),
              },
              {
                key: "status",
                label: "Mức tồn",
                render: (r) => (
                  <StatusBadge status={low(r) ? "CAN_NHAP" : "BINH_THUONG"} />
                ),
              },
              {
                key: "actions",
                label: "Thao tác",
                render: (r) => (
                  <div className="pm-actions">
                    <RecordHistoryButton entity="ton-kho-nguyen-lieu" code={`${r.ma_nguyen_lieu}/${r.ngay_ghi_nhan}`} />
                    {can("TON_KHO_UPDATE") && (
                      <button className="pm-link" onClick={() => edit(r)}>
                        Sửa
                      </button>
                    )}
                    {can("TON_KHO_HISTORY_VIEW") && (
                      <button
                        className="pm-link"
                        disabled={mutation.busy}
                        onClick={() =>
                          void mutation.run(
                            async () =>
                              setHistory({
                                id: r.ten_nguyen_lieu,
                                rows: await stockHistory(r.ma_nguyen_lieu),
                              }),
                            "",
                          )
                        }
                      >
                        Lịch sử
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
        title={
          editing
            ? `Cập nhật tồn kho · ${editing.ten_nguyen_lieu}`
            : "Ghi nhận tồn kho"
        }
        onClose={() => setOpen(false)}
        busy={mutation.busy}
        footer={
          <button
            className="pm-btn primary"
            type="submit"
            form="stock-form"
            disabled={
              mutation.busy ||
              !can(editing ? "TON_KHO_UPDATE" : "TON_KHO_CREATE")
            }
          >
            Lưu tồn kho
          </button>
        }
      >
        <form
          id="stock-form"
          className="pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {!editing && (
            <>
              <MaterialField
                value={form.ma_nguyen_lieu ?? ""}
                onChange={(v) => setForm({ ...form, ma_nguyen_lieu: v })}
              />
              <Field label="Ngày ghi nhận">
                <input
                  type="date"
                  required
                  value={form.ngay_ghi_nhan}
                  onChange={(e) =>
                    setForm({ ...form, ngay_ghi_nhan: e.target.value })
                  }
                />
              </Field>
            </>
          )}
          <div className="pm-form-grid">
            {(
              [
                "ton_kho_thuc_te",
                "so_luong_book",
                "ton_kho_an_toan",
                "ton_kho_toi_da",
              ] as const
            ).map((key, i) => (
              <Field
                key={key}
                label={
                  [
                    "Tồn thực tế",
                    "Số lượng đã book",
                    "Tồn an toàn",
                    "Tồn tối đa",
                  ][i]
                }
              >
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </Field>
            ))}
          </div>
          <Field label="Trạng thái bản ghi">
            <input
              required
              maxLength={30}
              value={form.trang_thai}
              onChange={(e) => setForm({ ...form, trang_thai: e.target.value })}
            />
          </Field>
          <div className="pm-help">
            Tồn khả dụng được máy chủ tính từ tồn thực tế và số lượng đã book.
          </div>
          <Feedback error={mutation.error} success="" />
        </form>
      </FormDrawer>
      <FormDrawer
        open={Boolean(history)}
        title={`Lịch sử tồn kho · ${history?.id ?? ""}`}
        onClose={() => setHistory(null)}
      >
        <DataTable
          rows={history?.rows ?? []}
          rowKey={(r) => r.ngay_ghi_nhan}
          columns={[
            {
              key: "date",
              label: "Ngày ghi nhận",
              render: (r) => formatDate(r.ngay_ghi_nhan),
            },
            {
              key: "stock",
              label: "Thực tế",
              numeric: true,
              render: (r) => formatNumber(r.ton_kho_thuc_te),
            },
            {
              key: "book",
              label: "Đã book",
              numeric: true,
              render: (r) => formatNumber(r.so_luong_book),
            },
            {
              key: "available",
              label: "Khả dụng",
              numeric: true,
              render: (r) => formatNumber(r.ton_kho_kha_dung),
            },
            {
              key: "safety",
              label: "An toàn",
              numeric: true,
              render: (r) => formatNumber(r.ton_kho_an_toan),
            },
          ]}
        />
      </FormDrawer>
    </>
  );
}
