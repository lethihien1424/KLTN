import DataTable from "../../components/common/DataTable";
import {
  LoadingState,
  ErrorState,
  useResource,
  formatNumber,
} from "../../components/common/PurchaseUI";
import { supplierPerformance } from "../../services/nhaCungCapService";
export default function SupplierPerformancePanel() {
  const resource = useResource(supplierPerformance);
  return (
    <section className="pm-panel">
      <h2>Hiệu suất nhà cung cấp</h2>
      {resource.loading ? (
        <LoadingState />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.refetch} />
      ) : (
        <DataTable
          rows={resource.data ?? []}
          rowKey={(r) => r.ma_ncc}
          columns={[
            { key: "name", label: "Nhà cung cấp", render: (r) => r.ten_ncc },
            {
              key: "score",
              label: "Điểm",
              numeric: true,
              render: (r) => formatNumber(r.diem_ncc),
            },
            {
              key: "ontime",
              label: "Đúng hạn",
              numeric: true,
              render: (r) =>
                r.ty_le_giao_dung_han_thuc_te === null
                  ? "—"
                  : `${formatNumber(r.ty_le_giao_dung_han_thuc_te)}%`,
            },
            {
              key: "full",
              label: "Giao đủ",
              numeric: true,
              render: (r) =>
                r.ty_le_giao_du_thuc_te === null
                  ? "—"
                  : `${formatNumber(r.ty_le_giao_du_thuc_te)}%`,
            },
          ]}
        />
      )}
      <a href="#/hieu-suat" className="pm-link">
        Xem toàn bộ hiệu suất →
      </a>
    </section>
  );
}
