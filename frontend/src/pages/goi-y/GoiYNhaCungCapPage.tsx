//D:\KLTN\KLTN\frontend\src\pages\goi-y\GoiYNhaCungCapPage.tsx
import { useEffect, useRef, useState } from "react";
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
  useResource,
  formatNumber,
  formatMoney,
} from "../../components/common/PurchaseUI";
import { api, queryString } from "../../services/apiClient";
import type { Suggestions, Suggestion } from "../../services/purchaseTypes";
import SupplyConfirmationDrawer from "./SupplyConfirmationDrawer";
import { CalculatorOutlined } from "@ant-design/icons";
import SupplierSuggestionExplanationDialog, { SupplierRankingDialog } from "./SupplierSuggestionExplanation";

const statusNames = { DA_XAC_NHAN_DU: "Đã xác nhận đủ", DA_XAC_NHAN_KHONG_DU: "Đã xác nhận không đủ", CHUA_XAC_NHAN: "Chưa xác nhận" };
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
    forecast.trim() && material.trim() && Number.isFinite(Number(qty)) && Number(qty) > 0
      ? { material: material.trim(), qty }
      : null,
  );
  const [selected, setSelected] = useState("");
  const [explaining, setExplaining] = useState("");
  const [rankingOpen, setRankingOpen] = useState(false);
  const [confirming, setConfirming] = useState<Suggestion | null>(null);
  const [clock, setClock] = useState(Date.now());
  const statusOf = (row: Suggestion) => {
    const evidence = row.xac_nhan;
    if (!evidence || !(Date.parse(evidence.ngay_xac_nhan) <= clock && clock < Date.parse(evidence.hieu_luc_den)))
      return "CHUA_XAC_NHAN";
    return row.trang_thai_cung_ung || "CHUA_XAC_NHAN";
  };
  // Share an in-flight request when StrictMode replays the initial effect.
  const pending = useRef<{ criteria: typeof criteria; promise: Promise<Suggestions> } | null>(null);
  const resource = useResource(
    () => {
      if (!criteria) return Promise.resolve(null);
      if (pending.current?.criteria === criteria) return pending.current.promise;
      const request = {
        criteria,
        promise: api<Suggestions>(
          `/goi-y-nha-cung-cap${queryString({ ma_nguyen_lieu: criteria.material, so_luong_can_mua: criteria.qty, ma_lich_su_du_bao: forecast || undefined })}`,
        ).finally(() => {
          if (pending.current === request) pending.current = null;
        }),
      };
      pending.current = request;
      return request.promise;
    },
    [criteria, forecast],
  );
  const changeDraft = (next: typeof draft) => {
    setDraft(next);
    setCriteria(null);
    resource.setData(null);
    setSelected("");
    setConfirming(null);
    setExplaining(""); setRankingOpen(false);
  };
  const supplier = resource.data?.nha_cung_cap.find(
    (r) => r.ma_ncc === selected,
  );
  const canCreate = can("DE_XUAT_NHAP_HANG_CREATE");
  useEffect(() => {
    if (!selected) return;
    const candidate = resource.data?.nha_cung_cap.find(row => row.ma_ncc === selected);
    if (!canCreate || (resource.data && (!candidate || statusOf(candidate) === "DA_XAC_NHAN_KHONG_DU"))) setSelected("");
  }, [resource.data, selected, canCreate, clock]);
  useEffect(() => {
    if (!criteria) return;
    const tick = setInterval(() => setClock(Date.now()), 1000);
    const refresh = setInterval(resource.refetch, 30000);
    window.addEventListener("focus", resource.refetch);
    return () => { clearInterval(tick); clearInterval(refresh); window.removeEventListener("focus", resource.refetch); };
  }, [criteria, forecast]);
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
            if (!draft.material.trim() || !Number.isFinite(Number(draft.qty)) || Number(draft.qty) <= 0) return;
            resource.setData(null);
            setCriteria({ material: draft.material.trim(), qty: draft.qty });
            setSelected("");
            setConfirming(null);
            setExplaining(""); setRankingOpen(false);
          }}
        >
          <MaterialField
            value={draft.material}
            onChange={(v) => changeDraft({ ...draft, material: v })}
          />
          <Field label="Số lượng cần mua (kg)">
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={draft.qty}
              onChange={(e) => {
                const qty = e.target.value;
                changeDraft({ ...draft, qty });
              }}
            />
          </Field>
          <button type="submit" className="pm-btn primary">
            Tìm nhà cung cấp
          </button>
        </form>
      </section>
      {!criteria ? null : resource.loading ? (
        <LoadingState />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.refetch} />
      ) : !resource.data ? (
        <LoadingState />
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
              label="Đã xác nhận đủ"
              value={
                resource.data?.nha_cung_cap.filter(
                  (r) => statusOf(r) === "DA_XAC_NHAN_DU",
                ).length ?? 0
              }
            />
          </div>
          <section className="pm-panel">
            <div className="suggestion-table-heading"><h2>So sánh nhà cung cấp</h2><button className="pm-btn" onClick={() => setRankingOpen(true)}><CalculatorOutlined aria-hidden="true" /> Cách xếp hạng</button></div>
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
                      <button className="pm-btn suggestion-info-button" onClick={() => setExplaining(r.ma_nguyen_lieu_ncc)}><CalculatorOutlined aria-hidden="true" /> Xem cách tính</button>
                    </>
                  ),
                },
                {
                  key: "score",
                  label: "Điểm NCC",
                  numeric: true,
                  render: (r) => <>{r.diem_ncc == null ? "Chưa có KPI" : formatNumber(r.diem_ncc)}<div className="pm-small">KPI thực tế · {formatNumber(r.do_day_du_kpi ?? 0)}% dữ liệu</div><div className="pm-small">Điểm ưu tiên: {r.diem_xep_hang == null ? "Chưa có dữ liệu" : formatNumber(r.diem_xep_hang)}</div></>,
                },
                {
                  key: "price",
                  label: "Đơn giá",
                  numeric: true,
                  render: (r) => formatMoney(r.don_gia),
                },
                {
                  key: "lead",
                  label: "Thời gian giao dự kiến",
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
                  label: "Khả năng cung ứng",
                  render: (r) => (
                    <span
                      className={`pm-badge ${statusOf(r) === "DA_XAC_NHAN_DU" ? "success" : "warning"}`}
                    >
                      {statusNames[statusOf(r)]}
                    </span>
                  ),
                },
                {
                  key: "select",
                  label: "Lựa chọn",
                  render: (r) => <>
                    {can("goi_y_nha_cung_cap:XAC_NHAN") && <button className="pm-btn" onClick={() => setConfirming(r)}>Xác nhận cung ứng</button>}
                    {can("DE_XUAT_NHAP_HANG_CREATE") && (
                      <button
                        className={`pm-btn ${selected === r.ma_ncc ? "primary" : ""}`}
                        aria-pressed={selected === r.ma_ncc}
                        disabled={statusOf(r) === "DA_XAC_NHAN_KHONG_DU" && selected !== r.ma_ncc}
                        onClick={() => setSelected(previous => previous === r.ma_ncc ? "" : r.ma_ncc)}
                      >
                        {selected === r.ma_ncc ? "Bỏ chọn" : "Chọn NCC"}
                      </button>
                    )}</>,
                },
              ]}
            />
            <p className="pm-small">
              {resource.data.chinh_sach_xep_hang?.cong_thuc}
              {" "}{resource.data.chinh_sach_xep_hang?.sap_xep}
              Chỉ tiêu khai báo và tồn NCC không được dùng làm bằng chứng. Chưa xác nhận không phải cam kết giao hàng.
            </p>
            {can("DE_XUAT_NHAP_HANG_CREATE") && (
              <div className="pm-actions">
                <button
                  className="pm-btn primary"
                  disabled={!supplier || statusOf(supplier) === "DA_XAC_NHAN_KHONG_DU"}
                  onClick={() => {
                    if (supplier && criteria)
                      navigate("/de-xuat/tao", {
                        material: criteria.material,
                        ncc: supplier.ma_ncc,
                        qty: criteria.qty,
                        forecast,
                        unconfirmed: statusOf(supplier) === "CHUA_XAC_NHAN" ? "1" : "0",
                      });
                  }}
                >
                  Tạo đề xuất nhập hàng →
                </button>
                {supplier && <span>Đã chọn: {supplier.ten_ncc}</span>}
                {supplier && statusOf(supplier) === "CHUA_XAC_NHAN" && <p className="pm-small">NCC đang chọn chưa có xác nhận cung ứng hợp lệ; đây chưa phải cam kết giao hàng.</p>}
              </div>
            )}
          </section>
        </>
      )}
      {confirming && criteria && can("goi_y_nha_cung_cap:XAC_NHAN") && <SupplyConfirmationDrawer
        supplier={confirming} material={criteria.material} qty={criteria.qty} forecast={forecast}
        onClose={() => { setConfirming(null); resource.refetch(); }} onSaved={() => { setConfirming(null); setSelected(""); resource.refetch(); }} />}
      {rankingOpen && resource.data && <SupplierRankingDialog report={resource.data} onClose={() => setRankingOpen(false)} />}
      {explaining && criteria && <SupplierSuggestionExplanationDialog key={`${explaining}/${criteria.material}/${criteria.qty}/${forecast}`} mappingId={explaining} material={criteria.material} qty={criteria.qty} forecast={forecast} onClose={() => setExplaining("")} onChanged={resource.refetch} />}
    </>
  );
}
