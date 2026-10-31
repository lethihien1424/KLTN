import { useRef, useState } from "react";
import { DownloadOutlined, UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { FormDrawer, Feedback, useMutation } from "../../components/common/PurchaseUI";
import DataTable from "../../components/common/DataTable";
import { deliveryTemplate, deliveryExcel, exportDeliveryReceipts, formatDeliveryMoney, type ReceiptFilters, type DeliveryImportReport } from "../../services/deliveryService";

export function useDeliveryExcel(onImported: () => void, history?: { filters: ReceiptFilters; loading: boolean }) {
  const { can } = useAuth(); const mutation = useMutation(); const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null); const [report, setReport] = useState<DeliveryImportReport | null>(null);
  const permitted = can("don_mua_nguyen_lieu:NHAP_FILE") && can("NHA_CUNG_CAP_SCORE");
  const close = () => { setReport(null); setFile(null); mutation.setError(""); };
  return { buttons: <>
    <button className="pm-btn" disabled={mutation.busy || !can("don_mua_nguyen_lieu:NHAP_FILE")} onClick={() => void mutation.run(deliveryTemplate, "Đã tải template lịch sử giao hàng.")}><DownloadOutlined aria-hidden="true" /> {history ? "Tải template" : "Template lịch sử"}</button>
    <button className="pm-btn" disabled={mutation.busy || !permitted} onClick={() => input.current?.click()}><UploadOutlined aria-hidden="true" /> {history ? "Nhập Excel" : "Nhập lịch sử giao hàng"}</button>
    {history && <button className="pm-btn" disabled={mutation.busy || history.loading || !can("don_mua_nguyen_lieu:XUAT_EXCEL")} onClick={() => void mutation.run(() => exportDeliveryReceipts(history.filters), "Đã xuất toàn bộ lịch sử theo bộ lọc.")}><FileExcelOutlined aria-hidden="true" /> Xuất Excel</button>}
  </>, feedback: <Feedback error={report ? "" : mutation.error} success={mutation.success} />,
    dialogs: <><input hidden ref={input} type="file" accept=".xlsx" aria-label="Chọn Excel lịch sử giao hàng" onChange={(e) => {
      const selected = e.target.files?.[0]; e.target.value = ""; if (!selected) return;
      void mutation.run(async () => {
        if (!/\.xlsx$/i.test(selected.name) || selected.size > 10 * 1024 * 1024) throw new Error("Chọn file .xlsx không quá 10 MB.");
        setFile(selected); setReport(await deliveryExcel(selected));
      }, "");
    }} />
    <FormDrawer open={Boolean(report)} title="Xem trước lịch sử giao hàng" onClose={close} busy={mutation.busy} footer={<>
      <button className="pm-btn" disabled={mutation.busy} onClick={close}>Hủy</button>
      <button className="pm-btn primary" disabled={mutation.busy || !report?.valid || !file || !permitted} onClick={() => void mutation.run(async () => {
        if (!file) return;
        try { await deliveryExcel(file, true); close(); onImported(); }
        catch (error) { try { setReport(await deliveryExcel(file)); } catch { /* Keep original failure. */ } throw error; }
      }, "Đã nhập lịch sử để đánh giá NCC; không thay đổi tồn kho.")}>Xác nhận nhập lịch sử</button>
    </>}>
      <p className="pm-help">Chỉ dùng để đánh giá nhà cung cấp. Không cộng tồn kho, không tạo nhập kho hoặc thay đổi đơn mua thật. Nếu một dòng lỗi, toàn bộ file không được lưu.</p>
      {report && <><p>{report.total_rows} dòng · {report.items.length} đợt giao</p>
        {report.errors.length > 0 && <div role="alert"><DataTable rows={report.errors.map((r, i) => ({ ...r, id: i }))} rowKey={(r) => String(r.id)} columns={[
          { key: "row", label: "Dòng", render: (r) => r.row }, { key: "error", label: "Lỗi", render: (r) => r.message },
        ]} /></div>}
        <DataTable rows={report.items} rowKey={(r) => `${r.supplier}/${r.code}/${r.delivery}`} columns={[
          { key: "order", label: "Đơn cũ", render: (r) => r.code }, { key: "supplier", label: "NCC", render: (r) => r.supplier },
          { key: "batch", label: "Đợt / ngày", render: (r) => `${r.delivery} · ${r.date}` },
          { key: "lines", label: "Nguyên liệu", render: (r) => r.lines }, { key: "closed", label: "Trạng thái", render: (r) => r.closed ? "Chốt đơn" : "Còn giao tiếp" },
          { key: "price", label: "Đơn giá", render: (r) => r.chi_tiet?.map((line) => <div key={line.ma_nguyen_lieu}>{line.ma_nguyen_lieu}: {formatDeliveryMoney(line.don_gia_mua)}{line.don_gia_mua != null && ` (VND/${line.don_vi_don_gia})`}</div>) ?? "Chưa có giá" },
          { key: "amount", label: "Thành tiền", render: (r) => r.chi_tiet?.map((line) => <div key={line.ma_nguyen_lieu}>{line.ma_nguyen_lieu}: {formatDeliveryMoney(line.thanh_tien)}</div>) ?? "Chưa có giá" },
          { key: "total", label: "Tổng giá trị nhập", render: (r) => formatDeliveryMoney(r.tong_gia_tri_nhap) },
        ]} />
      </>}<Feedback error={mutation.error} success="" />
    </FormDrawer></> };
}
