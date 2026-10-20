//D:\KLTN\KLTN\frontend\src\pages\don-mua\ChiTietDonMuaPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import ReviewDialog from "../../components/common/ReviewDialog";
import DonMuaForm from "./DonMuaForm";
import NhanHangDialog from "./NhanHangDialog";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  LoadingState,
  ErrorState,
  Feedback,
  useResource,
  useMutation,
  formatDate,
  formatNumber,
  formatMoney,
} from "../../components/common/PurchaseUI";
import { getOrder, reviewOrder } from "../../services/donMuaService";
export default function ChiTietDonMuaPage({ id }: { id: string }) {
  const { can } = useAuth();
  const resource = useResource(() => getOrder(id), [id]);
  const mutation = useMutation();
  const [review, setReview] = useState<"approve" | "reject" | null>(null);
  const [edit, setEdit] = useState(false);
  const [receive, setReceive] = useState(false);
  const order = resource.data;
  if (resource.loading) return <LoadingState />;
  if (resource.error || !order)
    return (
      <ErrorState
        message={resource.error || "Không tìm thấy đơn mua."}
        retry={resource.refetch}
      />
    );
  const pending = order.trang_thai === "CHUA_DUYET";
  return (
    <>
      <PageHeader
        title={order.ma_don_mua}
        description="Chi tiết đơn mua nguyên liệu và kết quả giao nhận."
        actions={
          <>
            <RecordHistoryButton entity="don-mua-nguyen-lieu" code={order.ma_don_mua} />
            <a className="pm-btn" href="#/don-mua">
              ← Danh sách
            </a>
            {pending && can("DON_MUA_UPDATE") && (
              <button className="pm-btn" onClick={() => setEdit(true)}>
                Cập nhật
              </button>
            )}
            {pending && can("DON_MUA_APPROVE") && (
              <button
                className="pm-btn primary"
                onClick={() => {
                  mutation.setError("");
                  setReview("approve");
                }}
              >
                Duyệt đơn mua
              </button>
            )}
            {pending && can("DON_MUA_REJECT") && (
              <button
                className="pm-btn danger"
                onClick={() => {
                  mutation.setError("");
                  setReview("reject");
                }}
              >
                Từ chối
              </button>
            )}
            {order.trang_thai === "DA_DUYET" && can("DON_MUA_RECEIVE") && (
              <button
                className="pm-btn primary"
                onClick={() => setReceive(true)}
              >
                Nhận hàng
              </button>
            )}
          </>
        }
      />
      <Feedback
        error={review ? "" : mutation.error}
        success={mutation.success}
      />
      <div className="pm-cards">
        <SummaryCard
          label="Trạng thái"
          value={<StatusBadge status={order.trang_thai} />}
        />
        <SummaryCard label="Nhà cung cấp" value={order.ten_ncc} />
        <SummaryCard label="Tổng tiền" value={formatMoney(order.tong_tien)} />
        <SummaryCard label="Nguyên liệu" value={order.chi_tiet.length} />
      </div>
      <section className="pm-panel">
        <h2>Thông tin đơn mua</h2>
        <dl className="pm-info">
          <div>
            <dt>Ngày đặt</dt>
            <dd>{formatDate(order.ngay_dat_hang)}</dd>
          </div>
          <div>
            <dt>Dự kiến giao</dt>
            <dd>{formatDate(order.ngay_du_kien_giao)}</dd>
          </div>
          <div>
            <dt>Giao thực tế</dt>
            <dd>{formatDate(order.ngay_giao_thuc_te)}</dd>
          </div>
          <div>
            <dt>Đề xuất gốc</dt>
            <dd>
              {order.ma_de_xuat && can("DE_XUAT_NHAP_HANG_VIEW") ? (
                <a className="pm-link" href={`#/de-xuat/${order.ma_de_xuat}`}>
                  {order.ma_de_xuat}
                </a>
              ) : (
                (order.ma_de_xuat ?? "—")
              )}
            </dd>
          </div>
          <div>
            <dt>Người tạo</dt>
            <dd>{order.nguoi_tao ?? "—"}</dd>
          </div>
          <div>
            <dt>Người duyệt</dt>
            <dd>{order.nguoi_duyet ?? "—"}</dd>
          </div>
          <div>
            <dt>Thời gian duyệt</dt>
            <dd>{formatDate(order.thoi_gian_duyet)}</dd>
          </div>
        </dl>
        {order.ly_do_tu_choi && (
          <div className="pm-error">Lý do từ chối: {order.ly_do_tu_choi}</div>
        )}
      </section>
      <section className="pm-panel">
        <h2>Chi tiết nguyên liệu</h2>
        <DataTable
          rows={order.chi_tiet}
          rowKey={(r) => r.ma_chi_tiet_don_mua}
          columns={[
            {
              key: "material",
              label: "Nguyên liệu",
              render: (r) => (
                <>
                  {r.ten_nguyen_lieu}
                  <div className="pm-small">
                    {r.ma_nguyen_lieu} · {r.don_vi_do_luong}
                  </div>
                </>
              ),
            },
            {
              key: "qty",
              label: "SL đặt",
              numeric: true,
              render: (r) => formatNumber(r.so_luong_mua),
            },
            {
              key: "price",
              label: "Đơn giá",
              numeric: true,
              render: (r) => formatMoney(r.don_gia_vnd_kg),
            },
            {
              key: "total",
              label: "Thành tiền",
              numeric: true,
              render: (r) => formatMoney(r.thanh_tien),
            },
            {
              key: "received",
              label: "Thực nhận",
              numeric: true,
              render: (r) =>
                order.trang_thai === "DA_NHAN_HANG"
                  ? formatNumber(r.so_luong_thuc_nhan)
                  : "—",
            },
            {
              key: "reason",
              label: "Lý do nhận thiếu",
              render: (r) => r.ly_do_khong_nhan ?? "—",
            },
          ]}
        />
      </section>
      {order.trang_thai === "DA_NHAN_HANG" && (
        <div className="pm-help">
          Đơn đã nhận hàng; tồn kho đã được cập nhật.{" "}
          {can("TON_KHO_VIEW") && (
            <a className="pm-link" href="#/ton-kho">
              Xem tồn kho →
            </a>
          )}{" "}
          {can("NHA_CUNG_CAP_PERFORMANCE_VIEW") && (
            <a className="pm-link" href="#/hieu-suat">
              Xem / tính lại hiệu suất NCC →
            </a>
          )}
        </div>
      )}
      <ReviewDialog
        action={review}
        title={`đơn mua ${id}`}
        onClose={() => setReview(null)}
        busy={mutation.busy}
        error={mutation.error}
        onConfirm={(reason) =>
          void mutation.run(async () => {
            if (
              !pending ||
              !can(reason === undefined ? "DON_MUA_APPROVE" : "DON_MUA_REJECT")
            )
              throw new Error(
                "Không thể duyệt/từ chối đơn ở trạng thái hiện tại.",
              );
            resource.setData(await reviewOrder(id, reason));
            setReview(null);
          })
        }
      />
      {edit && (
        <DonMuaForm
          order={order}
          onClose={() => setEdit(false)}
          onSaved={(result) => {
            resource.setData(result);
            setEdit(false);
            mutation.setSuccess("Đã cập nhật đơn mua.");
          }}
        />
      )}
      {receive && (
        <NhanHangDialog
          order={order}
          onClose={() => setReceive(false)}
          onSaved={(result) => {
            resource.setData(result);
            setReceive(false);
            mutation.setSuccess("Đã nhận hàng và cập nhật tồn kho.");
          }}
        />
      )}
    </>
  );
}
