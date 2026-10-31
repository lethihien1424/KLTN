import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import { FormDrawer, useResource, LoadingState, ErrorState, formatNumber, formatDate } from "../../components/common/PurchaseUI";
import { supplierDeliveryMetrics } from "../../services/deliveryService";
import { DeliveryHistoryTable } from "../don-mua/DeliveryHistoryTable";

export default function SupplierDeliveryDetail({ code, onClose }: { code: string; onClose: () => void }) {
  const { can } = useAuth();
  const resource = useResource(() => supplierDeliveryMetrics(code), [code]);
  return <FormDrawer open title={`Nguồn đánh giá NCC · ${code}`} onClose={onClose}>
    {resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : resource.data && <>
      <p>{resource.data.so_don} đơn · {resource.data.so_phieu} phiếu · {resource.data.so_don_dang_giao} đơn đang giao.</p>
      <p className="pm-help">Đúng hạn: đơn đã chốt có ngày nhận cuối không sau ngày hẹn / số đơn đã chốt. Giao đủ: bình quân tỷ lệ chấp nhận/đặt từng nguyên liệu, rồi từng đơn; tối đa 100%, gồm cả đơn đang giao. Chất lượng: đạt/giao theo từng đơn vị, bình quân các đơn vị. Thời gian giao: bình quân số ngày từ đặt đến nhận cuối của đơn đã chốt.</p>
      <p className="pm-help">Điểm = 30% chất lượng + 25% đúng hạn + 20% đủ + 15% điểm thời gian giao + 10% khả dụng NCC, bình quân các nguyên liệu. Không giao hàng không được tính đúng hạn; chưa có mẫu dùng cấu hình hiện có. Khả dụng NCC chỉ là dữ liệu cấu hình.</p>
      {resource.data.thanh_phan_diem && <DataTable rows={resource.data.thanh_phan_diem} rowKey={(r) => r.ma_nguyen_lieu} columns={[
        { key: "material", label: "Nguyên liệu cấu thành điểm", render: (r) => r.ma_nguyen_lieu }, { key: "score", label: "Điểm / 100", render: (r) => formatNumber(r.diem) },
      ]} />}
      <DataTable rows={resource.data.don_mua} rowKey={(r) => `${r.nguon}/${r.ma_don}`} columns={[
        { key: "order", label: "Đơn mua / nguồn", render: (r) => <>{r.nguon === "THUC_TE" && can("DON_MUA_VIEW") ? <a className="pm-link" href={`#/don-mua/${encodeURIComponent(r.ma_don)}`}>{r.ma_don}</a> : r.ma_don}<div className="pm-small">{r.nguon === "LICH_SU" ? "Lịch sử, không cộng kho" : r.nguon === "DON_CU" ? "Đơn cũ, chưa có chất lượng" : "Nhận kho thực tế"}</div></> },
        { key: "dates", label: "Hẹn / nhận cuối", render: (r) => `${formatDate(r.ngay_du_kien_giao)} / ${formatDate(r.ngay_nhan_cuoi)}` },
        { key: "status", label: "Đúng hạn", render: (r) => r.dung_han == null ? "Đang giao" : r.dung_han ? "Đúng hạn" : "Trễ" },
        { key: "full", label: "Tỷ lệ giao đủ", render: (r) => `${formatNumber(r.ty_le_du)}%` },
        { key: "batches", label: "Số đợt", render: (r) => r.so_dot },
      ]} />
      <h3>Các lần giao cấu thành KPI</h3><DeliveryHistoryTable rows={resource.data.lich_su_giao} />
    </>}
  </FormDrawer>;
}
