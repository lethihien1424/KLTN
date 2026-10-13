import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { navigate } from "../../routes/navigation";
import { MaterialField } from "../../components/common/EntityFields";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  SummaryCard,
  Field,
  LoadingState,
  ErrorState,
  EmptyState,
  useResource,
  formatNumber,
  formatMoney,
} from "../../components/common/PurchaseUI";
import { api, queryString } from "../../services/apiClient";
import type { Suggestions } from "../../services/purchaseTypes";
export default function GoiYNhaCungCapPage({
  material = "",
  qty = "",
  forecast = "",
}: {
  material?: string;
  qty?: string;
  forecast?: string;
}) {
  const { can } = useAuth();
  const [draft, setDraft] = useState({ material, qty });
  const [criteria, setCriteria] = useState(
    material && Number(qty) > 0 ? { material, qty } : null,
  );
  const [selected, setSelected] = useState("");
  const resource = useResource(
    () =>
      criteria
        ? api<Suggestions>(
            `/goi-y-nha-cung-cap${queryString({ ma_nguyen_lieu: criteria.material, so_luong_can_mua: criteria.qty })}`,
          )
        : Promise.resolve(null),
    [criteria?.material, criteria?.qty],
  );
  const supplier = resource.data?.nha_cung_cap.find(
    (r) => r.ma_ncc === selected,
  );
  return (
    <>
      <PageHeader
        title="Gợi ý nhà cung cấp"
        description="So sánh khả năng cung ứng, giá và hiệu suất; lựa chọn đối tác phù hợp."
        actions={
          forecast &&
          can("NHU_CAU_NGUYEN_LIEU_VIEW") && (
            <button
              className="pm-btn"
              onClick={() => navigate("/nhu-cau", { forecast })}
            >
              ← Nhu cầu nguyên liệu
            </button>
          )
        }
      />
      <section className="pm-panel">
        <form
          className="pm-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setCriteria({ material: draft.material.trim(), qty: draft.qty });
            setSelected("");
            resource.refetch();
          }}
        >
          <MaterialField
            value={draft.material}
            onChange={(v) => setDraft({ ...draft, material: v })}
          />
          <Field label="Số lượng cần mua (kg)">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={draft.qty}
              onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
            />
          </Field>
          <button type="submit" className="pm-btn primary">
            Tìm nhà cung cấp
          </button>
        </form>
      </section>
      {!criteria ? (
        <EmptyState
          title="Chọn nguyên liệu và số lượng"
          description="Hệ thống sẽ xếp hạng các nhà cung cấp có thể cung ứng."
        />
      ) : resource.loading ? (
        <LoadingState />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.refetch} />
      ) : (
        <>
          <div className="pm-cards">
            <SummaryCard
              label="Nguyên liệu"
              value={resource.data?.ten_nguyen_lieu ?? "—"}
            />
            <SummaryCard
              label="Cần mua (kg)"
              value={formatNumber(resource.data?.so_luong_can_mua)}
            />
            <SummaryCard
              label="Nhà cung cấp"
              value={resource.data?.nha_cung_cap.length ?? 0}
            />
            <SummaryCard
              label="Đủ khả năng cung ứng"
              value={
                resource.data?.nha_cung_cap.filter(
                  (r) => r.du_kha_nang_cung_cap,
                ).length ?? 0
              }
            />
          </div>
          <section className="pm-panel">
            <DataTable
              rows={resource.data?.nha_cung_cap ?? []}
              rowKey={(r) => r.ma_ncc}
              columns={[
                {
                  key: "rank",
                  label: "Ưu tiên",
                  render: (r) => (
                    <span className="pm-badge muted">
                      #
                      {(resource.data?.nha_cung_cap.findIndex(
                        (s) => s.ma_ncc === r.ma_ncc,
                      ) ?? 0) + 1}
                    </span>
                  ),
                },
                {
                  key: "name",
                  label: "Nhà cung cấp",
                  render: (r) => (
                    <>
                      <strong>{r.ten_ncc}</strong>
                      <div className="pm-small">{r.ma_ncc}</div>
                    </>
                  ),
                },
                {
                  key: "score",
                  label: "Điểm NCC",
                  numeric: true,
                  render: (r) => formatNumber(r.diem_ncc),
                },
                {
                  key: "price",
                  label: "Đơn giá",
                  numeric: true,
                  render: (r) => formatMoney(r.don_gia),
                },
                {
                  key: "available",
                  label: "Khả dụng (kg)",
                  numeric: true,
                  render: (r) => formatNumber(r.ton_kho_kha_dung_ncc),
                },
                {
                  key: "lead",
                  label: "Lead time",
                  render: (r) => `${r.lead_time_ngay} ngày`,
                },
                {
                  key: "ontime",
                  label: "Đúng hạn / giao đủ",
                  render: (r) =>
                    `${r.ty_le_giao_dung_han_thuc_te === null ? "—" : formatNumber(r.ty_le_giao_dung_han_thuc_te) + "%"} / ${r.ty_le_giao_du_thuc_te === null ? "—" : formatNumber(r.ty_le_giao_du_thuc_te) + "%"}`,
                },
                {
                  key: "capacity",
                  label: "Khả năng",
                  render: (r) => (
                    <span
                      className={`pm-badge ${r.du_kha_nang_cung_cap ? "success" : "warning"}`}
                    >
                      {r.du_kha_nang_cung_cap ? "Đủ cung ứng" : "Không đủ"}
                    </span>
                  ),
                },
                {
                  key: "select",
                  label: "Lựa chọn",
                  render: (r) =>
                    can("DE_XUAT_NHAP_HANG_CREATE") && (
                      <button
                        className={`pm-btn ${selected === r.ma_ncc ? "primary" : ""}`}
                        disabled={!r.du_kha_nang_cung_cap}
                        onClick={() => setSelected(r.ma_ncc)}
                      >
                        {selected === r.ma_ncc ? "Đã chọn" : "Chọn NCC"}
                      </button>
                    ),
                },
              ]}
            />
            <p className="pm-small">
              Thứ tự ưu tiên do hệ thống tính. Chưa có tỷ lệ giao hàng thực tế
              được hiển thị bằng dấu —.
            </p>
            {can("DE_XUAT_NHAP_HANG_CREATE") && (
              <div className="pm-actions">
                <button
                  className="pm-btn primary"
                  disabled={!supplier?.du_kha_nang_cung_cap}
                  onClick={() => {
                    if (supplier && criteria)
                      navigate("/de-xuat/tao", {
                        material: criteria.material,
                        ncc: supplier.ma_ncc,
                        qty: criteria.qty,
                      });
                  }}
                >
                  Tạo đề xuất nhập hàng →
                </button>
                {supplier && <span>Đã chọn: {supplier.ten_ncc}</span>}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
