import { useEffect, useRef, useState } from "react";

import {
  duBaoNhuCau,
  type DuBaoResponse,
} from "../../services/duBaoService";

type Props = {
  tenSanPham?: Record<string, string>;
};

type SoTuan = 4 | 8;

const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");

  return year && month && day
    ? `${day}/${month}/${year}`
    : value;
}

function formatRunTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function SoLuong({ value }: { value: number }) {
  return (
    <>
      {formatNumber(value)}{" "}
      <span className="db-unit-inline">sản phẩm</span>
    </>
  );
}

export default function DuBaoNhuCauPage({
  tenSanPham = {},
}: Props) {
  const [soTuan, setSoTuan] = useState<SoTuan>(4);
  const [result, setResult] = useState<DuBaoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const controllerRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      runningRef.current = false;
    };
  }, []);

  async function handleRunForecast(): Promise<void> {
    if (runningRef.current) {
      return;
    }

    runningRef.current = true;

    const requestId = ++requestIdRef.current;
    const selectedWeeks = soTuan;

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      const response = await duBaoNhuCau(
        selectedWeeks,
        controller.signal,
      );

      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setResult(response);
    } catch (cause: unknown) {
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      console.error("Lỗi chạy dự báo:", cause);

      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Không thể chạy dự báo lúc này. Vui lòng thử lại.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        runningRef.current = false;
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }

  const totalForecast =
    result?.ket_qua.reduce(
      (total, product) =>
        total +
        product.ket_qua.reduce(
          (sum, week) => sum + week.so_luong_du_bao,
          0,
        ),
      0,
    ) ?? 0;

  const resultWeeks = result?.so_tuan_du_bao ?? soTuan;

  return (
    <div className="db-page">
      <header className="db-page-head">
        <div className="db-page-head-main">
          <div className="db-page-head-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 19h16M7 16V9m5 7V5m5 11v-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div>
            <h1>Dự Báo Nhu Cầu Sản Phẩm</h1>
            <p>
              Ước tính nhu cầu tiêu thụ bằng mô hình Prophet,
              hỗ trợ chủ động lập kế hoạch sản xuất.
            </p>
          </div>
        </div>

        <span
          className={
            "db-status-pill " +
            (result ? "db-status-done" : "db-status-idle")
          }
        >
          <span className="db-status-dot" aria-hidden="true" />

          {result
            ? `Cập nhật lần gần nhất: ${formatRunTime(
                result.thoi_gian_chay,
              )}`
            : "Chưa có kết quả dự báo"}
        </span>
      </header>

      <div className="db-content">
        {error && (
          <div className="db-alert db-error" role="alert">
            {error}

            {result && (
              <div>
                Dữ liệu bên dưới thuộc lần dự báo thành công trước.
              </div>
            )}
          </div>
        )}

        <section className="db-card">
          <div className="db-card-head">
            <span className="db-step">1</span>

            <div>
              <h2>Chọn kỳ dự báo</h2>
              <p>
                Chọn 4 hoặc 8 tuần rồi nhấn Chạy dự báo.
              </p>
            </div>
          </div>

          <div className="db-controls">
            <div className="db-control">
              <span id="forecast-period-label">Kỳ dự báo</span>

              <div
                className="db-segment"
                role="group"
                aria-labelledby="forecast-period-label"
              >
                <button
                  type="button"
                  className={soTuan === 4 ? "active" : ""}
                  aria-pressed={soTuan === 4}
                  disabled={loading}
                  onClick={() => setSoTuan(4)}
                >
                  4 tuần
                </button>

                <button
                  type="button"
                  className={soTuan === 8 ? "active" : ""}
                  aria-pressed={soTuan === 8}
                  disabled={loading}
                  onClick={() => setSoTuan(8)}
                >
                  8 tuần
                </button>
              </div>
            </div>

            <button
              type="button"
              className="db-primary db-run"
              disabled={loading}
              onClick={() => void handleRunForecast()}
            >
              {loading ? (
                <>
                  <span className="db-spinner" aria-hidden="true" />
                  Đang chạy dự báo...
                </>
              ) : (
                "Chạy dự báo"
              )}
            </button>
          </div>

          <p className="db-meta">
            Dự báo toàn bộ danh mục sản phẩm đang kinh doanh
            trong 4 hoặc 8 tuần tới, bắt đầu từ tuần kế tiếp.
          </p>

          {result && result.so_tuan_du_bao !== soTuan && (
            <p className="db-hint">
              Bạn đang chọn {soTuan} tuần. Kết quả bên dưới
              thuộc kỳ {result.so_tuan_du_bao} tuần của lần
              chạy trước. Nhấn Chạy dự báo để cập nhật.
            </p>
          )}
        </section>

        <section className="db-card" aria-busy={loading}>
          <div className="db-card-head">
            <span className="db-step">2</span>

            <div>
              <h2>
                Kết quả dự báo
                {result ? ` — ${resultWeeks} tuần tới` : ""}
              </h2>

              <p>
                Tổng nhu cầu tiêu thụ dự kiến và kết quả
                đánh giá mô hình theo từng sản phẩm.
              </p>
            </div>
          </div>

          {loading && (
            <div className="db-loading" role="status">
              <span className="db-spinner" aria-hidden="true" />

              {result
                ? "Đang cập nhật kết quả mới. Kết quả lần trước vẫn được giữ bên dưới."
                : "Đang tính toán dự báo. Vui lòng chờ..."}
            </div>
          )}

          {!result ? (
            <div className="db-empty">
              <p className="db-empty-title">
                {loading
                  ? "Đang tính toán dự báo..."
                  : "Chưa có kết quả dự báo"}
              </p>

              <p className="db-empty-text">
                {loading
                  ? "Kết quả sẽ hiển thị khi tính toán hoàn tất."
                  : "Chọn kỳ dự báo ở trên rồi nhấn Chạy dự báo."}
              </p>
            </div>
          ) : (
            <>
              <p className="db-meta">
                Mã lần chạy:{" "}
                <strong>{result.ma_lich_su_du_bao}</strong>
                {" · "}
                {result.tong_san_pham} sản phẩm
                {" · "}
                Kỳ dự báo {result.so_tuan_du_bao} tuần
              </p>

              {result.ket_qua.length === 0 ? (
                <div className="db-empty">
                  Chưa có sản phẩm nào để hiển thị kết quả dự báo.
                </div>
              ) : (
                <>
                  <div className="db-table-scroll">
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th scope="col">Sản phẩm</th>
                          <th scope="col">Từ ngày</th>
                          <th scope="col">Đến ngày</th>
                          <th scope="col" className="db-num">
                            Tổng nhu cầu {resultWeeks} tuần tới
                          </th>
                          <th scope="col" className="db-num">
                            Sai số sMAPE
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {result.ket_qua.map((product) => {
                          const firstWeek = product.ket_qua[0];
                          const lastWeek =
                            product.ket_qua[
                              product.ket_qua.length - 1
                            ];

                          const total = product.ket_qua.reduce(
                            (sum, week) =>
                              sum + week.so_luong_du_bao,
                            0,
                          );

                          const evaluation =
                            result.danh_gia_mo_hinh.find(
                              (item) =>
                                item.ma_san_pham ===
                                  product.ma_san_pham &&
                                item.mo_hinh === "PROPHET" &&
                                item.horizon === resultWeeks,
                            );

                          return (
                            <tr key={product.ma_san_pham}>
                              <th scope="row">
                                {tenSanPham[product.ma_san_pham] ||
                                  product.ma_san_pham}
                              </th>

                              <td>
                                {firstWeek
                                  ? formatDate(firstWeek.tu_ngay)
                                  : "—"}
                              </td>

                              <td>
                                {lastWeek
                                  ? formatDate(lastWeek.den_ngay)
                                  : "—"}
                              </td>

                              <td className="db-blue db-num">
                                <SoLuong value={total} />
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
                                    {percentFormatter.format(
                                      evaluation.smape,
                                    )}
                                    %
                                  </span>
                                ) : (
                                  <span className="db-no-eval">
                                    Chưa có đánh giá
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>

                      <tfoot>
                        <tr>
                          <th scope="row" colSpan={3}>
                            Tổng số lượng tất cả sản phẩm
                          </th>

                          <td className="db-blue db-num">
                            <SoLuong value={totalForecast} />
                          </td>

                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <p className="db-meta">
                    sMAPE đo sai số trên dữ liệu kiểm định.
                    Giá trị càng thấp, sai số dự báo càng nhỏ.
                  </p>

                  {result.ket_qua.map((product) => (
                    <div
                      className="db-details"
                      key={product.ma_san_pham}
                    >
                      <h3>
                        {tenSanPham[product.ma_san_pham] ||
                          product.ma_san_pham}
                        {" — "}
                        Chi tiết dự báo từng tuần
                      </h3>

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
                            {product.ket_qua.map((week, index) => (
                              <tr key={week.tu_ngay}>
                                <th scope="row">
                                  Tuần {index + 1}
                                </th>

                                <td>
                                  {formatDate(week.tu_ngay)}
                                </td>

                                <td>
                                  {formatDate(week.den_ngay)}
                                </td>

                                <td className="db-blue db-num">
                                  <SoLuong
                                    value={week.so_luong_du_bao}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="db-detail-note">
                        Nhu cầu tiêu thụ dự kiến theo từng tuần.
                      </p>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}