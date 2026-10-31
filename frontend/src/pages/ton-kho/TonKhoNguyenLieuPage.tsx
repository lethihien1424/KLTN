import ActionIconButton from "../../components/common/ActionIconButton";
//D:\KLTN\KLTN\frontend\src\pages\ton-kho\TonKhoNguyenLieuPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import { MaterialField } from "../../components/common/EntityFields";
import {
  PageHeader,
  SummaryCard,
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
  number,
  today,
} from "../../components/common/PurchaseUI";
import {
  listStocks,
  saveStock,
  stockLevel,
  stockLevelLabel,
  type StockInput,
} from "../../services/tonKhoService";
import type { Stock } from "../../services/purchaseTypes";
import StockDetailDrawer from "./StockDetailDrawer";
import StockProductionDrawer from "./StockProductionDrawer";
import { useStockExcelActions } from "./useStockExcelActions";
import { applicableReasons } from "../../services/reasonService";
import "./stock.css";
const blank = (): StockInput => ({
  ma_nguyen_lieu: "",
  ngay_ghi_nhan: today(),
  ton_kho_thuc_te: "0",
  so_luong_book: "0",
  ton_kho_an_toan: "0",
  ton_kho_toi_da: "0",
  trang_thai: "DANG_SU_DUNG",
  ly_do_id: "",
  ghi_chu: "",
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
  const [detailCode, setDetailCode] = useState("");
  const [production, setProduction] = useState(false);
  const reasons = useResource(() => open ? applicableReasons("DIEU_CHINH_TON_KHO") : Promise.resolve([]), [open]);
  const reasonsUnavailable = reasons.loading || Boolean(reasons.error) || !reasons.data?.length;
  const noReasonsMessage = "Chưa có lý do điều chỉnh tồn kho đang hoạt động. Vui lòng cấu hình tại Cấu hình → Quản lý lý do trước khi lưu.";
  const excel = useStockExcelActions({ search, muc_ton: status, ngay_ghi_nhan: date }, resource.refetch);
  const low = (r: Stock) =>
    number(r.ton_kho_kha_dung) < number(r.ton_kho_an_toan);
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (r) =>
          (!status || status === stockLevel(r)) &&
          (!date || r.ngay_ghi_nhan === date) &&
          `${r.ma_nguyen_lieu} ${r.ten_nguyen_lieu}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
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
            ly_do_id: "",
            ghi_chu: "",
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
      if (reasons.loading) throw new Error("Đang tải lý do điều chỉnh tồn kho. Vui lòng chờ.");
      if (reasons.error) throw new Error(`Không tải được lý do điều chỉnh tồn kho: ${reasons.error}`);
      if (!reasons.data?.length) throw new Error(noReasonsMessage);
      const selectedReason = reasons.data.find((reason) => reason.id === form.ly_do_id.trim());
      if (!selectedReason) throw new Error("Vui lòng chọn lý do điều chỉnh tồn kho");
      if (selectedReason.ten_ly_do.trim().toLocaleLowerCase("vi") === "khác" && !form.ghi_chu?.trim())
        throw new Error('Vui lòng nhập ghi chú khi chọn lý do "Khác".');
      if (number(form.ton_kho_toi_da) < number(form.ton_kho_an_toan))
        throw new Error("Tồn kho tối đa phải lớn hơn hoặc bằng tồn an toàn.");
      await saveStock({ ...form, ly_do_id: selectedReason.id }, editing);
      setOpen(false);
      resource.refetch();
    });
  return (
    <div className="stock-page">
      <PageHeader
        title="Tồn kho nguyên liệu"
        description="Theo dõi tồn kho và hàng đang về từ đơn mua đã duyệt còn chờ giao."
        actions={
          <>{excel.buttons}{can("TON_KHO_CREATE") && (
            <button className="pm-btn primary" onClick={() => edit()}>
              + Ghi nhận tồn kho
            </button>
          )}</>
        }
      />
      <div className="pm-cards">
        <SummaryCard
          label="Nguyên liệu có tồn kho"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Nguyên liệu cần bổ sung"
          value={resource.data?.filter(low).length ?? "—"}
        />
        <SummaryCard
          label="Nguyên liệu đủ tồn"
          value={resource.data?.filter((r) => !low(r)).length ?? "—"}
        />
      </div>
      {resource.data?.some((r) => stockLevel(r) === "TON_AM") && <p className="stock-warning" role="alert">Có {resource.data.filter((r) => stockLevel(r) === "TON_AM").length} nguyên liệu có tồn khả dụng âm. Cần đối soát số đã giữ.</p>}
      {excel.feedback}
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
              { value: "CAN_NHAP", label: "Cần bổ sung" },
              { value: "TON_AM", label: "Tồn khả dụng âm" },
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
          {can("TON_KHO_UPDATE") && <button className="pm-btn" onClick={() => setProduction(true)}>Nguyên liệu cho sản xuất</button>}
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
                key: "name",
                label: "Nguyên liệu",
                render: (r) => (
                  <>
                    {r.ten_nguyen_lieu}
                    <div className="pm-small">{r.ma_nguyen_lieu} · {r.don_vi_do_luong}</div>
                  </>
                ),
              },
              ...(
                [
                  "ton_kho_thuc_te",
                  "hang_dang_ve",
                  "ton_kho_kha_dung",
                  "ton_kho_an_toan",
                ] as const
              ).map((key, i) => ({
                key,
                label: ["Tồn thực tế", "Hàng đang về", "Tồn khả dụng", "Mức an toàn"][
                  i
                ],
                numeric: true,
                render: (r: Stock) => <span className={key === "ton_kho_kha_dung" && number(r[key]) < 0 ? "stock-negative" : ""}>{formatNumber(r[key])} {r.don_vi_do_luong}</span>,
              })),
              {
                key: "status",
                label: "Tình trạng",
                render: (r) => (
                  <span className={stockLevel(r) === "TON_AM" ? "stock-negative" : `pm-badge ${low(r) ? "warning" : "success"}`}>{stockLevelLabel(r)}</span>
                ),
              },
              {
                key: "actions",
                label: "Thao tác",
                render: (r) => (
                  <div className="pm-actions">
                    <ActionIconButton action="view" label="Chi tiết tồn kho" onClick={() => setDetailCode(r.ma_nguyen_lieu)} />
                    <RecordHistoryButton entity="ton-kho-nguyen-lieu" code={`${r.ma_nguyen_lieu}/${r.ngay_ghi_nhan}`} />
                    {can("TON_KHO_UPDATE") && (
                      <ActionIconButton action="edit" label="Chỉnh sửa" onClick={() => edit(r)} />
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
          <>
          <button type="button" className="pm-btn" disabled={mutation.busy} onClick={() => setOpen(false)}>Hủy</button>
          <button
            className="pm-btn primary"
            type="submit"
            form="stock-form"
            disabled={
              mutation.busy ||
              reasonsUnavailable ||
              !can(editing ? "TON_KHO_UPDATE" : "TON_KHO_CREATE")
            }
          >
            Lưu tồn kho
          </button>
          </>
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
                    "Đã giữ (theo kế hoạch)",
                    "Tồn an toàn",
                    "Tồn tối đa",
                  ][i]
                }
              >
                <input
                  required
                  disabled={key === "so_luong_book"}
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
          <p className="pm-help">{editing ? "Kiểm kê/điều chỉnh tồn hiện tại." : "Ghi nhận tồn đầu kỳ hoặc snapshot kiểm kê mới; phần đã giữ được chuyển tiếp."} Không dùng để nhận hàng nhà cung cấp.</p>
          <Field label="Lý do *">
            <select aria-required="true" disabled={mutation.busy || reasonsUnavailable} value={form.ly_do_id} onChange={(e) => { setForm({ ...form, ly_do_id: e.target.value }); mutation.setError(""); }}>
              <option value="">Chọn lý do</option>{!reasons.loading && !reasons.error && reasons.data?.map((r) => <option key={r.id} value={r.id}>{r.ten_ly_do}</option>)}
            </select>
          </Field>
          {reasons.loading ? <LoadingState /> : reasons.error ? <ErrorState message={`Không tải được lý do điều chỉnh tồn kho. ${reasons.error}`} retry={reasons.refetch} /> : !reasons.data?.length ? <ErrorState message={noReasonsMessage} retry={reasons.refetch} /> : null}
          <Field label="Ghi chú"><textarea maxLength={2000} value={form.ghi_chu ?? ""} onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })} /></Field>
          <Feedback error={mutation.error} success="" />
        </form>
      </FormDrawer>
      {excel.dialogs}
      {detailCode && <StockDetailDrawer code={detailCode} onClose={() => setDetailCode("")} />}
      {production && <StockProductionDrawer onClose={() => setProduction(false)} onChanged={resource.refetch} />}
    </div>
  );
}
