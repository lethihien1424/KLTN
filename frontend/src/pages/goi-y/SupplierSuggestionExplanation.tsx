import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { FormDrawer, LoadingState, ErrorState, useResource, formatNumber, formatMoney } from "../../components/common/PurchaseUI";
import type { Suggestions } from "../../services/purchaseTypes";
import { explainSupplierSuggestion } from "../../services/supplierSuggestionService";
import SupplierScorePreviewDialog, { CriterionCard } from "../nha-cung-cap/SupplierScorePreviewDialog";
import { ReceiptDetail } from "../don-mua/LichSuNhapNguyenLieuPage";
import "./supplierSuggestionExplanation.css";

const value = (input: string | null | undefined) => input == null ? "Chưa có dữ liệu" : formatNumber(input);
const time = (input: string | null | undefined) => input ? new Date(input).toLocaleString("vi-VN") : "Chưa lưu thời điểm cập nhật";

export function SupplierRankingDialog({ report, onClose }: { report: Suggestions; onClose: () => void }) {
  const policy = report.chinh_sach_xep_hang;
  return <FormDrawer open className="score-preview-dialog" title="Cách xếp hạng nhà cung cấp" onClose={onClose} footer={<button className="pm-btn" onClick={onClose}>Đóng</button>}>
    <div className="score-preview-content suggestion-explanation">
      <p>Điểm NCC đánh giá lịch sử giao nhận. Điểm ưu tiên dùng để so sánh NCC cho nguyên liệu và số lượng đang tìm.</p>
      {!policy ? <p>Chưa có dữ liệu giải thích từ API. Vui lòng tìm kiếm lại sau khi backend được cập nhật.</p> : <>
        <div className="score-formula"><strong>{policy.cong_thuc}</strong><p>{policy.cong_thuc_gia}</p></div>
        <p>Nhóm cung ứng: {policy.nhom_cung_ung.join(" → ")}</p><p>{policy.sap_xep}</p>
        <details className="score-method"><summary>Thiếu dữ liệu và làm tròn</summary><p>{policy.thieu_kpi}</p><p>{policy.lam_tron}</p></details>
      </>}
      <h3>So sánh trên cùng bộ dữ liệu</h3>
      {report.nha_cung_cap.map((row, index) => <article className="suggestion-comparison" key={row.ma_nguyen_lieu_ncc}>
        <h4>#{row.giai_thich_xep_hang?.vi_tri ?? index + 1} · {row.ten_ncc} <span className="score-muted">{row.ma_ncc}</span></h4>
        <dl className="suggestion-facts">
          <div><dt>Điểm NCC</dt><dd>{value(row.diem_ncc)}</dd></div>
          <div><dt>Giá tham khảo</dt><dd>{formatMoney(row.don_gia)}</dd></div>
          <div><dt>Nhóm cung ứng</dt><dd>{row.giai_thich_xep_hang?.nhan_nhom ?? "Chưa có giải thích"}</dd></div>
          <div><dt>Phần điểm giá</dt><dd>{value(row.giai_thich_xep_hang?.dong_gop_gia)}</dd></div>
          <div><dt>Phần điểm KPI</dt><dd>{value(row.giai_thich_xep_hang?.dong_gop_kpi)}</dd></div>
          <div><dt>Tổng điểm ưu tiên</dt><dd>{value(row.diem_xep_hang)}</dd></div>
        </dl>
        <p className="suggestion-reason">{row.giai_thich_xep_hang?.so_sanh}</p>
        <details className="score-method"><summary>Phép tính thành phần · {row.ma_ncc}</summary>
          <p>{row.giai_thich_xep_hang?.phep_tinh_gia}</p><p>{row.giai_thich_xep_hang?.phep_tinh_dong_gop_gia}</p>
          <p>{row.giai_thich_xep_hang?.phep_tinh_dong_gop_kpi}</p><p>{row.giai_thich_xep_hang?.phep_tinh_tong}</p>
        </details>
      </article>)}
      {report.tinh_luc && <p className="score-muted">Dữ liệu tính lúc {time(report.tinh_luc)}. Tìm kiếm lại để cập nhật khi xác nhận hết hạn hoặc đầu vào thay đổi.</p>}
    </div>
  </FormDrawer>;
}

export default function SupplierSuggestionExplanationDialog({ mappingId, material, qty, forecast, onClose, onChanged }: {
  mappingId: string; material: string; qty: string; forecast: string; onClose: () => void; onChanged: () => void;
}) {
  const { can } = useAuth();
  const resource = useResource(() => explainSupplierSuggestion(mappingId, material, qty, forecast), [mappingId, material, qty, forecast]);
  const [expanded, setExpanded] = useState("");
  const [receipt, setReceipt] = useState("");
  const [scoreOpen, setScoreOpen] = useState(false);
  const row = resource.data?.nha_cung_cap;
  const detail = row?.giai_thich_xep_hang;
  const score = row?.chi_tiet_diem_ncc;
  const mapping = score?.mapping.find(item => item.ma_nguyen_lieu_ncc === mappingId);
  return <><FormDrawer open className="score-preview-dialog" title="Vì sao gợi ý nhà cung cấp này?" onClose={onClose} footer={<button className="pm-btn" onClick={onClose}>Đóng</button>}>
    <div className="score-preview-content suggestion-explanation">
      {resource.loading ? <LoadingState /> : resource.error ? <ErrorState message={resource.error} retry={resource.refetch} /> : row && detail && <>
        <section className="score-hero"><span className="score-eyebrow">ƯU TIÊN #{detail.vi_tri} · {row.ma_ncc}</span><h3>{row.ten_ncc}</h3>
          <dl className="suggestion-facts"><div><dt>Điểm NCC</dt><dd>{value(row.diem_ncc)}</dd></div><div><dt>Tổng điểm ưu tiên</dt><dd>{value(row.diem_xep_hang)}</dd></div><div><dt>Cung ứng</dt><dd>{detail.nhan_nhom}</dd></div></dl>
          <p className="suggestion-reason">{detail.so_sanh}</p>
        </section>
        <section className="suggestion-ranking-math"><h3>Điểm áp dụng vào xếp hạng</h3>
          <p className="score-formula">{resource.data?.chinh_sach_xep_hang.cong_thuc}</p>
          <p>{detail.phep_tinh_dong_gop_gia}</p><p>{detail.phep_tinh_dong_gop_kpi}</p><p className="score-formula">{detail.phep_tinh_tong}</p>
          <p className="score-muted">{resource.data?.chinh_sach_xep_hang.sap_xep}</p>
        </section>
        <h3>Nguồn số liệu và cách tính</h3>
        {score && <p className="score-muted">{score.giai_thich_tong.replace(/mapping/g, "nguyên liệu")}</p>}
        <p className="score-muted">Bốn thẻ KPI thể hiện đóng góp vào điểm mapping {mappingId}. Backend hiện dùng lịch sử giao nhận toàn NCC cho các KPI, kết hợp thời gian khai báo của từng mapping. Các điểm mapping được tổng hợp thành Điểm NCC; phần Điểm NCC áp dụng vào xếp hạng được tính riêng ở trên.</p>
        <div className="score-kpi-grid">
          {mapping?.tieu_chi.map(criterion => <CriterionCard key={criterion.key} criterion={criterion} expanded={expanded === criterion.key} onToggle={() => setExpanded(expanded === criterion.key ? "" : criterion.key)} onReceipt={setReceipt} />)}
          <details className="suggestion-source-card"><summary><strong>Đơn giá tham khảo</strong><span>{formatMoney(row.don_gia)}</span></summary>
            <h4>Dữ liệu gốc</h4><p>Mapping {detail.gia.ma_nguyen_lieu_ncc} · nguyên liệu {detail.gia.ma_nguyen_lieu}.</p>
            <p>Đơn vị tiền: {detail.gia.don_vi_tien} · đơn vị nguyên liệu: {detail.gia.don_vi_nguyen_lieu} · đơn vị giá: {detail.gia.don_vi_gia ?? "chưa lưu riêng"}.</p>
            <p>Thời điểm cập nhật: {time(detail.gia.cap_nhat_luc)}.</p><p className="score-muted">{detail.gia.ghi_chu}</p>
            <h4>Cách tính điểm giá</h4><p className="score-formula">{detail.phep_tinh_gia}</p>
            <h4>Điểm áp dụng vào xếp hạng</h4><p>{detail.phep_tinh_dong_gop_gia}</p>
          </details>
          <details className="suggestion-source-card"><summary><strong>Xác nhận cung ứng</strong><span>{detail.nhan_nhom}</span></summary>
            <h4>Dữ liệu gốc</h4><p>Yêu cầu hiện tại: {value(detail.cung_ung.so_luong_yeu_cau)} kg · lần dự báo: {detail.cung_ung.ma_lich_su_du_bao ?? "không gắn dự báo"}.</p>
            {row.xac_nhan ? <>
              <p>Bản xác nhận mới nhất: {row.xac_nhan.id} · {detail.cung_ung.xac_nhan_con_hieu_luc ? "còn hiệu lực" : "không còn hiệu lực tại thời điểm tính"}.</p>
              <p>Yêu cầu trên chứng từ: {value(row.xac_nhan.so_luong_can_mua)} kg · NCC xác nhận: {value(row.xac_nhan.so_luong_xac_nhan)} kg.</p>
              <p>Ngày xác nhận: {time(row.xac_nhan.ngay_xac_nhan)} · hạn hiệu lực: {time(row.xac_nhan.hieu_luc_den)}.</p>
              <p>Người xác nhận: {row.xac_nhan.nguoi_xac_nhan} · nguồn: {row.xac_nhan.nguon_xac_nhan}.</p><p>Lý do: {row.xac_nhan.ly_do} · Ghi chú/chứng từ: {row.xac_nhan.ghi_chu || "—"}.</p>
            </> : <p>Chưa có chứng từ xác nhận; chưa phải cam kết giao hàng.</p>}
            <h4>Cách đánh giá</h4><p className="score-formula">{detail.cung_ung.phep_tinh}</p>
            <h4>Áp dụng vào xếp hạng</h4><p>{detail.cung_ung.ghi_chu}</p>
          </details>
        </div>
        <p className="score-muted">Thời gian giao dự kiến: {detail.thoi_gian_giao.lead_time_ngay} ngày, lấy từ mapping {detail.thoi_gian_giao.ma_nguyen_lieu_ncc}. {detail.thoi_gian_giao.ghi_chu}</p>
        <div className="score-source-actions">
          {can("NHA_CUNG_CAP_SCORE") && <button className="pm-btn" onClick={() => setScoreOpen(true)}>Mở Tính lại điểm NCC</button>}
          {can("NGUYEN_LIEU_NCC_VIEW") && <a className="pm-link" target="_blank" rel="noreferrer" href={`#/nha-cung-cap/cung-ung?ncc=${encodeURIComponent(row.ma_ncc)}`}>Cấu hình giá và thời gian giao ↗</a>}
          {can("DON_MUA_VIEW") && <a className="pm-link" target="_blank" rel="noreferrer" href={`#/lich-su-nhap-nguyen-lieu?ma_ncc=${encodeURIComponent(row.ma_ncc)}`}>Lịch sử nhập / giá mua thực tế ↗</a>}
        </div>
        <p className="score-muted">Tính lúc {time(resource.data?.tinh_luc)}. Xem giải thích không lưu điểm, xác nhận hoặc đề xuất.</p>
      </>}
    </div>
  </FormDrawer>
    {receipt && can("DON_MUA_VIEW") && <ReceiptDetail code={receipt} onClose={() => setReceipt("")} />}
    {scoreOpen && row && can("NHA_CUNG_CAP_SCORE") && <SupplierScorePreviewDialog code={row.ma_ncc} onClose={() => setScoreOpen(false)} onSaved={() => { setScoreOpen(false); resource.refetch(); onChanged(); }} />}
  </>;
}
