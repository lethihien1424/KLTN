import ActionIconButton from "../../components/common/ActionIconButton";
//D:\KLTN\KLTN\frontend\src\pages\nha-cung-cap\HieuSuatNhaCungCapPage.tsx
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import SupplierDeliveryDetail from "./SupplierDeliveryDetail";
import SupplierScorePreviewDialog from "./SupplierScorePreviewDialog";
import { useDeliveryExcel } from "./useDeliveryExcel";
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
} from "../../services/nhaCungCapService";
const percent = (value: string | null | undefined) =>
  value == null ? "Chưa có dữ liệu" : `${formatNumber(value)}%`;
export default function HieuSuatNhaCungCapPage() {
  const { can } = useAuth();
  const resource = useResource(supplierPerformance);
  const mutation = useMutation();
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [detailCode, setDetailCode] = useState("");
  const excel = useDeliveryExcel(resource.refetch);
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter((r) =>
        `${r.ma_ncc} ${r.ten_ncc}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [resource.data, search],
  );
  const scored = resource.data?.filter((r) => r.diem_ncc !== null) ?? [];
  const delivered =
    resource.data?.filter((r) => r.ty_le_giao_du_thuc_te != null || (r.so_phieu ?? 0) > 0) ?? [];
  return (
    <>
      <PageHeader
        title="Hiệu suất nhà cung cấp"
        description="Theo dõi điểm thương mại và tỷ lệ giao hàng thực tế."
        actions={
          <>
            {excel.buttons}
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
      {excel.feedback}
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
                key: "quality", label: "Chất lượng đạt thực tế", numeric: true,
                render: (r) => percent(r.ty_le_chat_luong_dat_thuc_te),
              },
              { key: "lead", label: "Giao TB (ngày)", numeric: true, render: (r) => r.thoi_gian_giao_tb_ngay == null ? "Chưa có dữ liệu" : formatNumber(r.thoi_gian_giao_tb_ngay) },
              { key: "orders", label: "Đơn / đang giao", render: (r) => `${r.so_don ?? 0} / ${r.so_don_dang_giao ?? 0}` },
              {
                key: "actions",
                label: "Thao tác",
                render: (r) =>
                  <div className="pm-actions"><ActionIconButton action="view" label="Nguồn đánh giá NCC" onClick={() => setDetailCode(r.ma_ncc)} />{can("NHA_CUNG_CAP_SCORE") && (
                    <ActionIconButton action="score" label="Tính lại điểm" onClick={() => {
                        mutation.setError("");
                        setConfirm(r.ma_ncc);
                      }} />
                  )}</div>,
              },
            ]}
          />
        )}
        <p className="pm-small">
          KPI và điểm tự cập nhật khi xác nhận nhận hàng hoặc nhập lịch sử. Mỗi đơn được tính một lần; đơn chưa chốt không được tính là đã hoàn tất đúng hạn. Điểm giữ trọng số hiện tại; tiêu chí thiếu dữ liệu không được thay bằng tỷ lệ khai báo hoặc 0%. Thời gian khai báo chỉ là mốc so sánh với thời gian thực tế. Tồn NCC không được dùng làm KPI.
        </p>
      </section>
      {confirm !== null && can("NHA_CUNG_CAP_SCORE") && <SupplierScorePreviewDialog code={confirm || undefined}
        onClose={() => setConfirm(null)} onSaved={() => { setConfirm(null); resource.refetch(); }} />}
      {detailCode && <SupplierDeliveryDetail code={detailCode} onClose={() => setDetailCode("")} />}
      {excel.dialogs}
    </>
  );
}
