import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import AuditSettingsPage, { type HistoryScope } from "../../pages/cau-hinh/AuditSettingsPage";
import { FormDrawer } from "./PurchaseUI";

const permissions: Record<string, string> = {
  "nguyen-lieu": "NGUYEN_LIEU_VIEW",
  "nha-cung-cap": "NHA_CUNG_CAP_VIEW",
  "cong-thuc": "CONG_THUC_VIEW",
  "ton-kho-nguyen-lieu": "TON_KHO_VIEW",
  "nguyen-lieu-nha-cung-cap": "NGUYEN_LIEU_NCC_VIEW",
  "de-xuat-nhap-hang": "DE_XUAT_NHAP_HANG_VIEW",
  "don-mua-nguyen-lieu": "DON_MUA_VIEW",
};

export default function RecordHistoryButton({ entity, code }: HistoryScope) {
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  if (!can("VIEW_AUDIT_LOG") && !can(permissions[entity])) return null;
  return <>
    <button type="button" className="pm-link" onClick={() => setOpen(true)}>Lịch sử thay đổi</button>
    <FormDrawer open={open} title={`Lịch sử thay đổi · ${code}`} onClose={() => setOpen(false)}
      footer={<button type="button" className="pm-btn" onClick={() => setOpen(false)}>Đóng lịch sử</button>}>
      {open && <AuditSettingsPage scope={{ entity, code }} />}
    </FormDrawer>
  </>;
}
