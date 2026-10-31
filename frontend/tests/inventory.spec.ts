import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

const columns = ["Mã nguyên liệu", "Tồn thực tế", "Mức tồn an toàn", "Mức tồn tối đa", "Ngày kiểm kê", "Lý do", "Ghi chú"];
const initialStock = { ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Robusta", don_vi_do_luong: "kg", ngay_ghi_nhan: "2026-01-01",
  ton_kho_thuc_te: "620", hang_dang_ve: "90", so_luong_book: "70", ton_kho_kha_dung: "550", ton_kho_an_toan: "100", ton_kho_toi_da: "1000", trang_thai: "DANG_SU_DUNG" };
async function xlsx(rows: unknown[][] = []) {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("TonKho"); sheet.addRow(columns);
  rows.forEach((r) => sheet.addRow(r)); return Buffer.from(await book.xlsx.writeBuffer());
}
async function setup(page: Page, readonly = false) {
  const state = { stock: { ...initialStock }, imports: 0, previews: 0, exportQuery: "", issues: [] as any[], updates: [] as any[], writes: [] as string[], errors: [] as string[],
    excelsa: { ...initialStock, ma_nguyen_lieu: "NL2", ten_nguyen_lieu: "Excelsa", ton_kho_thuc_te: "34", so_luong_book: "47", ton_kho_kha_dung: "-13", ton_kho_an_toan: "15", ton_kho_toi_da: "100" },
    excelsaHistory: [] as any[],
    plan: { ma_ke_hoach: "KH1", ten_san_pham: "Coffee", so_luong: 70, trang_thai: "CHO_SAN_XUAT", chi_tiet: [
      { ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Robusta", don_vi_do_luong: "kg", so_luong_giu: "70", so_luong_xuat: "0", da_huy: "N" },
    ] } };
  await page.addInitScript(() => sessionStorage.setItem("access_token", "inventory-test"));
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.slice(4);
    if (request.method() !== "GET") state.writes.push(path);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "Kho test", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM", chi_tiet:
      (readonly ? ["XEM"] : ["XEM", "THEM", "SUA", "NHAP_FILE", "XUAT_EXCEL"]).map((thao_tac) => ({ chuc_nang: "ton_kho_nguyen_lieu", thao_tac })) } });
    if (path === "/ton-kho-nguyen-lieu") return route.fulfill({ json: [state.stock, state.excelsa] });
    if (path === "/ly-do/ap-dung") return route.fulfill({ json: [{ id: "LD1", ma_ly_do: "LD_CONFIG_001", ten_ly_do: "Chênh lệch kiểm kê", trang_thai: "DANG_SU_DUNG", chuc_nang_ap_dung: ["DIEU_CHINH_TON_KHO"] }] });
    if (path === "/ton-kho-nguyen-lieu/NL2/2026-01-01" && request.method() === "PUT") {
      const body = request.postDataJSON(); state.updates.push(body);
      state.excelsaHistory.push({ id: "COUNT1", thoi_gian: new Date().toISOString(), ngay_kiem_ke: "2026-01-01", loai: "KIEM_KE", so_luong: String(Number(body.ton_kho_thuc_te) - Number(state.excelsa.ton_kho_thuc_te)),
        ton_truoc: state.excelsa.ton_kho_thuc_te, ton_sau: body.ton_kho_thuc_te, giu_truoc: "47", giu_sau: "47", tham_chieu: "NL2/2026-01-01", nguoi_thuc_hien: "TEST", ten_nguoi_thuc_hien: "Kho test", ly_do: "Chênh lệch kiểm kê", ghi_chu: body.ghi_chu });
      Object.assign(state.excelsa, body); state.excelsa.ton_kho_kha_dung = String(Number(state.excelsa.ton_kho_thuc_te) - Number(state.excelsa.so_luong_book));
      return route.fulfill({ json: state.excelsa });
    }
    if (path === "/ton-kho-nguyen-lieu/NL2/chi-tiet") return route.fulfill({ json: { ton_kho: state.excelsa, hang_dang_ve: "0", da_giu_chua_co_nguon: "47", giu_theo_ke_hoach: [], giao_dich: state.excelsaHistory, don_mua: [] } });
    if (path === "/ton-kho-nguyen-lieu/NL1/2026-01-01" && request.method() === "PUT") {
      const body = request.postDataJSON(); state.updates.push(body); Object.assign(state.stock, body);
      state.stock.ton_kho_kha_dung = String(Number(state.stock.ton_kho_thuc_te) - Number(state.stock.so_luong_book));
      return route.fulfill({ json: state.stock });
    }
    if (path === "/ton-kho-nguyen-lieu/excel/template") return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await xlsx() });
    if (path === "/ton-kho-nguyen-lieu/excel/export") {
      state.exportQuery = url.search;
      return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await xlsx(Array.from({ length: 25 }, (_, i) => [`NL${i}`, 620, 100, 1000, "2026-01-01", "Kiểm kê", ""])) });
    }
    if (path === "/ton-kho-nguyen-lieu/excel/preview" || path === "/ton-kho-nguyen-lieu/excel/import") {
      const importing = path.endsWith("/import"); if (importing) state.imports++; else state.previews++;
      const invalid = request.postDataBuffer()?.toString().includes('filename="errors.xlsx"');
      if (importing) state.stock.ton_kho_thuc_te = "710";
      return route.fulfill({ json: { valid: !invalid, total_rows: 1, imported: importing ? 1 : 0,
        items: [{ row: 2, code: "NL1", name: "Robusta", unit: "kg", before: "620", after: "710", date: "2026-01-02" }],
        errors: invalid ? [{ row: 2, code: "NL1", message: "Trùng mã nguyên liệu trong file." }] : [] } });
    }
    if (path === "/ton-kho-nguyen-lieu/NL1/chi-tiet") return route.fulfill({ json: {
      ton_kho: state.stock, hang_dang_ve: "90", da_giu_chua_co_nguon: "20", giu_theo_ke_hoach: [],
      giao_dich: [{ id: "GD1", thoi_gian: "2026-01-02T10:00:00Z", ngay_kiem_ke: "2026-01-02", loai: "NHAP", so_luong: "90", ton_truoc: "620", ton_sau: "710", giu_truoc: "70", giu_sau: "70", tham_chieu: "DM1", nguoi_thuc_hien: "TEST", ten_nguoi_thuc_hien: "Kho test", ly_do: "Nhận hàng", ghi_chu: "Thực nhận" }],
      don_mua: [{ ma_don_mua: "DM1", ten_ncc: "Supplier", so_luong_mua: "100", so_luong_thuc_nhan: "90", con_cho_giao: "0", ngay_du_kien_giao: "2026-01-02", trang_thai: "DA_NHAN_HANG" }],
    } });
    if (path === "/ton-kho-nguyen-lieu/san-xuat/ke-hoach") return route.fulfill({ json: [state.plan] });
    if (path === "/ton-kho-nguyen-lieu/san-xuat/KH1/xuat") {
      const body = request.postDataJSON(); state.issues.push(body);
      const quantity = Number(body.chi_tiet[0].so_luong);
      state.stock.ton_kho_thuc_te = String(Number(state.stock.ton_kho_thuc_te) - quantity);
      state.stock.so_luong_book = String(Number(state.stock.so_luong_book) - quantity);
      state.plan.chi_tiet[0].so_luong_xuat = String(quantity);
      return route.fulfill({ json: { message: "Đã xuất" } });
    }
    if (path === "/ton-kho-nguyen-lieu/san-xuat/KH1/huy") {
      state.stock.so_luong_book = "0"; state.plan.chi_tiet[0].da_huy = "Y";
      return route.fulfill({ json: { message: "Đã hủy giữ" } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/ton-kho");
  await expect(page.getByRole("heading", { name: "Tồn kho nguyên liệu", exact: true })).toBeVisible();
  return state;
}

test("inventory has seven columns, incoming stock, three cards, negative warning and three detail tabs", async ({ page }) => {
  const state = await setup(page);
  await expect(page.locator(".pm-panel thead th")).toHaveText(["Nguyên liệu", "Tồn thực tế", "Hàng đang về", "Tồn khả dụng", "Mức an toàn", "Tình trạng", "Thao tác"]);
  await expect(page.getByRole("row").filter({ hasText: "Robusta" }).getByRole("cell").nth(2)).toHaveText("90 kg");
  await expect(page.locator(".pm-summary")).toHaveCount(3);
  await expect(page.getByRole("alert")).toContainText("tồn khả dụng âm");
  await page.getByRole("row").filter({ hasText: "Robusta" }).getByRole("button", { name: "Chi tiết tồn kho", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Chi tiết tồn kho · Robusta", exact: true });
  await expect(drawer.getByText("90 kg", { exact: true })).toBeVisible();
  await expect(drawer.getByRole("alert")).toContainText("Đã giữ chưa đối soát nguồn: 20 kg");
  await drawer.getByRole("tab", { name: "Lịch sử nhập–xuất", exact: true }).click();
  await expect(drawer.getByRole("cell", { name: "710", exact: true })).toBeVisible();
  await drawer.getByRole("tab", { name: "Đơn mua liên quan", exact: true }).click();
  await expect(drawer.getByRole("cell", { name: "Supplier", exact: true })).toBeVisible();
  await drawer.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.locator(".pm-toolbar select").selectOption("TON_AM");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  await expect(page.locator(".pm-panel tbody")).toContainText("Excelsa");
  expect(state.errors).toEqual([]);
});

test("inventory reloads actual and incoming quantities after a receipt", async ({ page }) => {
  const state = await setup(page);
  const row = page.getByRole("row").filter({ hasText: "Robusta" });
  await expect(row.getByRole("cell").nth(2)).toHaveText("90 kg");
  // Simulate committed receipt data returned by the stock API.
  Object.assign(state.stock, { ton_kho_thuc_te: "660", hang_dang_ve: "50", ton_kho_kha_dung: "590" });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(row.getByRole("cell").nth(1)).toHaveText("660 kg");
  await expect(row.getByRole("cell").nth(2)).toHaveText("50 kg");
  await expect(row.getByRole("cell").nth(3)).toHaveText("590 kg");
  Object.assign(state.stock, { ton_kho_thuc_te: "700", hang_dang_ve: "0", ton_kho_kha_dung: "630" });
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(row.getByRole("cell").nth(1)).toHaveText("700 kg");
  await expect(row.getByRole("cell").nth(2)).toHaveText("0 kg");
  expect(state.errors).toEqual([]);
});

test("inventory template export filters and Excel preview confirmation", async ({ page }) => {
  const state = await setup(page);
  await expect(page.locator(".pm-heading button")).toHaveText(["Tải template", "Nhập Excel", "Xuất Excel", "+ Ghi nhận tồn kho"]);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Tải template", exact: true }).click();
  const template = await download; const workbook = new ExcelJS.Workbook(); await workbook.xlsx.readFile((await template.path())!);
  expect(workbook.worksheets[0].getRow(1).values).toEqual([undefined, ...columns]);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("Robusta");
  const exported = page.waitForEvent("download"); await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const result = await exported; expect(result.suggestedFilename()).toMatch(/^Ton_kho_nguyen_lieu_\d{8}\.xlsx$/);
  await workbook.xlsx.readFile((await result.path())!); expect(workbook.worksheets[0].actualRowCount).toBe(26);
  expect(new URLSearchParams(state.exportQuery).get("search")).toBe("Robusta");
  const input = page.getByLabel("Chọn file Excel tồn kho");
  await input.setInputFiles({ name: "errors.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await xlsx() });
  const dialog = page.getByRole("dialog", { name: "Xem trước nhập tồn kho", exact: true });
  await expect(dialog.getByRole("alert")).toContainText("Trùng mã nguyên liệu");
  await expect(dialog.getByRole("button", { name: "Xác nhận nhập", exact: true })).toBeDisabled();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await input.setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await xlsx() });
  await expect(dialog.getByRole("status")).toContainText("Dữ liệu hợp lệ"); expect(state.imports).toBe(0);
  await dialog.getByRole("button", { name: "Xác nhận nhập", exact: true }).click();
  await expect(dialog).not.toBeVisible(); expect(state.imports).toBe(1);
  await expect(page.locator(".pm-panel tbody")).toContainText("710 kg"); expect(state.errors).toEqual([]);
});

test("inventory production issues actual quantity and cancels remaining hold", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Nguyên liệu cho sản xuất", exact: true }).click();
  const production = page.getByRole("dialog", { name: "Nguyên liệu cho sản xuất", exact: true });
  await production.getByRole("button", { name: "Xuất nguyên liệu", exact: true }).click();
  const issue = page.getByRole("dialog", { name: "Xuất nguyên liệu · KH1", exact: true });
  await issue.getByLabel(/^Robusta · còn giữ/).fill("30");
  await issue.getByRole("button", { name: "Xác nhận xuất kho", exact: true }).click();
  await expect(issue).not.toBeVisible(); expect(state.stock.ton_kho_thuc_te).toBe("590"); expect(state.stock.so_luong_book).toBe("40");
  expect(state.issues[0].request_id.length).toBeGreaterThan(16); expect(state.issues[0].chi_tiet[0].so_luong).toBe("30");
  await production.getByRole("button", { name: "Hủy giữ còn lại", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Xác nhận hủy phần giữ", exact: true });
  await confirm.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(confirm).not.toBeVisible(); expect(state.stock.so_luong_book).toBe("0"); expect(state.errors).toEqual([]);
});

test("inventory readonly permissions and mobile layout", async ({ page }) => {
  await setup(page, true);
  await expect(page.getByRole("button", { name: "Nhập Excel", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Xuất Excel", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "+ Ghi nhận tồn kho", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nguyên liệu cho sản xuất", exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Tải template", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});

test("inventory adjustment requires reason keeps held readonly and validates limits", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("row").filter({ hasText: "Robusta" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Robusta", exact: true });
  await expect(form.getByLabel("Đã giữ (theo kế hoạch)", { exact: true })).toBeDisabled();
  await form.getByLabel("Lý do *", { exact: true }).selectOption("LD1");
  await form.getByLabel("Tồn an toàn", { exact: true }).fill("2000");
  await form.getByRole("button", { name: "Lưu tồn kho", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Tồn kho tối đa phải lớn hơn hoặc bằng tồn an toàn");
  expect(state.updates).toHaveLength(0);
  await form.getByLabel("Tồn an toàn", { exact: true }).fill("100");
  await form.getByLabel("Tồn thực tế", { exact: true }).fill("600");
  await form.getByRole("button", { name: "Lưu tồn kho", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.stock.so_luong_book).toBe("70");
  expect(state.updates[0].so_luong_book).toBeUndefined(); expect(state.updates[0].ly_do_id).toBe("LD1");
});

test("Excelsa reason is required and the selected ID note stock and history stay synchronized", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await expect(form.getByLabel("Lý do *", { exact: true })).toBeEnabled();
  await form.getByRole("button", { name: "Lưu tồn kho", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Vui lòng chọn lý do điều chỉnh tồn kho");
  expect(state.updates).toHaveLength(0);
  await form.getByLabel("Lý do *", { exact: true }).selectOption("LD1");
  await form.getByLabel("Ghi chú", { exact: true }).fill("Kiểm kê Excelsa thực tế");
  await form.getByLabel("Tồn thực tế", { exact: true }).fill("70");
  await form.getByRole("button", { name: "Lưu tồn kho", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.updates).toHaveLength(1);
  expect(state.updates[0].ly_do_id).toBe("LD1"); expect(state.updates[0].ly_do_id).not.toBe("LD_CONFIG_001");
  expect(state.excelsa.so_luong_book).toBe("47"); expect(state.excelsa.ton_kho_kha_dung).toBe("23");
  await expect(page.locator(".pm-panel tbody")).toContainText("70 kg");
  await expect(page.locator(".pm-summary").filter({ hasText: "Nguyên liệu cần bổ sung" }).locator("strong")).toHaveText("0");
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chi tiết tồn kho", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết tồn kho · Excelsa", exact: true });
  await detail.getByRole("tab", { name: "Lịch sử nhập–xuất", exact: true }).click();
  await expect(detail.getByRole("cell", { name: "34", exact: true })).toBeVisible();
  await expect(detail.getByRole("cell", { name: "70", exact: true })).toBeVisible();
  await expect(detail.getByText("Kiểm kê Excelsa thực tế", { exact: true })).toBeVisible();
});

test("reason HTTP 500 is displayed as a server error and saving remains blocked", async ({ page }) => {
  const state = await setup(page);
  await page.route("**/api/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO", (route) => route.fulfill({ status: 500, json: { detail: "Máy chủ gặp lỗi xử lý yêu cầu (HTTP 500)." } }));
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await expect(form.getByRole("alert")).toContainText("HTTP 500");
  await expect(form.getByRole("alert")).not.toContainText("Không thể kết nối máy chủ");
  await expect(form.getByRole("button", { name: "Lưu tồn kho", exact: true })).toBeDisabled();
  await expect(form.getByLabel("Lý do *", { exact: true })).toBeDisabled();
  expect(state.updates).toHaveLength(0);
});

test("real reason network failure blocks saving and retry reloads the dropdown", async ({ page }) => {
  const state = await setup(page); let failing = true;
  await page.route("**/api/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO", (route) => failing ? route.abort("failed") : route.fallback());
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await expect(form.getByRole("alert")).toContainText("Không thể kết nối máy chủ");
  await expect(form.getByRole("button", { name: "Lưu tồn kho", exact: true })).toBeDisabled();
  expect(state.updates).toHaveLength(0);
  failing = false; await form.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(form.getByLabel("Lý do *", { exact: true })).toBeEnabled();
  await form.getByLabel("Lý do *", { exact: true }).selectOption("LD1");
});

test("unconfigured reasons explain the setup and cancel never updates inventory", async ({ page }) => {
  const state = await setup(page);
  await page.route("**/api/ly-do/ap-dung?chuc_nang=DIEU_CHINH_TON_KHO", (route) => route.fulfill({ json: [] }));
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await expect(form.getByRole("alert")).toContainText("Cấu hình → Quản lý lý do");
  await expect(form.getByRole("button", { name: "Lưu tồn kho", exact: true })).toBeDisabled();
  await form.getByLabel("Tồn thực tế", { exact: true }).fill("70");
  await form.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.updates).toHaveLength(0); expect(state.excelsa.ton_kho_thuc_te).toBe("34");
});

test("backend reason schema validation is shown without technical Pydantic text", async ({ page }) => {
  const state = await setup(page);
  await page.route("**/api/ton-kho-nguyen-lieu/NL2/2026-01-01", (route) => route.fulfill({ status: 422, json: { detail: [
    { type: "string_too_short", loc: ["body", "ly_do_id"], msg: "String should have at least 1 character", input: "" },
  ] } }));
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await form.getByLabel("Lý do *", { exact: true }).selectOption("LD1");
  await form.getByRole("button", { name: "Lưu tồn kho", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("Vui lòng chọn lý do điều chỉnh tồn kho");
  await expect(form.getByRole("alert")).not.toContainText("String should");
  expect(state.excelsa.ton_kho_thuc_te).toBe("34");
});

test("cancelling a filled adjustment with a valid reason sends no update", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("row").filter({ hasText: "Excelsa" }).getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Cập nhật tồn kho · Excelsa", exact: true });
  await form.getByLabel("Lý do *", { exact: true }).selectOption("LD1");
  await form.getByLabel("Ghi chú", { exact: true }).fill("Không lưu thay đổi này");
  await form.getByLabel("Tồn thực tế", { exact: true }).fill("70");
  await form.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.updates).toHaveLength(0); expect(state.excelsa.ton_kho_thuc_te).toBe("34");
});
