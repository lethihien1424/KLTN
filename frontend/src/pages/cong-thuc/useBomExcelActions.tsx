import { useRef, useState } from "react";
import { DownloadOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { Feedback, FormDrawer, useMutation } from "../../components/common/PurchaseUI";
import DataTable from "../../components/common/DataTable";
import { downloadBomTemplate, exportBomExcel, importBomExcel, previewBomExcel, type BomExcelFilters, type BomExcelReport } from "../../services/bomExcelService";

export function useBomExcelActions({ filters, loading, onImported }: {
  filters: BomExcelFilters; loading: boolean; onImported: () => void;
}) {
  const { can } = useAuth();
  const mutation = useMutation();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<BomExcelReport | null>(null);
  const [stage, setStage] = useState("");
  const run = (stage: string, action: () => Promise<void>, success = "") => void mutation.run(async () => {
    setStage(stage);
    try { await action(); } finally { setStage(""); }
  }, success);
  const close = () => { setReport(null); setFile(null); mutation.setError(""); };
  return {
    buttons: <>
      <button className="pm-btn" disabled={mutation.busy || !can("IMPORT_CONG_THUC")} onClick={() => run("template", downloadBomTemplate, "Đã tải template BOM.")}>
        <DownloadOutlined aria-hidden="true" /> {stage === "template" ? "Đang tải…" : "Tải template"}
      </button>
      <button className="pm-btn" disabled={mutation.busy || !can("IMPORT_CONG_THUC")} onClick={() => input.current?.click()}>
        <UploadOutlined aria-hidden="true" /> {stage === "preview" ? "Đang kiểm tra…" : "Nhập Excel"}
      </button>
      <button className="pm-btn" disabled={mutation.busy || loading || !can("CONG_THUC_EXPORT")} onClick={() => run("export", () => exportBomExcel(filters), "Đã xuất danh sách công thức BOM theo bộ lọc.")}>
        <FileExcelOutlined aria-hidden="true" /> {stage === "export" ? "Đang xuất…" : "Xuất Excel"}
      </button>
    </>,
    feedback: <Feedback error={report ? "" : mutation.error} success={mutation.success} />,
    dialogs: <>
      <input ref={input} type="file" accept=".xlsx" hidden aria-label="Chọn file Excel công thức BOM" onChange={(event) => {
        const selected = event.target.files?.[0];
        event.target.value = "";
        if (!selected) return;
        run("preview", async () => {
          setFile(null); setReport(null);
          if (!/\.xlsx$/i.test(selected.name)) throw new Error("Vui lòng chọn file .xlsx.");
          if (selected.size > 10 * 1024 * 1024) throw new Error("File vượt quá 10 MB.");
          const result = await previewBomExcel(selected);
          setFile(selected); setReport(result);
        });
      }} />
      <FormDrawer open={Boolean(report)} title="Kiểm tra Import công thức BOM" busy={mutation.busy} onClose={close} footer={<>
        <button className="pm-btn" disabled={mutation.busy} onClick={close}>Hủy</button>
        <button className="pm-btn primary" disabled={mutation.busy || !report?.valid || !file || !can("IMPORT_CONG_THUC")} onClick={() => run("import", async () => {
          if (!file || !report?.valid) return;
          const result = await importBomExcel(file);
          setReport(result);
          if (!result.valid || !result.imported) throw new Error("Dữ liệu đã thay đổi hoặc không hợp lệ. Xem lỗi bên dưới; chưa lưu công thức nào.");
          setReport(null); setFile(null); onImported();
        }, "Đã nhập thành công danh sách công thức BOM.")}>{stage === "import" ? "Đang nhập…" : "Xác nhận Import"}</button>
      </>}>
        {report && <>
          <p><strong>{file?.name}</strong> · {report.total_boms} công thức · {report.total_rows} dòng nguyên liệu</p>
          <p className="pm-help">Chưa lưu dữ liệu. Hệ thống kiểm tra lại khi xác nhận; nếu có lỗi thì toàn bộ file sẽ không được nhập. Không ghi đè công thức cũ hoặc cập nhật khối lượng sản phẩm.</p>
          {report.errors.length ? <>
            <p role="alert">Có {report.errors.length} lỗi cần sửa trước khi Import.</p>
            <DataTable rows={report.errors.map((error, index) => ({ ...error, index }))} rowKey={(row) => String(row.index)} columns={[
              { key: "row", label: "Dòng Excel", render: (row) => row.row },
              { key: "code", label: "Mã công thức", render: (row) => row.code || "—" },
              { key: "message", label: "Nguyên nhân", render: (row) => row.message },
            ]} />
          </> : <p role="status">Dữ liệu hợp lệ. Có thể xác nhận Import {report.total_boms} công thức.</p>}
          <DataTable rows={report.items} rowKey={(row) => row.code} columns={[
            { key: "code", label: "Mã công thức", render: (row) => row.code },
            { key: "name", label: "Tên công thức", render: (row) => row.name },
            { key: "product", label: "Mã sản phẩm", render: (row) => row.product },
            { key: "lines", label: "Số nguyên liệu", render: (row) => row.lines },
          ]} />
          <Feedback error={mutation.error} success="" />
        </>}
      </FormDrawer>
    </>,
  };
}
