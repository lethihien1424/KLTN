//D:\KLTN\KLTN\frontend\src\pages\don-mua\DanhSachDonMuaPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { navigate } from "../../routes/navigation";
import DataTable from "../../components/common/DataTable";
import DonMuaForm from "./DonMuaForm";
import ReviewDialog from "../../components/common/ReviewDialog";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  StatusTabs,
  SearchInput,
  FilterSelect,
  Field,
  LoadingState,
  ErrorState,
  useResource,
  useMutation,
  Feedback,
  formatDate,
  formatMoney,
  number,
} from "../../components/common/PurchaseUI";
import { listOrders, reviewOrder } from "../../services/donMuaService";
export default function DanhSachDonMuaPage({ approval = false }: { approval?: boolean }) {
  const { can } = useAuth();
  const resource = useResource(listOrders);
  const [status, setStatus] = useState(approval ? "CHUA_DUYET" : "");
  const mutation = useMutation();
  const [review, setReview] = useState<{ id: string; action: "approve" | "reject" } | null>(null);
  const [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [open, setOpen] = useState(false);
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (r) =>
          (!status || r.trang_thai === status) &&
          (!supplier || r.ma_ncc === supplier) &&
          (!from || r.ngay_dat_hang >= from) &&
          (!to || r.ngay_dat_hang <= to) &&
          `${r.ma_don_mua} ${r.ten_ncc} ${r.ma_de_xuat ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [resource.data, status, search, supplier, from, to],
  );
  return (
    <>
      <PageHeader
        title={approval ? "Duyệt đơn mua nguyên liệu" : "Đơn mua nguyên liệu"}
        description="Theo dõi quá trình đặt mua, phê duyệt và nhận nguyên liệu."
        actions={
          !approval && can("DON_MUA_CREATE") && (
            <button className="pm-btn primary" onClick={() => setOpen(true)}>
              + Tạo đơn mua
            </button>
          )
        }
      />
      <Feedback error={review ? "" : mutation.error} success={mutation.success} />
      <div className="pm-cards">
        <SummaryCard
          label="Tổng đơn mua"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Chờ duyệt"
          value={
            resource.data?.filter((r) => r.trang_thai === "CHUA_DUYET")
              .length ?? "—"
          }
        />
        <SummaryCard
          label="Đang chờ nhận"
          value={
            resource.data?.filter((r) => r.trang_thai === "DA_DUYET").length ??
            "—"
          }
        />
        <SummaryCard
          label="Giá trị đã nhận"
          value={
            resource.data
              ? formatMoney(
                  resource.data
                    .filter((r) => r.trang_thai === "DA_NHAN_HANG")
                    .reduce((s, r) => s + number(r.tong_tien), 0),
                )
              : "—"
          }
        />
      </div>
      <section className="pm-panel">
        <StatusTabs
          value={status}
          onChange={setStatus}
          options={[
            ["", "Tất cả"],
            ["CHUA_DUYET", "Chờ duyệt"],
            ["DA_DUYET", "Đã duyệt"],
            ["DA_NHAN_HANG", "Đã nhận"],
            ["TU_CHOI", "Từ chối"],
          ]}
        />
        <div className="pm-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <FilterSelect
            label="Nhà cung cấp"
            value={supplier}
            onChange={setSupplier}
            options={[
              { value: "", label: "Tất cả NCC" },
              ...Array.from(
                new Map(
                  (resource.data ?? []).map((r) => [
                    r.ma_ncc,
                    { value: r.ma_ncc, label: r.ten_ncc },
                  ]),
                ).values(),
              ),
            ]}
          />
          <Field label="Đặt từ ngày">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="Đến ngày">
            <input
              type="date"
              min={from || undefined}
              value={to}
              onChange={(e) => setTo(e.target.value)}
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
            rowKey={(r) => r.ma_don_mua}
            onRowClick={(r) => navigate(`/don-mua/${r.ma_don_mua}`)}
            columns={[
              { key: "id", label: "Mã đơn", render: (r) => r.ma_don_mua },
              {
                key: "supplier",
                label: "Nhà cung cấp",
                render: (r) => r.ten_ncc,
              },
              {
                key: "date",
                label: "Ngày đặt",
                render: (r) => formatDate(r.ngay_dat_hang),
              },
              {
                key: "delivery",
                label: "Dự kiến giao",
                render: (r) => formatDate(r.ngay_du_kien_giao),
              },
              {
                key: "value",
                label: "Tổng tiền",
                numeric: true,
                render: (r) => formatMoney(r.tong_tien),
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
                    {approval && r.trang_thai === "CHUA_DUYET" && can("DON_MUA_APPROVE") && (
                      <button className="pm-btn primary" disabled={mutation.busy} onClick={() => {
                        mutation.setError("");
                        setReview({ id: r.ma_don_mua, action: "approve" });
                      }}>Duyệt</button>
                    )}
                    {approval && r.trang_thai === "CHUA_DUYET" && can("DON_MUA_REJECT") && (
                      <button className="pm-btn danger" disabled={mutation.busy} onClick={() => {
                        mutation.setError("");
                        setReview({ id: r.ma_don_mua, action: "reject" });
                      }}>Từ chối</button>
                    )}
                    <button
                    className="pm-link"
                    onClick={() => navigate(`/don-mua/${r.ma_don_mua}`)}
                  >
                    Chi tiết →
                  </button>
                    <RecordHistoryButton entity="don-mua-nguyen-lieu" code={r.ma_don_mua} />
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>
      {review && (
        <ReviewDialog
          action={review.action}
          title={`đơn mua ${review.id}`}
          busy={mutation.busy}
          error={mutation.error}
          onClose={() => { if (!mutation.busy) setReview(null); }}
          onConfirm={(reason) => void mutation.run(async () => {
            const order = resource.data?.find(r => r.ma_don_mua === review.id);
            if (order?.trang_thai !== "CHUA_DUYET" ||
                !can(review.action === "approve" ? "DON_MUA_APPROVE" : "DON_MUA_REJECT")) {
              throw new Error("Không thể duyệt/từ chối đơn ở trạng thái hiện tại.");
            }
            const result = await reviewOrder(review.id, reason);
            resource.setData((resource.data ?? []).map(r => r.ma_don_mua === result.ma_don_mua ? result : r));
            setReview(null);
          }, review.action === "approve" ? "Đã duyệt đơn mua." : "Đã từ chối đơn mua.")}
        />
      )}
      {open && (
        <DonMuaForm
          onClose={() => setOpen(false)}
          onSaved={(r) => {
            setOpen(false);
            resource.refetch();
            navigate(`/don-mua/${r.ma_don_mua}`);
          }}
        />
      )}
    </>
  );
}
