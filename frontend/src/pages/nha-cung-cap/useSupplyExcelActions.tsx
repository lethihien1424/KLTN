import { useRef, useState } from "react";
import { DownloadOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { FormDrawer, Feedback, useMutation, formatNumber } from "../../components/common/PurchaseUI";
import DataTable from "../../components/common/DataTable";
import { downloadSupplyTemplate, exportSupplyExcel, supplyExcel, type SupplyExcelReport } from "../../services/supplyExcelService";

export function useSupplyExcelActions(search: string, supplier: string, onImported: () => void) {
  const { can } = useAuth(); const mutation = useMutation(); const input = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<SupplyExcelReport | null>(null); const [file, setFile] = useState<File | null>(null);
  const close = () => { setReport(null); setFile(null); mutation.setError(""); };
  return { buttons: <>
    <button className="pm-btn" disabled={mutation.busy || !can("IMPORT_NGUYEN_LIEU_NCC")} onClick={() => void mutation.run(downloadSupplyTemplate, "Đã tải template nguyên liệu cung ứng.")}><DownloadOutlined aria-hidden="true" /> Tải template</button>
    <button className="pm-btn" disabled={mutation.busy || !can("IMPORT_NGUYEN_LIEU_NCC")} onClick={() => input.current?.click()}><UploadOutlined aria-hidden="true" /> Nhập Excel</button>
    <button className="pm-btn" disabled={mutation.busy || !can("NGUYEN_LIEU_NCC_EXPORT")} onClick={() => void mutation.run(() => exportSupplyExcel(search, supplier), "Đã xuất toàn bộ cung ứng theo bộ lọc.")}><FileExcelOutlined aria-hidden="true" /> Xuất Excel</button>
  </>, feedback: <Feedback error={report ? "" : mutation.error} success={mutation.success} />,
    dialogs: <><input ref={input} hidden type="file" accept=".xlsx" aria-label="Chọn Excel nguyên liệu cung ứng" onChange={(event) => {
      const selected = event.target.files?.[0]; event.target.value = ""; if (!selected) return;
      void mutation.run(async () => {
        setFile(null); setReport(null);
        if (!/\.xlsx$/i.test(selected.name) || selected.size > 10 * 1024 * 1024) throw new Error("Chọn file .xlsx không quá 10 MB.");
        const result = await supplyExcel(selected, false, supplier); setFile(selected); setReport(result);
      }, "");
    }} />
    <FormDrawer open={Boolean(report)} title="Xem trước nhập nguyên liệu cung ứng" busy={mutation.busy} onClose={close} footer={<>
      <button className="pm-btn" disabled={mutation.busy} onClick={close}>Hủy</button>
      <button className="pm-btn primary" disabled={mutation.busy || !report?.valid || !file || !can("IMPORT_NGUYEN_LIEU_NCC")} onClick={() => void mutation.run(async () => {
        if (!file) return;
        try { await supplyExcel(file, true, supplier); close(); onImported(); }
        catch (error) { try { setReport(await supplyExcel(file, false, supplier)); } catch { /* Keep original failure. */ } throw error; }
      }, "Đã nhập nguyên liệu cung ứng; tồn kho Milano không thay đổi.")}>Xác nhận nhập cung ứng</button>
    </>}>
      <p className="pm-help">Chỉ thêm cặp NCC/nguyên liệu mới, không ghi đè. Tồn/book/xuất trong file là dữ liệu NCC. Không thay đổi tồn kho Milano hoặc tạo nhập kho. Có lỗi thì toàn bộ file không được lưu.</p>
      {report && <><p>{file?.name} · {report.total_rows} dòng</p>
        {report.errors.length > 0 && <div role="alert"><DataTable rows={report.errors.map((row, index) => ({ ...row, index }))} rowKey={(r) => String(r.index)} columns={[
          { key: "row", label: "Dòng", render: (r) => r.row }, { key: "error", label: "Lỗi", render: (r) => r.message },
        ]} /></div>}
        <DataTable rows={report.items} rowKey={(r) => String(r.row)} columns={[
          { key: "supplier", label: "Nhà cung cấp", render: (r) => `${r.ma_ncc} · ${r.ten_ncc}` },
          { key: "material", label: "Nguyên liệu", render: (r) => `${r.ma_nguyen_lieu} · ${r.ten_nguyen_lieu}` },
          { key: "unit", label: "Đơn vị", render: (r) => r.don_vi }, { key: "price", label: "Đơn giá", render: (r) => formatNumber(r.gia) },
          { key: "stock", label: "Tồn NCC", render: (r) => formatNumber(r.ton_ncc) },
        ]} />
      </>}<Feedback error={mutation.error} success="" />
    </FormDrawer></> };
}
