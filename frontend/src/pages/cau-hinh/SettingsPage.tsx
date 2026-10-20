// frontend/src/pages/cau-hinh/SettingsPage.tsx
import {
  FileTextOutlined,
  HistoryOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../auth/AuthContext";
import { settingsCards } from "./settings";
import "./settings.css";

export function SettingsBreadcrumb({ title }: { title?: string }) {
  return (
    <nav className="ch-breadcrumb" aria-label="Breadcrumb">
      <a href="#/">Trang chủ</a>
      <span className="ch-bc-sep">/</span>
      {title ? (
        <>
          <a href="#/cau-hinh">Cấu hình</a>
          <span className="ch-bc-sep">/</span>
          <span className="ch-bc-current" aria-current="page">
            {title}
          </span>
        </>
      ) : (
        <span className="ch-bc-current" aria-current="page">
          Cấu hình
        </span>
      )}
    </nav>
  );
}

export default function SettingsPage() {
  const { can } = useAuth();
  const availableCards = settingsCards.filter((card) =>
    can(card.permission),
  );

  return (
    <div className="ch-page">
      <SettingsBreadcrumb />

      <div className="ch-card-wrapper">
        {/* Header Band */}
        <div className="ch-page-header">
          <div className="ch-header-icon" aria-hidden="true">
            <SettingOutlined />
          </div>
          <div className="ch-header-text">
            <h2>Cấu hình</h2>
            <p>Quản lý cấu hình hệ thống Milano Coffee.</p>
          </div>
          <div className="ch-header-actions">
            <span className="ch-badge-pill">
              <AppstoreOutlined style={{ marginRight: 6 }} />
              {availableCards.length} chức năng
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="ch-card-body">
          <div className="ch-section-heading">
            <h3>Danh mục chức năng cấu hình</h3>
            <p>Chọn phân hệ bên dưới để cấu hình lý do nghiệp vụ hoặc tra cứu nhật ký thao tác hệ thống.</p>
          </div>

          {availableCards.length ? (
            <div className="ch-grid">
              {availableCards.map((card) => {
                const isAudit = card.path === "/cau-hinh/nhat-ky";
                return (
                  <a
                    key={card.path}
                    href={`#${card.path}`}
                    className="ch-menu-card"
                  >
                    <div>
                      <div className="ch-menu-card-top">
                        <div
                          className={`ch-card-icon-badge ${
                            isAudit ? "purple" : "blue"
                          }`}
                          aria-hidden="true"
                        >
                          {isAudit ? (
                            <HistoryOutlined />
                          ) : (
                            <FileTextOutlined />
                          )}
                        </div>
                        <span
                          className={`ch-card-tag ${
                            isAudit ? "purple" : "blue"
                          }`}
                        >
                          {card.tag}
                        </span>
                      </div>

                      <h3>{card.title}</h3>
                      <p>{card.description}</p>

                      <div className="ch-card-highlights">
                        {card.highlights.map((item, index) => (
                          <span key={index} className="ch-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="ch-card-footer">
                      <span>Truy cập phân hệ</span>
                      <span className="ch-arrow-btn">
                        Mở chức năng <ArrowRightOutlined />
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="ch-empty-state">
              <div className="ch-empty-icon">
                <SettingOutlined />
              </div>
              <h4>Bạn chưa có quyền truy cập màn hình này</h4>
              <p>Liên hệ quản trị viên để được cấp quyền cấu hình phù hợp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}