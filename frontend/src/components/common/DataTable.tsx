//D:\KLTN\KLTN\frontend\src\components\common\DataTable.tsx
import { useEffect, useState, type ReactNode } from "react";
import { EmptyState } from "./PurchaseUI";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
};
export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  pageSize = 10,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}) {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [rows.length]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  return (
    <div className="pm-table-card">
      <div className="pm-table-scroll">
        <table className="pm-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.numeric ? "numeric" : ""}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows
              .slice((current - 1) * pageSize, current * pageSize)
              .map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.numeric ? "numeric" : ""}
                    >
                      {column.key === columns[0]?.key && onRowClick ? (
                        <button
                          className="pm-link"
                          type="button"
                          onClick={() => onRowClick(row)}
                        >
                          {column.render(row)}
                        </button>
                      ) : (
                        column.render(row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState />}
      </div>
      {rows.length > 0 && (
        <footer className="pm-pagination">
          <span>
            {rows.length} bản ghi · Trang {current}/{pages}
          </span>
          <div>
            <button
              className="pm-btn"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              Trước
            </button>
            <button
              className="pm-btn"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              Sau
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
