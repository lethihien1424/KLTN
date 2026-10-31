import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync(new URL("../../test-fixtures/bom_quantities.json", import.meta.url), "utf8"));
const headers = ["ma_cong_thuc", "ten_cong_thuc", "ma_san_pham", "khoi_luong_thanh_pham_kg", "he_so_thu_hoi", "ty_le_hao_hut", "ma_nguyen_lieu", "ty_le_phoi_tron", "trang_thai"];
const initial = { ...fixture.bom, ten_san_pham: fixture.product.ten_san_pham, san_pham: fixture.product, chi_tiet: fixture.lines };
async function xlsx(boms: any[] = []) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("BOM");
  sheet.addRow(headers);
  for (const bom of boms) for (const line of bom.chi_tiet)
    sheet.addRow([bom.ma_cong_thuc, bom.ten_cong_thuc, bom.ma_san_pham, .25, Number(bom.he_so_thu_hoi), Number(bom.ty_le_hao_hut), line.ma_nguyen_lieu, Number(line.ty_le_phoi_tron), bom.trang_thai]);
  book.addWorksheet("HuongDan").addRow(["Nhập dữ liệu vào sheet BOM; tỷ lệ 0–1."]);
  book.addWorksheet("ViDu");
  return Buffer.from(await book.xlsx.writeBuffer());
}
async function setup(page: Page, allowed = true, many = false) {
  const state = { boms: many ? Array.from({ length: 12 }, (_, i) => ({ ...initial, ma_cong_thuc: `CT_${i}`, ten_cong_thuc: `Batch ${i}`, trang_thai: "NGUNG_SU_DUNG" })) : [structuredClone(initial)],
    imports: 0, previews: 0, exportQuery: "", errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem("access_token", "bom-excel-test"));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(4);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "BOM test", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM",
      chi_tiet: ["XEM", "THEM", "SUA", "XAC_NHAN", ...(allowed ? ["NHAP_FILE", "XUAT_EXCEL"] : [])].map((thao_tac) => ({ chuc_nang: "cong_thuc", thao_tac })) } });
    if (path === "/cong-thuc/excel/template") return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await xlsx() });
    if (path === "/cong-thuc/excel/export") {
      state.exportQuery = url.search;
      const boms = state.boms.filter((bom) => (!url.searchParams.get("search") || bom.ten_cong_thuc.includes(url.searchParams.get("search")!)) &&
        (!url.searchParams.get("ma_san_pham") || bom.ma_san_pham === url.searchParams.get("ma_san_pham")) &&
        (!url.searchParams.get("trang_thai") || bom.trang_thai === url.searchParams.get("trang_thai")));
      return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await xlsx(boms) });
    }
    if (path === "/cong-thuc/excel/preview" || path === "/cong-thuc/excel/import") {
      const importing = path.endsWith("/import");
      if (importing) state.imports += 1; else state.previews += 1;
      const invalid = request.postDataBuffer()?.toString().includes('filename="errors.xlsx"');
      const report = { valid: !invalid, total_rows: 4, total_boms: 2, imported: importing && !invalid ? 2 : 0,
        items: [1, 2].map((i) => ({ code: `CT_NEW${i}`, name: `Imported ${i}`, product: `SP_NEW${i}`, lines: 2, rows: [2 * i, 2 * i + 1], status: "DANG_SU_DUNG" })),
        errors: invalid ? [{ row: 3, code: "CT_NEW1", message: "Nguyên liệu MISSING không tồn tại." }] : [] };
      if (importing && !invalid) {
        expect(request.postDataBuffer()?.toString()).toContain('name="confirmed"');
        for (const item of report.items) state.boms.push({ ...initial, ma_cong_thuc: item.code, ten_cong_thuc: item.name, ma_san_pham: item.product,
          san_pham: { ...fixture.product, ma_san_pham: item.product } });
      }
      return route.fulfill({ json: report });
    }
    if (path === "/cong-thuc") return route.fulfill({ json: state.boms });
    if (path.startsWith("/cong-thuc/")) return route.fulfill({ json: state.boms.find((bom) => bom.ma_cong_thuc === path.split("/")[2]) });
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/cong-thuc");
  await expect(page.getByRole("button", { name: "+ Thêm công thức", exact: true })).toBeVisible();
  return state;
}

test("BOM Excel header order, template, filtered export includes every page and detail", async ({ page }) => {
  const state = await setup(page, true, true);
  const buttons = page.locator(".pm-heading button");
  await expect(buttons).toHaveText(["Tải template", "Nhập Excel", "Xuất Excel", "+ Thêm công thức"]);
  const tops = await buttons.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
  expect(Math.max(...tops) - Math.min(...tops)).toBeLessThan(1);
  const templateWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải template", exact: true }).click();
  const template = await templateWait;
  expect(template.suggestedFilename()).toBe("Template_cong_thuc_BOM.xlsx");
  const book = new ExcelJS.Workbook();
  await book.xlsx.readFile((await template.path())!);
  expect(book.worksheets.map((sheet) => sheet.name)).toEqual(["BOM", "HuongDan", "ViDu"]);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("Batch");
  await page.locator(".pm-toolbar select").nth(0).selectOption("SP0001");
  await page.locator(".pm-toolbar select").nth(1).selectOption("NGUNG_SU_DUNG");
  const exportWait = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const exported = await exportWait;
  expect(exported.suggestedFilename()).toMatch(/^Danh_sach_cong_thuc_BOM_\d{8}\.xlsx$/);
  await book.xlsx.readFile((await exported.path())!);
  expect(book.getWorksheet("BOM")!.actualRowCount).toBe(25);
  const params = new URLSearchParams(state.exportQuery);
  expect(params.get("search")).toBe("Batch");
  expect(params.get("ma_san_pham")).toBe("SP0001");
  expect(params.get("trang_thai")).toBe("NGUNG_SU_DUNG");
  expect(state.errors).toEqual([]);
});

test("BOM Excel preview shows row errors and prevents confirming invalid file", async ({ page }) => {
  const state = await setup(page);
  await page.getByLabel("Chọn file Excel công thức BOM").setInputFiles({ name: "errors.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await xlsx() });
  const dialog = page.getByRole("dialog", { name: "Kiểm tra Import công thức BOM", exact: true });
  await expect(dialog.getByRole("cell", { name: "Nguyên liệu MISSING không tồn tại.", exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Xác nhận Import", exact: true })).toBeDisabled();
  expect(state.previews).toBe(1);
  expect(state.imports).toBe(0);
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  expect(state.boms).toHaveLength(1);
});

test("BOM Excel valid preview waits for confirmation then refreshes list cards and quantities", async ({ page }) => {
  const state = await setup(page);
  await page.getByLabel("Chọn file Excel công thức BOM").setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await xlsx() });
  const dialog = page.getByRole("dialog", { name: "Kiểm tra Import công thức BOM", exact: true });
  await expect(dialog.getByRole("status")).toContainText("Dữ liệu hợp lệ");
  expect(state.imports).toBe(0);
  expect(state.boms).toHaveLength(1);
  await dialog.getByRole("button", { name: "Xác nhận Import", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".pm-summary strong").first()).toHaveText("3");
  await page.getByRole("button", { name: "CT_NEW1", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết CT_NEW1", exact: true });
  await expect(detail.getByTestId("bom-input-kg")).toHaveText("0,294118 kg");
  expect(state.imports).toBe(1);
  expect(state.errors).toEqual([]);
});

test("BOM Excel respects current import export permissions", async ({ page }) => {
  await setup(page, false);
  for (const name of ["Tải template", "Nhập Excel", "Xuất Excel"])
    await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "+ Thêm công thức", exact: true })).toBeEnabled();
});
