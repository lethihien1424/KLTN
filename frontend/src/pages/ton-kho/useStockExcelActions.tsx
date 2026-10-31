import { useRef, useState } from "react";
import { DownloadOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { Feedback, FormDrawer, useMutation, formatNumber } from "../../components/common/PurchaseUI";
import DataTable from "../../components/common/DataTable";
import { stockExcel, downloadStockTemplate, exportStockExcel, type StockExcelReport } from "../../services/tonKhoService";

export function useStockExcelActions(filters: { search: string; muc_ton: string; ngay_ghi_nhan: string }, onImported: () => void) {
  const { can } = useAuth();
  const mutation = useMutation();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<StockExcelReport | null>(null);
  const permitted = can("IMPORT_TON_KHO") && can("TON_KHO_UPDATE");
  const close = () => { setReport(null); setFile(null); mutation.setError(""); };
  return {
    buttons: <>
      <button className="pm-btn" disabled={mutation.busy || !can("IMPORT_TON_KHO")} onClick={() => void mutation.run(downloadStockTemplate, "Đã tải template tồn kho.")}><DownloadOutlined aria-hidden="true" /> Tải template</button>
      <button className="pm-btn" disabled={mutation.busy || !permitted} onClick={() => input.current?.click()}><UploadOutlined aria-hidden="true" /> Nhập Excel</button>
      <button className="pm-btn" disabled={mutation.busy || !can("TON_KHO_EXPORT")} onClick={() => void mutation.run(() => exportStockExcel(filters), "Đã xuất toàn bộ tồn kho theo bộ lọc.")}><FileExcelOutlined aria-hidden="true" /> Xuất Excel</button>
    </>,
    feedback: <Feedback error={report ? "" : mutation.error} success={mutation.success} />,
    dialogs: <>
      <input ref={input} type="file" accept=".xlsx" hidden aria-label="Chọn file Excel tồn kho" onChange={(event) => {
        const selected = event.target.files?.[0]; event.target.value = "";
        if (!selected) return;
        void mutation.run(async () => {
          setFile(null); setReport(null);
          if (!/\.xlsx$/i.test(selected.name) || selected.size > 10 * 1024 * 1024) throw new Error("Chọn file .xlsx không quá 10 MB.");
          const result = await stockExcel(selected); setFile(selected); setReport(result);
        }, "");
      }} />
      <FormDrawer open={Boolean(report)} title="Xem trước nhập tồn kho" onClose={close} busy={mutation.busy} footer={<>
        <button className="pm-btn" disabled={mutation.busy} onClick={close}>Hủy</button>
        <button className="pm-btn primary" disabled={mutation.busy || !file || !report?.valid || !permitted} onClick={() => void mutation.run(async () => {
          if (!file) return;
          try {
            await stockExcel(file, true); close(); onImported();
          } catch (error) {
            // Revalidate to show row errors if data changed since preview.
            try { setReport(await stockExcel(file)); } catch { /* Original error remains visible. */ }
            throw error;
          }
        }, "Đã ghi nhận tồn kho từ Excel.")}>Xác nhận nhập</button>
      </>}>
        {report && <>
          <p>{file?.name} · {report.total_rows} dòng. Chưa lưu dữ liệu.</p>
          <p className="pm-help">Chỉ ghi nhận tồn đầu kỳ hoặc kiểm kê. Nếu có lỗi, toàn bộ file không được lưu. Số đã giữ được giữ nguyên.</p>
          {report.errors.length > 0 ? <div role="alert"><p>Có {report.errors.length} lỗi cần sửa.</p><DataTable rows={report.errors.map((r, i) => ({ ...r, id: i }))} rowKey={(r) => String(r.id)} columns={[
            { key: "row", label: "Dòng", render: (r) => r.row }, { key: "code", label: "Mã nguyên liệu", render: (r) => r.code }, { key: "error", label: "Lỗi", render: (r) => r.message },
          ]} /></div> : <p role="status">Dữ liệu hợp lệ, có thể xác nhận nhập.</p>}
          <DataTable rows={report.items} rowKey={(r) => String(r.row)} columns={[
            { key: "row", label: "Dòng", render: (r) => r.row },
            { key: "material", label: "Nguyên liệu", render: (r) => `${r.code} · ${r.name}` },
            { key: "unit", label: "Đơn vị", render: (r) => r.unit },
            { key: "before", label: "Tồn trước", render: (r) => formatNumber(r.before) },
            { key: "after", label: "Tồn sau", render: (r) => formatNumber(r.after) },
            { key: "date", label: "Ngày kiểm kê", render: (r) => r.date },
          ]} /><Feedback error={mutation.error} success="" />
        </>}
      </FormDrawer>
    </>,
  };
}
