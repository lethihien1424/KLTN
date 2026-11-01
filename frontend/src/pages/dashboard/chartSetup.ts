// // D:\KLTN\KLTN\frontend\src\pages\dashboard\chartSetup.ts
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   PointElement,
//   LineElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js";

// // Đăng ký toàn bộ các thành phần thông dụng của Chart.js
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   PointElement,
//   LineElement,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// );

// export const CHART_COLORS = {
//   primary: "#2563eb",
//   primaryLight: "rgba(37, 99, 235, 0.15)",
//   secondary: "#10b981",
//   secondaryLight: "rgba(16, 185, 129, 0.15)",
//   warning: "#f59e0b",
//   warningLight: "rgba(245, 158, 11, 0.15)",
//   danger: "#ef4444",
//   dangerLight: "rgba(239, 68, 68, 0.15)",
//   purple: "#8b5cf6",
//   purpleLight: "rgba(139, 92, 246, 0.15)",
//   teal: "#14b8a6",
//   tealLight: "rgba(20, 184, 166, 0.15)",
//   pink: "#ec4899",
//   orange: "#f97316",
//   slate: "#64748b",
//   palette: [
//     "#2563eb",
//     "#10b981",
//     "#f59e0b",
//     "#8b5cf6",
//     "#ec4899",
//     "#14b8a6",
//     "#f97316",
//     "#06b6d4",
//     "#84cc16",
//     "#6366f1",
//   ],
// };

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);


// Màu của dữ liệu vẽ trên canvas.
// Đây là cấu hình Chart.js, không phải CSS giao diện.
export const CHART_COLORS = {
  primary: "#2878c8",
  primaryLight: "rgba(40, 120, 200, 0.14)",

  secondary: "#279b78",
  secondaryLight: "rgba(39, 155, 120, 0.14)",

  warning: "#e2a126",
  warningLight: "rgba(226, 161, 38, 0.16)",

  danger: "#d85a52",
  dangerLight: "rgba(216, 90, 82, 0.14)",

  purple: "#8063c8",
  purpleLight: "rgba(128, 99, 200, 0.14)",

  teal: "#1d9aa6",
  tealLight: "rgba(29, 154, 166, 0.14)",

  pink: "#d06e91",
  orange: "#dc7b38",
  slate: "#64748b",

  palette: [
    "#2878c8",
    "#279b78",
    "#e2a126",
    "#8063c8",
    "#d06e91",
    "#1d9aa6",
    "#dc7b38",
    "#5583b7",
    "#7b9d49",
    "#69778b",
  ],
};
