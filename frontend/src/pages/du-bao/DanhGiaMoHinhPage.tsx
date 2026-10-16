import { useEffect, useMemo, useState } from "react";
import {
  layChiTietDuBao,
  layLichSuDuBao,
  type DuBaoResponse,
  type LichSuDuBao,
} from "../../services/duBaoService";

// Trang chỉ đọc kết quả đánh giá đã lưu, không chạy lại mô hình.
const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const fmt = (value: number | null | undefined) =>
  value == null || !Number.isFinite(value) ? "—" : numberFormat.format(value);
const fmtDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(date);
};
const modelLabel = (value: string) =>
  value === "PROPHET" ? "Prophet" :
  value === "SEASONAL_NAIVE" ? "Seasonal Naive" :
  value === "TUONG_DUONG" ? "Tương đương" : value;

export default function DanhGiaMoHinhPage() {
  const [history, setHistory] = useState<LichSuDuBao[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState<DuBaoResponse | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingHistory(true);
    layLichSuDuBao()
      .then(items => {
        if (!active) return;
        setHistory(items);
        if (items.length) setSelectedId(items[0].ma_lich_su_du_bao);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "Không tải được lịch sử dự báo.");
      })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoadingDetail(true);
    setError("");
    setDetail(null);
    layChiTietDuBao(selectedId)
      .then(value => { if (active) setDetail(value); })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "Không tải được kết quả đánh giá.");
      })
      .finally(() => { if (active) setLoadingDetail(false); });
    return () => { active = false; };
  }, [selectedId]);

  const filteredHistory = useMemo(() => history.filter(item =>
    `${item.ma_lich_su_du_bao} ${item.ho_ten_nguoi_thuc_hien ?? ""} ${item.nguoi_thuc_hien ?? ""}`
      .toLowerCase().includes(query.trim().toLowerCase()),
  ), [history, query]);

  const comparisons = detail?.so_sanh_mo_hinh ?? [];
  const prophetWins = comparisons.filter(item => item.mo_hinh_tot_hon_theo_mae === "PROPHET").length;
  const naiveWins = comparisons.filter(item => item.mo_hinh_tot_hon_theo_mae === "SEASONAL_NAIVE").length;

  return (
    <div className="db-page">
      <main className="db-shell">
        <header className="db-page-header">
          <div className="db-page-icon">📊</div>
          <div>
            <h1>Đánh giá mô hình dự báo</h1>
            <p>Kiểm chứng kết quả Prophet bằng Backtesting và so sánh với Seasonal Naive.</p>
          </div>
        </header>
        <div className="db-content">
          <section className="db-config">
            <div className="db-config-heading">
              <h3>Chọn lần dự báo đã lưu</h3>
              <p>Chức năng này chỉ đọc kết quả từ lịch sử, không chạy lại mô hình.</p>
            </div>
            <div className="db-config-grid">
              <div className="db-field">
                <label htmlFor="dg-search">Tìm lần dự báo</label>
                <input id="dg-search" className="db-select-trigger" value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Mã lần chạy hoặc người thực hiện" />
              </div>
              <div className="db-field">
                <label htmlFor="dg-run">Lần dự báo</label>
                <select id="dg-run" className="db-select-trigger" value={selectedId}
                  onChange={event => setSelectedId(event.target.value)}
                  disabled={loadingHistory || history.length === 0}>
                  {filteredHistory.length === 0 && <option value="">Không có kết quả</option>}
                  {filteredHistory.map(item => (
                    <option key={item.ma_lich_su_du_bao} value={item.ma_lich_su_du_bao}>
                      {item.ma_lich_su_du_bao} — {fmtDateTime(item.thoi_gian_chay)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {error && <p className="db-warning" role="alert">{error}</p>}
          {(loadingHistory || loadingDetail) && <p className="db-empty-text">Đang tải dữ liệu đánh giá...</p>}
          {!loadingHistory && history.length === 0 && !error && (
            <p className="db-empty-text">Chưa có lần dự báo nào được lưu.</p>
          )}
          {detail && !loadingDetail && (
            <section className="db-results">
              <div className="db-section-heading">
                <div>
                  <h3>Kết quả đánh giá — {detail.ma_lich_su_du_bao}</h3>
                  <p>Thời gian chạy: {fmtDateTime(detail.thoi_gian_chay)} · Kỳ dự báo: {detail.so_tuan_du_bao} tuần</p>
                </div>
              </div>
              <div className="db-run-metrics">
                <div><small>Sản phẩm được đánh giá</small><strong>{detail.tong_san_pham}</strong></div>
                <div><small>Prophet có MAE thấp hơn</small><strong>{prophetWins}/{comparisons.length || "—"}</strong></div>
                <div><small>Seasonal Naive có MAE thấp hơn</small><strong>{naiveWins}/{comparisons.length || "—"}</strong></div>
              </div>
              <div className="db-inner-card">
                <h4>So sánh sai số MAE theo sản phẩm</h4>
                <div className="db-history-table-wrap">
                  <table className="db-history-table">
                    <thead><tr><th>Sản phẩm</th><th>MAE Prophet</th><th>MAE Seasonal Naive</th><th>Mô hình có MAE thấp hơn</th><th>Cải thiện MAE</th></tr></thead>
                    <tbody>
                      {comparisons.map(item => (
                        <tr key={item.ma_san_pham}>
                          <td><b>{item.ma_san_pham}</b></td>
                          <td>{fmt(item.prophet_mae)}</td>
                          <td>{fmt(item.seasonal_naive_mae)}</td>
                          <td>{modelLabel(item.mo_hinh_tot_hon_theo_mae)}</td>
                          <td>{item.ty_le_cai_thien_mae == null ? "—" : `${fmt(item.ty_le_cai_thien_mae)}%`}</td>
                        </tr>
                      ))}
                      {!comparisons.length && <tr><td colSpan={5}>Lần dự báo này chưa có dữ liệu so sánh mô hình.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="db-inner-card">
                <h4>Chỉ số đánh giá chi tiết</h4>
                <div className="db-history-table-wrap">
                  <table className="db-history-table">
                    <thead><tr><th>Sản phẩm</th><th>Mô hình</th><th>MAE</th><th>RMSE</th><th>WAPE</th><th>sMAPE</th></tr></thead>
                    <tbody>
                      {detail.danh_gia_mo_hinh.map((item, index) => (
                        <tr key={`${item.ma_san_pham}-${item.mo_hinh}-${index}`}>
                          <td>{item.ma_san_pham}</td>
                          <td>{modelLabel(item.mo_hinh)}</td>
                          <td>{fmt(item.mae)}</td>
                          <td>{fmt(item.rmse)}</td>
                          <td>{item.wape == null ? "—" : `${fmt(item.wape)}%`}</td>
                          <td>{fmt(item.smape)}%</td>
                        </tr>
                      ))}
                      {!detail.danh_gia_mo_hinh.length && <tr><td colSpan={6}>Chưa có kết quả Backtesting cho lần chạy này.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              {detail.ghi_chu_danh_gia && <p className="db-footer-note">{detail.ghi_chu_danh_gia}</p>}
              <p className="db-footer-note">
                Các chỉ số phản ánh sai số trên dữ liệu kiểm thử lịch sử; chỉ số thấp hơn thể hiện sai số thấp hơn trong phạm vi đánh giá, không bảo đảm mô hình luôn tốt hơn trong tương lai.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
