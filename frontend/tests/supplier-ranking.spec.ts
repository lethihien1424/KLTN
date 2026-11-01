import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page, writable = true) {
  const state = { writes: [] as string[], errors: [] as string[], reads: 0 };
  page.on("pageerror", e => state.errors.push(e.message));
  const policy = { cong_thuc: "Điểm ưu tiên = Điểm giá × 30% + Điểm NCC × Độ đầy đủ KPI × 70%.", cong_thuc_gia: "Giá thấp nhất / giá NCC × 100.", nhom_cung_ung: ["Đã xác nhận đủ", "Chưa xác nhận", "Đã xác nhận không đủ"], sap_xep: "Nhóm cung ứng trước, điểm ưu tiên sau.", thieu_kpi: "Không có KPI thì phần KPI không đóng góp.", lam_tron: "Làm tròn 0,01 trước khi sắp xếp." };
  const rows = [3, 1].map((id, index) => ({ ma_nguyen_lieu_ncc: `MAP${id}`, ma_ncc: `NCC000${id}`, ten_ncc: `Coffee ${id}`, don_gia: id === 3 ? "120" : "100", lead_time_ngay: 7,
    diem_ncc: id === 3 ? "90" : "50", diem_xep_hang: id === 3 ? "88" : "65", do_day_du_kpi: "100", ty_le_giao_dung_han_thuc_te: "100", ty_le_giao_du_thuc_te: "100", trang_thai_cung_ung: "CHUA_XAC_NHAN", xac_nhan: null,
    giai_thich_xep_hang: { vi_tri: index+1, nhan_nhom: "Chưa xác nhận", dong_gop_gia: id === 3 ? "25" : "30", dong_gop_kpi: id === 3 ? "63" : "35",
      so_sanh: "NCC0003 (giá 120) xếp trên NCC0001 (giá 100): cùng nhóm cung ứng; tổng điểm ưu tiên 88 > 65. Giá cao hơn được bù bởi phần KPI thực tế.",
      phep_tinh_gia: id === 3 ? "100 / 120 × 100 = 83,333333 điểm giá" : "100 / 100 × 100 = 100 điểm giá", phep_tinh_dong_gop_gia: id === 3 ? "83,333333 × 30% = 25 điểm" : "100 × 30% = 30 điểm", phep_tinh_dong_gop_kpi: id === 3 ? "90 × 100% × 70% = 63 điểm" : "50 × 100% × 70% = 35 điểm", phep_tinh_tong: id === 3 ? "25 + 63 = 88 → làm tròn 88 điểm ưu tiên" : "30 + 35 = 65 → làm tròn 65 điểm ưu tiên",
      gia: { ma_nguyen_lieu_ncc: `MAP${id}`, ma_nguyen_lieu: "NL1", don_vi_tien: "VND", don_vi_nguyen_lieu: "kg", don_vi_gia: null, cap_nhat_luc: null, ghi_chu: "Giá tham khảo từ cấu hình, không phải giá mua thực tế." },
      thoi_gian_giao: { ma_nguyen_lieu_ncc: `MAP${id}`, lead_time_ngay: 7, ghi_chu: "Lấy từ cấu hình mapping." },
      cung_ung: { so_luong_yeu_cau: "20", ma_lich_su_du_bao: "DB1", phep_tinh: "Chưa có xác nhận còn hiệu lực.", ghi_chu: "Không dùng tồn Milano hoặc tồn NCC khai báo." } },
  }));
  const criteria = ["Chất lượng", "Đúng hạn", "Giao đủ", "Đáp ứng thời gian giao"].map((ten, i) => ({ key: ["quality_ratio", "on_time_ratio", "full_ratio", "lead_time"][i], ten, diem: "100", trong_so: ["35", "30", "20", "15"][i], trong_so_ap_dung: ["35", "30", "20", "15"][i], dong_gop: ["35", "30", "20", "15"][i], nguon: "THUC_TE", so_mau: 1, phep_tinh: "100 × 35% = 35 điểm", giai_thich: { tom_tat: "KPI từ chứng từ DM1", ghi_chu: "Lịch sử toàn NCC", dong: [{ tieu_de: "DM1", ma_don: "DM1", nguon: "THUC_TE", noi_dung: ["Dữ liệu kiểm định gốc"], phieu: [{ ma_phieu_nhan: "PH1", ma_phieu_nhap: "PN1" }] }], tong_hop_kiem_dinh: { so_dong_hop_le: 1, so_dong_chua_kiem_dinh: 0, theo_don_vi: [{ don_vi: "kg", so_luong_giao: "20", so_luong_dat: "20", so_luong_khong_dat: "0", so_dong_hop_le: 1, phep_tinh: "20 / 20 × 100 = 100%" }] } } }));
  await page.addInitScript(() => sessionStorage.setItem("access_token", "ranking-test"));
  await page.route("**/api/**", route => {
    const req = route.request(); const path = new URL(req.url()).pathname.slice(4);
    if (req.method() !== "GET") state.writes.push(path);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "U1", ho_ten: "User", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "U1", vai_tro: "CUSTOM", chi_tiet: [{ chuc_nang: "goi_y_nha_cung_cap", thao_tac: "XEM" }, ...(writable ? [{ chuc_nang: "de_xuat_nhap_hang", thao_tac: "THEM" }] : [])] } });
    if (path === "/goi-y-nha-cung-cap") { state.reads++; return route.fulfill({ json: { ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Coffee", so_luong_can_mua: "20", nha_cung_cap: rows, chinh_sach_xep_hang: policy } }); }
    if (path.endsWith("/giai-thich")) return route.fulfill({ json: { nha_cung_cap: { ...rows[0], chi_tiet_diem_ncc: { giai_thich_tong: "Điểm NCC = trung bình (90 + 90) / 2 = 90.", mapping: [{ ma_nguyen_lieu_ncc: "OTHER", tieu_chi: [] }, { ma_nguyen_lieu_ncc: "MAP3", tieu_chi: criteria }] } }, chinh_sach_xep_hang: policy, tinh_luc: "2026-11-01T09:00:00Z" } });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/goi-y?material=NL1&qty=20&forecast=DB1");
  await expect(page.getByRole("button", { name: "Cách xếp hạng", exact: true })).toBeVisible();
  return state;
}

test("selection starts empty, switches A to B, toggles B off and never writes", async ({ page }) => {
  const state = await setup(page);
  const a = page.getByRole("row").filter({ hasText: "NCC0003" });
  const b = page.getByRole("row").filter({ hasText: "NCC0001" });
  const create = page.getByRole("button", { name: "Tạo đề xuất nhập hàng →", exact: true });
  await expect(create).toBeDisabled();
  await a.getByRole("button", { name: "Chọn NCC", exact: true }).click();
  await expect(a.getByRole("button", { name: "Bỏ chọn", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("NCC đang chọn chưa có xác nhận cung ứng hợp lệ; đây chưa phải cam kết giao hàng.", { exact: true })).toBeVisible();
  await b.getByRole("button", { name: "Chọn NCC", exact: true }).click();
  await expect(a.getByRole("button", { name: "Chọn NCC", exact: true })).toHaveAttribute("aria-pressed", "false");
  await b.getByRole("button", { name: "Bỏ chọn", exact: true }).click();
  await expect(create).toBeDisabled();
  await page.reload(); await expect(create).toBeDisabled();
  expect(state.writes).toEqual([]); expect(state.errors).toEqual([]);
});

test("new search and quantity changes clear selection; proposal keeps supplier material quantity forecast", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Chọn NCC", exact: true }).first().click();
  await page.getByRole("button", { name: "Tìm nhà cung cấp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tạo đề xuất nhập hàng →", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Chọn NCC", exact: true }).last().click();
  await page.getByLabel("Số lượng cần mua (kg)", { exact: true }).fill("25");
  await expect(page.getByRole("button", { name: "Chọn NCC", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tìm nhà cung cấp", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tạo đề xuất nhập hàng →", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Chọn NCC", exact: true }).last().click();
  await page.getByRole("button", { name: "Tạo đề xuất nhập hàng →", exact: true }).click();
  await expect(page).toHaveURL(/#\/de-xuat\/tao\?/);
  const query = new URLSearchParams(new URL(page.url()).hash.split("?")[1]);
  expect(Object.fromEntries(query)).toMatchObject({ material: "NL1", qty: "25", ncc: "NCC0001", forecast: "DB1", unconfirmed: "1" });
  expect(state.writes).toEqual([]);
});

test("comparison and evidence are available without selecting or write permissions", async ({ page }) => {
  const state = await setup(page, false);
  await expect(page.getByRole("button", { name: "Chọn NCC", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xác nhận cung ứng", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Cách xếp hạng", exact: true }).click();
  const compare = page.getByRole("dialog", { name: "Cách xếp hạng nhà cung cấp", exact: true });
  await expect(compare.locator(".suggestion-comparison")).toHaveCount(2);
  await expect(compare).toContainText("Giá cao hơn được bù bởi phần KPI");
  await compare.getByText("Phép tính thành phần · NCC0003", { exact: true }).click();
  await expect(compare.getByText("25 + 63 = 88 → làm tròn 88 điểm ưu tiên", { exact: true })).toBeVisible();
  await compare.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page.getByRole("button", { name: "Xem cách tính", exact: true }).first().click();
  const detail = page.getByRole("dialog", { name: "Vì sao gợi ý nhà cung cấp này?", exact: true });
  await expect(detail.locator(".score-kpi-card")).toHaveCount(4);
  await expect(detail.locator(".suggestion-source-card")).toHaveCount(2);
  await expect(detail.getByRole("button", { name: "Mở Tính lại điểm NCC", exact: true })).toHaveCount(0);
  await detail.getByText("Đơn giá tham khảo", { exact: true }).click();
  await expect(detail).toContainText("chưa lưu riêng");
  await detail.getByRole("button", { name: /Chất lượng/ }).click();
  await expect(detail.getByRole("region", { name: "Tổng hợp dữ liệu kiểm định", exact: true })).toBeVisible();
  await detail.getByText("Xem chi tiết chứng từ", { exact: false }).click();
  await expect(detail).toContainText("Tỷ lệ của riêng chứng từ");
  await expect(detail.getByRole("button", { name: "Xem PN1", exact: true })).toHaveCount(0);
  await detail.screenshot({ path: "reports/supplier-ranking-explanation.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => detail.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await detail.screenshot({ path: "reports/supplier-ranking-explanation-mobile.png" });
  expect(state.writes).toEqual([]); expect(state.errors).toEqual([]);
});
