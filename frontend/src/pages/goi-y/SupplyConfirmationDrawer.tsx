import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { FormDrawer, Field, Feedback, useMutation, formatNumber } from "../../components/common/PurchaseUI";
import { api, jsonBody } from "../../services/apiClient";
import type { Suggestion } from "../../services/purchaseTypes";

const localInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export default function SupplyConfirmationDrawer({ supplier, material, qty, forecast, onClose, onSaved }: {
  supplier: Suggestion; material: string; qty: string; forecast: string; onClose: () => void; onSaved: () => void;
}) {
  const { user, can } = useAuth();
  const mutation = useMutation();
  const [form, setForm] = useState({
    so_luong_xac_nhan: "", ngay_xac_nhan: localInput(new Date()),
    hieu_luc_den: localInput(new Date(Date.now() + 86400000)),
    nguon_xac_nhan: "EMAIL", ly_do: "", ghi_chu: "",
  });
  const field = (key: keyof typeof form, label: string, type = "text", required = true) => (
    <Field label={label}><input required={required} type={type} value={form[key]}
      min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined}
      maxLength={type === "text" ? key === "ghi_chu" ? 2000 : 500 : undefined}
      onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></Field>
  );
  return <FormDrawer open title={`Xác nhận cung ứng – ${supplier.ten_ncc}`} busy={mutation.busy} onClose={onClose}>
    <form className="pm-form" onSubmit={(event) => {
      event.preventDefault();
      void mutation.run(async () => {
        if (!can("goi_y_nha_cung_cap:XAC_NHAN")) throw new Error("Bạn chưa có quyền xác nhận cung ứng.");
        await api("/goi-y-nha-cung-cap/xac-nhan", { method: "POST", body: jsonBody({
          ...form, ngay_xac_nhan: new Date(form.ngay_xac_nhan).toISOString(), hieu_luc_den: new Date(form.hieu_luc_den).toISOString(),
          ma_nguyen_lieu_ncc: supplier.ma_nguyen_lieu_ncc, ma_lich_su_du_bao: forecast || null,
          so_luong_can_mua: qty, phien_ban_truoc: supplier.xac_nhan?.id ?? null,
        }) });
        onSaved();
      }, "Đã ghi nhận xác nhận cung ứng.");
    }}>
      <p>{material} · Số lượng cần mua: <strong>{formatNumber(qty)} kg</strong></p>
      <p>Người xác nhận: {user.ho_ten || user.ma_nguoi_dung}</p>
      <p className="pm-small">Chỉ ghi nhận sau khi liên hệ NCC hoặc nhận chứng từ. Số tồn khai báo trước đây không phải xác nhận cung ứng.</p>
      {supplier.xac_nhan && <p className="pm-small">Xác nhận trước: {supplier.xac_nhan.nguoi_xac_nhan} · {formatNumber(supplier.xac_nhan.so_luong_xac_nhan)} kg · hiệu lực đến {new Date(supplier.xac_nhan.hieu_luc_den).toLocaleString("vi-VN")}.</p>}
      {field("so_luong_xac_nhan", "Số lượng NCC xác nhận có thể giao (kg)", "number")}
      {field("ngay_xac_nhan", "Ngày xác nhận", "datetime-local")}
      {field("hieu_luc_den", "Thời hạn hiệu lực", "datetime-local")}
      <Field label="Nguồn xác nhận"><select value={form.nguon_xac_nhan} onChange={(event) => setForm({ ...form, nguon_xac_nhan: event.target.value })}>
        <option value="EMAIL">Email</option><option value="DIEN_THOAI">Điện thoại</option><option value="VAN_BAN">Văn bản/Báo giá</option><option value="TRUC_TIEP">Trao đổi trực tiếp</option>
      </select></Field>
      {field("ly_do", "Lý do xác nhận")}
      {field("ghi_chu", "Ghi chú / tham chiếu chứng từ", "text", false)}
      <p className="pm-small">Mỗi lần lưu tạo một bản xác nhận mới, giữ nguyên lịch sử. Xác nhận không làm thay đổi tồn kho hoặc tự duyệt đề xuất.</p>
      <Feedback error={mutation.error} success={mutation.success} />
      <button className="pm-btn primary" disabled={mutation.busy || !can("goi_y_nha_cung_cap:XAC_NHAN")}>Lưu xác nhận cung ứng</button>
    </form>
  </FormDrawer>;
}
