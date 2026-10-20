//D:\KLTN\KLTN\frontend\src\pages\de-xuat\ChiTietDeXuatPage.tsx
import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import ReviewDialog from "../../components/common/ReviewDialog";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  ConfirmDialog,
  Field,
  LoadingState,
  ErrorState,
  Feedback,
  useResource,
  useMutation,
  formatDate,
  formatNumber,
  formatMoney,
  number,
  today,
} from "../../components/common/PurchaseUI";
import {
  getProposal,
  reviewProposal,
  generateOrders,
} from "../../services/deXuatService";
import type { Order } from "../../services/purchaseTypes";
export default function ChiTietDeXuatPage({ id }: { id: string }) {
  const { can } = useAuth();
  const resource = useResource(() => getProposal(id), [id]);
  const mutation = useMutation();
  const [review, setReview] = useState<"approve" | "reject" | null>(null);
  const [generate, setGenerate] = useState(false);
  const [delivery, setDelivery] = useState(today());
  const [created, setCreated] = useState<Order[]>([]);
  const proposal = resource.data;
  if (resource.loading) return <LoadingState />;
  if (resource.error || !proposal)
    return (
      <ErrorState
        message={resource.error || "Không tìm thấy đề xuất."}
        retry={resource.refetch}
      />
    );
  const pending = proposal.trang_thai === "CHO_DUYET";
  return (
    <>
      <PageHeader
        title={proposal.ma_de_xuat}
        description="Chi tiết đề xuất nhập hàng và tiến trình phê duyệt."
        actions={
          <>
            <RecordHistoryButton entity="de-xuat-nhap-hang" code={proposal.ma_de_xuat} />
            <a className="pm-btn" href="#/de-xuat">
              ← Danh sách
            </a>
            {pending && can("DE_XUAT_NHAP_HANG_APPROVE") && (
              <button
                className="pm-btn primary"
                onClick={() => {
                  mutation.setError("");
                  setReview("approve");
                }}
              >
                Duyệt đề xuất
              </button>
            )}
            {pending && can("DE_XUAT_NHAP_HANG_REJECT") && (
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
            {proposal.trang_thai === "DA_DUYET" && can("DON_MUA_CREATE") && (
              <button
                className="pm-btn primary"
                onClick={() => {
                  mutation.setError("");
                  setGenerate(true);
                }}
              >
                Tạo đơn mua
              </button>
            )}
          </>
        }
      />
      <Feedback
        error={review || generate ? "" : mutation.error}
        success={mutation.success}
      />
      <div className="pm-cards">
        <SummaryCard
          label="Trạng thái"
          value={<StatusBadge status={proposal.trang_thai} />}
        />
        <SummaryCard label="Số nguyên liệu" value={proposal.chi_tiet.length} />
        <SummaryCard
          label="Tổng lượng (kg)"
          value={formatNumber(
            proposal.chi_tiet.reduce(
              (s, r) => s + number(r.so_luong_de_xuat_kg),
              0,
            ),
          )}
        />
        <SummaryCard
          label="Giá trị dự kiến"
          value={formatMoney(
            proposal.chi_tiet.reduce(
              (s, r) =>
                s + number(r.so_luong_de_xuat_kg) * number(r.don_gia_du_kien),
              0,
            ),
          )}
        />
      </div>
      <section className="pm-panel">
        <h2>Thông tin đề xuất</h2>
        <dl className="pm-info">
          <div>
            <dt>Ngày tạo</dt>
            <dd>{formatDate(proposal.ngay_tao_de_xuat)}</dd>
          </div>
          <div>
            <dt>Người tạo</dt>
            <dd>{proposal.nguoi_tao ?? "—"}</dd>
          </div>
          <div>
            <dt>Người duyệt</dt>
            <dd>{proposal.nguoi_duyet ?? "—"}</dd>
          </div>
          <div>
            <dt>Thời gian duyệt</dt>
            <dd>{formatDate(proposal.thoi_gian_duyet)}</dd>
          </div>
        </dl>
        {proposal.ghi_chu && <p>Ghi chú: {proposal.ghi_chu}</p>}
        {proposal.ly_do_tu_choi && (
          <div className="pm-error">
            Lý do từ chối: {proposal.ly_do_tu_choi}
          </div>
        )}
      </section>
      <section className="pm-panel">
        <h2>Nguyên liệu đề xuất</h2>
        <DataTable
          rows={proposal.chi_tiet}
          rowKey={(r) => r.ma_chi_tiet}
          columns={[
            {
              key: "material",
              label: "Nguyên liệu",
              render: (r) => (
                <>
                  {r.ten_nguyen_lieu}
                  <div className="pm-small">{r.ma_nguyen_lieu}</div>
                </>
              ),
            },
            {
              key: "supplier",
              label: "Nhà cung cấp",
              render: (r) => r.ten_ncc,
            },
            {
              key: "qty",
              label: "SL đề xuất (kg)",
              numeric: true,
              render: (r) => formatNumber(r.so_luong_de_xuat_kg),
            },
            {
              key: "price",
              label: "Đơn giá dự kiến",
              numeric: true,
              render: (r) => formatMoney(r.don_gia_du_kien),
            },
            {
              key: "total",
              label: "Thành tiền",
              numeric: true,
              render: (r) =>
                formatMoney(
                  number(r.so_luong_de_xuat_kg) * number(r.don_gia_du_kien),
                ),
            },
          ]}
        />
      </section>
      {created.length > 0 && (
        <section className="pm-panel">
          <h2>Đơn mua đã tạo</h2>
          <div className="pm-actions">
            {created.map((order) =>
              can("DON_MUA_VIEW") ? (
                <a
                  key={order.ma_don_mua}
                  className="pm-btn"
                  href={`#/don-mua/${order.ma_don_mua}`}
                >
                  {order.ma_don_mua} · {order.ten_ncc} →
                </a>
              ) : (
                <span key={order.ma_don_mua}>{order.ma_don_mua}</span>
              ),
            )}
          </div>
        </section>
      )}
      <ReviewDialog
        action={review}
        title={`đề xuất ${proposal.ma_de_xuat}`}
        onClose={() => setReview(null)}
        busy={mutation.busy}
        error={mutation.error}
        onConfirm={(reason) =>
          void mutation.run(async () => {
            if (
              !pending ||
              !can(
                reason === undefined
                  ? "DE_XUAT_NHAP_HANG_APPROVE"
                  : "DE_XUAT_NHAP_HANG_REJECT",
              )
            )
              throw new Error(
                "Không thể duyệt/từ chối đề xuất trong trạng thái hiện tại.",
              );
            const value = await reviewProposal(id, reason);
            resource.setData(value);
            setReview(null);
          })
        }
      />
      <ConfirmDialog
        open={generate}
        title="Tạo đơn mua từ đề xuất"
        onClose={() => setGenerate(false)}
        busy={mutation.busy}
        confirmLabel="Tạo đơn mua"
        onConfirm={() =>
          void mutation.run(async () => {
            if (!can("DON_MUA_CREATE") || proposal.trang_thai !== "DA_DUYET")
              throw new Error("Đề xuất phải được duyệt trước khi tạo đơn mua.");
            if (!delivery || delivery < today())
              throw new Error(
                "Ngày dự kiến giao không được trước ngày hiện tại.",
              );
            const result = await generateOrders(id, delivery);
            setCreated(result.don_mua);
            setGenerate(false);
          }, "Đã tạo đơn mua chờ duyệt.")
        }
      >
        <p>
          Hệ thống tách đơn theo nhà cung cấp. Mỗi đơn sẽ cần được duyệt trước
          khi nhận hàng.
        </p>
        <Field label="Ngày dự kiến giao *">
          <input
            required
            type="date"
            min={today()}
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          />
        </Field>
        <Feedback error={mutation.error} success="" />
      </ConfirmDialog>
    </>
  );
}
