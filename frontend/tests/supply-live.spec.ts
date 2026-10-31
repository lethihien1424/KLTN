import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";

test("live supply template export and duplicate preview cancel preserve business data", async ({ page }) => {
  const token = process.env.MILANO_LIVE_TEST_TOKEN;
  test.skip(!token || !process.env.MILANO_LIVE_SUPPLY_SAMPLE, "Run verify_supply_excel_live.py; no live import is committed.");
  const sample = JSON.parse(process.env.MILANO_LIVE_SUPPLY_SAMPLE!);
  await page.addInitScript((value) => sessionStorage.setItem("access_token", value), token!);
  const imports: string[] = [];
  page.on("request", (r) => { if (r.url().includes("/excel/import")) imports.push(r.url()); });
  await page.goto("/#/nha-cung-cap/cung-ung");
  for (const name of ["Tải template", "Xuất Excel"]) {
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name, exact: true }).click();
    expect((await downloading).suggestedFilename()).toMatch(/\.xlsx$/);
  }
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("CungUng");
  const keys = ["ma_ncc", "ma_nguyen_lieu", "don_gia_nguyen_lieu", "so_luong_ton_kho", "so_luong_book", "so_luong_xuat", "lead_time_ngay", "ty_le_chat_luong_dat", "ty_le_giao_dung_han", "ty_le_giao_du"];
  sheet.addRow(keys); sheet.addRow(keys.map((key) => sample[key]));
  await page.getByLabel("Chọn Excel nguyên liệu cung ứng").setInputFiles({ name: "supply.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: Buffer.from(await book.xlsx.writeBuffer()) });
  const dialog = page.getByRole("dialog", { name: "Xem trước nhập nguyên liệu cung ứng", exact: true });
  await expect(dialog.getByRole("alert")).toContainText("Cặp cung ứng đã tồn tại");
  await expect(dialog.getByRole("button", { name: "Xác nhận nhập cung ứng", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(dialog).not.toBeVisible(); expect(imports).toHaveLength(0);
});
