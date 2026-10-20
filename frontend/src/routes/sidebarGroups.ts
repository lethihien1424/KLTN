//D:\KLTN\KLTN\frontend\src\routes\sidebarGroups.ts
// import type { DashboardItem } from "../components/dashboard/DashboardBase";

// export const sidebarGroups = [
//   { id: "materials", label: "Nguyên liệu", paths: ["/nguyen-lieu", "/cong-thuc", "/ton-kho", "/nha-cung-cap/cung-ung"] },
//   { id: "suppliers", label: "Nhà cung cấp", paths: ["/nha-cung-cap", "/goi-y", "/hieu-suat", "/xem-thong-tin-nha-cung-cap"] },
//   { id: "purchasing", label: "Mua hàng", paths: ["/nhu-cau-nguyen-lieu", "/de-xuat-nhap-hang", "/don-mua-nguyen-lieu", "/xem-ke-hoach-mua-hang"] },
// ];

// // Entries have already been filtered by the existing permission helper.
// export function groupSidebarMenu(entries: DashboardItem[]): DashboardItem[] {
//   const groupedPaths = new Set(sidebarGroups.flatMap(group => group.paths));
//   const groups = sidebarGroups.flatMap(group => {
//     const children = group.paths.flatMap(path => entries.filter(item => item.id === path));
//     return children.length ? [{ id: `module-${group.id}`, label: group.label, icon: children[0].icon, children }] : [];
//   });
//   const firstGrouped = entries.findIndex(item => groupedPaths.has(item.id));
//   if (firstGrouped < 0) return entries;
//   return [
//     ...entries.slice(0, firstGrouped),
//     ...groups,
//     ...entries.slice(firstGrouped).filter(item => !groupedPaths.has(item.id)),
//   ];
// }

// D:\KLTN\KLTN\frontend\src\routes\sidebarGroups.ts
import type { DashboardItem } from "../components/dashboard/DashboardBase";
import { menu } from "./menu";

export const sidebarGroups = [
  { id: "du_bao", label: "Dự báo" },
  { id: "materials", label: "Nguyên liệu" },
  { id: "suppliers", label: "Nhà cung cấp" },
  { id: "purchasing", label: "Mua hàng" },
  { id: "quan_tri", label: "Quản trị hệ thống" },

].map(group => ({ ...group, paths: menu.filter(item => item.group === group.id).map(item => item.path) }));

// Chỉ nhóm những mục đã được lọc quyền; nhóm rỗng không xuất hiện.
export function groupSidebarMenu(entries: DashboardItem[]): DashboardItem[] {
  const result: DashboardItem[] = [];
  const added = new Set<string>();
  for (const entry of entries) {
    const group = sidebarGroups.find(item => item.paths.includes(entry.id));
    if (!group) { result.push(entry); continue; }
    if (added.has(group.id)) continue;
    const children = entries.filter(item => group.paths.includes(item.id));
    result.push({ id: `module-${group.id}`, label: group.label, icon: children[0]?.icon, children });
    added.add(group.id);
  }
  return result;
}
