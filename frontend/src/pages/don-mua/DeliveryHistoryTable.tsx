import DataTable from "../../components/common/DataTable";
import { formatNumber, formatDate, useResource, LoadingState, ErrorState } from "../../components/common/PurchaseUI";
import { orderDeliveryHistory, formatDeliveryMoney, receiptNumber, type DeliveryRow } from "../../services/deliveryService";

export function DeliveryHistoryTable({ rows }: { rows: DeliveryRow[] }) {
  return <DataTable rows={rows} rowKey={(row) => row.chi_tiet_id} columns={[
    { key: "date", label: "Ngày nhận / dự kiến", render: (r) => <>{formatDate(r.ngay_giao_thuc_te)}<div className="pm-small">{formatDate(r.ngay_du_kien_giao)}</div></> },
    { key: "receipt", label: "Phiếu / nguồn", render: (r) => <>{receiptNumber(r)}<div className="pm-small">{r.ma_don_mua ?? r.ma_don_cu} · {r.nguon === "LICH_SU" ? "Lịch sử, không cộng kho" : "Nhận kho thực tế"}</div></> },
    { key: "material", label: "Nguyên liệu", render: (r) => `${r.ten_nguyen_lieu} (${r.don_vi})` },
    { key: "ordered", label: "Đặt", render: (r) => formatNumber(r.so_luong_dat) },
    { key: "delivered", label: "Giao", render: (r) => formatNumber(r.so_luong_giao) },
    { key: "quality", label: "Đạt / Không đạt", render: (r) => `${formatNumber(r.so_luong_dat_chat_luong)} / ${formatNumber(r.so_luong_khong_dat)}` },
    { key: "accepted", label: "Chấp nhận", render: (r) => formatNumber(r.so_luong_nhap_kho) },
    { key: "price", label: "Đơn giá", render: (r) => <>{formatDeliveryMoney(r.don_gia_mua)}{r.don_gia_mua != null && <div className="pm-small">VND/{r.don_vi_don_gia}</div>}</> },
    { key: "amount", label: "Thành tiền", render: (r) => formatDeliveryMoney(r.thanh_tien) },
    { key: "state", label: "Hạn / chốt", render: (r) => <>{r.dung_han ? "Trong hạn" : "Trễ"}<div className="pm-small">{r.hoan_tat ? "Chốt đơn" : "Còn giao tiếp"}</div></> },
    { key: "actor", label: "Người xác nhận", render: (r) => `${r.ten_nguoi_xac_nhan} (${r.nguoi_xac_nhan})` },
    { key: "reason", label: "Lý do / Ghi chú", render: (r) => <>{r.ly_do || "—"}<div className="pm-small">{r.ghi_chu}</div></> },
  ]} />;
}

export default function OrderDeliveryHistory({ code, version }: { code: string; version: number }) {
  const resource = useResource(() => orderDeliveryHistory(code), [code, version]);
  return <section className="pm-panel"><h2>Lịch sử nhận hàng</h2><p className="pm-help">Mỗi phiếu là một lần xác nhận. Lượng chấp nhận mới cộng kho; nguyên liệu chưa có kiểm chất lượng được hiển thị “—”. Giao đủ được đánh giá theo tổng lũy kế của đơn.</p>
    {resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : <DeliveryHistoryTable rows={resource.data ?? []} />}
  </section>;
}
