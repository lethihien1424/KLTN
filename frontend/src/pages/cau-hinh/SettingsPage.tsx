import {
  FileTextOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { EmptyState, PageHeader } from "../../components/common/PurchaseUI";
import { settingsCards } from "./settings";
import "./settings.css";

export function SettingsBreadcrumb({ title }: { title?: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <a href="#/">Trang chủ</a> /{" "}
      {title ? (
        <><a href="#/cau-hinh">Cấu hình</a> / <span aria-current="page">{title}</span></>
      ) : (
        <span aria-current="page">Cấu hình</span>
      )}
    </nav>
  );
}

export default function SettingsPage() {
  const { can } = useAuth();
  const availableCards = settingsCards.filter((card) => can(card.permission));
  return (
    <>
      <SettingsBreadcrumb />
      <PageHeader
        title="Cấu hình"
        description="Quản lý cấu hình hệ thống Milano Coffee."
      />
      {availableCards.length ? (
        <div className="settings-grid">
          {availableCards.map((card) => {
            return (
              <a key={card.path} href={`#${card.path}`} className="pm-panel settings-card">
                {card.permission === "VIEW_AUDIT_LOG" ? <HistoryOutlined aria-hidden="true" /> : <FileTextOutlined aria-hidden="true" />}
                <div>
                  <h2>{card.title}</h2>
                  <p>{card.description}</p>
                  <span className="pm-small">Mở chức năng →</span>
                </div>
              </a>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Bạn chưa có quyền truy cập màn hình này"
          description="Liên hệ quản trị viên để được cấp quyền phù hợp."
        />
      )}
    </>
  );
}
