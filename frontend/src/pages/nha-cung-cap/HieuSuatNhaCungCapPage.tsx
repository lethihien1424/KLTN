import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  SummaryCard,
  SearchInput,
  ConfirmDialog,
  LoadingState,
  ErrorState,
  Feedback,
  useResource,
  useMutation,
  formatNumber,
  number,
} from "../../components/common/PurchaseUI";
import {
  supplierPerformance,
  scoreSupplier,
} from "../../services/nhaCungCapService";
const percent = (value: string | null) =>
  value === null ? "Chưa có dữ liệu" : `${formatNumber(value)}%`;
export default function HieuSuatNhaCungCapPage() {
  const { can } = useAuth();
  const resource = useResource(supplierPerformance);
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter((r) =>
        `${r.ma_ncc} ${r.ten_ncc}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  const scored = resource.data?.filter((r) => r.diem_ncc !== null) ?? [];
  const delivered =
    resource.data?.filter((r) => r.ty_le_giao_dung_han_thuc_te !== null) ?? [];
  return (
    <>
      <PageHeader
        title="Hiệu suất nhà cung cấp"
        description="Theo dõi điểm thương mại và tỷ lệ giao hàng thực tế."
        actions={
          <>
            <button className="pm-btn" onClick={resource.refetch}>
              Làm mới
            </button>
            {can("NHA_CUNG_CAP_SCORE") && (
              <button
                className="pm-btn primary"
                onClick={() => {
                  mutation.setError("");
                  setConfirm("");
                }}
              >
                Tính lại tất cả
              </button>
            )}
          </>
        }
      />
      <div className="pm-cards">
        <SummaryCard
          label="Nhà cung cấp"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Điểm bình quân"
          value={
            scored.length
              ? formatNumber(
                  scored.reduce((s, r) => s + number(r.diem_ncc), 0) /
                    scored.length,
                )
              : "—"
          }
        />
        <SummaryCard
          label="Có dữ liệu giao hàng"
          value={resource.data ? delivered.length : "—"}
        />
        <SummaryCard
          label="Chưa có dữ liệu giao hàng"
          value={resource.data ? resource.data.length - delivered.length : "—"}
        />
      </div>
      <Feedback
        error={confirm !== null ? "" : mutation.error}
        success={mutation.success}
      />
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
            rowKey={(r) => r.ma_ncc}
            columns={[
              { key: "id", label: "Mã NCC", render: (r) => r.ma_ncc },
              {
                key: "name",
                label: "Nhà cung cấp",
                render: (r) => <strong>{r.ten_ncc}</strong>,
              },
              {
                key: "score",
                label: "Điểm NCC / 100",
                numeric: true,
                render: (r) => (
                  <>
                    {formatNumber(r.diem_ncc)}
                    {r.diem_ncc !== null && (
                      <div className="pm-score">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, number(r.diem_ncc)))}%`,
                          }}
                        />
                      </div>
                    )}
                  </>
                ),
              },
              {
                key: "ontime",
                label: "Giao đúng hạn thực tế",
                numeric: true,
                render: (r) => percent(r.ty_le_giao_dung_han_thuc_te),
              },
              {
                key: "full",
                label: "Giao đủ thực tế",
                numeric: true,
                render: (r) => percent(r.ty_le_giao_du_thuc_te),
              },
              {
                key: "actions",
                label: "",
                render: (r) =>
                  can("NHA_CUNG_CAP_SCORE") && (
                    <button
                      className="pm-link"
                      onClick={() => {
                        mutation.setError("");
                        setConfirm(r.ma_ncc);
                      }}
                    >
                      Tính lại điểm
                    </button>
                  ),
              },
            ]}
          />
        )}
        <p className="pm-small">
          Tỷ lệ thực tế dựa trên các đơn đã nhận hàng. Sau khi nhận đơn mới,
          dùng “Tính lại điểm” để cập nhật kết quả.
        </p>
      </section>
      <ConfirmDialog
        open={confirm !== null}
        title="Tính lại hiệu suất NCC"
        onClose={() => setConfirm(null)}
        busy={mutation.busy}
        onConfirm={() =>
          void mutation.run(async () => {
            if (!can("NHA_CUNG_CAP_SCORE"))
              throw new Error("Bạn chưa có quyền tính điểm.");
            await scoreSupplier(confirm || undefined);
            setConfirm(null);
            resource.refetch();
          }, "Đã tính lại điểm và hiệu suất nhà cung cấp.")
        }
      >
        <p>
          Cập nhật điểm và tỷ lệ giao hàng cho{" "}
          {confirm || "tất cả nhà cung cấp"}?
        </p>
        <Feedback error={mutation.error} success="" />
      </ConfirmDialog>
    </>
  );
}
