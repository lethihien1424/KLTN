//D:\KLTN\KLTN\frontend\src\pages\nha-cung-cap\ChiTietNhaCungCapPage.tsx
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../services/apiClient";
import { supplierPerformance } from "../../services/nhaCungCapService";
import type { Supplier } from "../../services/purchaseTypes";
import {
  PageHeader,
  StatusTabs,
  StatusBadge,
  SummaryCard,
  LoadingState,
  ErrorState,
  useResource,
  formatNumber,
} from "../../components/common/PurchaseUI";
import NguyenLieuNhaCungCapPage from "./NguyenLieuNhaCungCapPage";
export default function ChiTietNhaCungCapPage({ id }: { id: string }) {
  const { can } = useAuth();
  const [tab, setTab] = useState("info");
  const resource = useResource(
    () => api<Supplier>(`/nha-cung-cap/${encodeURIComponent(id)}`),
    [id],
  );
  const performance = useResource(
    () =>
      tab === "performance" && can("NHA_CUNG_CAP_PERFORMANCE_VIEW")
        ? supplierPerformance()
        : Promise.resolve([]),
    [tab, can("NHA_CUNG_CAP_PERFORMANCE_VIEW")],
  );
  const data = resource.data;
  const metrics = performance.data?.find((r) => r.ma_ncc === id);
  if (resource.loading) return <LoadingState />;
  if (resource.error || !data)
    return <ErrorState message={resource.error} retry={resource.refetch} />;
  return (
    <>
      <PageHeader
        title={data.ten_ncc}
        description={`Nhà cung cấp ${id}`}
        actions={
          <a className="pm-btn" href="#/nha-cung-cap">
            ← Danh sách
          </a>
        }
      />
      <StatusTabs
        value={tab}
        onChange={setTab}
        options={[
          ["info", "Thông tin"],
          ...(can("NGUYEN_LIEU_NCC_VIEW")
            ? [["supplies", "Nguyên liệu cung cấp"] as [string, string]]
            : []),
          ...(can("NHA_CUNG_CAP_PERFORMANCE_VIEW")
            ? [["performance", "Hiệu suất"] as [string, string]]
            : []),
        ]}
      />
      {tab === "info" && (
        <section className="pm-panel">
          <dl className="pm-info">
            <div>
              <dt>Mã NCC</dt>
              <dd>{id}</dd>
            </div>
            <div>
              <dt>Tên nhà cung cấp</dt>
              <dd>{data.ten_ncc}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>
                <StatusBadge status={data.trang_thai} />
              </dd>
            </div>
          </dl>
        </section>
      )}
      {tab === "supplies" && can("NGUYEN_LIEU_NCC_VIEW") && (
        <NguyenLieuNhaCungCapPage supplier={id} />
      )}
      {tab === "performance" &&
        can("NHA_CUNG_CAP_PERFORMANCE_VIEW") &&
        (performance.loading ? (
          <LoadingState />
        ) : performance.error ? (
          <ErrorState message={performance.error} retry={performance.refetch} />
        ) : (
          <>
            <div className="pm-cards">
              <SummaryCard
                label="Điểm NCC"
                value={formatNumber(metrics?.diem_ncc)}
              />
              <SummaryCard
                label="Giao đúng hạn"
                value={
                  metrics?.ty_le_giao_dung_han_thuc_te == null
                    ? "Chưa có dữ liệu"
                    : `${formatNumber(metrics.ty_le_giao_dung_han_thuc_te)}%`
                }
              />
              <SummaryCard
                label="Giao đủ"
                value={
                  metrics?.ty_le_giao_du_thuc_te == null
                    ? "Chưa có dữ liệu"
                    : `${formatNumber(metrics.ty_le_giao_du_thuc_te)}%`
                }
              />
            </div>
            <a className="pm-btn" href="#/hieu-suat">
              So sánh hiệu suất nhà cung cấp →
            </a>
          </>
        ))}
    </>
  );
}
