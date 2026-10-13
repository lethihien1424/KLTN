import type { DashboardItem } from "../components/dashboard/DashboardBase";

export const sidebarGroups = [
  { id: "materials", label: "Nguyên liệu", paths: ["/nguyen-lieu", "/cong-thuc", "/ton-kho", "/nha-cung-cap/cung-ung"] },
  { id: "suppliers", label: "Nhà cung cấp", paths: ["/nha-cung-cap", "/goi-y", "/hieu-suat", "/xem-thong-tin-nha-cung-cap"] },
  { id: "purchasing", label: "Mua hàng", paths: ["/nhu-cau-nguyen-lieu", "/de-xuat-nhap-hang", "/don-mua-nguyen-lieu", "/xem-ke-hoach-mua-hang"] },
];

// Entries have already been filtered by the existing permission helper.
export function groupSidebarMenu(entries: DashboardItem[]): DashboardItem[] {
  const groupedPaths = new Set(sidebarGroups.flatMap(group => group.paths));
  const groups = sidebarGroups.flatMap(group => {
    const children = group.paths.flatMap(path => entries.filter(item => item.id === path));
    return children.length ? [{ id: `module-${group.id}`, label: group.label, icon: children[0].icon, children }] : [];
  });
  const firstGrouped = entries.findIndex(item => groupedPaths.has(item.id));
  if (firstGrouped < 0) return entries;
  return [
    ...entries.slice(0, firstGrouped),
    ...groups,
    ...entries.slice(firstGrouped).filter(item => !groupedPaths.has(item.id)),
  ];
}
