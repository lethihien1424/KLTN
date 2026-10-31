import { test, expect } from "@playwright/test";
import { menu } from "../src/routes/menu";

for (const viewport of [{ width: 1440, height: 720 }, { width: 390, height: 844 }]) {
  test(`sidebar and main scroll independently at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => sessionStorage.setItem("access_token", "layout-test"));
    await page.route("**/api/**", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/auth/me")) return route.fulfill({ json: {
        ma_nguoi_dung: "LAYOUT", ho_ten: "Layout test", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG",
      } });
      if (path.endsWith("/phan-quyen/cua-toi")) return route.fulfill({ json: {
        ma_nguoi_dung: "LAYOUT", vai_tro: "CUSTOM",
        chi_tiet: menu.filter(item => item.permission).map(item => {
          const [chuc_nang, thao_tac] = item.permission.split(":");
          return { chuc_nang, thao_tac };
        }),
      } });
      if (path.endsWith("/nguyen-lieu")) return route.fulfill({ json: Array.from({ length: 25 }, (_, i) => ({
        ma_nguyen_lieu: `NL${i}`, ten_nguyen_lieu: `Nguyên liệu ${i}`, don_vi_do_luong: "kg", trang_thai: "DANG_SU_DUNG",
      })) });
      return route.fulfill({ json: [] });
    });
    await page.goto("/#/nguyen-lieu");
    const main = page.locator(".dashboard-main");
    const sidebar = page.locator(".dashboard-sidebar");
    const header = page.locator(".dashboard-topbar");
    const active = sidebar.locator('[aria-current="page"]');
    await expect(active).toHaveText("Nguyên liệu");
    await expect(page.locator(".pm-pagination")).toContainText("25 bản ghi");
    const headerBox = await header.boundingBox();
    const sidebarBox = await sidebar.boundingBox();
    const mainBox = await main.boundingBox();
    expect(sidebarBox!.x).toBe(0);
    expect(sidebarBox!.height).toBe(viewport.height);
    expect(mainBox!.x).toBeGreaterThanOrEqual(sidebarBox!.width);
    await main.hover();
    await page.mouse.wheel(0, 2000);
    await expect.poll(() => main.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await sidebar.evaluate(el => el.scrollTop)).toBe(0);
    expect(await header.boundingBox()).toEqual(headerBox);
    expect(await sidebar.boundingBox()).toEqual(sidebarBox);
    await expect(page.locator(".pm-pagination")).toBeInViewport();
    await page.locator(".pm-pagination").getByRole("button", { name: "Sau" }).click();
    await expect(page.locator(".pm-pagination")).toContainText("Trang 2/3");
    const mainScroll = await main.evaluate(el => el.scrollTop);
    await sidebar.hover();
    await page.mouse.wheel(0, 2000);
    await expect.poll(() => sidebar.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect(await main.evaluate(el => el.scrollTop)).toBe(mainScroll);
    await expect(sidebar.locator(".dashboard-logout")).toBeInViewport();
    expect(await header.boundingBox()).toEqual(headerBox);
    await sidebar.getByRole("button", { name: /Quản trị hệ thống/ }).click();
    await expect(sidebar.getByRole("button", { name: /Quản trị hệ thống/ })).toHaveAttribute("aria-expanded", "false");
    await sidebar.getByRole("button", { name: /Quản trị hệ thống/ }).click();
    await expect(active).toHaveText("Nguyên liệu");
    expect(await page.evaluate(() => ({ top: window.scrollY, overflow: document.documentElement.scrollHeight > innerHeight })))
      .toEqual({ top: 0, overflow: false });
  });
}
