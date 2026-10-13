import { useEffect, useState, type ReactNode } from "react";
import {
  ConfirmDialog,
  Field,
  Feedback,
  useResource,
  LoadingState,
  ErrorState,
} from "./PurchaseUI";
import {
  applicableReasons,
  type ReasonSelection,
} from "../../services/reasonService";
export default function ReasonConfirmDialog({
  open,
  title,
  functionCode,
  busy,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  functionCode?: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: ReasonSelection) => void;
  children: ReactNode;
}) {
  const [reasonId, setReasonId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const reasons = useResource(
    () =>
      open && functionCode
        ? applicableReasons(functionCode)
        : Promise.resolve([]),
    [open, functionCode],
  );
  useEffect(() => {
    setReasonId("");
    setNote("");
    setError("");
  }, [open, functionCode]);
  const other =
    reasons.data
      ?.find((r) => r.id === reasonId)
      ?.ten_ly_do.trim()
      .toLocaleLowerCase("vi") === "khác";
  return (
    <ConfirmDialog
      open={open}
      title={title}
      busy={busy}
      onClose={onClose}
      onConfirm={() => {
        if (
          functionCode &&
          (!reasonId || !reasons.data?.some((r) => r.id === reasonId))
        ) {
          setError("Vui lòng chọn lý do.");
          return;
        }
        if (other && !note.trim()) {
          setError('Vui lòng nhập ghi chú khi chọn lý do "Khác".');
          return;
        }
        setError("");
        onConfirm({ ly_do_id: reasonId, ghi_chu: note.trim() || null });
      }}
    >
      {children}
      {functionCode && (
        <>
          {reasons.loading ? (
            <LoadingState />
          ) : reasons.error ? (
            <ErrorState message={reasons.error} retry={reasons.refetch} />
          ) : (
            <Field label="Lý do *">
              <select
                value={reasonId}
                onChange={(e) => {
                  setReasonId(e.target.value);
                  setError("");
                }}
              >
                <option value="">Chọn lý do</option>
                {reasons.data?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.ten_ly_do}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={other ? "Ghi chú *" : "Ghi chú"}>
            <textarea
              rows={3}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <Feedback error={error} success="" />
        </>
      )}
    </ConfirmDialog>
  );
}
