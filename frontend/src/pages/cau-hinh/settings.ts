// frontend/src/pages/cau-hinh/settings.ts

export type SettingsCardConfig = {
  title: string;
  description: string;
  path: string;
  permission: string;
  tag: string;
  theme: "blue" | "purple";
  highlights: string[];
};

export const settingsCards: SettingsCardConfig[] = [
  {
    title: "Quản lý lý do",
    description:
      "Quản lý danh mục các lý do áp dụng trong quy trình thay đổi trạng thái nguyên liệu, công thức BOM và nhà cung cấp.",
    path: "/cau-hinh/quan-ly-ly-do",
    permission: "quan_ly_ly_do:XEM",
    tag: "Nghiệp vụ",
    theme: "blue",
    highlights: [
      "Đổi trạng thái nguyên liệu",
      "Đổi trạng thái công thức / BOM",
      "Đổi trạng thái nhà cung cấp",
    ],
  },
  {
    title: "Nhật ký hoạt động",
    description:
      "Tra cứu lịch sử thao tác, theo dõi vết thay đổi dữ liệu và so sánh dữ liệu trước - sau trên toàn hệ thống.",
    path: "/cau-hinh/nhat-ky",
    permission: "nhat_ky_hoat_dong:XEM",
    tag: "Nhật ký & Kiểm toán",
    theme: "purple",
    highlights: [
      "Theo dõi thao tác người dùng",
      "Chi tiết dữ liệu trước & sau",
      "Bộ lọc module & đối tượng",
    ],
  },
];