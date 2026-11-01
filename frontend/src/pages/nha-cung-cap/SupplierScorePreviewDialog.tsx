import { useId, useState, type ReactNode } from "react";
import { ArrowRightOutlined, CheckCircleOutlined, ClockCircleOutlined, DownOutlined, FileSearchOutlined, InboxOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { FormDrawer, Field, Feedback, LoadingState, ErrorState, useResource, useMutation, formatNumber } from "../../components/common/PurchaseUI";
import { ApiError } from "../../services/apiClient";
import { previewSupplierScore, scoreSupplier, type SupplierScoreCriterion, type SupplierScoreItem, type SupplierScorePreview } from "../../services/nhaCungCapService";
import { applicableReasons } from "../../services/reasonService";
import { ReceiptDetail } from "../don-mua/LichSuNhapNguyenLieuPage";
import "./supplierScorePreview.css";

const number = (value: string | null) => value === null ? "Chưa có dữ liệu" : formatNumber(value);
const preciseNumber = (value: string) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(Number(value));
const sourceLabel = (source?: string) => source === "LICH_SU" ? "Lịch sử Excel" : source === "DON_CU" ? "Đơn đã nhận cũ" : "Chứng từ thực tế";
const sourceLabels: Record<string, string> = { THUC_TE: "Chứng từ thực tế", THUC_TE_VA_KHAI_BAO: "Chứng từ thực tế + thời gian khai báo", CHUA_DU_DU_LIEU: "Chưa có dữ liệu" };
const icons: Record<string, ReactNode> = { quality_ratio: <SafetyCertificateOutlined />, on_time_ratio: <ClockCircleOutlined />, full_ratio: <InboxOutlined />, lead_time: <ThunderboltOutlined /> };

function EvidenceDeck({ criterion, onReceipt }: { criterion: SupplierScoreCriterion; onReceipt: (code: string) => void }) {
  const { can } = useAuth();
  const [index, setIndex] = useState(0);
  const quality = criterion.key === "quality_ratio";
  const rows = (criterion.giai_thich?.dong ?? []).filter(item => !quality || item.phieu.length > 0);
  const row = rows[index];
  return <details className="score-documents">
    <summary><FileSearchOutlined /> {quality ? "Xem chi tiết chứng từ" : "Xem chứng từ chi tiết"} <span>({rows.length} mục)</span></summary>
    {rows.length === 0 ? <p>Chưa có chứng từ cho tiêu chí này.</p> : <>
      <Field label={quality ? "Chọn chứng từ kiểm định" : "Chọn chứng từ hoặc nhóm tổng hợp"}><select value={index} onChange={e => setIndex(Number(e.target.value))}>
        {rows.map((item, i) => <option key={i} value={i}>{i + 1}. {item.tieu_de}{item.nguon ? ` · ${sourceLabel(item.nguon)}` : ""}</option>)}
      </select></Field>
      {row && <article className="score-evidence">
        <strong>{row.tieu_de}</strong>{row.nguon && <span className="score-tag">{sourceLabel(row.nguon)}</span>}
        {quality && <p className="score-document-scope">Tỷ lệ của riêng chứng từ (dòng nguyên liệu đang chọn), không phải KPI chất lượng tổng NCC.</p>}
        {row.noi_dung.map((text, i) => <p key={i}>{text}</p>)}
        <div className="score-source-actions">
          {row.ma_don && (can("DON_MUA_VIEW") && row.nguon !== "LICH_SU" ? <a className="pm-link" target="_blank" rel="noreferrer" href={`#/don-mua/${encodeURIComponent(row.ma_don)}`}>Đơn mua {row.ma_don} ↗</a> : <span>Đơn mua: {row.ma_don}</span>)}
          {row.phieu.map(doc => can("DON_MUA_VIEW") ? <button key={doc.ma_phieu_nhan} className="pm-btn" onClick={() => onReceipt(doc.ma_phieu_nhan)}>Xem {doc.ma_phieu_nhap}</button> : <span key={doc.ma_phieu_nhan}>Phiếu {doc.ma_phieu_nhap}</span>)}
        </div>
      </article>}
    </>}
  </details>;
}

function QualitySummary({ criterion }: { criterion: SupplierScoreCriterion }) {
  const summary = criterion.giai_thich?.tong_hop_kiem_dinh;
  return <section className="score-quality-summary" aria-label="Tổng hợp dữ liệu kiểm định">
    <h4>Tổng hợp dữ liệu kiểm định</h4>
    {!summary ? <p>Preview chưa có dữ liệu tổng hợp kiểm định. Vui lòng tính lại Preview.</p> : <>
      <p className="score-muted">Toàn bộ dữ liệu kiểm định của NCC · {summary.so_dong_hop_le} dòng kiểm định hợp lệ. {summary.so_dong_chua_kiem_dinh > 0 && `${summary.so_dong_chua_kiem_dinh} dòng chưa kiểm định không tham gia KPI chất lượng.`}</p>
      {summary.theo_don_vi.length === 0 ? <p>Chưa có dữ liệu kiểm định; tiêu chí không tham gia tính điểm.</p> : summary.theo_don_vi.map(unit => <div className="score-quality-unit" key={unit.don_vi}>
        <strong>Đơn vị: {unit.don_vi}</strong>
        <dl className="score-inspection-totals">
          <div><dt>Tổng số lượng giao</dt><dd>{preciseNumber(unit.so_luong_giao)} {unit.don_vi}</dd></div>
          <div><dt>Tổng số lượng đạt</dt><dd>{preciseNumber(unit.so_luong_dat)} {unit.don_vi}</dd></div>
          <div><dt>Tổng số lượng không đạt</dt><dd>{preciseNumber(unit.so_luong_khong_dat)} {unit.don_vi}</dd></div>
          <div><dt>Dòng kiểm định hợp lệ</dt><dd>{unit.so_dong_hop_le}</dd></div>
        </dl>
        <p className="score-formula">{unit.phep_tinh}</p>
        {unit.chuoi_du_lieu && <p className="score-quality-chain">{unit.chuoi_du_lieu}{summary.theo_don_vi.length === 1 && criterion.dong_gop !== null && ` → ${preciseNumber(criterion.dong_gop)} điểm`}</p>}
      </div>)}
      {summary.theo_don_vi.length > 1 && <p className="score-muted">Tổng riêng theo từng đơn vị đo; không cộng các đơn vị khác nhau. KPI chất lượng tổng NCC là trung bình các tỷ lệ theo đơn vị có tổng lượng giao lớn hơn 0.</p>}
    </>}
  </section>;
}

export function CriterionCard({ criterion, expanded, onToggle, onReceipt }: { criterion: SupplierScoreCriterion; expanded: boolean; onToggle: () => void; onReceipt: (code: string) => void }) {
  const id = useId();
  return <article className={`score-kpi-card${expanded ? " is-expanded" : ""}`}>
    <button className="score-kpi-toggle" aria-expanded={expanded} aria-controls={expanded ? id : undefined} onClick={onToggle}>
      <span className="score-kpi-title"><span className="score-kpi-icon" aria-hidden="true">{icons[criterion.key]}</span><strong>{criterion.ten}</strong><DownOutlined className="score-chevron" aria-hidden="true" /></span>
      <span className="score-kpi-metrics">
        <span><small>Điểm KPI</small><b>{number(criterion.diem)}</b></span>
        <span><small>Trọng số</small><b>{formatNumber(criterion.trong_so)}%</b></span>
        <span className="score-contribution"><small>Đóng góp</small><b>{criterion.dong_gop === null ? "Không áp dụng" : `${formatNumber(criterion.dong_gop)} điểm`}</b></span>
      </span>
      <span className="score-kpi-hint">{criterion.diem === null ? "Chưa có dữ liệu · không tham gia tính điểm" : expanded ? "Thu gọn cách tính" : "Xem cách tính"}</span>
    </button>
    {expanded && <div id={id} className="score-kpi-detail">
      <section className="score-step"><span className="score-step-number">1</span><div>
        <h4>Dữ liệu thực tế lấy từ đâu?</h4><p>{sourceLabels[criterion.nguon]} · {criterion.so_mau} mẫu đánh giá.</p>
        {criterion.key === "quality_ratio" ? <QualitySummary criterion={criterion} /> : <><p className="score-muted">{criterion.giai_thich?.ghi_chu}</p><EvidenceDeck criterion={criterion} onReceipt={onReceipt} /></>}
      </div></section>
      <section className="score-step"><span className="score-step-number">2</span><div>
        <h4>Cách tính KPI</h4><p className="score-formula">{criterion.giai_thich?.tom_tat || "Chưa có dữ liệu; không tham gia tính điểm."}</p><p className="score-muted">{criterion.giai_thich?.cong_thuc_ngan}</p>
      </div></section>
      <section className="score-step"><span className="score-step-number">3</span><div>
        <h4>Cách tính điểm đóng góp</h4><p className="score-formula">{criterion.phep_tinh || "Chưa có dữ liệu; không tham gia tính điểm."}</p>
        <p className="score-muted">Trọng số gốc {formatNumber(criterion.trong_so)}% · Trọng số áp dụng {criterion.trong_so_ap_dung === null ? "không áp dụng" : `${formatNumber(criterion.trong_so_ap_dung)}%`}. Tiêu chí thiếu dữ liệu được loại khỏi mẫu số trọng số.</p>
      </div></section>
      {criterion.key === "quality_ratio" && <EvidenceDeck criterion={criterion} onReceipt={onReceipt} />}
    </div>}
  </article>;
}

function SupplierPanel({ row, policy, onReceipt }: { row: SupplierScoreItem; policy: SupplierScorePreview["chinh_sach"]; onReceipt: (code: string) => void }) {
  const { can } = useAuth();
  const [mappingId, setMappingId] = useState("");
  const [expanded, setExpanded] = useState("");
  const mapping = row.mapping.find(item => item.ma_nguyen_lieu_ncc === mappingId) ?? row.mapping[0];
  const participating = row.mapping.filter(item => item.diem !== null).length;
  return <>
    <section className="score-hero" aria-label="Điểm tổng NCC">
      <div className="score-hero-heading"><div><span className="score-eyebrow">ĐÁNH GIÁ NHÀ CUNG CẤP</span><h3>{row.ten_ncc}</h3><span className="score-muted">{row.ma_ncc}</span></div>
        <span className={`score-status${row.diem_moi === null ? " is-missing" : ""}`}><CheckCircleOutlined /> {row.diem_moi === null ? "Chưa có dữ liệu" : row.tinh_trang === "DU_DU_LIEU" ? "Đủ 4 tiêu chí" : "Thiếu một phần dữ liệu"}</span></div>
      <div className="score-totals"><div><span>Điểm hiện tại</span><strong>{number(row.diem_hien_tai)}</strong></div><ArrowRightOutlined className="score-arrow" /><div className="score-new"><span>Điểm tính lại</span><strong>{number(row.diem_moi)}</strong></div>
        <div className="score-total-meta"><b>{participating}/{row.mapping.length} nguyên liệu</b><span>tham gia tính điểm</span>{row.chenh_lech !== null && <span className="score-delta">{Number(row.chenh_lech) > 0 ? "+" : ""}{formatNumber(row.chenh_lech)} điểm so với hiện tại</span>}</div></div>
      <div className="score-average"><span>Trung bình điểm nguyên liệu</span><p>{row.giai_thich_tong?.replace(/mapping/g, "nguyên liệu").replace("HALF_UP", "")}</p></div>
    </section>
    <section className="score-material-section" aria-label="Điểm từng nguyên liệu">
      <div className="score-section-heading"><h3>Điểm từng nguyên liệu</h3><span>Chọn để xem 4 tiêu chí</span></div>
      {row.mapping.length === 0 ? <p>Chưa có nguyên liệu cung ứng để tính điểm.</p> : <div className="score-material-list">
        {row.mapping.map(item => <button key={item.ma_nguyen_lieu_ncc} className={`score-material${mapping === item ? " is-selected" : ""}`} aria-pressed={mapping === item} onClick={() => { setMappingId(item.ma_nguyen_lieu_ncc); setExpanded(""); }}>
          <span><strong>{item.ten_nguyen_lieu || item.ma_nguyen_lieu}</strong><small>{item.ma_nguyen_lieu} · {item.ma_nguyen_lieu_ncc}</small></span><b>{number(item.diem)}{item.diem !== null && <small> điểm</small>}</b>
        </button>)}
      </div>}
    </section>
    {mapping && <section className="score-evaluation" aria-label={`Chi tiết nguyên liệu ${mapping.ma_nguyen_lieu}`}>
      <div className="score-section-heading"><h3>Chi tiết đánh giá · {mapping.ten_nguyen_lieu || mapping.ma_nguyen_lieu}</h3><span>Độ đầy đủ {formatNumber(mapping.do_day_du)}%</span></div>
      <p className="score-muted">KPI thực tế được tổng hợp trên toàn NCC; mỗi nguyên liệu áp dụng thời gian giao khai báo riêng.</p>
      <div className="score-kpi-grid">{mapping.tieu_chi.map(criterion => <CriterionCard key={`${mapping.ma_nguyen_lieu_ncc}/${criterion.key}`} criterion={criterion} expanded={expanded === criterion.key} onToggle={() => setExpanded(expanded === criterion.key ? "" : criterion.key)} onReceipt={onReceipt} />)}</div>
      <details className="score-method"><summary>Phép cộng điểm nguyên liệu và chính sách tính</summary>
        <p className="score-formula">{mapping.giai_thich_tong?.replace(/mapping/g, "nguyên liệu")}</p><p>{policy.formula}</p><p>{policy.missing}</p><p>{policy.sources}</p><p>{policy.quality} {policy.on_time} {policy.full} {policy.lead}</p>
        <p>Thời gian khai báo: {mapping.lead_time_khai_bao_ngay} ngày · Thực tế trung bình: {number(mapping.lead_time_thuc_te_ngay)}{mapping.lead_time_thuc_te_ngay !== null && " ngày"}.</p>
        <p>Tỷ lệ khai báo (không dùng làm KPI): chất lượng {formatNumber(Number(mapping.khai_bao_khong_dung_lam_kpi.chat_luong) * 100)}%, đúng hạn {formatNumber(Number(mapping.khai_bao_khong_dung_lam_kpi.dung_han) * 100)}%, giao đủ {formatNumber(Number(mapping.khai_bao_khong_dung_lam_kpi.giao_du) * 100)}%.</p>
        <p>{row.so_phieu} phiếu giao hàng · {row.so_lan_giao} lần giao · {row.so_don} đơn · {row.so_don_da_chot} đơn đã chốt · {row.so_dong_kiem_dinh_hop_le} dòng kiểm định hợp lệ.</p><p>Nguồn: {row.so_phieu_thuc_te} phiếu thực tế, {row.so_phieu_lich_su} phiếu lịch sử Excel, {row.so_don_cu} đơn đã nhận cũ.</p>
        <p>Phép tính hiển thị tối đa 6 chữ số thập phân; điểm được tính từ giá trị chưa làm tròn.</p>
      </details>
      <div className="score-source-actions">
        {can("DON_MUA_VIEW") && <a className="pm-link" target="_blank" rel="noreferrer" href={`#/lich-su-nhap-nguyen-lieu?ma_ncc=${encodeURIComponent(row.ma_ncc)}`}>Lịch sử nhập nguyên liệu ↗</a>}
        {can("NGUYEN_LIEU_NCC_VIEW") && <a className="pm-link" target="_blank" rel="noreferrer" href={`#/nha-cung-cap/cung-ung?ncc=${encodeURIComponent(row.ma_ncc)}`}>Thông tin thời gian giao NCC ↗</a>}
      </div>
    </section>}
  </>;
}

export default function SupplierScorePreviewDialog({ code, onClose, onSaved }: { code?: string; onClose: () => void; onSaved: () => void }) {
  const { can } = useAuth();
  const preview = useResource(() => previewSupplierScore(code), [code]);
  const reasons = useResource(() => applicableReasons("TINH_LAI_DIEM_NCC"), []);
  const mutation = useMutation();
  const [reasonId, setReasonId] = useState("");
  const [note, setNote] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [stale, setStale] = useState(false);
  const [receipt, setReceipt] = useState("");
  const selectedReason = !reasons.loading && !reasons.error ? reasons.data?.find(item => item.id === reasonId && item.trang_thai === "DANG_SU_DUNG") : undefined;
  const other = selectedReason?.ten_ly_do.trim().toLocaleLowerCase("vi") === "khác";
  const row = preview.data?.nha_cung_cap.find(item => item.ma_ncc === supplierId) ?? preview.data?.nha_cung_cap[0];
  const available = can("NHA_CUNG_CAP_SCORE") && !preview.loading && !preview.error && !stale && Boolean(preview.data?.preview_token) && Boolean(preview.data?.nha_cung_cap.length);
  const refresh = () => { setStale(false); preview.setData(null); mutation.setError(""); preview.refetch(); };
  return <><FormDrawer open className="score-preview-dialog" title={code ? "Tính lại điểm nhà cung cấp" : "Tính điểm tất cả nhà cung cấp"} onClose={onClose} busy={mutation.busy} footer={<>
    <span className="score-footer-note">Chỉ lưu điểm khi bạn xác nhận.</span><button className="pm-btn" disabled={mutation.busy} onClick={onClose}>Hủy</button>
    <button className="pm-btn primary" disabled={!available || mutation.busy || !selectedReason || (other && !note.trim())} onClick={() => void mutation.run(async () => {
      if (!available || !preview.data || !selectedReason || (other && !note.trim())) return;
      try {
        await scoreSupplier(code, { preview_token: preview.data.preview_token, ly_do: selectedReason.ten_ly_do, ly_do_id: selectedReason.id, ghi_chu: note.trim() || null }); onSaved();
      } catch (error) { if (error instanceof ApiError && error.status === 409) setStale(true); throw error; }
    }, "")}>Xác nhận lưu điểm</button>
  </>}>
    <div className="score-preview-content"><Feedback error={mutation.error} success="" />{stale && <button className="pm-btn" onClick={refresh}>Tính lại Preview</button>}
      {preview.loading ? <LoadingState /> : preview.error ? <ErrorState message={preview.error} retry={refresh} /> : preview.data && <>
        {!code && <Field label={`Nhà cung cấp · ${preview.data.nha_cung_cap.length} NCC sẽ được cập nhật`}><select value={row?.ma_ncc ?? ""} onChange={e => setSupplierId(e.target.value)}>{preview.data.nha_cung_cap.map(item => <option key={item.ma_ncc} value={item.ma_ncc}>{item.ma_ncc} · {item.ten_ncc} · {number(item.diem_moi)}</option>)}</select></Field>}
        {row && <SupplierPanel key={row.ma_ncc} row={row} policy={preview.data.chinh_sach} onReceipt={setReceipt} />}
        <p className="score-preview-time"><ClockCircleOutlined /> Preview có hiệu lực 15 phút · {new Date(preview.data.tinh_luc).toLocaleString("vi-VN")}. Dữ liệu thay đổi cần tính lại Preview.</p>
        <section className="score-confirmation" aria-label="Thông tin xác nhận"><h3>Xác nhận tính lại điểm</h3>
          {reasons.loading ? <LoadingState /> : reasons.error ? <ErrorState message={reasons.error} retry={reasons.refetch} /> : <Field label="Lý do tính lại điểm *"><select required value={reasonId} onChange={e => setReasonId(e.target.value)}><option value="">Chọn lý do đã cấu hình</option>{reasons.data?.filter(item => item.trang_thai === "DANG_SU_DUNG").map(item => <option key={item.id} value={item.id}>{item.ten_ly_do}</option>)}</select></Field>}
          {!reasons.loading && !reasons.error && !reasons.data?.length && <p className="score-muted">Chưa có lý do áp dụng. Cần cấu hình lý do đang sử dụng cho “Tính lại điểm nhà cung cấp” tại Cấu hình → Quản lý lý do.</p>}
          <Field label={other ? "Ghi chú *" : "Ghi chú"}><textarea rows={2} required={other} maxLength={2000} placeholder="Bổ sung thông tin đối soát (nếu có)" value={note} onChange={e => setNote(e.target.value)} /></Field>
        </section>
      </>}
    </div>
  </FormDrawer>{receipt && can("DON_MUA_VIEW") && <ReceiptDetail code={receipt} onClose={() => setReceipt("")} />}</>;
}
