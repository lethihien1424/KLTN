//D:\KLTN\KLTN\frontend\src\pages\de-xuat\TaoDeXuatPage.tsx
import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { navigate } from "../../routes/navigation";
import {
  MaterialField,
  SupplierField,
} from "../../components/common/EntityFields";
import {
  PageHeader,
  Field,
  Feedback,
  useMutation,
} from "../../components/common/PurchaseUI";
import {
  createProposal,
  type ProposalInput,
} from "../../services/deXuatService";
import type { Proposal } from "../../services/purchaseTypes";
export default function TaoDeXuatPage({
  material = "",
  ncc = "",
  qty = "",
}: {
  material?: string;
  ncc?: string;
  qty?: string;
}) {
  const { can } = useAuth();
  const mutation = useMutation();
  const [created, setCreated] = useState<Proposal | null>(null);
  const [form, setForm] = useState<ProposalInput>({
    ghi_chu: "",
    chi_tiet: [
      { ma_nguyen_lieu: material, ma_ncc: ncc, so_luong_de_xuat_kg: qty },
    ],
  });
  const save = () =>
    void mutation.run(async () => {
      if (!can("DE_XUAT_NHAP_HANG_CREATE"))
        throw new Error("Bạn chưa có quyền tạo đề xuất.");
      if (
        new Set(
          form.chi_tiet.map(
            (r) => `${r.ma_nguyen_lieu.trim()}|${r.ma_ncc.trim()}`,
          ),
        ).size !== form.chi_tiet.length
      )
        throw new Error(
          "Không được trùng cặp nguyên liệu và nhà cung cấp trong đề xuất.",
        );
      const result = await createProposal(form);
      setCreated(result);
      if (can("DE_XUAT_NHAP_HANG_VIEW"))
        navigate(`/de-xuat/${result.ma_de_xuat}`);
    }, "Đã tạo đề xuất chờ duyệt.");
  return (
    <>
      <PageHeader
        title="Tạo đề xuất nhập hàng"
        description="Chọn nguyên liệu, nhà cung cấp và lượng cần mua. Đơn giá được lấy từ dữ liệu cung ứng."
        actions={
          can("DE_XUAT_NHAP_HANG_VIEW") && (
            <a className="pm-btn" href="#/de-xuat">
              ← Danh sách đề xuất
            </a>
          )
        }
      />
      <Feedback error={mutation.error} success={mutation.success} />
      {created ? (
        <section className="pm-panel">
          <h2>Đề xuất {created.ma_de_xuat} đã được tạo</h2>
          <p>Đề xuất đang chờ quản lý duyệt.</p>
        </section>
      ) : (
        <form
          className="pm-panel pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
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
                <SupplierField
                  value={row.ma_ncc}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      chi_tiet: form.chi_tiet.map((r, i) =>
                        i === index ? { ...r, ma_ncc: v } : r,
                      ),
                    })
                  }
                />
              </div>
              <Field label="Số lượng đề xuất (kg)">
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={row.so_luong_de_xuat_kg}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      chi_tiet: form.chi_tiet.map((r, i) =>
                        i === index
                          ? { ...r, so_luong_de_xuat_kg: e.target.value }
                          : r,
                      ),
                    })
                  }
                />
              </Field>
              <button
                type="button"
                className="pm-link"
                disabled={form.chi_tiet.length === 1 || mutation.busy}
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
              disabled={mutation.busy}
              onClick={() =>
                setForm({
                  ...form,
                  chi_tiet: [
                    ...form.chi_tiet,
                    { ma_nguyen_lieu: "", ma_ncc: "", so_luong_de_xuat_kg: "" },
                  ],
                })
              }
            >
              + Thêm nguyên liệu
            </button>
          </div>
          <Field label="Ghi chú">
            <textarea
              maxLength={1000}
              rows={3}
              value={form.ghi_chu}
              onChange={(e) => setForm({ ...form, ghi_chu: e.target.value })}
            />
          </Field>
          <div className="pm-actions">
            <button
              type="submit"
              className="pm-btn primary"
              disabled={mutation.busy || !can("DE_XUAT_NHAP_HANG_CREATE")}
            >
              {mutation.busy ? "Đang tạo…" : "Gửi đề xuất chờ duyệt"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
