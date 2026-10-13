import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  useResource,
  formatMoney,
  formatNumber,
  formatDate,
} from "../../components/common/PurchaseUI";
import { api } from "../../services/apiClient";
import type { Overview, StockAlert } from "../../services/purchaseTypes";
import SupplierPerformancePanel from "./SupplierPerformancePanel";
export default function DashboardMuaHangPage() {
  const { can } = useAuth();
  const resource = useResource(async () => {
    const [overview, alerts] = await Promise.all([
      api<Overview>("/dashboard/tong-quan"),
      api<StockAlert[]>("/dashboard/canh-bao-ton-kho"),
    ]);
    return { overview, alerts };
  });
  const data = resource.data;
  return (
    <>
      <PageHeader
        title="Dashboard mua hàng"
        description="Tổng quan nhu cầu, tồn kho và trạng thái mua nguyên liệu."
        actions={
          <>
            {can("NHA_CUNG_CAP_PERFORMANCE_VIEW") && (
              <a className="pm-btn" href="#/hieu-suat">
                Hiệu suất nhà cung cấp
              </a>
            )}
            <button className="pm-btn" onClick={resource.refetch}>
              Làm mới
            </button>
          </>
        }
      />
      {resource.loading ? (
        <LoadingState />
      ) : resource.error || !data ? (
        <ErrorState message={resource.error} retry={resource.refetch} />
      ) : (
        <>
          <div className="pm-cards">
            <SummaryCard
              label="Nguyên liệu"
              value={data.overview.nguyen_lieu.tong_so}
            />
            <SummaryCard
              label="Dưới tồn an toàn"
              value={data.overview.nguyen_lieu.duoi_ton_an_toan}
            />
            <SummaryCard
              label="Đề xuất chờ duyệt"
              value={data.overview.de_xuat_nhap_hang.CHO_DUYET ?? 0}
            />
            <SummaryCard
              label="Đơn mua chờ duyệt"
              value={data.overview.don_mua.CHUA_DUYET ?? 0}
            />
            <SummaryCard
              label="Đơn đã nhận hàng"
              value={data.overview.don_mua.DA_NHAN_HANG ?? 0}
            />
            <SummaryCard
              label="Giá trị đơn đã duyệt"
              value={formatMoney(data.overview.mua_hang.gia_tri_da_duyet)}
            />
            <SummaryCard
              label="Giá trị đã nhận hàng"
              value={formatMoney(data.overview.mua_hang.gia_tri_da_nhan_hang)}
            />
            <SummaryCard
              label="Nhà cung cấp"
              value={data.overview.nha_cung_cap.tong_so}
            />
            <SummaryCard
              label="NCC có dữ liệu giao hàng"
              value={data.overview.nha_cung_cap.co_du_lieu_hieu_suat_thuc_te}
            />
          </div>
          <div className="pm-form-grid">
            <section className="pm-panel">
              <h2>Trạng thái đề xuất</h2>
              <DataTable
                rows={Object.entries(data.overview.de_xuat_nhap_hang)}
                rowKey={(r) => r[0]}
                columns={[
                  {
                    key: "status",
                    label: "Trạng thái",
                    render: (r) => <StatusBadge status={r[0]} />,
                  },
                  {
                    key: "count",
                    label: "Số đề xuất",
                    numeric: true,
                    render: (r) => r[1],
                  },
                ]}
              />
            </section>
            <section className="pm-panel">
              <h2>Trạng thái đơn mua</h2>
              <DataTable
                rows={Object.entries(data.overview.don_mua)}
                rowKey={(r) => r[0]}
                columns={[
                  {
                    key: "status",
                    label: "Trạng thái",
                    render: (r) => <StatusBadge status={r[0]} />,
                  },
                  {
                    key: "count",
                    label: "Số đơn",
                    numeric: true,
                    render: (r) => r[1],
                  },
                ]}
              />
            </section>
          </div>
          <section className="pm-panel">
            <h2>Cảnh báo tồn kho</h2>
            <DataTable
              rows={data.alerts}
              rowKey={(r) => r.ma_nguyen_lieu}
              columns={[
                {
                  key: "name",
                  label: "Nguyên liệu",
                  render: (r) => (
                    <>
                      {r.ten_nguyen_lieu}
                      <div className="pm-small">{r.ma_nguyen_lieu}</div>
                    </>
                  ),
                },
                {
                  key: "unit",
                  label: "Đơn vị",
                  render: (r) => r.don_vi_do_luong,
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
                {
                  key: "short",
                  label: "Thiếu so với an toàn",
                  numeric: true,
                  render: (r) => formatNumber(r.so_luong_thieu_an_toan),
                },
                {
                  key: "date",
                  label: "Ngày ghi nhận",
                  render: (r) => formatDate(r.ngay_ghi_nhan),
                },
                {
                  key: "actions",
                  label: "",
                  render: () =>
                    can("TON_KHO_VIEW") && (
                      <a className="pm-link" href="#/ton-kho">
                        Xem tồn kho →
                      </a>
                    ),
                },
              ]}
            />
          </section>
          {can("NHA_CUNG_CAP_PERFORMANCE_VIEW") && <SupplierPerformancePanel />}
        </>
      )}
    </>
  );
}
