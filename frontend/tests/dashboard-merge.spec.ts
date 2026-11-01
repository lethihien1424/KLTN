import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page, permissions: string[]) {
  const state = { permissions, requests: [] as string[], errors: [] as string[] };
  page.on("pageerror", error => state.errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem("access_token", "merge-regression"));
  await page.route("**/api/**", route => {
    const path = new URL(route.request().url()).pathname.slice(4);
    state.requests.push(path);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "MERGE", ho_ten: "Merge test", vai_tro: "ADMIN", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "MERGE", vai_tro: "ADMIN", chi_tiet: state.permissions.map(key => { const [chuc_nang, thao_tac] = key.split(":"); return { chuc_nang, thao_tac }; }) } });
    if (path === "/dashboard/hieu-suat-nha-cung-cap") return route.fulfill({ json: [{ ma_ncc: "NCC1", ten_ncc: "NCC kiểm thử", diem_ncc: "57.67", xep_loai: "TRUNG_BINH", ty_le_chat_luong_dat_thuc_te: "98.97", thoi_gian_giao_tb_ngay: "3.00", so_don: 2, so_phieu: 4 }] });
    if (path === "/dashboard/nguyen-lieu-cung-ung") return route.fulfill({ json: { all_items: [] } });
    if (path === "/nguyen-lieu") return route.fulfill({ json: Array.from({ length: 25 }, (_, index) => ({ ma_nguyen_lieu: `NL${index}`, ten_nguyen_lieu: `Nguyên liệu ${index}`, don_vi_do_luong: "kg", trang_thai: "DANG_SU_DUNG" })) });
    return route.fulfill({ json: [] });
  });
  return state;
}

test("merged dashboard renders supplier charts with explicit dynamic permissions", async ({ page }) => {
  const state = await setup(page, ["nha_cung_cap:XEM"]);
  await page.goto("/#/dashboard/nha-cung-cap");
  await expect(page.getByRole("heading", { name: "Nguyên liệu cung ứng và điểm nhà cung cấp", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Điểm thương mại nhà cung cấp", exact: true })).toBeVisible();
  await expect.poll(() => state.requests.includes("/dashboard/hieu-suat-nha-cung-cap")).toBe(true);
  await expect.poll(() => state.requests.includes("/dashboard/nguyen-lieu-cung-ung")).toBe(true);
  await expect(page.getByText("Không thể hiển thị khu vực này.", { exact: false })).toHaveCount(0);
  expect(state.errors).toEqual([]);
});

test("ungranted ADMIN has no dashboard bypass and permission refresh updates visibility", async ({ page }) => {
  const state = await setup(page, []);
  await page.goto("/#/dashboard/nha-cung-cap");
  await expect(page.getByText("Bạn chưa được cấp quyền xem dashboard tương ứng.", { exact: true })).toBeVisible();
  expect(state.requests.filter(path => path.startsWith("/dashboard/"))).toEqual([]);
  state.permissions = ["nha_cung_cap:XEM"];
  await page.evaluate(() => window.dispatchEvent(new Event("auth-permissions-refresh")));
  await expect(page.locator(".dv-board")).toHaveCount(1);
  state.permissions = [];
  await page.evaluate(() => window.dispatchEvent(new Event("auth-permissions-refresh")));
  await expect(page.locator(".dv-board")).toHaveCount(0);
  expect(state.errors).toEqual([]);
});

test("DataTable retains its main API and pagination with the new shared controls", async ({ page }) => {
  const state = await setup(page, ["nguyen_lieu:XEM"]);
  await page.goto("/#/nguyen-lieu");
  const table = page.locator(".pm-table");
  await expect(table.locator("tbody tr")).toHaveCount(10);
  await expect(page.locator(".pm-pagination")).toContainText("25 bản ghi · Trang 1/3");
  await page.locator(".pm-pagination").getByRole("button", { name: "Sau", exact: true }).click();
  await expect(table).toContainText("NL10");
  await expect(page.locator(".pm-pagination")).toContainText("Trang 2/3");
  await page.getByLabel("Số dòng mỗi trang", { exact: true }).selectOption("30");
  await expect(table.locator("tbody tr")).toHaveCount(25);
  await expect(page.locator(".pm-pagination")).toContainText("Trang 1/1");
  await expect(table.locator(".pm-action-cell").first()).toBeAttached();
  expect(state.errors).toEqual([]);
});
