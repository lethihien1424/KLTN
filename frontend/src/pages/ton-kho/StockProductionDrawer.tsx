import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import { FormDrawer, Field, Feedback, LoadingState, ErrorState, useResource, useMutation, formatNumber, ConfirmDialog } from "../../components/common/PurchaseUI";
import { listStockPlans, stockPlanAction, type StockPlan } from "../../services/tonKhoService";

export default function StockProductionDrawer({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const { can } = useAuth();
  const plans = useResource(listStockPlans);
  const mutation = useMutation();
  const [selected, setSelected] = useState<StockPlan | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [requestId, setRequestId] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<{ plan: StockPlan; action: "giu" | "huy" } | null>(null);
  const refresh = () => { plans.refetch(); onChanged(); };
  return <>
    <FormDrawer open title="Nguyên liệu cho sản xuất" onClose={onClose} busy={mutation.busy}>
      <p className="pm-help">Chọn kế hoạch đang chờ, xác nhận giữ theo BOM rồi nhập số thực xuất. Hủy giữ giải phóng phần chưa xuất. Việc tạo đơn hàng không tự giữ hoặc xuất nguyên liệu.</p>
      <Feedback error={selected ? "" : mutation.error} success={mutation.success} />
      {plans.loading ? <LoadingState /> : plans.error ? <ErrorState message={plans.error} retry={plans.refetch} /> : <DataTable rows={plans.data ?? []} rowKey={(r) => r.ma_ke_hoach} columns={[
        { key: "plan", label: "Kế hoạch", render: (r) => r.ma_ke_hoach },
        { key: "product", label: "Sản phẩm", render: (r) => `${r.ten_san_pham} · ${r.so_luong}` },
        { key: "state", label: "Nguyên liệu", render: (r) => !r.chi_tiet.length ? "Chưa giữ" : r.chi_tiet.some((l) => l.da_huy === "Y") ? "Đã hủy phần giữ" : r.chi_tiet.every((l) => Number(l.so_luong_xuat) >= Number(l.so_luong_giu)) ? "Đã xuất đủ" : "Đang giữ" },
        { key: "actions", label: "Thao tác", render: (r) => <div className="pm-actions">
          {!r.chi_tiet.length && r.trang_thai === "CHO_SAN_XUAT" && <button className="pm-btn" disabled={mutation.busy || !can("TON_KHO_UPDATE")} onClick={() => setPending({ plan: r, action: "giu" })}>Giữ theo BOM</button>}
          {r.chi_tiet.some((l) => l.da_huy !== "Y" && Number(l.so_luong_giu) > Number(l.so_luong_xuat)) && <>
            <button className="pm-btn" disabled={mutation.busy || !can("TON_KHO_UPDATE")} onClick={() => { setSelected(r); setRequestId(crypto.randomUUID()); setNote(""); setQuantities(Object.fromEntries(r.chi_tiet.map((l) => [l.ma_nguyen_lieu, String(Number(l.so_luong_giu) - Number(l.so_luong_xuat))]))); mutation.setError(""); }}>Xuất nguyên liệu</button>
            <button className="pm-btn" disabled={mutation.busy || !can("TON_KHO_UPDATE")} onClick={() => setPending({ plan: r, action: "huy" })}>Hủy giữ còn lại</button>
          </>}
        </div> },
      ]} />}
    </FormDrawer>
    <ConfirmDialog open={Boolean(pending)} title={pending?.action === "giu" ? "Xác nhận giữ nguyên liệu" : "Xác nhận hủy phần giữ"} busy={mutation.busy} onClose={() => setPending(null)} onConfirm={() => void mutation.run(async () => {
      if (!pending) return;
      await stockPlanAction(pending.plan.ma_ke_hoach, pending.action); setPending(null); refresh();
    }, pending?.action === "giu" ? "Đã giữ nguyên liệu theo BOM." : "Đã giải phóng phần chưa xuất.")}>
      <p>Kế hoạch {pending?.plan.ma_ke_hoach} · {pending?.plan.ten_san_pham}.</p>
      <p>{pending?.action === "giu" ? "Xác nhận này giữ đầy đủ nguyên liệu theo BOM đang sử dụng. Tồn thực tế chưa giảm." : "Giải phóng toàn bộ phần chưa xuất của kế hoạch. Phần đã xuất vẫn được lưu trong lịch sử."}</p>
      <Feedback error={mutation.error} success="" />
    </ConfirmDialog>
    <FormDrawer open={Boolean(selected)} title={`Xuất nguyên liệu · ${selected?.ma_ke_hoach ?? ""}`} busy={mutation.busy} onClose={() => setSelected(null)} footer={<button className="pm-btn primary" form="stock-issue-form" type="submit" disabled={mutation.busy || !can("TON_KHO_UPDATE")}>Xác nhận xuất kho</button>}>
      <form id="stock-issue-form" className="pm-form" onSubmit={(event) => { event.preventDefault(); void mutation.run(async () => {
        if (!selected) return;
        await stockPlanAction(selected.ma_ke_hoach, "xuat", { request_id: requestId, ghi_chu: note || null,
          chi_tiet: selected.chi_tiet.map((l) => ({ ma_nguyen_lieu: l.ma_nguyen_lieu, so_luong: quantities[l.ma_nguyen_lieu] })) });
        setSelected(null); refresh();
      }, "Đã xuất nguyên liệu sản xuất."); }}>
        <p>Tồn thực tế chỉ giảm khi xác nhận. Nhập 0 cho nguyên liệu chưa xuất trong đợt này.</p>
        {selected?.chi_tiet.map((l) => <Field key={l.ma_nguyen_lieu} label={`${l.ten_nguyen_lieu} · còn giữ ${formatNumber(Number(l.so_luong_giu) - Number(l.so_luong_xuat))} ${l.don_vi_do_luong}`}>
          <input aria-label={`Thực xuất ${l.ma_nguyen_lieu}`} type="number" min="0" max={Number(l.so_luong_giu) - Number(l.so_luong_xuat)} step="0.01" required value={quantities[l.ma_nguyen_lieu] ?? "0"} onChange={(e) => { setQuantities({ ...quantities, [l.ma_nguyen_lieu]: e.target.value }); setRequestId(crypto.randomUUID()); }} />
        </Field>)}
        <Field label="Ghi chú"><textarea maxLength={2000} value={note} onChange={(e) => { setNote(e.target.value); setRequestId(crypto.randomUUID()); }} /></Field>
        <Feedback error={mutation.error} success="" />
      </form>
    </FormDrawer>
  </>;
}
