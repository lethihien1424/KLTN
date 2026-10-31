import { test, expect } from "@playwright/test";

// Read-only live verification. A short-lived token is injected in memory by the runner.
test("live Excelsa loads configured reasons validates empty selection and cancels without PUT", async ({ page }) => {
  const token = process.env.MILANO_LIVE_TEST_TOKEN;
  test.skip(!token, "Run through backend/scripts/verify_inventory_reason_live.py against the Docker app.");
  await page.addInitScript((value) => sessionStorage.setItem("access_token", value), token!);
  const updates: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "PUT" && request.url().includes("/ton-kho-nguyen-lieu/")) updates.push(request.url());
  });
  await page.goto("/#/ton-kho");
  const row = page.getByRole("row").filter({ hasText: "Excelsa" });
  await expect(row).toContainText("34 kg");
  const reasonsResponse = page.waitForResponse((response) => response.url().includes("/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO"));
  await row.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const response = await reasonsResponse;
  expect(response.status()).toBe(200);
  const choices = await response.json();
  expect(choices.length).toBeGreaterThan(0);
  expect(choices.every((reason: { trang_thai: string; chuc_nang_ap_dung: string[] }) => reason.trang_thai === "DANG_SU_DUNG" && reason.chuc_nang_ap_dung.includes("DIEU_CHINH_TON_KHO"))).toBeTruthy();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await expect(form.getByLabel("Lý do *", { exact: true })).toBeEnabled();
  await form.getByRole("button", { name: "Lưu tồn kho", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Vui lòng chọn lý do điều chỉnh tồn kho");
  expect(updates).toHaveLength(0);
  await form.getByLabel("Lý do *", { exact: true }).selectOption("LD_TK_KIEM_KE");
  await expect(form.getByLabel("Đã giữ (theo kế hoạch)", { exact: true })).toHaveValue("47.00");
  await form.getByLabel("Tồn thực tế", { exact: true }).fill("70");
  await form.getByLabel("Ghi chú", { exact: true }).fill("Kiểm tra giao diện; hủy thao tác, không ghi dữ liệu");
  await form.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(form).not.toBeVisible();
  expect(updates).toHaveLength(0);
  await expect(row).toContainText("34 kg");
  await expect(row).toContainText("-13 kg");
});
