import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

const headers = ["ma_ncc", "ma_nguyen_lieu", "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat", "lead_time_ngay", "ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du"];
const exportHeaders = ["ma_nguyen_lieu_ncc", "ma_ncc", "ten_ncc", "ma_nguyen_lieu", "ten_nguyen_lieu", "don_vi_do_luong", "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat", "kha_dung_ncc", "lead_time_ngay", "ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du"];
const mapping = { ma_nguyen_lieu_ncc: "MAP1", ma_ncc: "NCC1", ten_ncc: "Supplier", ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Coffee", don_vi_do_luong: "kg", don_gia_nguyen_lieu: "150000", so_luong_ton_kho: "100", so_luong_book: "20", so_luong_xuat: "10", lead_time_ngay: 3, ty_le_chat_luong_dat: "0.95", ty_le_giao_dung_han: "0.90", ty_le_giao_du: "0.85" };
async function workbook(rows?: any[]) {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("CungUng"); sheet.addRow(rows ? exportHeaders : headers);
  if (rows) for (const row of rows) sheet.addRow(exportHeaders.map((key) => key === "kha_dung_ncc" ? Number(row.so_luong_ton_kho) - Number(row.so_luong_book) : key.startsWith("ty_le") ? Number(row[key]) : row[key]));
  return Buffer.from(await book.xlsx.writeBuffer());
}
async function setup(page: Page, readonly = false, scope = "") {
  const state = { rows: Array.from({ length: 25 }, (_, i) => ({ ...mapping, ma_nguyen_lieu_ncc: `MAP${i}`, ma_nguyen_lieu: `NL${i}`, ma_ncc: i < 22 ? "NCC1" : "NCC2", ten_nguyen_lieu: `${i < 20 ? "Coffee" : "Tea"} ${i}` })),
    imports: 0, previews: 0, exportQuery: "", previewScope: "", failImport: false, writes: [] as string[], errors: [] as string[], milano: { actual: "34", booked: "47", available: "-13" } };
  await page.addInitScript(() => sessionStorage.setItem("access_token", "supply-excel-test"));
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const req = route.request(), url = new URL(req.url()), path = url.pathname.slice(4);
    if (req.method() !== "GET") state.writes.push(path);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "Supply test", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM", chi_tiet: (readonly ? ["XEM"] : ["XEM", "THEM", "SUA", "NHAP_FILE", "XUAT_EXCEL"]).map((thao_tac) => ({ chuc_nang: "nguyen_lieu_nha_cung_cap", thao_tac })) } });
    if (path === "/nguyen-lieu-nha-cung-cap") return route.fulfill({ json: state.rows.filter((row) => !url.searchParams.get("ma_ncc") || row.ma_ncc === url.searchParams.get("ma_ncc")) });
    if (path.endsWith("/excel/template")) return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await workbook() });
    if (path.endsWith("/excel/export")) {
      state.exportQuery = url.search;
      const search = url.searchParams.get("search")?.toLowerCase() ?? "";
      const rows = state.rows.filter((row) => (!url.searchParams.get("ma_ncc") || row.ma_ncc === url.searchParams.get("ma_ncc")) && `${row.ma_nguyen_lieu_ncc} ${row.ma_ncc} ${row.ma_nguyen_lieu} ${row.ten_nguyen_lieu} ${row.ten_ncc}`.toLowerCase().includes(search));
      return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await workbook(rows) });
    }
    if (path.endsWith("/excel/preview") || path.endsWith("/excel/import")) {
      const importing = path.endsWith("/import"), invalid = req.postDataBuffer()?.toString().includes('filename="duplicate.xlsx"');
      if (!importing) { state.previews++; state.previewScope = url.searchParams.get("ma_ncc") ?? ""; }
      if (importing && state.failImport) return route.fulfill({ status: 500, json: { detail: "Không thể nhập cung ứng. Giao dịch đã rollback." } });
      if (importing && !invalid) { state.imports++; state.rows.push({ ...mapping, ma_nguyen_lieu_ncc: "MAP_IMPORTED", ma_nguyen_lieu: "NL_NEW", ten_nguyen_lieu: "Imported Coffee" }); }
      return route.fulfill({ json: { valid: !invalid, total_rows: 1, imported: importing && !invalid ? 1 : 0,
        items: [{ row: 2, ma_ncc: "NCC1", ten_ncc: "Supplier", ma_nguyen_lieu: "NL_NEW", ten_nguyen_lieu: "Imported Coffee", don_vi: "kg", gia: "150000", ton_ncc: "100" }],
        errors: invalid ? [{ row: 2, message: "Cặp cung ứng đã tồn tại; không ghi đè." }] : [] } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/nha-cung-cap/cung-ung" + (scope ? "?ncc=" + scope : ""));
  await expect(page.getByRole("heading", { name: "Nguyên liệu cung ứng", exact: true })).toBeVisible();
  return state;
}

test("supply Excel header template and export include every filtered page", async ({ page }) => {
  const state = await setup(page);
  await expect(page.locator(".pm-heading button")).toHaveText(["Tải template", "Nhập Excel", "Xuất Excel", "+ Thêm nguyên liệu cung ứng"]);
  const templateWait = page.waitForEvent("download"); await page.getByRole("button", { name: "Tải template", exact: true }).click();
  const template = await templateWait; expect(template.suggestedFilename()).toBe("Template_nguyen_lieu_cung_ung.xlsx");
  const book = new ExcelJS.Workbook(); await book.xlsx.readFile((await template.path())!);
  expect(book.worksheets[0].getRow(1).values).toEqual([undefined, ...headers]);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("Coffee");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(10);
  const exportWait = page.waitForEvent("download"); await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const exported = await exportWait; expect(exported.suggestedFilename()).toMatch(/^Nguyen_lieu_cung_ung_\d{8}\.xlsx$/);
  await book.xlsx.readFile((await exported.path())!); expect(book.worksheets[0].actualRowCount).toBe(21);
  expect(book.worksheets[0].getRow(1).values).toEqual([undefined, ...exportHeaders]);
  expect(new URLSearchParams(state.exportQuery).get("search")).toBe("Coffee");
  expect(state.writes).toHaveLength(0); expect(state.milano).toEqual({ actual: "34", booked: "47", available: "-13" }); expect(state.errors).toEqual([]);
});

test("supply import previews row errors waits for confirmation and refreshes without Milano writes", async ({ page }) => {
  const state = await setup(page); const input = page.getByLabel("Chọn Excel nguyên liệu cung ứng");
  await input.setInputFiles({ name: "duplicate.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook() });
  const form = page.getByRole("dialog", { name: "Xem trước nhập nguyên liệu cung ứng", exact: true });
  await expect(form.getByRole("alert")).toContainText("không ghi đè");
  await expect(form.getByRole("button", { name: "Xác nhận nhập cung ứng", exact: true })).toBeDisabled();
  await form.getByRole("button", { name: "Hủy", exact: true }).click(); expect(state.imports).toBe(0);
  await input.setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook() });
  await expect(form).toBeVisible(); expect(state.imports).toBe(0);
  await form.getByRole("button", { name: "Xác nhận nhập cung ứng", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.imports).toBe(1); expect(state.rows).toHaveLength(26);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("Imported");
  await expect(page.locator(".pm-panel tbody")).toContainText("Imported Coffee");
  expect(state.writes.every((path) => path.startsWith("/nguyen-lieu-nha-cung-cap/excel/"))).toBeTruthy();
  expect(state.milano).toEqual({ actual: "34", booked: "47", available: "-13" });
});

test("supply Excel preserves supplier scope and current permissions", async ({ page }) => {
  const state = await setup(page, false, "NCC1");
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Xuất Excel", exact: true }).click(); await download;
  expect(new URLSearchParams(state.exportQuery).get("ma_ncc")).toBe("NCC1");
  await page.getByLabel("Chọn Excel nguyên liệu cung ứng").setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook() });
  await expect(page.getByRole("dialog", { name: "Xem trước nhập nguyên liệu cung ứng", exact: true })).toBeVisible();
  expect(state.previewScope).toBe("NCC1");
});

test("supply viewer cannot import export or download a template without those rights", async ({ page }) => {
  const state = await setup(page, true);
  for (const name of ["Tải template", "Nhập Excel", "Xuất Excel"]) await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "+ Thêm nguyên liệu cung ứng", exact: true })).toHaveCount(0);
  expect(state.writes).toHaveLength(0);
});

test("supply import failure leaves data unchanged and shows the actual server error", async ({ page }) => {
  const state = await setup(page); state.failImport = true;
  await page.getByLabel("Chọn Excel nguyên liệu cung ứng").setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook() });
  const form = page.getByRole("dialog", { name: "Xem trước nhập nguyên liệu cung ứng", exact: true });
  await form.getByRole("button", { name: "Xác nhận nhập cung ứng", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Giao dịch đã rollback");
  expect(state.imports).toBe(0); expect(state.rows).toHaveLength(25);
  expect(state.milano).toEqual({ actual: "34", booked: "47", available: "-13" });
});
