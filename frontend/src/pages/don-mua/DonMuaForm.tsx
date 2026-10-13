import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  MaterialField,
  SupplierField,
} from "../../components/common/EntityFields";
import {
  FormDrawer,
  Field,
  Feedback,
  useMutation,
  today,
} from "../../components/common/PurchaseUI";
import { saveOrder, type OrderInput } from "../../services/donMuaService";
import type { Order } from "../../services/purchaseTypes";
export default function DonMuaForm({
  order,
  onClose,
  onSaved,
}: {
  order?: Order;
  onClose: () => void;
  onSaved: (result: Order) => void;
}) {
  const { can } = useAuth();
  const mutation = useMutation();
  const [form, setForm] = useState<OrderInput>(() =>
    order
      ? {
          ma_ncc: order.ma_ncc,
          ngay_dat_hang: order.ngay_dat_hang,
          ngay_du_kien_giao: order.ngay_du_kien_giao,
          chi_tiet: order.chi_tiet.map((r) => ({
            ma_nguyen_lieu: r.ma_nguyen_lieu,
            so_luong_mua: r.so_luong_mua,
          })),
        }
      : {
          ma_ncc: "",
          ngay_dat_hang: today(),
          ngay_du_kien_giao: today(),
          chi_tiet: [{ ma_nguyen_lieu: "", so_luong_mua: "" }],
        },
  );
  const save = () =>
    void mutation.run(async () => {
      if (!can(order ? "DON_MUA_UPDATE" : "DON_MUA_CREATE"))
        throw new Error("Bạn chưa có quyền lưu đơn mua.");
      if (form.ngay_du_kien_giao < form.ngay_dat_hang)
        throw new Error("Ngày dự kiến giao không được trước ngày đặt.");
      if (
        new Set(form.chi_tiet.map((r) => r.ma_nguyen_lieu)).size !==
        form.chi_tiet.length
      )
        throw new Error("Không được chọn trùng nguyên liệu.");
      onSaved(await saveOrder(form, order?.ma_don_mua));
    });
  return (
    <FormDrawer
      open
      title={order ? `Cập nhật ${order.ma_don_mua}` : "Tạo đơn mua nguyên liệu"}
      onClose={onClose}
      busy={mutation.busy}
      footer={
        <button
          className="pm-btn primary"
          type="submit"
          form="order-form"
          disabled={
            mutation.busy || !can(order ? "DON_MUA_UPDATE" : "DON_MUA_CREATE")
          }
        >
          {mutation.busy ? "Đang lưu…" : "Lưu đơn mua"}
        </button>
      }
    >
      <form
        id="order-form"
        className="pm-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <SupplierField
          value={form.ma_ncc}
          onChange={(v) => setForm({ ...form, ma_ncc: v })}
        />
        <div className="pm-form-grid">
          <Field label="Ngày đặt hàng">
            <input
              type="date"
              required
              value={form.ngay_dat_hang}
              onChange={(e) =>
                setForm({ ...form, ngay_dat_hang: e.target.value })
              }
            />
          </Field>
          <Field label="Ngày dự kiến giao">
            <input
              type="date"
              required
              min={form.ngay_dat_hang}
              value={form.ngay_du_kien_giao}
              onChange={(e) =>
                setForm({ ...form, ngay_du_kien_giao: e.target.value })
              }
            />
          </Field>
        </div>
        {form.chi_tiet.map((row, index) => (
          <div className="pm-line-item" key={index}>
            <div className="pm-form-grid">
              <MaterialField
                value={row.ma_nguyen_lieu}
                onChange={(v) =>
                  setForm({
                    ...form,
                    chi_tiet: form.chi_tiet.map((r, i) =>
                      i === index ? { ...r, ma_nguyen_lieu: v } : r,
                    ),
                  })
                }
              />
              <Field label="Số lượng mua (kg)">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={row.so_luong_mua}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      chi_tiet: form.chi_tiet.map((r, i) =>
                        i === index
                          ? { ...r, so_luong_mua: e.target.value }
                          : r,
                      ),
                    })
                  }
                />
              </Field>
            </div>
            <button
              type="button"
              className="pm-link"
              disabled={form.chi_tiet.length === 1}
              onClick={() =>
                setForm({
                  ...form,
                  chi_tiet: form.chi_tiet.filter((_, i) => i !== index),
                })
              }
            >
              Bỏ dòng
            </button>
          </div>
        ))}
        <div>
          <button
            type="button"
            className="pm-btn"
            onClick={() =>
              setForm({
                ...form,
                chi_tiet: [
                  ...form.chi_tiet,
                  { ma_nguyen_lieu: "", so_luong_mua: "" },
                ],
              })
            }
          >
            + Thêm nguyên liệu
          </button>
        </div>
        <div className="pm-help">
          Đơn giá và thành tiền được tính theo dữ liệu cung ứng trên máy chủ.
          Đơn mới có trạng thái chờ duyệt.
        </div>
        <Feedback error={mutation.error} success="" />
      </form>
    </FormDrawer>
  );
}
