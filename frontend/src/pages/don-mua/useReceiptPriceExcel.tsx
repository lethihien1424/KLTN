import { useRef, useState } from 'react';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../auth/AuthContext';
import { Feedback, Field, FormDrawer, useMutation, formatNumber } from '../../components/common/PurchaseUI';
import DataTable from '../../components/common/DataTable';
import { formatDeliveryMoney, receiptNumber, receiptPriceExcel, receiptPriceTemplate, type ReceiptFilters, type ReceiptPriceUpdateReport } from '../../services/deliveryService';

export function useReceiptPriceExcel(onUpdated: () => void, filters: ReceiptFilters, loading: boolean) {
  const { can } = useAuth(); const mutation = useMutation(); const input = useRef<HTMLInputElement>(null);
  const permitted = ['XEM', 'NHAP_FILE', 'SUA'].every((op) => can(`don_mua_nguyen_lieu:${op}`));
  const [open, setOpen] = useState(false); const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<ReceiptPriceUpdateReport | null>(null); const [reason, setReason] = useState('');
  const close = () => { setOpen(false); setFile(null); setReport(null); setReason(''); mutation.setError(''); };
  return {
    button: <button className="pm-btn" disabled={!permitted || loading || mutation.busy} onClick={() => { setOpen(true); mutation.setError(''); }}><UploadOutlined aria-hidden="true" /> Cập nhật giá từ Excel</button>,
    feedback: <Feedback error={open ? '' : mutation.error} success={mutation.success} />,
    dialog: <FormDrawer open={open} title="Cập nhật giá từ Excel" onClose={close} busy={mutation.busy} footer={<>
      <button className="pm-btn" disabled={mutation.busy} onClick={close}>Đóng</button>
      <button className="pm-btn primary" disabled={!permitted || mutation.busy || !file || !report?.valid || !report.preview_token || !reason.trim() || !report.items.some((r) => r.changed)}
        onClick={() => void mutation.run(async () => {
          if (!file || !report?.preview_token) return;
          try {
            await receiptPriceExcel(file, { token: report.preview_token, reason: reason.trim() });
            onUpdated(); close();
          } catch (error) {
            try { setReport(await receiptPriceExcel(file)); } catch { setReport(null); }
            throw error;
          }
        }, 'Đã cập nhật giá phiếu nhập và ghi nhật ký; không thay đổi tồn kho.')}>Xác nhận cập nhật giá</button>
    </>}>
      <p className="pm-help">Dùng sheet CapNhatGia để cập nhật phiếu đã tồn tại. Chỉ sửa giá và đơn vị giá; thành tiền được tính lại theo số chấp nhận đang lưu. Không thêm phiếu, không đổi số lượng, kiểm định, ngày nhận, trạng thái hoặc tồn kho.</p>
      <div className="pm-toolbar">
        <button className="pm-btn" disabled={!permitted || mutation.busy} onClick={() => void mutation.run(() => receiptPriceTemplate(filters), 'Đã tải template cập nhật giá theo bộ lọc.')}><DownloadOutlined aria-hidden="true" /> Tải template cập nhật giá</button>
        <button className="pm-btn" disabled={!permitted || mutation.busy} onClick={() => input.current?.click()}><UploadOutlined aria-hidden="true" /> Chọn file cập nhật giá</button>
      </div>
      <input hidden ref={input} type="file" accept=".xlsx" aria-label="Chọn Excel cập nhật giá phiếu nhập" onChange={(event) => {
        const selected = event.target.files?.[0]; event.target.value = ''; if (!selected) return;
        setFile(null); setReport(null);
        void mutation.run(async () => {
          if (!/\.xlsx$/i.test(selected.name) || selected.size > 10 * 1024 * 1024) throw new Error('Chọn file .xlsx không quá 10 MB.');
          const result = await receiptPriceExcel(selected); setFile(selected); setReport(result);
        }, '');
      }} />
      <Field label="Lý do cập nhật giá"><textarea value={reason} maxLength={2000} disabled={mutation.busy} onChange={(e) => setReason(e.target.value)} /></Field>
      <p className="pm-help">Chỉ xác nhận giá mua có chứng từ. Giá minh họa trong file không phải bằng chứng giá thực tế.</p>
      {report && <>
        <p>{report.total_rows} dòng · {report.items.filter((r) => r.changed).length} dòng thay đổi</p>
        {report.items.some((r) => r.source_note?.toLocaleLowerCase('vi').includes('minh họa')) && <p role="alert">File có ghi chú giá minh họa. Hãy thay bằng giá mua thực tế trước khi xác nhận.</p>}
        {report.errors.length > 0 && <div role="alert"><DataTable rows={report.errors.map((r, i) => ({ ...r, id: i }))} rowKey={(r) => String(r.id)} columns={[
          { key: 'row', label: 'Dòng', render: (r) => r.row }, { key: 'error', label: 'Lỗi', render: (r) => r.message },
        ]} /></div>}
        <DataTable rows={report.items} rowKey={(r) => `${r.ma_phieu_nhan}/${r.ma_nguyen_lieu}`} columns={[
          { key: 'receipt', label: 'Mã phiếu nhận', render: (r) => receiptNumber(r) },
          { key: 'material', label: 'Nguyên liệu', render: (r) => r.ma_nguyen_lieu },
          { key: 'quantity', label: 'Số lượng nhập kho', render: (r) => `${formatNumber(r.so_luong_nhap_kho)} ${r.don_vi_moi}` },
          { key: 'old', label: 'Giá cũ', render: (r) => formatDeliveryMoney(r.don_gia_cu) },
          { key: 'new', label: 'Giá mới', render: (r) => <>{formatDeliveryMoney(r.don_gia_moi)}<div className="pm-small">VND/{r.don_vi_moi}</div></> },
          { key: 'before', label: 'Thành tiền cũ', render: (r) => formatDeliveryMoney(r.thanh_tien_cu) },
          { key: 'after', label: 'Thành tiền mới', render: (r) => formatDeliveryMoney(r.thanh_tien_moi) },
        ]} />
      </>}
      <Feedback error={mutation.error} success="" />
    </FormDrawer>,
  };
}
