import type { ReactNode } from "react";
import "./SharedDataTable.css";

export type SharedDataTableColumn<T> = {
  key: string;
  title: string;
  render: (row: T) => ReactNode;
  width?: string | number;
  align?: "left" | "center" | "right";
  className?: string;
};

type Props<T> = {
  rows: T[];
  columns: SharedDataTableColumn<T>[];
  rowKey: (row: T) => string;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  serverSide?: boolean;
  loading?: boolean;
  error?: ReactNode;
  emptyMessage?: ReactNode;
  loadingMessage?: ReactNode;
};

const PAGE_SIZES = [10, 30, 50, 100, 300, 500, 700];

export default function SharedDataTable<T>({
  rows,
  columns,
  rowKey,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  serverSide = false,
  loading = false,
  error,
  emptyMessage = "Không có dữ liệu phù hợp.",
  loadingMessage = "Đang tải dữ liệu...",
}: Props<T>) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const firstRow = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastRow = Math.min(currentPage * pageSize, total);
  const visibleRows = serverSide
    ? rows
    : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageSizes = pageSize === 7 ? [7, ...PAGE_SIZES] : PAGE_SIZES;
  const pageButtons: Array<number | "ellipsis"> = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : currentPage <= 3
      ? [1, 2, 3, 4, "ellipsis", pageCount]
      : currentPage >= pageCount - 2
        ? [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount]
        : [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount];

  return (
    <section className="shared-table-card" aria-busy={loading}>
      <div className="shared-table-scroll">
        <table className="shared-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={column.className}
                  style={{ width: column.width, textAlign: column.align }}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="shared-table-state" colSpan={columns.length} role="status">{loadingMessage}</td></tr>
            ) : error ? (
              <tr><td className="shared-table-state is-error" colSpan={columns.length} role="alert">{error}</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr><td className="shared-table-state" colSpan={columns.length}>{emptyMessage}</td></tr>
            ) : visibleRows.map(row => (
              <tr key={rowKey(row)}>
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={column.className}
                    style={{ textAlign: column.align }}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="shared-table-pagination">
        <span className="shared-table-total">
          {total === 0 ? "Tổng 0 dòng" : `Tổng ${total} dòng · Hiển thị ${firstRow}–${lastRow}`}
        </span>
        <div className="shared-table-page-controls">
          <button
            type="button"
            className="shared-table-arrow"
            aria-label="Trang trước"
            disabled={loading || currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >‹</button>
          {pageButtons.map((pageButton, index) => pageButton === "ellipsis" ? (
            <span className="shared-table-ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
          ) : (
            <button
              type="button"
              key={pageButton}
              className={`shared-table-page-button${pageButton === currentPage ? " is-current" : ""}`}
              aria-label={`Trang ${pageButton}`}
              aria-current={pageButton === currentPage ? "page" : undefined}
              disabled={loading}
              onClick={() => onPageChange(pageButton)}
            >{pageButton}</button>
          ))}
          <button
            type="button"
            className="shared-table-arrow"
            aria-label="Trang sau"
            disabled={loading || currentPage >= pageCount}
            onClick={() => onPageChange(currentPage + 1)}
          >›</button>
          <label className="shared-table-page-size">
            <span className="shared-table-sr-only">Số dòng mỗi trang</span>
            <select
              aria-label="Số dòng mỗi trang"
              value={pageSize}
              disabled={loading}
              onChange={event => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizes.map(size => <option key={size} value={size}>{size} / trang</option>)}
            </select>
          </label>
        </div>
      </footer>
    </section>
  );
}
