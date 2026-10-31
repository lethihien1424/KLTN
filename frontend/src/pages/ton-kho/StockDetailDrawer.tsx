import { useState } from "react";
import DataTable from "../../components/common/DataTable";
import { FormDrawer, LoadingState, ErrorState, useResource, formatNumber, formatDate } from "../../components/common/PurchaseUI";
import { getStockDetail, stockLevelLabel } from "../../services/tonKhoService";

const movementNames: Record<string, string> = { NHAP: "Nhập", XUAT: "Xuất", KIEM_KE: "Kiểm kê/Điều chỉnh", TON_DAU_KY: "Tồn đầu kỳ", GIU: "Giữ nguyên liệu", HUY_GIU: "Hủy giữ" };
export default function StockDetailDrawer({ code, onClose }: { code: string; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  const resource = useResource(() => getStockDetail(code), [code]);
  const detail = resource.data;
  const stock = detail?.ton_kho;
  return <FormDrawer open title={`Chi tiết tồn kho · ${stock?.ten_nguyen_lieu ?? code}`} onClose={onClose}>
    <div className="pm-actions" role="tablist" aria-label="Chi tiết tồn kho">
      {["Thông tin tồn kho", "Lịch sử nhập–xuất", "Đơn mua liên quan"].map((label, index) =>
        <button key={label} id={`stock-tab-${index}`} role="tab" aria-selected={tab === index} aria-controls="stock-tab-panel" className={`pm-btn ${tab === index ? "primary" : ""}`} onClick={() => setTab(index)}>{label}</button>)}
    </div>
    {resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : detail && stock && <div id="stock-tab-panel" role="tabpanel" aria-labelledby={`stock-tab-${tab}`}>
      {tab === 0 && <>
        <dl className="stock-details">
          <dt>Nguyên liệu</dt><dd>{stock.ten_nguyen_lieu} · {stock.ma_nguyen_lieu}</dd>
          <dt>Đơn vị tính</dt><dd>{stock.don_vi_do_luong}</dd>
          {([ ["Tồn thực tế", stock.ton_kho_thuc_te], ["Đã giữ", stock.so_luong_book], ["Tồn khả dụng", stock.ton_kho_kha_dung], ["Tồn an toàn", stock.ton_kho_an_toan], ["Tồn tối đa", stock.ton_kho_toi_da], ["Hàng đang về", detail.hang_dang_ve] ] as const).map(([label, value]) => <div key={label} style={{ display: "contents" }}><dt>{label}</dt><dd>{formatNumber(value)} {stock.don_vi_do_luong}</dd></div>)}
          <dt>Ngày ghi nhận gần nhất</dt><dd>{formatDate(stock.ngay_ghi_nhan)}</dd>
          {detail.ngay_cap_nhat_gan_nhat && <><dt>Cập nhật gần nhất</dt><dd>{new Date(detail.ngay_cap_nhat_gan_nhat).toLocaleString("vi-VN")}</dd></>}
          <dt>Tình trạng</dt><dd>{stockLevelLabel(stock)}</dd>
        </dl>
        {Number(detail.da_giu_chua_co_nguon) !== 0 && <p className="stock-warning" role="alert">Đã giữ chưa đối soát nguồn: {formatNumber(detail.da_giu_chua_co_nguon)} {stock.don_vi_do_luong}. Số liệu cũ được giữ nguyên để kiểm tra.</p>}
        <h3>Nguyên liệu giữ theo kế hoạch</h3>
        <DataTable rows={detail.giu_theo_ke_hoach} rowKey={(r) => r.ma_ke_hoach} columns={[
          { key: "plan", label: "Kế hoạch/BOM", render: (r) => `${r.ma_ke_hoach} / ${r.ma_cong_thuc}` },
          { key: "held", label: "Đã giữ ban đầu", render: (r) => formatNumber(r.so_luong_giu) },
          { key: "issued", label: "Đã xuất", render: (r) => formatNumber(r.so_luong_xuat) },
          { key: "remaining", label: "Còn giữ", render: (r) => r.da_huy === "Y" ? "Đã hủy giữ" : formatNumber(Number(r.so_luong_giu) - Number(r.so_luong_xuat)) },
        ]} />
      </>}
      {tab === 1 && <>
        <p className="pm-help">Chỉ hiển thị giao dịch được ghi nhận từ khi bật sổ kho. Các snapshot cũ không được chuyển thành lịch sử nhập hàng.</p>
        <DataTable rows={detail.giao_dich} rowKey={(r) => r.id} columns={[
          { key: "time", label: "Thời gian / ngày thực tế", render: (r) => <>{new Date(r.thoi_gian).toLocaleString("vi-VN")}<div className="pm-small">{formatDate(r.ngay_kiem_ke)}</div></> },
          { key: "kind", label: "Loại", render: (r) => movementNames[r.loai] ?? r.loai },
          { key: "quantity", label: "Tăng/giảm", render: (r) => formatNumber(r.so_luong) },
          { key: "before", label: "Tồn trước", render: (r) => formatNumber(r.ton_truoc) },
          { key: "after", label: "Tồn sau", render: (r) => formatNumber(r.ton_sau) },
          { key: "held", label: "Đã giữ trước → sau", render: (r) => `${formatNumber(r.giu_truoc)} → ${formatNumber(r.giu_sau)}` },
          { key: "ref", label: "Tham chiếu", render: (r) => r.tham_chieu },
          { key: "actor", label: "Người thực hiện", render: (r) => `${r.ten_nguoi_thuc_hien} (${r.nguoi_thuc_hien})` },
          { key: "reason", label: "Lý do / Ghi chú", render: (r) => <>{r.ly_do}<div className="pm-small">{r.ghi_chu}</div></> },
        ]} />
      </>}
      {tab === 2 && <><p>{stock.ten_nguyen_lieu} · {stock.don_vi_do_luong}. Hàng đang về là phần chưa được chấp nhận của đơn còn mở. Đơn đã chốt không còn tính hàng chờ giao.</p><DataTable rows={detail.don_mua} rowKey={(r) => r.ma_don_mua} columns={[
        { key: "code", label: "Đơn mua", render: (r) => r.ma_don_mua },
        { key: "supplier", label: "Nhà cung cấp", render: (r) => r.ten_ncc },
        { key: "ordered", label: "Đặt", render: (r) => formatNumber(r.so_luong_mua) },
        { key: "received", label: "Thực nhận", render: (r) => formatNumber(r.so_luong_thuc_nhan) },
        { key: "pending", label: "Còn chờ giao", render: (r) => formatNumber(r.con_cho_giao) },
        { key: "date", label: "Dự kiến giao", render: (r) => formatDate(r.ngay_du_kien_giao) },
        { key: "status", label: "Trạng thái", render: (r) => ({ DA_DUYET: "Đã duyệt", DA_NHAN_HANG: "Đã nhận hàng", CHUA_DUYET: "Chưa duyệt", TU_CHOI: "Từ chối" })[r.trang_thai] ?? r.trang_thai },
      ]} /></>}
    </div>}
  </FormDrawer>;
}
