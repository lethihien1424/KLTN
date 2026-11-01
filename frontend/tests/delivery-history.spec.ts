import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const templateColumns = ["ma_don_cu", "ma_ncc", "lan_giao", "ngay_dat", "ngay_du_kien", "ngay_nhan", "ma_nguyen_lieu", "so_luong_dat", "so_luong_giao", "so_luong_dat_chat_luong", "so_luong_khong_dat", "so_luong_chap_nhan", "hoan_tat", "ly_do", "ghi_chu", "don_gia_mua"];
async function workbook(headers: string[], rows: unknown[][] = [], sheet = "LichSuGiaoHang") {
  const book = new ExcelJS.Workbook(); const tab = book.addWorksheet(sheet); tab.addRow(headers);
  rows.forEach((row) => tab.addRow(row)); return Buffer.from(await book.xlsx.writeBuffer());
}
const line = (id: string, material = "NL1", unit = "kg", accepted = "40") => ({
  id, ma_nguyen_lieu: material, ten_nguyen_lieu: material === "NL1" ? "Robusta" : "Sữa", don_vi: unit,
  so_luong_dat: "100", so_luong_giao: accepted, so_luong_nhap_kho: accepted,
  don_gia_mua: "10.25" as string | null, don_vi_don_gia: unit as string | null,
  thanh_tien: ({ "40": "410.0000", "5": "51.2500", "60": "615.0000" }[accepted] ?? "615.0000") as string | null,
  so_luong_dat_chat_luong: null, so_luong_khong_dat: null, don_vi_ton_kho: unit,
  ton_truoc: "620", ton_sau: String(620 + Number(accepted)), ma_giao_dich_kho: `GD${id}`, ly_do: "Kiểm nhận thực tế",
});
function receipt(index: number) {
  return { ma_phieu_nhan: `PH${index}`, ma_don_mua: index < 3 ? "DM1" : `DM${index}`, ma_don_cu: null as string | null, lan_giao_cu: null as string | null,
    ma_ncc: index === 12 ? "NCC2" : "NCC1", ten_ncc: index === 12 ? "NCC thứ hai" : "Nhà cung cấp Coffee", nguon: "THUC_TE",
    ngay_dat_hang: "2026-01-01", ngay_du_kien_giao: "2026-01-03", ngay_giao_thuc_te: index === 1 ? "2026-01-02" : "2026-01-04",
    hoan_tat: index !== 1, dung_han: index === 1, trang_thai_giao_hang: index === 1 ? "CON_GIAO_TIEP" : "DA_CHOT",
    so_nguyen_lieu: index === 1 ? 2 : 1, tong_thuc_nhan: index === 1 ? [{ don_vi: "kg", so_luong: "40" }, { don_vi: "l", so_luong: "5" }] : [{ don_vi: "kg", so_luong: "60" }],
    tong_gia_tri_nhap: (index === 1 ? "461.2500" : "615.0000") as string | null,
    nguoi_xac_nhan: "TEST", ten_nguoi_xac_nhan: "Người nhận kho", ghi_chu: "Ghi chú phiếu nhận",
    chi_tiet: index === 1 ? [line("L1"), line("L2", "NL2", "l", "5")] : [line(`L${index + 1}`, "NL1", "kg", "60")],
  };
}
async function setup(page: Page, rights = ["XEM", "NHAP_FILE", "XUAT_EXCEL"], score = true, supplierView = false) {
  const state = { rows: Array.from({ length: 12 }, (_, i) => receipt(i + 1)), previews: 0, imports: 0, stock: 620,
    exportQuery: "", requests: [] as string[], errors: [] as string[], reads: 0, historyQueries: [] as string[] };
  await page.addInitScript(() => sessionStorage.setItem("access_token", "history-test"));
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname.slice(4);
    if (request.method() !== "GET") state.requests.push(path);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "Kho", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM", chi_tiet: [
      ...rights.map((thao_tac) => ({ chuc_nang: "don_mua_nguyen_lieu", thao_tac })),
      ...(score ? [{ chuc_nang: "nha_cung_cap", thao_tac: "TINH_DIEM" }] : []),
      ...(supplierView ? [{ chuc_nang: "nha_cung_cap", thao_tac: "XEM" }] : []),
    ] } });
    if (path === "/nha-cung-cap") return route.fulfill({ json: ["NCC1", "NCC2", "NCC3"].map((ma_ncc) => ({
      ma_ncc, ten_ncc: ma_ncc === "NCC1" ? "Nhà cung cấp Coffee" : ma_ncc === "NCC2" ? "NCC thứ hai" : "NCC chưa giao hàng",
      trang_thai: "DANG_HOAT_DONG", diem_dieu_kien_thuong_mai: null,
      ty_le_giao_dung_han_thuc_te: null, ty_le_giao_du_thuc_te: null,
    })) });
    const root = "/giao-nguyen-lieu/lich-su";
    if (path === root) {
      state.reads++; state.historyQueries.push(url.search);
      return route.fulfill({ json: state.rows.filter((r) => !url.searchParams.get("ma_ncc") || r.ma_ncc === url.searchParams.get("ma_ncc")) });
    }
    if (path.startsWith(root + "/phieu/")) return route.fulfill({ json: state.rows.find((r) => r.ma_phieu_nhan === path.split("/").at(-1)) });
    if (path === root + "/excel/template") return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await workbook(templateColumns) });
    if (path === root + "/excel/export") {
      state.exportQuery = url.search;
      return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await workbook(["Mã phiếu nhận", "Mã đơn mua"],
        state.rows.map((r) => [r.ma_phieu_nhan, r.ma_don_mua || r.ma_don_cu]), "LichSuNhapNguyenLieu") });
    }
    if (path === root + "/excel/preview" || path === root + "/excel/import") {
      const importing = path.endsWith("/import"); const invalid = request.postDataBuffer()?.toString().includes('filename="duplicate.xlsx"');
      if (!importing) state.previews++;
      if (importing && !invalid) {
        state.imports++; const past = receipt(13);
        Object.assign(past, { nguon: "LICH_SU", ma_don_mua: null, ma_don_cu: "OLD1", lan_giao_cu: "DOT1" });
        past.chi_tiet.forEach((item) => Object.assign(item, { ton_truoc: null, ton_sau: null, ma_giao_dich_kho: null }));
        state.rows.unshift(past);
      }
      return route.fulfill({ json: { valid: !invalid, imported: importing && !invalid ? 1 : 0, total_rows: 1,
        items: [{ code: "OLD1", supplier: "NCC1", delivery: "DOT1", lines: 1, date: "2026-01-04", closed: true,
          tong_gia_tri_nhap: "410.0000", chi_tiet: [{ ma_nguyen_lieu: "NL1", so_luong_nhap_kho: "40", don_gia_mua: "10.25", don_vi_don_gia: "kg", thanh_tien: "410.0000" }] }],
        errors: invalid ? [{ row: 2, message: "Đợt lịch sử đã tồn tại; không ghi đè hoặc cộng trùng." }] : [] } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/lich-su-nhap-nguyen-lieu");
  return state;
}

for (const supplier of ["NCC1", "NCC2", "NCC3"]) {
  test(`supplier history action navigates with the selected supplier and survives reload: ${supplier}`, async ({ page }) => {
    const state = await setup(page, ["XEM", "NHAP_FILE", "XUAT_EXCEL"], true, true);
    Object.assign(state.rows[2], { nguon: "LICH_SU", ma_don_mua: null, ma_don_cu: "OLD3" });
    await page.goto("/#/nha-cung-cap");
    const row = page.getByRole("row").filter({ has: page.getByRole("button", { name: supplier, exact: true }) });
    const action = row.getByRole("button", { name: "Xem lịch sử nhập hàng", exact: true });
    await action.hover();
    await expect(page.getByRole("tooltip", { name: "Xem lịch sử nhập hàng", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xem nguyên liệu cung ứng", exact: true })).toHaveCount(0);
    await action.click();
    await expect(page).toHaveURL(new RegExp(`/\\#/lich-su-nhap-nguyen-lieu\\?ma_ncc=${supplier}$`));
    const selector = page.getByRole("combobox", { name: "Nhà cung cấp", exact: true });
    await expect(selector).toHaveValue(supplier);
    if (supplier === "NCC3") {
      await expect(page.getByText("Nhà cung cấp này chưa có lịch sử nhập hàng", { exact: true })).toBeVisible();
    } else {
      await expect(page.locator(".pm-panel tbody tr")).toHaveCount(supplier === "NCC1" ? 10 : 1);
      await expect(page.locator(".pm-panel tbody")).not.toContainText(supplier === "NCC1" ? "NCC2" : "NCC1");
      if (supplier === "NCC1") {
        await expect(page.locator(".pm-panel tbody")).toContainText("Quá khứ · không cộng kho");
        await expect(page.locator(".pm-panel tbody")).toContainText("Nhận kho thực tế");
        await page.getByRole("button", { name: "Sau", exact: true }).click();
        await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
      }
    }
    expect(state.historyQueries.some((query) => new URLSearchParams(query).get("ma_ncc") === supplier)).toBeTruthy();
    await page.reload();
    await expect(selector).toHaveValue(supplier);
    await page.getByRole("button", { name: "Làm mới", exact: true }).click();
    if (supplier === "NCC3") await expect(page.getByText("Nhà cung cấp này chưa có lịch sử nhập hàng", { exact: true })).toBeVisible();
    else await expect(page.locator(".pm-panel tbody tr")).toHaveCount(supplier === "NCC1" ? 10 : 1);
    expect(state.requests).toEqual([]); expect(state.stock).toBe(620); expect(state.errors).toEqual([]);
  });
}

test("supplier URL filter combines with other filters, export, switching, clearing and browser back", async ({ page }) => {
  const state = await setup(page, ["XEM", "NHAP_FILE", "XUAT_EXCEL"], true, true);
  await page.goto("/#/lich-su-nhap-nguyen-lieu?ma_ncc=NCC1");
  const selector = page.getByRole("combobox", { name: "Nhà cung cấp", exact: true });
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("PH1");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(3);
  await expect(page.locator(".pm-panel tbody")).not.toContainText("PH12");
  await page.getByLabel("Ngày nhận từ", { exact: true }).fill("2026-01-02");
  await page.getByLabel("Ngày nhận đến", { exact: true }).fill("2026-01-02");
  await page.getByRole("combobox", { name: "Nguyên liệu", exact: true }).selectOption("NL2");
  await page.getByLabel("Mã đơn mua", { exact: true }).fill("DM1");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click(); await download;
  expect(Object.fromEntries(new URLSearchParams(state.exportQuery))).toMatchObject({ ma_ncc: "NCC1", search: "PH1", ngay_nhan_tu: "2026-01-02", ngay_nhan_den: "2026-01-02", ma_nguyen_lieu: "NL2", ma_don_mua: "DM1" });
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("");
  await page.getByLabel("Ngày nhận từ", { exact: true }).fill("");
  await page.getByLabel("Ngày nhận đến", { exact: true }).fill("");
  await page.getByRole("combobox", { name: "Nguyên liệu", exact: true }).selectOption("");
  await page.getByLabel("Mã đơn mua", { exact: true }).fill("");
  await selector.selectOption("NCC2");
  await expect(page).toHaveURL(/ma_ncc=NCC2$/);
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  await expect(page.locator(".pm-panel tbody")).toContainText("PH12");
  await selector.selectOption("");
  await expect(page).toHaveURL(/\/#\/lich-su-nhap-nguyen-lieu$/);
  await expect(page.locator(".pm-pagination")).toContainText("12 bản ghi");
  await page.goBack();
  await expect(selector).toHaveValue("NCC2");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  expect(state.requests).toEqual([]); expect(state.errors).toEqual([]);
});

test("changing supplier hides previous receipts and ignores a late response", async ({ page }) => {
  const state = await setup(page, ["XEM"], false, true);
  await page.goto("/#/lich-su-nhap-nguyen-lieu?ma_ncc=NCC1");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(10);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/giao-nguyen-lieu/lich-su?ma_ncc=NCC2", async (route) => {
    await pending;
    await route.fulfill({ json: state.rows.filter((r) => r.ma_ncc === "NCC2") });
  });
  const request = page.waitForRequest("**/api/giao-nguyen-lieu/lich-su?ma_ncc=NCC2");
  const selector = page.getByRole("combobox", { name: "Nhà cung cấp", exact: true });
  await selector.selectOption("NCC2"); await request;
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(0);
  await selector.selectOption("NCC1");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(10);
  const response = page.waitForResponse("**/api/giao-nguyen-lieu/lich-su?ma_ncc=NCC2");
  release(); await response;
  await expect(selector).toHaveValue("NCC1");
  await expect(page.locator(".pm-panel tbody")).not.toContainText("NCC2");
  expect(state.errors).toEqual([]);
});

test("supplier history action and direct URL require history viewing permission", async ({ page }) => {
  const state = await setup(page, [], false, true);
  await page.goto("/#/nha-cung-cap");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Xem lịch sử nhập hàng", exact: true })).toHaveCount(0);
  await page.goto("/#/lich-su-nhap-nguyen-lieu?ma_ncc=NCC1");
  await expect(page.getByText("Bạn chưa có quyền truy cập màn hình này", { exact: true })).toBeVisible();
  expect(state.reads).toBe(0); expect(state.requests).toEqual([]);
});

test("receipt list groups batches totals by unit and details reuse warehouse history", async ({ page }) => {
  const state = await setup(page);
  await expect(page.getByRole("heading", { name: "Lịch sử nhập nguyên liệu", exact: true })).toBeVisible();
  await expect(page.locator(".pm-heading button")).toHaveText(["Tải template", "Nhập Excel", "Xuất Excel", "Cập nhật giá từ Excel"]);
  await expect(page.locator(".pm-panel thead th")).toHaveText(["Mã phiếu nhận", "Ngày nhận", "Nhà cung cấp", "Mã đơn mua", "Số nguyên liệu", "Tổng thực nhận", "Tổng giá trị nhập", "Trạng thái giao hàng", "Thao tác"]);
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(10);
  await page.getByLabel("Mã đơn mua", { exact: true }).fill("DM1");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(2);
  const first = page.locator(".pm-panel tbody tr").first();
  await expect(first.getByRole("cell").nth(5)).toHaveText("40 kg5 l");
  await first.getByRole("button", { name: "Chi tiết lần nhập", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết lần nhập · PH1", exact: true });
  await expect(detail).toContainText("Người nhận kho (TEST)");
  await expect(detail).toContainText("Ghi chú phiếu nhận");
  await expect(detail.getByRole("columnheader", { name: "Đơn giá", exact: true })).toBeVisible();
  await expect(detail.getByRole("columnheader", { name: "Thành tiền", exact: true })).toBeVisible();
  await expect(detail).toContainText("VND/kg");
  await expect(detail).toContainText("VND/l");
  await expect(detail).toContainText("461,25 ₫");
  await expect(detail).toContainText("chưa có kết quả kiểm định chất lượng");
  await expect(detail.getByRole("columnheader", { name: "Tồn trước", exact: true })).toBeVisible();
  await expect(detail.getByRole("cell", { name: "660 kg", exact: true })).toBeVisible();
  await expect(detail.getByRole("link", { name: "DM1", exact: true })).toHaveAttribute("href", "#/don-mua/DM1");
  await detail.getByRole("button", { name: "Đóng", exact: true }).click();
  expect(state.requests).toEqual([]); expect(state.errors).toEqual([]);
});

test("receipt filters cover search dates supplier material and purchase code", async ({ page }) => {
  await setup(page);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("PH12");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("");
  await page.getByRole("combobox", { name: "Nhà cung cấp", exact: true }).selectOption("NCC2");
  await expect(page.locator(".pm-panel tbody")).toContainText("NCC thứ hai");
  await page.getByRole("combobox", { name: "Nhà cung cấp", exact: true }).selectOption("");
  await page.getByRole("combobox", { name: "Nguyên liệu", exact: true }).selectOption("NL2");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  await expect(page.locator(".pm-panel tbody")).toContainText("40 kg");
  await expect(page.locator(".pm-panel tbody")).toContainText("5 l");
  await page.getByRole("combobox", { name: "Nguyên liệu", exact: true }).selectOption("");
  await page.getByLabel("Ngày nhận từ", { exact: true }).fill("2026-01-02");
  await page.getByLabel("Ngày nhận đến", { exact: true }).fill("2026-01-02");
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(1);
  await page.getByLabel("Ngày nhận từ", { exact: true }).fill("2026-01-05");
  await expect(page.getByRole("alert")).toContainText("Ngày nhận từ không được sau ngày nhận đến");
  await expect(page.getByRole("button", { name: "Xuất Excel", exact: true })).toBeDisabled();
});

test("template and export include all receipts beyond the table page and pass every filter", async ({ page }) => {
  const state = await setup(page);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Tải template", exact: true }).click();
  const template = await pending; const book = new ExcelJS.Workbook();
  await book.xlsx.readFile((await template.path())!);
  expect(book.worksheets[0].getRow(1).values).toEqual([undefined, ...templateColumns]);
  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click();
  const result = await exported;
  await book.xlsx.readFile((await result.path())!); expect(book.worksheets[0].actualRowCount).toBe(13);
  await page.getByPlaceholder("Tìm theo mã hoặc tên…").fill("Coffee");
  await page.getByLabel("Ngày nhận từ", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Ngày nhận đến", { exact: true }).fill("2026-01-05");
  await page.getByRole("combobox", { name: "Nhà cung cấp", exact: true }).selectOption("NCC1");
  await page.getByRole("combobox", { name: "Nguyên liệu", exact: true }).selectOption("NL1");
  await page.getByLabel("Mã đơn mua", { exact: true }).fill("DM1");
  const filtered = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất Excel", exact: true }).click(); await filtered;
  expect(Object.fromEntries(new URLSearchParams(state.exportQuery))).toEqual({ search: "Coffee", ngay_nhan_tu: "2026-01-01", ngay_nhan_den: "2026-01-05", ma_ncc: "NCC1", ma_nguyen_lieu: "NL1", ma_don_mua: "DM1" });
  expect(state.errors).toEqual([]);
});

test("historical import previews row errors confirms separately and never calls receiving", async ({ page }) => {
  const state = await setup(page);
  const input = page.getByLabel("Chọn Excel lịch sử giao hàng");
  await input.setInputFiles({ name: "duplicate.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook(templateColumns) });
  const preview = page.getByRole("dialog", { name: "Xem trước lịch sử giao hàng", exact: true });
  await expect(preview.getByRole("alert")).toContainText("Đợt lịch sử đã tồn tại");
  await expect(preview.getByRole("button", { name: "Xác nhận nhập lịch sử", exact: true })).toBeDisabled();
  await preview.getByRole("button", { name: "Hủy", exact: true }).click();
  await input.setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await workbook(templateColumns) });
  await expect(preview).toBeVisible(); expect(state.imports).toBe(0);
  await expect(preview).toContainText("10,25 ₫");
  await expect(preview).toContainText("VND/kg");
  await expect(preview).toContainText("410 ₫");
  await preview.getByRole("button", { name: "Xác nhận nhập lịch sử", exact: true }).click();
  await expect(preview).not.toBeVisible(); expect(state.imports).toBe(1);
  const past = page.locator(".pm-panel tbody tr").first();
  await expect(past).toContainText("Quá khứ · không cộng kho");
  await past.getByRole("button", { name: "Chi tiết lần nhập", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết lần nhập · PH13", exact: true });
  await expect(detail.getByRole("cell", { name: "Không có lịch sử kho", exact: true })).toHaveCount(2);
  expect(state.stock).toBe(620);
  expect(state.requests.every((path) => path.startsWith("/giao-nguyen-lieu/lich-su/excel/"))).toBeTruthy();
  expect(state.errors).toEqual([]);
});

test("view-only RBAC keeps history usable without catalogue permissions and prevents Excel writes", async ({ page }) => {
  const state = await setup(page, ["XEM"], false);
  await expect(page.locator(".pm-panel tbody tr")).toHaveCount(10);
  for (const name of ["Tải template", "Nhập Excel", "Xuất Excel"]) await expect(page.getByRole("button", { name, exact: true })).toBeDisabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  expect(state.requests).toEqual([]); expect(state.errors).toEqual([]);
});

test("import requires supplier scoring permission and missing view permission blocks history", async ({ page }) => {
  await setup(page, ["XEM", "NHAP_FILE"], false);
  await expect(page.getByRole("button", { name: "Tải template", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Nhập Excel", exact: true })).toBeDisabled();
});

test("ungranted dynamic role cannot view history", async ({ page }) => {
  const state = await setup(page, [], false);
  await expect(page.getByText("Bạn chưa có quyền truy cập màn hình này", { exact: true })).toBeVisible();
  expect(state.reads).toBe(0);
});

test("partial missing prices show no complete total and zero price stays known", async ({ page }) => {
  const state = await setup(page);
  state.rows[0].chi_tiet[1].don_gia_mua = null;
  state.rows[0].chi_tiet[1].don_vi_don_gia = null;
  state.rows[0].chi_tiet[1].thanh_tien = null;
  state.rows[0].tong_gia_tri_nhap = null;
  Object.assign(state.rows[1].chi_tiet[0], { don_gia_mua: "0.00", thanh_tien: "0.0000" });
  state.rows[1].tong_gia_tri_nhap = "0.0000";
  await page.reload();
  const first = page.locator(".pm-panel tbody tr").first();
  await expect(first.getByRole("cell").nth(6)).toHaveText("Chưa có giá");
  await expect(page.locator(".pm-panel tbody tr").nth(1).getByRole("cell").nth(6)).toHaveText("0 ₫");
  await first.getByRole("button", { name: "Chi tiết lần nhập", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết lần nhập · PH1", exact: true });
  await expect(detail).toContainText("Tổng giá trị nhập: Chưa có giá");
  await expect(detail).toContainText("410 ₫");
  await expect(detail.getByRole("cell", { name: "Chưa có giá", exact: true })).toHaveCount(2);
  expect(state.requests).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("large historical amounts retain every decimal digit in list and detail", async ({ page }) => {
  const state = await setup(page);
  const amount = "9999999999999890000000000.0001";
  state.rows[0].tong_gia_tri_nhap = amount;
  state.rows[0].chi_tiet = [Object.assign(state.rows[0].chi_tiet[0], { don_gia_mua: "9999999999999.99", thanh_tien: amount })];
  await page.reload();
  const first = page.locator(".pm-panel tbody tr").first();
  await expect(first).toContainText("9.999.999.999.999.890.000.000.000,0001 ₫");
  await first.getByRole("button", { name: "Chi tiết lần nhập", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Chi tiết lần nhập · PH1", exact: true });
  await expect(detail).toContainText("9.999.999.999.999,99 ₫");
  await expect(detail).toContainText("9.999.999.999.999.890.000.000.000,0001 ₫");
  expect(state.errors).toEqual([]);
});

async function setupPriceUpdate(page: Page, stale = false) {
  const state = await setup(page, ['XEM', 'NHAP_FILE', 'XUAT_EXCEL', 'SUA'], false);
  const original = resolve('..', 'test-fixtures', 'Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx');
  const extracted = resolve('..', 'test-fixtures', 'delivery_price_update_rows.json');
  const supplied = existsSync(original) && existsSync(extracted);
  // Retain original workbook coverage when supplied; otherwise these mocked UI
  // tests use deterministic synthetic data, independent of local attachments.
  const values: (string | number)[][] = supplied ? JSON.parse(readFileSync(extracted, 'utf8')) : Array.from({ length: 7 }, (_, i) => {
    const order = Math.floor(i / 2) + 1, quantity = i === 0 ? 48 : 10, price = i === 0 ? 92000 : 100000;
    return [String(order).padStart(32, '0'), `OLD${order}`, 'DOT1', 'NCC1', `NL${i % 2 + 1}`, 'Coffee', quantity,
      'kg', price, 'VND/kg', quantity * price, 'Giá minh họa - dữ liệu kiểm thử tổng hợp'];
  });
  const source = supplied ? readFileSync(original) : await workbook(['Mã phiếu nhận','Mã đơn cũ','Đợt giao','Mã NCC','Mã nguyên liệu','Tên nguyên liệu',
    'Số lượng nhập kho','Đơn vị','Đơn giá mua (VND)','Đơn vị đơn giá','Thành tiền (VND)','Ghi chú'], values, 'CapNhatGia');
  const raw = values.map((r) => [undefined, ...r] as (string | number)[]);
  const grouped = new Map<string, ReturnType<typeof receipt>>();
  for (const r of raw) {
    const id = String(r[1]);
    if (!grouped.has(id)) grouped.set(id, { ...receipt(grouped.size + 1), ma_phieu_nhan: id, nguon: 'LICH_SU',
      ma_don_mua: null, ma_don_cu: String(r[2]), lan_giao_cu: String(r[3]), ma_ncc: String(r[4]), chi_tiet: [], tong_gia_tri_nhap: null });
    grouped.get(id)!.chi_tiet.push({ ...line(`${id}/${r[5]}`, String(r[5]), 'kg', String(r[7])),
      ten_nguyen_lieu: String(r[6]), don_gia_mua: null, don_vi_don_gia: null, thanh_tien: null });
  }
  state.rows = [...grouped.values()];
  const changes = raw.map((r, i) => ({ row: i + 2, ma_phieu_nhan: String(r[1]), ma_nguyen_lieu: String(r[5]),
    so_luong_nhap_kho: String(r[7]), don_gia_cu: null, don_vi_cu: null, thanh_tien_cu: null,
    don_gia_moi: `${r[9]}.00`, don_vi_moi: 'kg', thanh_tien_moi: `${BigInt(r[7]) * BigInt(r[9])}.0000`, changed: true,
    source_note: String(r[12]) }));
  const calls = { previews: 0, applies: 0, reason: '' };
  await page.route('**/api/giao-nguyen-lieu/lich-su/excel/prices/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataBuffer()?.toString() ?? '';
    if (path.endsWith('/template')) return route.fulfill({ contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: await workbook(['ma_phieu_nhan','ma_nguyen_lieu','don_gia_mua','don_vi_don_gia','ly_do'], [], 'CapNhatGia') });
    if (path.endsWith('/preview')) {
      calls.previews++;
      const invalid = body.includes('filename="invalid.xlsx"');
      return route.fulfill({ json: { valid: !invalid, total_rows: 7, updated: 0, items: invalid ? [] : changes,
        preview_token: invalid ? null : `preview-${calls.previews}`, errors: invalid ? [{ row: 8, message: 'Trùng mã phiếu nhận/nguyên liệu.' }] : [] } });
    }
    calls.applies++;
    calls.reason = body;
    if (stale) return route.fulfill({ status: 409, json: { detail: 'Preview đã thay đổi. Hãy xem lại giá hiện tại.' } });
    for (const r of state.rows) {
      for (const detail of r.chi_tiet) {
        const change = changes.find((c) => c.ma_phieu_nhan === r.ma_phieu_nhan && c.ma_nguyen_lieu === detail.ma_nguyen_lieu)!;
        Object.assign(detail, { don_gia_mua: change.don_gia_moi, don_vi_don_gia: change.don_vi_moi, thanh_tien: change.thanh_tien_moi });
      }
      r.tong_gia_tri_nhap = `${changes.filter((c) => c.ma_phieu_nhan === r.ma_phieu_nhan).reduce((sum, c) => sum + BigInt(c.thanh_tien_moi.split('.')[0]), 0n)}.0000`;
    }
    return route.fulfill({ json: { valid: true, total_rows: 7, updated: 7, items: changes, errors: [], preview_token: 'done' } });
  });
  await page.route('**/api/giao-nguyen-lieu/lich-su/excel/export*', async (route) => route.fulfill({
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: await workbook(
      ['Mã phiếu nhận','Mã nguyên liệu','Đơn giá mua (VND)','Thành tiền (VND)'],
      state.rows.flatMap((r) => r.chi_tiet.map((d) => [r.ma_phieu_nhan,d.ma_nguyen_lieu,d.don_gia_mua,d.thanh_tien])), 'LichSuNhapNguyenLieu'),
  }));
  await page.reload();
  return { state, source, calls };
}

test('price update previews seven rows then detail and export show corrected prices', async ({ page }) => {
  const { state, source, calls } = await setupPriceUpdate(page);
  const quantities = state.rows.flatMap((r) => r.chi_tiet.map((d) => d.so_luong_nhap_kho));
  await page.getByRole('button', { name: 'Cập nhật giá từ Excel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Cập nhật giá từ Excel', exact: true });
  await page.getByLabel('Chọn Excel cập nhật giá phiếu nhập').setInputFiles({ name: 'Cap_nhat_don_gia_7_phieu_nhap_cu.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: source });
  await expect(dialog).toContainText('7 dòng · 7 dòng thay đổi');
  await expect(dialog).toContainText('File có ghi chú giá minh họa');
  await expect(dialog).toContainText('92.000 ₫');
  await expect(dialog.getByRole('cell', { name: 'Chưa có giá', exact: true })).toHaveCount(14);
  const confirm = dialog.getByRole('button', { name: 'Xác nhận cập nhật giá', exact: true });
  await expect(confirm).toBeDisabled(); expect(calls.applies).toBe(0);
  await dialog.getByLabel('Lý do cập nhật giá').fill('Chứng từ thử nghiệm trong API mock');
  await confirm.click(); await expect(dialog).not.toBeVisible();
  expect(calls.applies).toBe(1); expect(calls.reason).toContain('preview-1'); expect(calls.reason).toContain('Chứng từ thử nghiệm');
  expect(state.rows).toHaveLength(4); expect(state.rows.flatMap((r) => r.chi_tiet.map((d) => d.so_luong_nhap_kho))).toEqual(quantities);
  await page.locator('.pm-panel tbody tr').first().getByRole('button', { name: 'Chi tiết lần nhập', exact: true }).click();
  const detail = page.getByRole('dialog', { name: /^Chi tiết lần nhập/ });
  await expect(detail).toContainText('92.000 ₫'); await expect(detail).toContainText('4.416.000 ₫');
  await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
  const waiting = page.waitForEvent('download'); await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
  const exported = new ExcelJS.Workbook(); await exported.xlsx.readFile((await (await waiting).path())!);
  expect(exported.worksheets[0].actualRowCount).toBe(8);
  expect(exported.worksheets[0].getCell('C2').text).toBe('92000.00');
  expect(exported.worksheets[0].getCell('D2').text).toBe('4416000.0000');
  expect(state.imports).toBe(0); expect(state.stock).toBe(620); expect(state.errors).toEqual([]);
});

test('price updates reject invalid files and stale preview requires another confirmation', async ({ page }) => {
  const { source, calls } = await setupPriceUpdate(page, true);
  await page.getByRole('button', { name: 'Cập nhật giá từ Excel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Cập nhật giá từ Excel', exact: true });
  const input = page.getByLabel('Chọn Excel cập nhật giá phiếu nhập');
  await input.setInputFiles({ name: 'invalid.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: source });
  await expect(dialog).toContainText('Trùng mã phiếu nhận/nguyên liệu');
  await dialog.getByLabel('Lý do cập nhật giá').fill('Kiểm tra stale preview');
  await expect(dialog.getByRole('button', { name: 'Xác nhận cập nhật giá', exact: true })).toBeDisabled();
  await input.setInputFiles({ name: 'prices.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: source });
  await expect(dialog).toContainText('7 dòng · 7 dòng thay đổi');
  await dialog.getByRole('button', { name: 'Xác nhận cập nhật giá', exact: true }).click();
  await expect(dialog).toContainText('Preview đã thay đổi');
  expect(calls.applies).toBe(1); expect(calls.previews).toBe(3);
  await expect(dialog).toBeVisible();
});

test('price correction requires dynamic edit and import permissions without supplier scoring', async ({ page }) => {
  await setup(page, ['XEM','NHAP_FILE'], true);
  await expect(page.getByRole('button', { name: 'Cập nhật giá từ Excel', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Nhập Excel', exact: true })).toBeEnabled();
});

test('PN business numbers display, search and filter while detail requests keep UUID', async ({ page }) => {
  const state = await setup(page);
  state.rows.forEach((row, index) => Object.assign(row, {
    ma_phieu_nhan: String(index + 1).padStart(32, '0'), ma_phieu_nhap: `PN${String(index + 1).padStart(4, '0')}`,
  }));
  await page.reload();
  const table = page.locator('.pm-panel tbody');
  await expect(table).toContainText('PN0001');
  await expect(table).not.toContainText(state.rows[0].ma_phieu_nhan);
  await page.getByPlaceholder('Tìm theo mã hoặc tên…').fill('pn0002');
  await expect(page.locator('.pm-panel tbody tr')).toHaveCount(1);
  await expect(table).toContainText('PN0002');
  await page.getByPlaceholder('Tìm theo mã hoặc tên…').fill('');
  await page.getByLabel('Mã phiếu nhận', { exact: true }).fill('PN0003');
  await expect(page.locator('.pm-panel tbody tr')).toHaveCount(1);
  await expect(table).toContainText('PN0003');
  const detailRequest = page.waitForRequest(request => request.url().includes('/lich-su/phieu/'));
  await table.getByRole('button', { name: 'Chi tiết lần nhập', exact: true }).click();
  expect((await detailRequest).url()).toContain(`/phieu/${state.rows[2].ma_phieu_nhan}`);
  const dialog = page.getByRole('dialog', { name: 'Chi tiết lần nhập · PN0003', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Phiếu nhận: PN0003');
  await expect(dialog).not.toContainText(state.rows[2].ma_phieu_nhan);
  await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
  await exported;
  expect(new URLSearchParams(state.exportQuery).get('ma_phieu_nhap')).toBe('PN0003');
});

test('price preview shows PN while preserving the UUID in the response identity', async ({ page }) => {
  await setup(page, ['XEM', 'NHAP_FILE', 'SUA']);
  const uuid = 'abcdef0123456789abcdef0123456789';
  await page.route('**/api/giao-nguyen-lieu/lich-su/excel/prices/preview', route => route.fulfill({ json: {
    valid: true, total_rows: 1, updated: 0, preview_token: 'preview-test', errors: [],
    items: [{ row: 2, ma_phieu_nhan: uuid, ma_phieu_nhap: 'PN10000', ma_nguyen_lieu: 'NL1', so_luong_nhap_kho: '10',
      don_gia_cu: null, don_vi_cu: null, thanh_tien_cu: null, don_gia_moi: '12.00', don_vi_moi: 'kg', thanh_tien_moi: '120.0000', changed: true }],
  } }));
  await page.getByRole('button', { name: 'Cập nhật giá từ Excel', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Cập nhật giá từ Excel', exact: true });
  await dialog.locator('input[type=file]').setInputFiles({ name: 'prices.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: await workbook(['ma_phieu_nhan','ma_nguyen_lieu','don_gia_mua','don_vi_don_gia','ly_do'], [['PN10000','NL1',12,'kg','Test']], 'CapNhatGia') });
  await expect(dialog.locator('tbody')).toContainText('PN10000');
  await expect(dialog.locator('tbody')).not.toContainText(uuid);
});
