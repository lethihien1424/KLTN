///D:\KLTN\KLTN\frontend\src\pages\du-bao\DuBaoNhuCauPage.tsx
import { useEffect, useRef, useState } from "react";

import {
  duBaoNhuCau,
  layLichSuDuBao,
  layChiTietDuBao,
  layDuBaoMoiNhat,
  type DuBaoResponse,
  type LichSuDuBao,
  type SoTuanDuBao,
} from "../../services/duBaoService";

import { getMe } from "../../services/authService";

import "../../../public/DuBaoNhuCau.css";

type Props = {
  tenSanPham?: Record<string, string>;
};

type Tab = "chay" | "lich-su";

type ForecastSession = {
  latest: DuBaoResponse | null;
  pending: Promise<DuBaoResponse> | null;
};

/*
 * Giữ kết quả khi chuyển chức năng trong cùng phiên ứng dụng.
 * Khi tải lại trình duyệt, trang lấy kết quả mới nhất từ database.
 */
const sessions = new Map<string, ForecastSession>();

function getSession(accountId: string): ForecastSession {
  const existing = sessions.get(accountId);

  if (existing) {
    return existing;
  }

  const session: ForecastSession = {
    latest: null,
    pending: null,
  };

  sessions.set(accountId, session);
  return session;
}

function keepNewest(
  session: ForecastSession,
  result: DuBaoResponse,
): void {
  if (
    !session.latest ||
    Date.parse(result.thoi_gian_chay) >=
      Date.parse(session.latest.thoi_gian_chay)
  ) {
    session.latest = result;
  }
}

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const timeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const [year, month, day] = value.slice(0, 10).split("-");

  return year && month && day
    ? `${day}/${month}/${year}`
    : value;
}

function formatTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : timeFormatter.format(date);
}

function getErrorMessage(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : "Không thể tải dữ liệu. Vui lòng thử lại.";
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "THANH_CONG"
      ? "Thành công"
      : status === "THAT_BAI"
        ? "Thất bại"
        : status === "DANG_CHAY"
          ? "Đang chạy"
          : status;

  const colorClass =
    status === "THANH_CONG"
      ? "db-status-success"
      : status === "THAT_BAI"
        ? "db-status-error"
        : "db-status-neutral";

  return (
    <span className={`db-status ${colorClass}`}>
      <span className="db-status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

/*
 * Dùng chung cho kết quả mới nhất và xem chi tiết lịch sử.
 */
function ForecastResult({
  result,
  tenSanPham,
}: {
  result: DuBaoResponse;
  tenSanPham: Record<string, string>;
}) {
  const totalForecast = result.ket_qua.reduce(
    (total, product) =>
      total +
      product.ket_qua.reduce(
        (sum, week) => sum + week.so_luong_du_bao,
        0,
      ),
    0,
  );

  return (
    <div className="db-result">
      <div className="db-result-heading">
        <div>
          <h2>Kết quả dự báo</h2>
          <p>
            Tổng nhu cầu tiêu thụ dự kiến trong{" "}
            {result.so_tuan_du_bao} tuần.
          </p>
        </div>

        <StatusBadge status="THANH_CONG" />
      </div>

      <div className="db-overview">
        <div>
          <span>Mã lần chạy</span>
          <strong>{result.ma_lich_su_du_bao}</strong>
        </div>

        <div>
          <span>Thời gian chạy</span>
          <strong>{formatTime(result.thoi_gian_chay)}</strong>
        </div>

        <div>
          <span>Sản phẩm dự báo</span>
          <strong>{result.tong_san_pham}</strong>
        </div>

        <div>
          <span>Tổng nhu cầu dự kiến</span>
          <strong>
            {formatNumber(totalForecast)}
            <small> sản phẩm</small>
          </strong>
        </div>
      </div>

      <section className="db-section">
        <div className="db-section-heading">
          <h3>Tổng hợp nhu cầu theo sản phẩm</h3>
          <p>
            Nhu cầu dự kiến và sai số đánh giá của từng sản phẩm.
          </p>
        </div>

        <div className="db-table-scroll db-bordered-table">
          <table className="db-table">
            <thead>
              <tr>
                <th scope="col">Sản phẩm</th>
                <th scope="col">Từ ngày</th>
                <th scope="col">Đến ngày</th>
                <th scope="col" className="db-num">
                  Tổng nhu cầu
                </th>
                <th scope="col" className="db-num">
                  Sai số sMAPE
                </th>
              </tr>
            </thead>

            <tbody>
              {result.ket_qua.map(product => {
                const firstWeek = product.ket_qua[0];

                const lastWeek =
                  product.ket_qua[product.ket_qua.length - 1];

                const quantity = product.ket_qua.reduce(
                  (sum, week) => sum + week.so_luong_du_bao,
                  0,
                );

                const evaluation =
                  result.danh_gia_mo_hinh.find(
                    item =>
                      item.ma_san_pham === product.ma_san_pham &&
                      item.mo_hinh.toUpperCase() === "PROPHET" &&
                      item.horizon === result.so_tuan_du_bao,
                  );

                return (
                  <tr key={product.ma_san_pham}>
                    <th scope="row">
                      <span className="db-product-name">
                        {tenSanPham[product.ma_san_pham] ||
                          product.ma_san_pham}
                      </span>

                      {tenSanPham[product.ma_san_pham] && (
                        <small className="db-product-code">
                          {product.ma_san_pham}
                        </small>
                      )}
                    </th>

                    <td>
                      {formatDate(firstWeek?.tu_ngay ?? null)}
                    </td>

                    <td>
                      {formatDate(lastWeek?.den_ngay ?? null)}
                    </td>

                    <td className="db-num db-emphasis">
                      {formatNumber(quantity)}
                    </td>

                    <td className="db-num">
                      {evaluation ? (
                        <span
                          title={
                            "Sai số tuyệt đối trung bình: " +
                            formatNumber(evaluation.mae) +
                            " sản phẩm"
                          }
                        >
                          {percentFormatter.format(evaluation.smape)}%
                        </span>
                      ) : (
                        <span className="db-muted">
                          Chưa có đánh giá
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {result.ket_qua.length === 0 && (
                <tr>
                  <td colSpan={5} className="db-empty">
                    Không có sản phẩm để hiển thị.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <th scope="row" colSpan={3}>
                  Tổng số lượng tất cả sản phẩm
                </th>

                <td className="db-num db-emphasis">
                  {formatNumber(totalForecast)}
                </td>

                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="db-note">
          Đơn vị: sản phẩm. sMAPE đo sai số trên dữ liệu kiểm định;
          giá trị càng thấp thì sai số càng nhỏ.
        </p>
      </section>

      <section className="db-section">
        <div className="db-section-heading">
          <h3>Chi tiết dự báo từng tuần</h3>
        </div>

        <div className="db-products">
          {result.ket_qua.map((product, index) => {
            const productTotal = product.ket_qua.reduce(
              (sum, week) => sum + week.so_luong_du_bao,
              0,
            );

            return (
              <details
                className="db-product-detail"
                key={`${result.ma_lich_su_du_bao}-${product.ma_san_pham}`}
                open={index === 0}
              >
                <summary>
                  <span className="db-detail-name">
                    {tenSanPham[product.ma_san_pham] ||
                      product.ma_san_pham}
                  </span>

                  <span className="db-detail-total">
                    {formatNumber(productTotal)} sản phẩm
                  </span>
                </summary>

                <div className="db-table-scroll">
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th scope="col">Tuần</th>
                        <th scope="col">Từ ngày</th>
                        <th scope="col">Đến ngày</th>
                        <th scope="col" className="db-num">
                          Nhu cầu dự báo
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {product.ket_qua.map((week, weekIndex) => (
                        <tr key={week.tu_ngay}>
                          <th scope="row">
                            Tuần {weekIndex + 1}
                          </th>

                          <td>{formatDate(week.tu_ngay)}</td>
                          <td>{formatDate(week.den_ngay)}</td>

                          <td className="db-num db-emphasis">
                            {formatNumber(week.so_luong_du_bao)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default function DuBaoNhuCauPage({
  tenSanPham = {},
}: Props) {
  const [tab, setTab] = useState<Tab>("chay");
  const [soTuan, setSoTuan] = useState<SoTuanDuBao>(4);

  const [accountId, setAccountId] = useState("");
  const [canRun, setCanRun] = useState(false);

  const [result, setResult] =
    useState<DuBaoResponse | null>(null);

  const [history, setHistory] = useState<LichSuDuBao[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [viewResult, setViewResult] =
    useState<DuBaoResponse | null>(null);

  const [initialLoading, setInitialLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewLoadingId, setViewLoadingId] = useState("");

  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [search, setSearch] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);

  const mountedRef = useRef(false);
  const viewRequestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    const controller = new AbortController();

    async function initialize(): Promise<void> {
      try {
        const user = await getMe();

        if (controller.signal.aborted) {
          return;
        }

        setAccountId(user.ma_nguoi_dung);

        setCanRun(
          [
            "ADMIN",
            "QUAN_LY_BAN_HANG",
            "NHAN_VIEN_BAN_HANG",
          ].includes(user.vai_tro),
        );

        const session = getSession(user.ma_nguoi_dung);

        setResult(session.latest);

        if (session.latest) {
          setSoTuan(session.latest.so_tuan_du_bao);
        }

        /*
         * Chuyển chức năng trong lúc đang chạy:
         * quay lại sẽ chờ cùng yêu cầu, không chạy thêm lần nữa.
         */
        if (session.pending) {
          setRunning(true);

          try {
            await session.pending;
          } catch (cause) {
            if (!controller.signal.aborted) {
              setError(getErrorMessage(cause));
            }
          } finally {
            if (!controller.signal.aborted) {
              setResult(session.latest);
              setRunning(false);
            }
          }
        }

        if (controller.signal.aborted) {
          return;
        }

        try {
          const latest = await layDuBaoMoiNhat(
            controller.signal,
          );

          if (controller.signal.aborted) {
            return;
          }

          if (latest) {
            keepNewest(session, latest);
          }

          setResult(session.latest);

          if (session.latest) {
            setSoTuan(session.latest.so_tuan_du_bao);
          }
        } catch (cause) {
          if (!controller.signal.aborted) {
            setError(getErrorMessage(cause));
          }
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(cause));
        }
      } finally {
        if (!controller.signal.aborted) {
          setInitialLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      mountedRef.current = false;
      viewRequestRef.current += 1;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (tab !== "lich-su" || !accountId) {
      return;
    }

    const controller = new AbortController();

    setHistoryLoading(true);
    setHistoryError("");

    layLichSuDuBao(controller.signal)
      .then(rows => {
        if (!controller.signal.aborted) {
          setHistory(rows);
          setHistoryLoaded(true);
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setHistoryError(getErrorMessage(cause));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [tab, accountId, historyVersion]);

  async function handleRunForecast(): Promise<void> {
    if (!accountId || !canRun || initialLoading) {
      return;
    }

    const session = getSession(accountId);

    if (session.pending) {
      return;
    }

    setRunning(true);
    setError("");

    /*
     * Không hủy yêu cầu chạy khi chuyển menu.
     * Kết quả vẫn được cập nhật vào session khi hoàn tất.
     */
    const request = duBaoNhuCau(soTuan).then(response => {
      keepNewest(session, response);
      return response;
    });

    session.pending = request;

    try {
      await request;

      if (mountedRef.current) {
        setResult(session.latest);
        setHistoryVersion(version => version + 1);
      }
    } catch (cause) {
      if (mountedRef.current) {
        setError(getErrorMessage(cause));
      }
    } finally {
      if (session.pending === request) {
        session.pending = null;
      }

      if (mountedRef.current) {
        setRunning(false);
      }
    }
  }

  async function handleViewForecast(id: string): Promise<void> {
    const requestId = ++viewRequestRef.current;

    setViewLoadingId(id);
    setHistoryError("");

    try {
      const detail = await layChiTietDuBao(id);

      if (
        mountedRef.current &&
        requestId === viewRequestRef.current
      ) {
        setViewResult(detail);
      }
    } catch (cause) {
      if (
        mountedRef.current &&
        requestId === viewRequestRef.current
      ) {
        setHistoryError(getErrorMessage(cause));
      }
    } finally {
      if (
        mountedRef.current &&
        requestId === viewRequestRef.current
      ) {
        setViewLoadingId("");
      }
    }
  }

  function changeTab(nextTab: Tab): void {
    viewRequestRef.current += 1;
    setViewLoadingId("");
    setViewResult(null);
    setTab(nextTab);
  }

  const keyword = search.trim().toLocaleLowerCase("vi");

  const filteredHistory = history.filter(item => {
    const text = [
      item.ma_lich_su_du_bao,
      item.nguoi_thuc_hien || "",
      item.ho_ten_nguoi_thuc_hien || "",
    ]
      .join(" ")
      .toLocaleLowerCase("vi");

    return text.includes(keyword);
  });

  return (
    <div className="db-page">
      <section className="db-shell">
        <header className="db-heading">
          <span className="db-heading-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4v16h16M8 15l4-5 4 2 4-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <div>
            <h1>Dự báo nhu cầu sản phẩm</h1>
            <p>
              Chạy dự báo và xem lại kết quả của các lần dự báo.
            </p>
          </div>
        </header>

        <nav
          className="db-tabs"
          aria-label="Chức năng dự báo"
        >
          <button
            type="button"
            className={tab === "chay" ? "is-selected" : ""}
            aria-current={tab === "chay" ? "page" : undefined}
            onClick={() => changeTab("chay")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m13 3-8 10h6l-1 8 9-11h-6l1-7Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>

            Chạy dự báo
          </button>

          <button
            type="button"
            className={tab === "lich-su" ? "is-selected" : ""}
            aria-current={tab === "lich-su" ? "page" : undefined}
            onClick={() => changeTab("lich-su")}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="8"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M12 7v5l3 2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            Lịch sử các lần dự báo

            {historyLoaded && (
              <span className="db-tab-count">
                {history.length}
              </span>
            )}
          </button>
        </nav>

        <div className="db-body">
          {tab === "chay" ? (
            <>
              <section className="db-run-panel">
                <div>
                  <h2>Chọn kỳ dự báo</h2>
                  <p>
                    Dự báo nhu cầu sản phẩm trong 4 hoặc 8 tuần tới.
                  </p>
                </div>

                <div className="db-run-controls">
                  <div
                    className="db-segment"
                    role="group"
                    aria-label="Kỳ dự báo"
                  >
                    {([4, 8] as const).map(weeks => (
                      <button
                        key={weeks}
                        type="button"
                        aria-pressed={soTuan === weeks}
                        disabled={running || initialLoading}
                        className={
                          soTuan === weeks ? "is-selected" : ""
                        }
                        onClick={() => setSoTuan(weeks)}
                      >
                        {weeks} tuần
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="db-button db-primary"
                    disabled={
                      running ||
                      initialLoading ||
                      !canRun ||
                      !accountId
                    }
                    onClick={() => void handleRunForecast()}
                  >
                    {running && (
                      <span
                        className="db-spinner"
                        aria-hidden="true"
                      />
                    )}

                    {running
                      ? "Đang chạy dự báo..."
                      : "Chạy dự báo"}
                  </button>
                </div>
              </section>

              {!initialLoading && !canRun && accountId && (
                <p className="db-note">
                  Tài khoản của bạn được xem kết quả dự báo.
                </p>
              )}

              {error && (
                <div className="db-alert" role="alert">
                  {error}

                  {result && (
                    <p>
                      Kết quả dự báo đã có vẫn được giữ bên dưới.
                    </p>
                  )}
                </div>
              )}

              {running && (
                <div className="db-loading" role="status">
                  <span
                    className="db-spinner"
                    aria-hidden="true"
                  />

                  Đang tính toán dự báo. Kết quả sẽ được cập nhật
                  khi hoàn tất.
                </div>
              )}

              {result ? (
                <>
                  {soTuan !== result.so_tuan_du_bao && (
                    <p className="db-note">
                      Bạn đang chọn {soTuan} tuần. Kết quả bên dưới
                      thuộc lần dự báo {result.so_tuan_du_bao} tuần.
                    </p>
                  )}

                  <ForecastResult
                    key={result.ma_lich_su_du_bao}
                    result={result}
                    tenSanPham={tenSanPham}
                  />
                </>
              ) : (
                <div className="db-empty">
                  <strong>
                    {initialLoading
                      ? "Đang tải kết quả dự báo..."
                      : running
                        ? "Đang tính toán dự báo..."
                        : "Chưa có kết quả dự báo"}
                  </strong>

                  <p>
                    {initialLoading || running
                      ? "Vui lòng chờ trong giây lát."
                      : "Kết quả sẽ hiển thị tại đây sau khi chạy dự báo."}
                  </p>
                </div>
              )}
            </>
          ) : viewResult ? (
            <>
              <div className="db-view-toolbar">
                <button
                  type="button"
                  className="db-button"
                  onClick={() => setViewResult(null)}
                >
                  ← Quay lại lịch sử
                </button>

                <span>
                  Chi tiết lần dự báo{" "}
                  <strong>
                    {viewResult.ma_lich_su_du_bao}
                  </strong>
                </span>
              </div>

              <ForecastResult
                key={viewResult.ma_lich_su_du_bao}
                result={viewResult}
                tenSanPham={tenSanPham}
              />
            </>
          ) : (
            <>
              <div className="db-history-toolbar">
                <div>
                  <h2>Lịch sử dự báo</h2>
                  <p>
                    {historyLoaded
                      ? `${history.length} lần dự báo đã lưu`
                      : "Các lần dự báo đã lưu trong hệ thống"}
                  </p>
                </div>

                <div className="db-history-tools">
                  <input
                    type="search"
                    value={search}
                    onChange={event =>
                      setSearch(event.target.value)
                    }
                    placeholder="Tìm mã lần chạy hoặc người thực hiện..."
                    aria-label="Tìm lịch sử dự báo"
                  />

                  <button
                    type="button"
                    className="db-button"
                    disabled={historyLoading}
                    onClick={() =>
                      setHistoryVersion(version => version + 1)
                    }
                  >
                    Làm mới
                  </button>
                </div>
              </div>

              {historyError && (
                <div className="db-alert" role="alert">
                  {historyError}
                </div>
              )}

              {historyLoading && history.length > 0 && (
                <div className="db-loading" role="status">
                  <span
                    className="db-spinner"
                    aria-hidden="true"
                  />

                  Đang cập nhật lịch sử dự báo...
                </div>
              )}

              <div className="db-table-scroll db-bordered-table">
                <table
                  className="db-table db-history-table"
                  aria-busy={historyLoading}
                >
                  <thead>
                    <tr>
                      <th scope="col">Mã lần chạy</th>
                      <th scope="col">Thời gian chạy</th>
                      <th scope="col">Dữ liệu huấn luyện</th>
                      <th scope="col">Kỳ dự báo</th>
                      <th scope="col">Người thực hiện</th>
                      <th scope="col">Trạng thái</th>
                      <th scope="col" className="db-center">
                        Thao tác
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredHistory.map(item => (
                      <tr key={item.ma_lich_su_du_bao}>
                        <th scope="row" className="db-emphasis">
                          {item.ma_lich_su_du_bao}
                        </th>

                        <td>
                          {formatTime(item.thoi_gian_chay)}
                        </td>

                        <td>
                          {item.ngay_bat_dau_huan_luyen &&
                          item.ngay_ket_thuc_huan_luyen
                            ? `${formatDate(
                                item.ngay_bat_dau_huan_luyen,
                              )} → ${formatDate(
                                item.ngay_ket_thuc_huan_luyen,
                              )}`
                            : "—"}
                        </td>

                        <td>
                          {item.so_tuan_du_bao} tuần
                        </td>

                        <td>
                          {item.ho_ten_nguoi_thuc_hien ||
                            item.nguoi_thuc_hien ||
                            "—"}
                        </td>

                        <td>
                          <StatusBadge
                            status={item.trang_thai}
                          />
                        </td>

                        <td className="db-center">
                          <button
                            type="button"
                            className="db-view-button"
                            disabled={
                              Boolean(viewLoadingId) ||
                              item.trang_thai !== "THANH_CONG"
                            }
                            onClick={() =>
                              void handleViewForecast(
                                item.ma_lich_su_du_bao,
                              )
                            }
                            aria-label={
                              `Xem lần dự báo ${item.ma_lich_su_du_bao}`
                            }
                          >
                            {viewLoadingId ===
                            item.ma_lich_su_du_bao ? (
                              <span
                                className="db-spinner"
                                aria-hidden="true"
                              />
                            ) : (
                              "Xem"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="db-empty">
                          {historyLoading
                            ? "Đang tải lịch sử dự báo..."
                            : historyError
                              ? "Chưa tải được lịch sử dự báo."
                              : search.trim()
                                ? "Không tìm thấy lần dự báo phù hợp."
                                : "Chưa có lịch sử dự báo."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </>
          )}
        </div>
      </section>
    </div>
  );
}