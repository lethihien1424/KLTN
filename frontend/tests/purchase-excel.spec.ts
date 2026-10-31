import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

const columns = ["Mã tham chiếu đơn", "Mã nhà cung cấp", "Mã nguyên liệu", "Số lượng mua", "Đơn vị tính", "Đơn giá mua", "Ngày dự kiến giao", "Ghi chú"];
async function workbook() {
  const book = new ExcelJS.Workbook(); book.addWorksheet("DonMua").addRow(columns);
  book.addWorksheet("HuongDan"); book.addWorksheet("ViDu");
  return Buffer.from(await book.xlsx.writeBuffer());
}
const report = {
  valid: true, total_rows: 1, total_orders: 1, imported: 0,
  items: [{ row: 2, code: "REF1", supplier: "NCC1", material: "NL1", unit: "kg", quantity: "2.25", price: "3.14", total: "7.07", delivery: "2026-12-01", note: "Test" }],
  errors: [] as { row: number; column: string; code: string; message: string }[],
};
async function setup(page: Page, rights = ["XEM", "THEM", "NHAP_FILE", "XUAT_EXCEL"]) {
  const state = { rights, previews: 0, imports: 0, lists: 0, exportQuery: "", invalid: false, stale: false, added: false };
  await page.addInitScript(() => sessionStorage.setItem("access_token", "purchase-excel-test"));
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "Excel test", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path.endsWith("/phan-quyen/cua-toi")) return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM", chi_tiet: state.rights.map(thao_tac => ({ chuc_nang: "don_mua_nguyen_lieu", thao_tac })) } });
    if (path.endsWith("/excel/template") || path.endsWith("/excel/export")) {
      if (path.endsWith("/export")) state.exportQuery = new URL(route.request().url()).search;
      return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await workbook() });
    }
    if (path.endsWith("/excel/preview")) {
      state.previews++;
      return route.fulfill({ json: state.invalid ? { ...report, valid: false, errors: [{ row: 2, column: "Mã nhà cung cấp", code: "REF1", message: "NCC không tồn tại." }] } : report });
    }
    if (path.endsWith("/excel/import")) {
      state.imports++;
      expect(route.request().postDataBuffer()?.toString()).toContain('name="confirmed"');
      if (state.stale) return route.fulfill({ json: { ...report, valid: false, errors: [{ row: 2, column: "Mã tham chiếu đơn", code: "REF1", message: "Đơn đã tồn tại." }] } });
      state.added = true;
      return route.fulfill({ json: { ...report, imported: 1 } });
    }
    if (path.endsWith("/don-mua-nguyen-lieu")) {
      state.lists++;
      return route.fulfill({ json: Array.from({ length: state.added ? 26 : 25 }, (_, i) => ({
        ma_don_mua: `DM${i}`, ma_ncc: "NCC1", ten_ncc: "Nhà cung cấp 1", ma_de_xuat: null, nguoi_tao: "TEST",
        ngay_dat_hang: "2026-10-31", ngay_du_kien_giao: "2026-12-01", tong_tien: "7.07", trang_thai: "CHUA_DUYET",
      })) });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/don-mua-nguyen-lieu");
  await expect(page.getByRole("heading", { name: "Đơn mua nguyên liệu", exact: true })).toBeVisible();
  await expect(page.locator(".pm-pagination")).toContainText("25 bản ghi");
  return state;
}
async function selectFile(page: Page) {
  await page.getByLabel("Chọn file Excel đơn mua").setInputFiles({ name: "orders.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook() });
}

test("purchase Excel buttons match BOM style, align and download template", async ({ page }) => {
  await setup(page);
  const buttons = page.locator(".pm-heading button");
  await expect(buttons).toHaveText(["Tải template", "Nhập Excel", "Xuất Excel", "+ Tạo đơn mua"]);
  const tops = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().top));
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
  for (const button of await buttons.all().then(list => list.slice(0, 3))) {
    await expect(button.locator(".anticon")).toHaveCount(1);
    await expect(button).toHaveCSS("background-color", "rgb(255, 255, 255)");
  }
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải template", exact: true }).click();
  const file = await download; expect(file.suggestedFilename()).toBe("Template_don_mua_nguyen_lieu.xlsx");
  const book = new ExcelJS.Workbook(); await book.xlsx.readFile((await file.path())!);
  expect(book.worksheets.map(sheet => sheet.name)).toEqual(["DonMua", "HuongDan", "ViDu"]);
});

test("purchase Excel preview requires confirmation and refreshes list and cards", async ({ page }) => {
  const state = await setup(page);
  await selectFile(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Dữ liệu hợp lệ");
  expect(state.imports).toBe(0);
  await expect(dialog).toContainText("không liên kết đề xuất");
  await dialog.getByRole("button", { name: "Xác nhận Import", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".pm-pagination")).toContainText("26 bản ghi");
  await expect(page.locator(".pm-summary").filter({ hasText: "Tổng đơn mua" })).toContainText("26");
  expect(state.imports).toBe(1); expect(state.lists).toBeGreaterThan(1);
});

test("purchase Excel row and column errors and changed data block import", async ({ page }) => {
  const state = await setup(page); state.invalid = true;
  await selectFile(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("NCC không tồn tại.");
  await expect(dialog).toContainText("Mã nhà cung cấp");
  await expect(dialog.getByRole("button", { name: "Xác nhận Import", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  state.invalid = false; state.stale = true;
  await selectFile(page);
  await dialog.getByRole("button", { name: "Xác nhận Import", exact: true }).click();
  await expect(dialog).toContainText("Đơn đã tồn tại.");
  await expect(dialog.getByRole("button", { name: "Xác nhận Import", exact: true })).toBeDisabled();
  await expect(page.locator(".pm-summary").filter({ hasText: "Tổng đơn mua" })).toContainText("25");
});

test("purchase Excel export sends every active filter beyond current pagination", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Sau", exact: true }).click();
  await page.getByRole("button", { name: "Chờ duyệt", exact: true }).click();
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("Nhà cung cấp");
  await page.locator(".pm-toolbar select").selectOption("NCC1");
  await page.getByLabel("Đặt từ ngày").fill("2026-10-01");
  await page.getByLabel("Đến ngày").fill("2026-10-31");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  expect((await download).suggestedFilename()).toMatch(/^Danh_sach_don_mua_nguyen_lieu_\d{8}\.xlsx$/);
  const params = new URLSearchParams(state.exportQuery);
  expect(Object.fromEntries(params)).toEqual({ search: "Nhà cung cấp", ma_ncc: "NCC1", trang_thai: "CHUA_DUYET", ngay_dat_tu: "2026-10-01", ngay_dat_den: "2026-10-31" });
});

test("purchase Excel uses dynamic permissions and wraps on narrow screens", async ({ page }) => {
  const state = await setup(page, ["XEM", "NHAP_FILE", "XUAT_EXCEL"]);
  await expect(page.getByRole("button", { name: "Nhập Excel", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tải template", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "+ Tạo đơn mua", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Xuất Excel", exact: true })).toBeEnabled();
  state.rights = ["XEM", "THEM", "NHAP_FILE"];
  await page.reload();
  await expect(page.getByRole("button", { name: "Nhập Excel", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Xuất Excel", exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 650, height: 844 });
  const buttons = page.locator(".pm-heading button");
  await expect(buttons).toHaveCount(4);
  const boxes = await buttons.evaluateAll(nodes => nodes.map(node => ({ left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right })));
  for (const box of boxes) { expect(box.left).toBeGreaterThanOrEqual(0); expect(box.right).toBeLessThanOrEqual(650); }
});
