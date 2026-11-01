
//D:\KLTN\KLTN\frontend\src\components\common\DataTable.tsx
import { useEffect, useState, type ReactNode } from "react";
import SharedDataTable from "./SharedDataTable";
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
  const [selectedPageSize, setSelectedPageSize] = useState(pageSize);
  useEffect(() => {
    setSelectedPageSize(pageSize);
    setPage(1);
  }, [pageSize]);
  useEffect(() => {
    setPage(1);
  }, [rows.length]);
  const columnsWithActions = columns.map((column, index) => ({
    key: column.key,
    title: column.label,
    align: column.numeric ? "right" as const : "left" as const,
    className: column.key === "actions" ? "pm-action-cell" : column.numeric ? "numeric" : undefined,
    render: (row: T) => index === 0 && onRowClick ? (
      <button
        className="pm-link"
        type="button"
        onClick={() => onRowClick(row)}
      >
        {column.render(row)}
      </button>
    ) : column.render(row),
  }));

  return (
    <SharedDataTable
      legacy
      emptyMessage={<EmptyState />}
      rows={rows}
      columns={columnsWithActions}
      rowKey={rowKey}
      total={rows.length}
      page={page}
      pageSize={selectedPageSize}
      onPageChange={setPage}
      onPageSizeChange={size => { setSelectedPageSize(size); setPage(1); }}
    />
  );
}
