//D:\KLTN\KLTN\frontend\src\pages\don-mua\NhanHangDialog.tsx
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  FormDrawer,
  Field,
  Feedback,
  useMutation,
  number,
  formatNumber,
  today,
} from "../../components/common/PurchaseUI";
import { receiveOrder, type ReceiptInput } from "../../services/donMuaService";
import type { Order } from "../../services/purchaseTypes";
export default function NhanHangDialog({
  order,
  onClose,
  onSaved,
}: {
  order: Order;
  onClose: () => void;
  onSaved: (result: Order) => void;
}) {
  const { can } = useAuth();
  const mutation = useMutation();
  const [form, setForm] = useState<ReceiptInput>({
    ngay_giao_thuc_te: today(),
    request_id: crypto.randomUUID(), hoan_tat: true, ghi_chu: "",
    chi_tiet: order.chi_tiet.map((r) => ({
      ma_chi_tiet_don_mua: r.ma_chi_tiet_don_mua,
      so_luong_thuc_nhan: String(number(r.so_luong_mua) - number(r.so_luong_thuc_nhan)),
      so_luong_giao: String(number(r.so_luong_mua) - number(r.so_luong_thuc_nhan)),
      so_luong_dat_chat_luong: String(number(r.so_luong_mua) - number(r.so_luong_thuc_nhan)),
      so_luong_khong_dat: "0",
      ly_do_khong_nhan: null,
    })),
  });
  const change = (values: Partial<ReceiptInput>) => setForm({ ...form, ...values, request_id: crypto.randomUUID() });
  const changeLine = (index: number, values: Partial<ReceiptInput["chi_tiet"][number]>) =>
    change({ chi_tiet: form.chi_tiet.map((line, i) => i === index ? { ...line, ...values } : line) });
  const save = () =>
    void mutation.run(async () => {
      if (!can("DON_MUA_RECEIVE") || order.trang_thai !== "DA_DUYET")
        throw new Error("Chỉ được nhận đơn mua đã duyệt.");
      if (
        form.ngay_giao_thuc_te < order.ngay_dat_hang ||
        form.ngay_giao_thuc_te > today()
      )
        throw new Error("Ngày nhận phải từ ngày đặt hàng đến hôm nay.");
      for (const line of form.chi_tiet) {
        const source = order.chi_tiet.find((r) => r.ma_chi_tiet_don_mua === line.ma_chi_tiet_don_mua)!;
        const ordered = number(source.so_luong_mua) - number(source.so_luong_thuc_nhan);
        const received = number(line.so_luong_thuc_nhan);
        const delivered = number(line.so_luong_giao), good = number(line.so_luong_dat_chat_luong), bad = number(line.so_luong_khong_dat);
        if (Math.abs(good + bad - delivered) > 0.000001 || received > good || delivered > ordered)
          throw new Error("Số đạt + không đạt phải bằng số giao; lượng nhập không vượt số đạt hoặc số còn chờ.");
        if (
          line.so_luong_thuc_nhan === "" ||
          !Number.isFinite(received) ||
          received < 0 ||
          received > ordered
        )
          throw new Error("Số lượng nhận phải từ 0 đến số lượng đặt.");
        if ((delivered > received || (form.hoan_tat && received < ordered)) && !line.ly_do_khong_nhan?.trim())
          throw new Error(
            "Vui lòng ghi lý do cho từng nguyên liệu nhận thiếu.",
          );
      }
      const payload = {
        ...form,
        chi_tiet: form.chi_tiet.map((r) => ({
          ...r,
          ly_do_khong_nhan: r.ly_do_khong_nhan?.trim() || null,
        })),
      };
      onSaved(await receiveOrder(order.ma_don_mua, payload));
    }, "Đã nhận hàng và cập nhật tồn kho.");
  return (
    <FormDrawer
      open
      title={`Nhận hàng · ${order.ma_don_mua}`}
      onClose={onClose}
      busy={mutation.busy}
      footer={
        <button
          className="pm-btn primary"
          type="submit"
          form="receipt-form"
          disabled={mutation.busy || !can("DON_MUA_RECEIVE")}
        >
          {mutation.busy ? "Đang nhận hàng…" : "Xác nhận nhận hàng"}
        </button>
      }
    >
      <form
        id="receipt-form"
        className="pm-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="pm-help">
          Chỉ lượng được chấp nhận nhập kho làm tăng tồn. Bỏ chọn chốt đơn nếu còn đợt giao tiếp theo; đơn đã chốt không nhận thêm.
        </div>
        <Field label="Ngày giao thực tế *">
          <input
            required
            type="date"
            min={order.ngay_dat_hang}
            max={today()}
            value={form.ngay_giao_thuc_te}
            onChange={(e) =>
              change({ ngay_giao_thuc_te: e.target.value })
            }
          />
        </Field>
        <Field label="Chốt nhận hàng của đơn"><input type="checkbox" checked={form.hoan_tat} onChange={(e) => change({ hoan_tat: e.target.checked })} /></Field>
        <Field label="Ghi chú phiếu nhận"><textarea maxLength={2000} value={form.ghi_chu ?? ""} onChange={(e) => change({ ghi_chu: e.target.value })} /></Field>
        {form.chi_tiet.map((line, index) => {
          const source = order.chi_tiet[index];
          const short =
            number(line.so_luong_giao) > number(line.so_luong_thuc_nhan) || (form.hoan_tat && number(line.so_luong_thuc_nhan) < number(source.so_luong_mua) - number(source.so_luong_thuc_nhan));
          const remaining = number(source.so_luong_mua) - number(source.so_luong_thuc_nhan);
          return (
            <div className="pm-line-item" key={line.ma_chi_tiet_don_mua}>
              <strong>{source.ten_nguyen_lieu}</strong>
              <div className="pm-small">
                Đã đặt: {formatNumber(source.so_luong_mua)}{" "}
                {source.don_vi_do_luong}
                {" · Còn chờ: "}{formatNumber(remaining)}
              </div>
              <div className="pm-form-grid">
              <Field label="Số lượng giao đợt này"><input required type="number" min="0" max={remaining} step="0.01" value={line.so_luong_giao ?? ""} onChange={(e) => {
                const good = Math.max(0, number(e.target.value) - number(line.so_luong_khong_dat));
                changeLine(index, { so_luong_giao: e.target.value, so_luong_dat_chat_luong: String(good), so_luong_thuc_nhan: String(good) });
              }} /></Field>
              <Field label="Không đạt chất lượng"><input required type="number" min="0" max={line.so_luong_giao} step="0.01" value={line.so_luong_khong_dat ?? ""} onChange={(e) => {
                const good = Math.max(0, number(line.so_luong_giao) - number(e.target.value));
                changeLine(index, { so_luong_khong_dat: e.target.value, so_luong_dat_chat_luong: String(good), so_luong_thuc_nhan: String(good) });
              }} /></Field>
              <Field label="Đạt chất lượng"><input required type="number" min="0" max={line.so_luong_giao} step="0.01" value={line.so_luong_dat_chat_luong ?? ""} onChange={(e) => changeLine(index, { so_luong_dat_chat_luong: e.target.value })} /></Field>
              <Field label="Số lượng thực nhận" hint="Lượng chấp nhận nhập kho, không vượt số đạt chất lượng.">
                <input
                  required
                  type="number"
                  min="0"
                  max={Math.min(remaining, number(line.so_luong_dat_chat_luong))}
                  step="0.01"
                  value={line.so_luong_thuc_nhan}
                  onChange={(e) =>
                    changeLine(index, { so_luong_thuc_nhan: e.target.value })
                  }
                />
              </Field>
              </div>
              <Field label={short ? "Lý do nhận thiếu *" : "Ghi chú nhận hàng"}>
                <textarea
                  required={short}
                  maxLength={500}
                  rows={2}
                  value={line.ly_do_khong_nhan ?? ""}
                  onChange={(e) =>
                    changeLine(index, { ly_do_khong_nhan: e.target.value })
                  }
                />
              </Field>
            </div>
          );
        })}
        <Feedback error={mutation.error} success="" />
      </form>
    </FormDrawer>
  );
}
