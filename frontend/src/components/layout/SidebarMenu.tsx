import { useEffect, useState } from "react";
import { DownOutlined, RightOutlined } from "@ant-design/icons";
import type { DashboardItem } from "../dashboard/DashboardBase";

function matches(item: DashboardItem, path: string) {
  return item.id === path || (item.id !== "/" && path.startsWith(item.id + "/") && !(item.id === "/nha-cung-cap" && path === "/nha-cung-cap/cung-ung"));
}

export default function SidebarMenu({ items, activePath, onNavigate }: { items: DashboardItem[]; activePath: string; onNavigate: (path: string) => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const activeGroup = items.find(item => item.children?.some(child => matches(child, activePath)))?.id;
  useEffect(() => {
    if (activeGroup) setClosed(current => ({ ...current, [activeGroup]: false }));
  }, [activePath, activeGroup]);

  const link = (item: DashboardItem) => (
    <button key={item.id} type="button" className={matches(item, activePath) ? "dashboard-nav-item active" : "dashboard-nav-item"} aria-current={matches(item, activePath) ? "page" : undefined} onClick={() => onNavigate(item.id)}>
      <span className="dashboard-nav-icon" aria-hidden="true">{item.icon ?? "•"}</span>
      <span className="dashboard-nav-label">{item.label}</span>
      {item.badge !== undefined && item.badge !== null && <span className="dashboard-nav-badge">{item.badge}</span>}
    </button>
  );

  return <>{items.map(item => item.children ? (
    <div key={item.id}>
      <button type="button" className="dashboard-nav-item" aria-label={`Module ${item.label}`} aria-expanded={!closed[item.id]} aria-controls={`sidebar-${item.id}`} onClick={() => setClosed(current => ({ ...current, [item.id]: !current[item.id] }))}>
        <span className="dashboard-nav-icon" aria-hidden="true">{item.icon}</span>
        <span className="dashboard-nav-label">{item.label}</span>
        <span aria-hidden="true">{closed[item.id] ? <RightOutlined /> : <DownOutlined />}</span>
      </button>
      <div id={`sidebar-${item.id}`} role="group" aria-label={item.label} hidden={Boolean(closed[item.id])} style={{ paddingLeft: 12 }}>
        {item.children.map(link)}
      </div>
    </div>
  ) : link(item))}</>;
}
