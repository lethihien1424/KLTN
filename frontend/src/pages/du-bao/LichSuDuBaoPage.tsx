///D:\KLTN\KLTN\frontend\src\pages\du-bao\LichSuDuBaoPage.tsx
import DuBaoNhuCauPage from "./DuBaoNhuCauPage";

type Props = {
  tenSanPham?: Record<string, string>;
};

export default function LichSuDuBaoPage({
  tenSanPham,
}: Props) {
  return (
    <DuBaoNhuCauPage
      mode="lich-su"
      tenSanPham={tenSanPham}
    />
  );
}
