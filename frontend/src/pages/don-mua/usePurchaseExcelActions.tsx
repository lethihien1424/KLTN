import { useRef, useState } from "react";
import { DownloadOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { Feedback, FormDrawer, formatMoney, useMutation } from "../../components/common/PurchaseUI";
import DataTable from "../../components/common/DataTable";
import { downloadPurchaseTemplate, exportPurchaseExcel, importPurchaseExcel, previewPurchaseExcel,
  type PurchaseExcelFilters, type PurchaseExcelReport } from "../../services/purchaseExcelService";

export function usePurchaseExcelActions({ filters, loading, onImported }: {
  filters: PurchaseExcelFilters; loading: boolean; onImported: () => void;
}) {
  const { can } = useAuth();
  const canImport = can("don_mua_nguyen_lieu:XEM") && can("don_mua_nguyen_lieu:THEM") && can("don_mua_nguyen_lieu:NHAP_FILE");
  const canExport = can("don_mua_nguyen_lieu:XEM") && can("don_mua_nguyen_lieu:XUAT_EXCEL");
  const mutation = useMutation();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PurchaseExcelReport | null>(null);
  const [stage, setStage] = useState("");
  const run = (stage: string, action: () => Promise<void>, success = "") => void mutation.run(async () => {
    setStage(stage);
    try { await action(); } finally { setStage(""); }
  }, success);
  const close = () => { setReport(null); setFile(null); mutation.setError(""); };
  return {
    buttons: <>
      <button className="pm-btn" disabled={mutation.busy || !canImport} onClick={() => run("template", downloadPurchaseTemplate, "Đã tải template đơn mua.")}>
        <DownloadOutlined aria-hidden="true" /> {stage === "template" ? "Đang tải…" : "Tải template"}
      </button>
      <button className="pm-btn" disabled={mutation.busy || !canImport} onClick={() => input.current?.click()}>
        <UploadOutlined aria-hidden="true" /> {stage === "preview" ? "Đang kiểm tra…" : "Nhập Excel"}
      </button>
      <button className="pm-btn" disabled={mutation.busy || loading || !canExport} onClick={() => run("export", () => exportPurchaseExcel(filters), "Đã xuất đơn mua theo bộ lọc.")}>
        <FileExcelOutlined aria-hidden="true" /> {stage === "export" ? "Đang xuất…" : "Xuất Excel"}
      </button>
    </>,
    feedback: <Feedback error={report ? "" : mutation.error} success={mutation.success} />,
    dialogs: <>
      <input ref={input} type="file" accept=".xlsx" hidden aria-label="Chọn file Excel đơn mua" onChange={event => {
        const selected = event.target.files?.[0]; event.target.value = "";
        if (!selected || !canImport) return;
        run("preview", async () => {
          setFile(null); setReport(null);
          if (!/\.xlsx$/i.test(selected.name)) throw new Error("Vui lòng chọn file .xlsx.");
          if (selected.size > 10 * 1024 * 1024) throw new Error("File vượt quá 10 MB.");
          const result = await previewPurchaseExcel(selected);
          setFile(selected); setReport(result);
        });
      }} />
      <FormDrawer open={Boolean(report)} title="Kiểm tra Import đơn mua nguyên liệu" busy={mutation.busy} onClose={close} footer={<>
        <button className="pm-btn" disabled={mutation.busy} onClick={close}>Hủy</button>
        <button className="pm-btn primary" disabled={mutation.busy || !report?.valid || !file || !canImport} onClick={() => run("import", async () => {
          if (!file || !report?.valid || !canImport) return;
          const result = await importPurchaseExcel(file); setReport(result);
          if (!result.valid || !result.imported) throw new Error("Dữ liệu đã thay đổi hoặc không hợp lệ. Chưa lưu đơn nào; xem lỗi bên dưới.");
          setReport(null); setFile(null); onImported();
        }, "Đã nhập đơn mua ở trạng thái Chờ duyệt.")}>{stage === "import" ? "Đang nhập…" : "Xác nhận Import"}</button>
      </>}>
        {report && <>
          <p><strong>{file?.name}</strong> · {report.total_orders} đơn mua · {report.total_rows} dòng nguyên liệu</p>
          <p className="pm-help">Đơn mua trực tiếp, không liên kết đề xuất; trạng thái Chờ duyệt. Chưa lưu dữ liệu. Khi xác nhận, hệ thống kiểm tra lại toàn file; có lỗi thì không lưu đơn nào. Không tự duyệt, nhận hàng hoặc cộng tồn kho.</p>
          {report.errors.length ? <>
            <p role="alert">Có {report.errors.length} lỗi cần sửa trước khi Import.</p>
            <DataTable rows={report.errors.map((error, index) => ({ ...error, index }))} rowKey={row => String(row.index)} columns={[
              { key: "row", label: "Dòng Excel", render: row => row.row },
              { key: "column", label: "Cột", render: row => row.column },
              { key: "code", label: "Mã tham chiếu", render: row => row.code || "—" },
              { key: "message", label: "Nguyên nhân", render: row => row.message },
            ]} />
          </> : <p role="status">Dữ liệu hợp lệ. Có thể xác nhận Import {report.total_orders} đơn mua.</p>}
          <DataTable rows={report.items} rowKey={row => String(row.row)} columns={[
            { key: "row", label: "Dòng", render: row => row.row },
            { key: "code", label: "Mã tham chiếu", render: row => row.code },
            { key: "supplier", label: "NCC", render: row => row.supplier },
            { key: "material", label: "Nguyên liệu", render: row => row.material },
            { key: "quantity", label: "Số lượng", render: row => `${row.quantity} ${row.unit}` },
            { key: "price", label: "Đơn giá", render: row => formatMoney(row.price) },
            { key: "total", label: "Thành tiền", render: row => formatMoney(row.total) },
            { key: "delivery", label: "Dự kiến giao", render: row => row.delivery },
            { key: "note", label: "Ghi chú", render: row => row.note || "—" },
          ]} />
          <Feedback error={mutation.error} success="" />
        </>}
      </FormDrawer>
    </>,
  };
}
