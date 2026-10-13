import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  PageHeader,
  Field,
  Feedback,
  SummaryCard,
  useMutation,
} from "../../components/common/PurchaseUI";
import { api } from "../../services/apiClient";
type ImportResult = {
  success: boolean;
  message: string;
  total_rows: number;
  imported_rows: number;
};
export default function NhapDuLieuBanHangPage() {
  const { can } = useAuth();
  const mutation = useMutation();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  return (
    <>
      <PageHeader
        title="Nhập dữ liệu bán hàng"
        description="Tải dữ liệu đơn hàng để phục vụ dự báo nhu cầu sản phẩm."
      />
      <section className="pm-panel">
        <form
          className="pm-form"
          onSubmit={(e) => {
            e.preventDefault();
            void mutation.run(async () => {
              if (!file || !can("IMPORT_DON_HANG"))
                throw new Error(
                  "Vui lòng chọn file và kiểm tra quyền nhập dữ liệu.",
                );
              const body = new FormData();
              body.append("file", file);
              const value = await api<ImportResult>("/imports/don-hang", {
                method: "POST",
                body,
              });
              if (!value.success) throw new Error(value.message);
              setResult(value);
            }, "Đã nhập dữ liệu bán hàng.");
          }}
        >
          <Field label="File dữ liệu (CSV / Excel)">
            <input
              type="file"
              accept=".csv,.xlsx"
              required
              disabled={mutation.busy}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
                mutation.setError("");
              }}
            />
          </Field>
          <div className="pm-help">
            Các cột bắt buộc: ma_don_hang, ma_san_pham, ngay_don_hang, so_luong,
            trang_thai_don_hang. Ngày theo định dạng YYYY-MM-DD; sản phẩm phải
            tồn tại trong danh mục.
          </div>
          <div>
            <button
              type="submit"
              className="pm-btn primary"
              disabled={!file || mutation.busy || !can("IMPORT_DON_HANG")}
            >
              {mutation.busy ? "Đang nhập dữ liệu…" : "Nhập dữ liệu"}
            </button>
          </div>
          <Feedback error={mutation.error} success={mutation.success} />
        </form>
      </section>
      {result && (
        <div className="pm-cards">
          <SummaryCard label="Số dòng trong file" value={result.total_rows} />
          <SummaryCard label="Số dòng đã nhập" value={result.imported_rows} />
        </div>
      )}
    </>
  );
}
