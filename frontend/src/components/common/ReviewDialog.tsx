import { useState } from "react";
import { ConfirmDialog, Field, Feedback } from "./PurchaseUI";
export default function ReviewDialog({
  action,
  title,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  action: "approve" | "reject" | null;
  title: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <ConfirmDialog
      open={Boolean(action)}
      title={`${action === "reject" ? "Từ chối" : "Duyệt"} ${title}`}
      busy={busy}
      onClose={() => {
        setReason("");
        onClose();
      }}
      onConfirm={() => {
        if (action === "reject" && !reason.trim()) {
          document
            .getElementById("review-form")
            ?.querySelector<HTMLTextAreaElement>("textarea")
            ?.reportValidity();
          return;
        }
        onConfirm(action === "reject" ? reason.trim() : undefined);
      }}
      confirmLabel={action === "reject" ? "Xác nhận từ chối" : "Xác nhận duyệt"}
    >
      {action === "reject" ? (
        <form id="review-form" onSubmit={(e) => e.preventDefault()}>
          <Field label="Lý do từ chối *">
            <textarea
              required
              maxLength={1000}
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </form>
      ) : (
        <p>
          Xác nhận duyệt {title}? Thông tin người duyệt sẽ được lưu trên hệ
          thống.
        </p>
      )}
      <Feedback error={error} success="" />
    </ConfirmDialog>
  );
}
