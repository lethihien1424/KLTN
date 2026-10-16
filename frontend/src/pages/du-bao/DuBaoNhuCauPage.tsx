///D:\KLTN\KLTN\frontend\src\pages\du-bao\DuBaoNhuCauPage.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  chayDuBaoTheoYeuCau,
  layChiTietDuBao,
  layDuBaoMoiNhat,
  layLichSuDuBao,
  laySanPhamDuBao,
  type ChiTietDuBao,
  type DanhGiaMoHinh,
  type DuBaoResponse,
  type DuBaoSanPham,
  type LichSuDuBao,
  type SanPhamDuBao,
  type SoTuanDuBao,
  type YeuToDuBao,
} from "../../services/duBaoService";
type Props = {
  tenSanPham?: Record<string, string>;
  mode?: Tab;
};
type Tab = "du-bao" | "lich-su";
const SO_TUAN: SoTuanDuBao[] = [1, 2, 3, 4, 5, 6, 7, 8];
/* ---------- định dạng ---------- */
const nf = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});
function fmt(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : nf.format(value);
}
function fmtSigned(value: number): string {
  if (value > 0) return `+${nf.format(value)}`;
  if (value < 0) return `−${nf.format(Math.abs(value))}`;
  return "0";
}
function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
function shortDate(value: string): string {
  const [, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}`;
}
function dateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(parsed);
}
function addDays(value: string, days: number): string {
  const parsed = new Date(`${value}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}
// Thứ Hai tuần kế tiếp (giờ Việt Nam) — khớp logic backend.
function nextMonday(): string {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const date = new Date(`${today}T00:00:00Z`);
  const weekday = date.getUTCDay();
  const daysToMonday = ((8 - weekday) % 7) || 7;
  return addDays(today, daysToMonday);
}
function percent(
  current: number,
  previous: number | null,
): number | null {
  return previous != null && previous > 0
    ? ((current - previous) / previous) * 100
    : null;
}
/* ---------- icon (SVG nội tuyến, không cần thư viện) ---------- */
const ICON = {
  chart: "M3 3v18h18 M7 15l4-5 3 3 5-6",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7z",
  clock: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0 M12 7v5l3 2",
  down: "m6 9 6 6 6-6",
  right: "m9 18 6-6-6-6",
  left: "m15 18-6-6 6-6",
  check: "m5 12 5 5 9-10",
  search: "M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0 M20 20l-3.5-3.5",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4",
  minus: "M6 12h12",
} as const;
function Icon({
  name,
  size = 16,
}: {
  name: keyof typeof ICON;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON[name]} />
    </svg>
  );
}
/* ---------- so sánh kỳ trước ---------- */
function Change({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  if (previous === null) {
    return (
      <span className="db-change neutral">Chưa có dữ liệu đối chiếu</span>
    );
  }
  const difference = current - previous;
  const rate = percent(current, previous);
  const type =
    difference > 0
      ? "positive"
      : difference < 0
        ? "negative"
        : "neutral";
  return (
    <span className={`db-change ${type}`}>
      {difference > 0 ? "▲" : difference < 0 ? "▼" : "●"}{" "}
      {difference === 0 ? "Không đổi" : fmtSigned(difference)}
      {rate !== null && difference !== 0
        ? ` (${rate > 0 ? "+" : "−"}${fmt(Math.abs(rate))}%)`
        : ""}
    </span>
  );
}
function compareSentence(
  current: number,
  previous: number | null,
): string {
  if (previous === null) {
    return "Chưa có dữ liệu đối chiếu đáng tin cậy.";
  }
  const difference = current - previous;
  const rate = percent(current, previous);
  const ratePart =
    rate === null ? "" : ` (${fmt(Math.abs(rate))}%)`;
  if (difference === 0) return "Bằng kỳ trước.";
  return difference > 0
    ? `Nhiều hơn kỳ trước ${fmt(difference)} sản phẩm${ratePart}.`
    : `Ít hơn kỳ trước ${fmt(-difference)} sản phẩm${ratePart}.`;
}
/* ---------- dữ liệu dẫn xuất từ kết quả API ---------- */
function productName(
  product: DuBaoSanPham,
  names: Record<string, string>,
): string {
  return (
    product.ten_san_pham ||
    names[product.ma_san_pham] ||
    product.ma_san_pham
  );
}
function productTotal(product: DuBaoSanPham): number {
  return (
    product.tong_du_bao ??
    product.ket_qua.reduce(
      (sum, week) => sum + week.so_luong_du_bao,
      0,
    )
  );
}
function getPrevious(
  product: DuBaoSanPham,
  index: number,
): number | null {
  const week = product.ket_qua[index];
  if (!week) return null;
  if (week.ky_truoc != null) {
    return week.ky_truoc;
  }
  // Bản lưu cũ: tuần 2 trở đi so với dự báo tuần liền trước.
  if (index > 0) {
    return product.ket_qua[index - 1]?.so_luong_du_bao ?? null;
  }
  return null;
}
function previousTitle(week: ChiTietDuBao, hasValue: boolean): string {
  if (!hasValue) return "Chưa có kỳ trước";
  switch (week.loai_ky_truoc) {
    case "THUC_TE_TUAN_TRUOC":
      return "Tuần liền trước (thực tế)";
    case "THUC_TE_GAN_NHAT":
      return week.ky_truoc_tu_ngay
        ? `Tuần thực tế gần nhất (từ ${shortDate(week.ky_truoc_tu_ngay)})`
        : "Tuần thực tế gần nhất";
    case "DU_BAO_TUAN_TRUOC":
      return "Dự báo tuần trước";
    default:
      return "Kỳ trước";
  }
}
// Câu mô tả nguồn đối chiếu của một tuần (theo sản phẩm đầu tiên).
function referenceNote(
  product: DuBaoSanPham | undefined,
  index: number,
): string {
  const week = product?.ket_qua[index];
  if (!week) return "";
  if (week.ky_truoc == null && index === 0) {
    return "Chưa có số liệu thực tế để đối chiếu.";
  }
  if (index > 0) {
    return `So với dự báo của tuần ${index}.`;
  }
  if (week.loai_ky_truoc === "THUC_TE_GAN_NHAT") {
    return `So với tuần thực tế gần nhất có dữ liệu${
      week.ky_truoc_tu_ngay
        ? ` (bắt đầu ${shortDate(week.ky_truoc_tu_ngay)})`
        : ""
    }, vì dữ liệu bán hàng chưa cập nhật tới tuần liền trước.`;
  }
  return "So với tuần thực tế liền trước.";
}
interface WeekSummary {
  index: number;
  start: string;
  end: string;
  total: number;
  previous: number | null;
  holidays: string[];
  note: string;
}
function getWeeks(result: DuBaoResponse): WeekSummary[] {
  const first = result.ket_qua[0];
  if (!first) return [];
  return first.ket_qua.map((week, index) => {
    let total = 0;
    let previousTotal = 0;
    let hasPrevious = true;
    const holidays = new Set<string>();
    for (const product of result.ket_qua) {
      const item = product.ket_qua[index];
      if (!item) {
        hasPrevious = false;
        continue;
      }
      total += item.so_luong_du_bao;
      const previous = getPrevious(product, index);
      if (previous === null) {
        hasPrevious = false;
      } else {
        previousTotal += previous;
      }
      for (const holiday of item.ngay_le ?? []) {
        holidays.add(holiday);
      }
    }
    return {
      index,
      start: week.tu_ngay,
      end: week.den_ngay,
      total,
      previous: hasPrevious ? previousTotal : null,
      holidays: [...holidays],
      note: referenceNote(first, index),
    };
  });
}
/* ---------- chi tiết 1 sản phẩm trong 1 tuần ---------- */
function ProductDetail({
  product,
  weekIndex,
  evaluation,
}: {
  product: DuBaoSanPham;
  weekIndex: number;
  evaluation?: DanhGiaMoHinh;
}) {
  const week = product.ket_qua[weekIndex];
  if (!week) return null;
  const previous = getPrevious(product, weekIndex);
  const factors: YeuToDuBao[] = week.yeu_to?.length
    ? week.yeu_to
    : (product.yeu_to ?? []);
  const maxFactor = Math.max(
    1,
    ...factors.map(factor => Math.abs(factor.so_luong)),
  );
  return (
    <div className="db-product-expanded">
      <div className="db-product-metrics">
        <div>
          <small>Dự báo tuần {weekIndex + 1}</small>
          <strong className="blue">{fmt(week.so_luong_du_bao)}</strong>
          <span>
            {fmt(week.can_duoi)} – {fmt(week.can_tren)} sản phẩm
            (khoảng tin cậy 80%)
          </span>
        </div>
        <div>
          <small>{previousTitle(week, previous !== null)}</small>
          <strong>{fmt(previous)}</strong>
          <span>
            {previous === null
              ? "Chưa có dữ liệu để đối chiếu"
              : week.loai_ky_truoc === "DU_BAO_TUAN_TRUOC" ||
                  (week.ky_truoc == null && weekIndex > 0)
                ? "Số dự báo của tuần liền trước"
                : "Số liệu thực tế đã ghi nhận"}
          </span>
        </div>
        <div>
          <small>So với kỳ trước</small>
          <Change
            current={week.so_luong_du_bao}
            previous={previous}
          />
          <span>
            {compareSentence(week.so_luong_du_bao, previous)}
          </span>
        </div>
      </div>
      <div className="db-product-description">
        <strong>{product.phan_loai || "Dự báo nhu cầu"}.</strong>{" "}
        {product.dien_giai ||
          "Kết quả được ước lượng từ lịch sử đặt hàng bằng mô hình Prophet."}
      </div>
      <div className="db-detail-columns">
        <div className="db-detail-card">
          <h4>Thông tin tuần này</h4>
          <div className="db-info-line">
            <span>Ngày lễ trong tuần</span>
            <b>
              {week.ngay_le?.length
                ? week.ngay_le.join(", ")
                : "Không có"}
            </b>
          </div>
          <div className="db-info-line">
            <span>Chương trình khuyến mãi</span>
            <b>
              {week.chuong_trinh_km
                ? `${week.chuong_trinh_km}${
                    week.muc_giam_gia
                      ? ` (−${fmt((week.muc_giam_gia ?? 0) * 100)}%)`
                      : ""
                  }`
                : "Không có"}
            </b>
          </div>
          <div className="db-info-line">
            <span>Cùng kỳ năm trước (Seasonal Naive)</span>
            <b>{fmt(week.cung_ky)}</b>
          </div>
          <div className="db-info-line">
            <span>Sai số Prophet (sMAPE)</span>
            <b>
              {evaluation ? `${fmt(evaluation.smape)}%` : "—"}
            </b>
          </div>
        </div>
        <div className="db-detail-card">
          <h4>Nguyên nhân thay đổi so với kỳ trước</h4>
          {factors.length === 0 && (
            <p className="db-empty-text">
              {previous === null
                ? "Chưa có kỳ đối chiếu nên chưa phân tích được nguyên nhân."
                : "Bản lưu cũ không có phân tích nguyên nhân. Hãy chạy dự báo mới."}
            </p>
          )}
          {factors.map((factor, index) => (
            <div className="db-factor" key={`${factor.ten}-${index}`}>
              <div className="db-factor-head">
                <span>{factor.ten}</span>
                <b
                  className={
                    factor.so_luong > 0
                      ? "up"
                      : factor.so_luong < 0
                        ? "down"
                        : ""
                  }
                >
                  {fmtSigned(factor.so_luong)} sp
                </b>
              </div>
              <div className="db-factor-track">
                <div
                  className={
                    factor.so_luong < 0 ? "db-bar-down" : "db-bar-up"
                  }
                  style={{
                    width: `${
                      factor.so_luong === 0
                        ? 0
                        : Math.max(
                            4,
                            (Math.abs(factor.so_luong) / maxFactor) *
                              100,
                          )
                    }%`,
                  }}
                />
              </div>
              {factor.dien_giai && <p>{factor.dien_giai}</p>}
            </div>
          ))}
          {factors.length > 0 && (
            <p className="db-empty-text" style={{ marginTop: 8 }}>
              Các yếu tố là chênh lệch trước khi làm tròn số lượng,
              cộng lại bằng tổng chênh lệch của mô hình.
            </p>
          )}
        </div>
      </div>
      {product.canh_bao?.map((warning, index) => (
        <p className="db-warning" key={index}>
          {warning}
        </p>
      ))}
    </div>
  );
}
/* ---------- toàn bộ kết quả một lần chạy ---------- */
function ForecastResults({
  result,
  names,
}: {
  result: DuBaoResponse;
  names: Record<string, string>;
}) {
  const [expandedWeeks, setExpandedWeeks] = useState<number[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<string[]>(
    [],
  );
  const resultRef = useRef<HTMLDivElement>(null);
  const weeks = useMemo(() => getWeeks(result), [result]);
  const evaluationByProduct = useMemo(() => {
    const map = new Map<string, DanhGiaMoHinh>();
    for (const item of result.danh_gia_mo_hinh) {
      if (item.mo_hinh === "PROPHET" && !map.has(item.ma_san_pham)) {
        map.set(item.ma_san_pham, item);
      }
    }
    return map;
  }, [result]);
  const total = weeks.reduce((sum, week) => sum + week.total, 0);
  const previousValues = result.ket_qua.map(
    product => product.tong_ky_truoc,
  );
  const hasPrevious =
    previousValues.length > 0 &&
    previousValues.every(value => value != null);
  const previousTotal = hasPrevious
    ? previousValues.reduce<number>(
        (sum, value) => sum + (value ?? 0),
        0,
      )
    : null;
  const firstProduct = result.ket_qua[0];
  const previousRange =
    previousTotal !== null &&
    firstProduct?.tong_ky_truoc_tu_ngay &&
    firstProduct?.tong_ky_truoc_den_ngay
      ? ` (thực tế ${shortDate(firstProduct.tong_ky_truoc_tu_ngay)} – ${shortDate(firstProduct.tong_ky_truoc_den_ngay)})`
      : "";
  // Bán chạy / bán chậm: xếp theo tổng nhu cầu dự báo của kỳ này.
  const sorted = [...result.ket_qua].sort(
    (a, b) => productTotal(b) - productTotal(a),
  );
  const count = sorted.length;
  const topSize = count >= 5 ? 2 : count >= 2 ? 1 : 0;
  const best = sorted.slice(0, topSize);
  const slow = topSize
    ? sorted.slice(count - topSize).reverse()
    : [];
  const chartMax = Math.max(
    1,
    ...weeks.map(week => Math.max(week.total, week.previous ?? 0)),
  );
  const allExpanded =
    weeks.length > 0 && expandedWeeks.length === weeks.length;
  function toggleWeek(index: number) {
    setExpandedWeeks(current =>
      current.includes(index)
        ? current.filter(item => item !== index)
        : [...current, index],
    );
  }
  function toggleProduct(key: string) {
    setExpandedProducts(current =>
      current.includes(key)
        ? current.filter(item => item !== key)
        : [...current, key],
    );
  }
  // Bấm sản phẩm trong khung bán chạy / bán chậm: mở tuần 1 + sản phẩm đó.
  function focusProduct(code: string) {
    setExpandedWeeks(current =>
      current.includes(0) ? current : [...current, 0],
    );
    setExpandedProducts(current => {
      const key = `0-${code}`;
      return current.includes(key) ? current : [...current, key];
    });
    window.setTimeout(() => {
      resultRef.current
        ?.querySelector(`[data-key="0-${code}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }
  const ranking = (
    title: string,
    tone: "positive" | "negative",
    list: DuBaoSanPham[],
    startRank: (index: number) => number,
  ) => (
    <div className="db-inner-card">
      <h4 className={`db-ranking-title ${tone}`}>● {title}</h4>
      {list.length === 0 ? (
        <p className="db-empty-text">
          Cần dự báo từ 2 sản phẩm trở lên để xếp hạng.
        </p>
      ) : (
        list.map((product, index) => (
          <button
            type="button"
            className="db-ranking-item"
            key={product.ma_san_pham}
            onClick={() => focusProduct(product.ma_san_pham)}
          >
            <span className="db-rank-number">
              {startRank(index)}
            </span>
            <span className="db-ranking-name">
              <strong>{productName(product, names)}</strong>
              <small>
                {product.ma_san_pham} · {fmt(productTotal(product))}{" "}
                sản phẩm
              </small>
            </span>
            <Change
              current={productTotal(product)}
              previous={product.tong_ky_truoc ?? null}
            />
          </button>
        ))
      )}
    </div>
  );
  return (
    <div className="db-results" ref={resultRef}>
      <div className="db-section-heading">
        <div>
          <h3>Kết quả dự báo</h3>
          <p>
            Tổng nhu cầu dự kiến trong {weeks.length} tuần (
            {fmtDate(weeks[0]?.start)} –{" "}
            {fmtDate(weeks[weeks.length - 1]?.end)}).
          </p>
        </div>
        <span className="db-status-success">● Thành công</span>
      </div>
      <div className="db-run-metrics">
        <div>
          <small>Mã lần chạy</small>
          <strong>{result.ma_lich_su_du_bao}</strong>
        </div>
        <div>
          <small>Thời gian chạy</small>
          <strong>{dateTime(result.thoi_gian_chay)}</strong>
        </div>
        <div>
          <small>Sản phẩm dự báo</small>
          <strong>{result.tong_san_pham}</strong>
        </div>
      </div>
      <div className="db-total-summary">
        <small>Tổng nhu cầu dự kiến</small>
        <div>
          <strong>{fmt(total)}</strong>
          <span>sản phẩm</span>
        </div>
        <div className="db-summary-comparison">
          <Change current={total} previous={previousTotal} />
          <span>
            Tổng kỳ trước: {fmt(previousTotal)}
            {previousRange}
          </span>
        </div>
      </div>
      <div className="db-overview-title db-section-heading">
        <div>
          <h3>Tổng quan nhu cầu</h3>
          <p>Nhu cầu theo từng tuần và sản phẩm bán chạy, bán chậm.</p>
        </div>
      </div>
      <div className="db-overview-grid">
        <div className="db-inner-card">
          <h4>Tổng nhu cầu theo tuần (sản phẩm)</h4>
          <div className="db-chart-legend">
            <span>
              <i className="db-legend-blue" /> Dự báo
            </span>
            <span>
              <i className="db-legend-dark" /> Tuần có dịp lễ
            </span>
            <span>
              <i className="db-legend-line" /> Kỳ trước (nếu có)
            </span>
          </div>
          <div className="db-chart-columns">
            {weeks.map(week => (
              <div className="db-chart-column" key={week.start}>
                <div className="db-chart-plot">
                  <div className="db-chart-area">
                    <b
                      className="db-chart-value"
                      style={{
                        bottom: `${(week.total / chartMax) * 100}%`,
                      }}
                    >
                      {fmt(week.total)}
                    </b>
                    <div
                      className={`db-chart-bar ${
                        week.holidays.length ? "holiday" : ""
                      }`}
                      style={{
                        height: `${Math.max(
                          1,
                          (week.total / chartMax) * 100,
                        )}%`,
                      }}
                    />
                    {week.previous !== null && (
                      <div
                        className="db-chart-previous"
                        title={`Kỳ trước: ${fmt(week.previous)}`}
                        style={{
                          bottom: `${(week.previous / chartMax) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
                <strong>Tuần {week.index + 1}</strong>
                <small>{shortDate(week.start)}</small>
              </div>
            ))}
          </div>
          <div className="db-holiday-tags">
            <b>Dịp lễ trong kỳ:</b>
            {weeks.every(week => week.holidays.length === 0) && (
              <small>Không có dịp lễ lớn</small>
            )}
            {weeks.flatMap(week =>
              week.holidays.map(holiday => (
                <span key={`${week.start}-${holiday}`}>
                  Tuần {week.index + 1} · {holiday}
                </span>
              )),
            )}
          </div>
        </div>
        <div className="db-ranking-column">
          {ranking(
            `Bán chạy nhất (top ${topSize})`,
            "positive",
            best,
            index => index + 1,
          )}
          {ranking(
            `Bán chậm nhất (top ${topSize})`,
            "negative",
            slow,
            index => count - index,
          )}
        </div>
      </div>
      <div className="db-details-section">
        <div className="db-section-heading">
          <div>
            <h3>Chi tiết dự báo</h3>
            <p>
              Nhấn vào một tuần để xem các sản phẩm, rồi nhấn vào sản
              phẩm để xem so với kỳ trước, chênh lệch và nguyên nhân.
            </p>
          </div>
          <button
            type="button"
            className="db-outline-button"
            onClick={() => {
              setExpandedWeeks(
                allExpanded ? [] : weeks.map(week => week.index),
              );
              if (allExpanded) setExpandedProducts([]);
            }}
          >
            {allExpanded ? "Thu gọn tất cả" : "Mở rộng tất cả"}
          </button>
        </div>
        <div className="db-week-table">
          <div className="db-week-header">
            <span>Tuần</span>
            <span>Dịp lễ</span>
            <span>Tổng nhu cầu</span>
            <span>So với tuần kỳ trước</span>
            <span />
          </div>
          {weeks.map(week => {
            const expanded = expandedWeeks.includes(week.index);
            return (
              <div className="db-week-block" key={week.start}>
                <button
                  type="button"
                  className="db-week-row"
                  onClick={() => toggleWeek(week.index)}
                  aria-expanded={expanded}
                >
                  <span className="db-week-name">
                    <b>Tuần {week.index + 1}</b>
                    <small>
                      {shortDate(week.start)} – {fmtDate(week.end)}
                    </small>
                  </span>
                  <span className="db-week-holiday">
                    {week.holidays.length
                      ? week.holidays.join(", ")
                      : "Không có"}
                  </span>
                  <strong className="db-blue-value">
                    {fmt(week.total)}
                  </strong>
                  <Change
                    current={week.total}
                    previous={week.previous}
                  />
                  <Icon name={expanded ? "down" : "right"} />
                </button>
                {expanded && (
                  <div className="db-week-expanded">
                    <div
                      className={`db-week-note ${
                        week.holidays.length ? "holiday" : ""
                      }`}
                    >
                      {week.holidays.length
                        ? `Tuần có ${week.holidays.join(", ")}.`
                        : "Tuần này không có dịp lễ lớn."}{" "}
                      {week.note}
                    </div>
                    <div className="db-product-table">
                      <div className="db-product-header">
                        <span>Sản phẩm</span>
                        <span>Dự báo</span>
                        <span>Kỳ trước</span>
                        <span>Chênh lệch</span>
                        <span />
                      </div>
                      {[...result.ket_qua]
                        .sort(
                          (a, b) =>
                            (b.ket_qua[week.index]?.so_luong_du_bao ??
                              0) -
                            (a.ket_qua[week.index]?.so_luong_du_bao ??
                              0),
                        )
                        .map(product => {
                          const item = product.ket_qua[week.index];
                          if (!item) return null;
                          const previous = getPrevious(
                            product,
                            week.index,
                          );
                          const key = `${week.index}-${product.ma_san_pham}`;
                          const productExpanded =
                            expandedProducts.includes(key);
                          return (
                            <div
                              className="db-product-block"
                              data-key={key}
                              key={product.ma_san_pham}
                            >
                              <button
                                type="button"
                                className={`db-product-row ${
                                  productExpanded ? "expanded" : ""
                                }`}
                                onClick={() => toggleProduct(key)}
                                aria-expanded={productExpanded}
                              >
                                <span className="db-product-name">
                                  <b>{product.ma_san_pham}</b>
                                  {" · "}
                                  {productName(product, names)}
                                </span>
                                <strong className="db-blue-value">
                                  {fmt(item.so_luong_du_bao)}
                                </strong>
                                <span>{fmt(previous)}</span>
                                <Change
                                  current={item.so_luong_du_bao}
                                  previous={previous}
                                />
                                <Icon
                                  name={productExpanded ? "down" : "right"}
                                  size={14}
                                />
                              </button>
                              {productExpanded && (
                                <ProductDetail
                                  product={product}
                                  weekIndex={week.index}
                                  evaluation={evaluationByProduct.get(
                                    product.ma_san_pham,
                                  )}
                                />
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="db-footer-note">
        Đơn vị: sản phẩm. Dự báo là ước lượng từ lịch sử đặt hàng bằng
        Prophet, không phải số lượng thực tế trong tương lai.
        {result.ngay_bat_dau_huan_luyen && result.ngay_ket_thuc_huan_luyen
          ? ` Dữ liệu huấn luyện: ${fmtDate(result.ngay_bat_dau_huan_luyen)} – ${fmtDate(result.ngay_ket_thuc_huan_luyen)}.`
          : ""}
        {result.ngay_du_lieu_cuoi
          ? ` Đơn hàng mới nhất: ${fmtDate(result.ngay_du_lieu_cuoi)}.`
          : ""}
      </p>
    </div>
  );
}
/* ---------- trang ---------- */
export default function DuBaoNhuCauPage({
  tenSanPham = {},
  mode = "du-bao",
}: Props) {
  const tab = mode;
  const [soTuan, setSoTuan] = useState<SoTuanDuBao>(4);
  const [products, setProducts] = useState<SanPhamDuBao[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productDropdown, setProductDropdown] = useState(false);
  const [weekDropdown, setWeekDropdown] = useState(false);
  const [result, setResult] = useState<DuBaoResponse | null>(null);
  const [history, setHistory] = useState<LichSuDuBao[]>([]);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyDetail, setHistoryDetail] =
    useState<DuBaoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const weekDropdownRef = useRef<HTMLDivElement>(null);
  const resultAnchorRef = useRef<HTMLDivElement>(null);
  // Tính lại mỗi lần render để luôn đúng khi qua tuần mới.
  const startDate = nextMonday();
  const endDate = addDays(startDate, soTuan * 7 - 1);
  const allSelected =
    products.length > 0 && selectedIds.length === products.length;
  const someSelected = selectedIds.length > 0 && !allSelected;
  const names = useMemo(() => {
    const output = { ...tenSanPham };
    for (const product of products) {
      output[product.ma] = product.ten;
    }
    return output;
  }, [products, tenSanPham]);
  useEffect(() => {
    let active = true;
    async function load() {
      const [catalogResult, latestResult, historyResult] =
        await Promise.allSettled([
          laySanPhamDuBao(),
          layDuBaoMoiNhat(),
          layLichSuDuBao(),
        ]);
      if (!active) return;
      if (catalogResult.status === "fulfilled") {
        const catalog = catalogResult.value;
        setProducts(catalog);
        setSelectedIds(catalog.map(product => product.ma));
      } else {
        setError(
          catalogResult.reason instanceof Error
            ? catalogResult.reason.message
            : "Không tải được danh sách sản phẩm.",
        );
      }
      if (latestResult.status === "fulfilled") {
        setResult(latestResult.value);
      }
      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value);
      }
      setProductsLoading(false);
      setLoading(false);
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!productDropdownRef.current?.contains(target)) {
        setProductDropdown(false);
      }
      if (!weekDropdownRef.current?.contains(target)) {
        setWeekDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, []);
  useEffect(() => {
    if (!running) {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(() => {
      setElapsed(value => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  function toggleProduct(id: string) {
    setSelectedIds(current =>
      current.includes(id)
        ? current.filter(item => item !== id)
        : [...current, id],
    );
  }
  async function reloadHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      setHistory(await layLichSuDuBao());
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? cause.message
          : "Không tải được lịch sử dự báo.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }
  async function runForecast() {
    if (running) return;
    if (selectedIds.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }
    setRunning(true);
    setError("");
    setProductDropdown(false);
    setWeekDropdown(false);
    try {
      const response = await chayDuBaoTheoYeuCau({
        so_tuan_du_bao: soTuan,
        ma_san_pham: selectedIds,
        khuyen_mai: [],
      });
      setResult(response);
      void reloadHistory();
      window.setTimeout(() => {
        resultAnchorRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Không thể chạy dự báo.",
      );
    } finally {
      setRunning(false);
    }
  }
  async function viewHistory(id: string) {
    setDetailLoading(true);
    setHistoryError("");
    try {
      setHistoryDetail(await layChiTietDuBao(id));
    } catch (cause) {
      setHistoryError(
        cause instanceof Error
          ? cause.message
          : "Không tải được chi tiết dự báo.",
      );
    } finally {
      setDetailLoading(false);
    }
  }
  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();
    if (!query) return history;
    return history.filter(item =>
      [
        item.ma_lich_su_du_bao,
        item.ho_ten_nguoi_thuc_hien,
        item.nguoi_thuc_hien,
        item.trang_thai,
      ]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query)),
    );
  }, [history, historyQuery]);
  const pickerLabel = productsLoading
    ? "Đang tải sản phẩm..."
    : selectedIds.length === 0
      ? "Chưa chọn sản phẩm"
      : allSelected
        ? `Tất cả sản phẩm (${products.length})`
        : `Đã chọn ${selectedIds.length}/${products.length} sản phẩm`;
  return (
    <div className="db-page">
      <main className="db-shell">
        <header className="db-page-header">
          <div className="db-page-icon">
            <Icon name={mode === "du-bao" ? "chart" : "clock"} size={22} />
          </div>
          <div>
            <h1>
              {mode === "du-bao"
                ? "Dự báo nhu cầu sản phẩm"
                : "Lịch sử dự báo"}
            </h1>
            <p>
              {mode === "du-bao"
                ? "Thiết lập, chạy dự báo và xem kết quả nhu cầu sản phẩm."
                : "Tra cứu và xem lại chi tiết các lần dự báo đã thực hiện."}
            </p>
          </div>
        </header>
        <div className="db-content">
          {tab === "du-bao" ? (
            <>
              <section className="db-config">
                <div className="db-config-heading">
                  <h3>Thiết lập dự báo</h3>
                  <p>
                    Chọn số tuần cần dự báo và các sản phẩm. Kỳ dự báo
                    bắt đầu từ tuần kế tiếp ({fmtDate(startDate)}).
                  </p>
                </div>
                <div className="db-config-grid">
                  <div className="db-field">
                    <label id="db-label-weeks">Số tuần dự báo</label>
                    <div
                      className="db-dropdown-wrapper"
                      ref={weekDropdownRef}
                    >
                      <button
                        type="button"
                        className="db-select-trigger"
                        aria-haspopup="listbox"
                        aria-expanded={weekDropdown}
                        aria-labelledby="db-label-weeks"
                        onClick={() => {
                          setWeekDropdown(value => !value);
                          setProductDropdown(false);
                        }}
                      >
                        <span>
                          {soTuan} tuần · {shortDate(startDate)} –{" "}
                          {shortDate(endDate)}
                        </span>
                        <Icon name="down" />
                      </button>
                      {weekDropdown && (
                        <div
                          className="db-dropdown-panel"
                          role="listbox"
                          aria-labelledby="db-label-weeks"
                        >
                          {SO_TUAN.map(weeks => (
                            <button
                              type="button"
                              role="option"
                              aria-selected={weeks === soTuan}
                              key={weeks}
                              className={`db-week-option ${
                                weeks === soTuan ? "selected" : ""
                              }`}
                              onClick={() => {
                                setSoTuan(weeks);
                                setWeekDropdown(false);
                              }}
                            >
                              <span>
                                {weeks === soTuan ? (
                                  <Icon name="check" />
                                ) : (
                                  <i className="db-option-gap" />
                                )}
                                {weeks} tuần
                              </span>
                              <small>
                                {shortDate(startDate)} –{" "}
                                {shortDate(
                                  addDays(startDate, weeks * 7 - 1),
                                )}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="db-field">
                    <label id="db-label-products">
                      Sản phẩm cần dự báo
                    </label>
                    <div
                      className="db-dropdown-wrapper"
                      ref={productDropdownRef}
                    >
                      <button
                        type="button"
                        className="db-select-trigger"
                        aria-haspopup="true"
                        aria-expanded={productDropdown}
                        aria-labelledby="db-label-products"
                        disabled={productsLoading}
                        onClick={() => {
                          setProductDropdown(value => !value);
                          setWeekDropdown(false);
                        }}
                      >
                        <span>{pickerLabel}</span>
                        <Icon name="down" />
                      </button>
                      {productDropdown && (
                        <div className="db-dropdown-panel db-product-dropdown">
                          <label className="db-checkbox-row db-all-products">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={element => {
                                if (element) {
                                  element.indeterminate = someSelected;
                                }
                              }}
                              onChange={() => {
                                setSelectedIds(
                                  allSelected
                                    ? []
                                    : products.map(
                                        product => product.ma,
                                      ),
                                );
                              }}
                            />
                            <b>Tất cả sản phẩm</b>
                            <small>
                              {selectedIds.length}/{products.length}
                            </small>
                          </label>
                          <div className="db-product-options">
                            {products.map(product => (
                              <label
                                className="db-checkbox-row"
                                key={product.ma}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(
                                    product.ma,
                                  )}
                                  onChange={() =>
                                    toggleProduct(product.ma)
                                  }
                                />
                                <span>
                                  <b>{product.ma}</b> · {product.ten}
                                </span>
                              </label>
                            ))}
                          </div>
                          <div className="db-dropdown-footer">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedIds(
                                  products.map(item => item.ma),
                                )
                              }
                            >
                              Chọn tất cả
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedIds([])}
                            >
                              Bỏ chọn
                            </button>
                            <button
                              type="button"
                              className="db-done-button"
                              onClick={() => setProductDropdown(false)}
                            >
                              Xong
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="db-config-footer">
                  <span>
                    <Icon name="calendar" />
                    Dự báo {soTuan} tuần ({fmtDate(startDate)} –{" "}
                    {fmtDate(endDate)}) cho {selectedIds.length} sản
                    phẩm.
                  </span>
                  <button
                    type="button"
                    className="db-primary-button"
                    disabled={
                      running ||
                      productsLoading ||
                      selectedIds.length === 0
                    }
                    onClick={() => void runForecast()}
                  >
                    <Icon name="bolt" />
                    {running ? "Đang chạy..." : "Chạy dự báo"}
                  </button>
                </div>
              </section>
              {error && (
                <div className="db-error" role="alert">
                  {error}
                </div>
              )}
              <div ref={resultAnchorRef} />
              {running && (
                <section className="db-progress-panel" aria-live="polite">
                  <h3>Đang chạy dự báo...</h3>
                  <p>
                    Đang huấn luyện Prophet, đánh giá với Seasonal Naive
                    cho {selectedIds.length} sản phẩm. Đã chạy {elapsed}{" "}
                    giây.
                  </p>
                  <div className="db-progress-track">
                    <div className="db-progress-indeterminate" />
                  </div>
                </section>
              )}
              {!running && loading && (
                <p className="db-loading-text">
                  Đang tải kết quả dự báo...
                </p>
              )}
              {!running && !loading && result && (
                <ForecastResults
                  key={result.ma_lich_su_du_bao}
                  result={result}
                  names={names}
                />
              )}
              {!running && !loading && !result && (
                <div className="db-placeholder">
                  <Icon name="chart" size={28} />
                  <h3>Chưa có kết quả dự báo</h3>
                  <p>
                    Chọn số tuần và sản phẩm ở trên rồi nhấn Chạy dự
                    báo để xem kết quả.
                  </p>
                </div>
              )}
            </>
          ) : (
            <section className="db-history-section">
              {historyDetail || detailLoading ? (
                <>
                  <div className="db-section-heading">
                    <div>
                      <h3>
                        Chi tiết lần chạy{" "}
                        {historyDetail?.ma_lich_su_du_bao ?? ""}
                      </h3>
                      <p>Xem lại kết quả đã lưu của lần dự báo này.</p>
                    </div>
                    <button
                      type="button"
                      className="db-outline-button"
                      onClick={() => setHistoryDetail(null)}
                    >
                      <Icon name="left" size={14} />
                      Quay lại danh sách
                    </button>
                  </div>
                  {historyError && (
                    <div className="db-error" role="alert">
                      {historyError}
                    </div>
                  )}
                  {detailLoading && (
                    <p className="db-loading-text">
                      Đang tải chi tiết dự báo...
                    </p>
                  )}
                  {!detailLoading && historyDetail && (
                    <ForecastResults
                      key={historyDetail.ma_lich_su_du_bao}
                      result={historyDetail}
                      names={names}
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="db-section-heading">
                    <div>
                      <h3>Lịch sử các lần dự báo</h3>
                      <p>
                        Chọn Xem để mở lại kết quả đã lưu, giao diện
                        giống hệt lúc vừa chạy.
                      </p>
                    </div>
                  </div>
                  <input
                    type="search"
                    className="db-history-search"
                    aria-label="Tìm trong lịch sử"
                    placeholder="Tìm theo mã, người thực hiện..."
                    value={historyQuery}
                    onChange={event =>
                      setHistoryQuery(event.target.value)
                    }
                  />
                  {historyError && (
                    <div className="db-error" role="alert">
                      {historyError}
                    </div>
                  )}
                  {historyLoading ? (
                    <p className="db-loading-text">
                      Đang tải lịch sử...
                    </p>
                  ) : (
                    <div className="db-history-table-wrap">
                      <table className="db-history-table">
                        <thead>
                          <tr>
                            <th>Mã lần chạy</th>
                            <th>Thời gian chạy</th>
                            <th>Người thực hiện</th>
                            <th>Số tuần</th>
                            <th>Sản phẩm</th>
                            <th>Trạng thái</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {filteredHistory.map(item => (
                            <tr key={item.ma_lich_su_du_bao}>
                              <td>
                                <b>{item.ma_lich_su_du_bao}</b>
                              </td>
                              <td>{dateTime(item.thoi_gian_chay)}</td>
                              <td>
                                {item.ho_ten_nguoi_thuc_hien ||
                                  item.nguoi_thuc_hien ||
                                  "—"}
                              </td>
                              <td>{item.so_tuan_du_bao} tuần</td>
                              <td>{fmt(item.tong_san_pham)}</td>
                              <td>
                                <span className="db-status-success">
                                  {item.trang_thai}
                                </span>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="db-text-button"
                                  onClick={() =>
                                    void viewHistory(
                                      item.ma_lich_su_du_bao,
                                    )
                                  }
                                >
                                  Xem
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredHistory.length === 0 && (
                            <tr>
                              <td colSpan={7} className="db-empty-text">
                                {history.length === 0
                                  ? "Chưa có lịch sử dự báo."
                                  : "Không có lần chạy nào khớp từ khóa."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
