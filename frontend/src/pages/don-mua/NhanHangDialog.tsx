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
    chi_tiet: order.chi_tiet.map((r) => ({
      ma_chi_tiet_don_mua: r.ma_chi_tiet_don_mua,
      so_luong_thuc_nhan: r.so_luong_mua,
      ly_do_khong_nhan: null,
    })),
  });
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
        const ordered = number(
          order.chi_tiet.find(
            (r) => r.ma_chi_tiet_don_mua === line.ma_chi_tiet_don_mua,
          )?.so_luong_mua,
        );
        const received = number(line.so_luong_thuc_nhan);
        if (
          line.so_luong_thuc_nhan === "" ||
          !Number.isFinite(received) ||
          received < 0 ||
          received > ordered
        )
          throw new Error("Số lượng nhận phải từ 0 đến số lượng đặt.");
        if (received < ordered && !line.ly_do_khong_nhan?.trim())
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
          Xác nhận nhận hàng sẽ cập nhật tồn kho. Đơn đã nhận không thể nhận lần
          thứ hai.
        </div>
        <Field label="Ngày giao thực tế *">
          <input
            required
            type="date"
            min={order.ngay_dat_hang}
            max={today()}
            value={form.ngay_giao_thuc_te}
            onChange={(e) =>
              setForm({ ...form, ngay_giao_thuc_te: e.target.value })
            }
          />
        </Field>
        {form.chi_tiet.map((line, index) => {
          const source = order.chi_tiet[index];
          const short =
            number(line.so_luong_thuc_nhan) < number(source.so_luong_mua);
          return (
            <div className="pm-line-item" key={line.ma_chi_tiet_don_mua}>
              <strong>{source.ten_nguyen_lieu}</strong>
              <div className="pm-small">
                Đã đặt: {formatNumber(source.so_luong_mua)}{" "}
                {source.don_vi_do_luong}
              </div>
              <Field label="Số lượng thực nhận">
                <input
                  required
                  type="number"
                  min="0"
                  max={source.so_luong_mua}
                  step="0.01"
                  value={line.so_luong_thuc_nhan}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      chi_tiet: form.chi_tiet.map((r, i) =>
                        i === index
                          ? { ...r, so_luong_thuc_nhan: e.target.value }
                          : r,
                      ),
                    })
                  }
                />
              </Field>
              <Field label={short ? "Lý do nhận thiếu *" : "Ghi chú nhận hàng"}>
                <textarea
                  required={short}
                  maxLength={500}
                  rows={2}
                  value={line.ly_do_khong_nhan ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      chi_tiet: form.chi_tiet.map((r, i) =>
                        i === index
                          ? { ...r, ly_do_khong_nhan: e.target.value }
                          : r,
                      ),
                    })
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
