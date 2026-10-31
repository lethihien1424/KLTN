import { test, expect, type Page } from "@playwright/test";
import ExcelJS from "exceljs";

const headers = ["ma_don_cu", "ma_ncc", "lan_giao", "ngay_dat", "ngay_du_kien", "ngay_nhan", "ma_nguyen_lieu", "so_luong_dat", "so_luong_giao", "so_luong_dat_chat_luong", "so_luong_khong_dat", "so_luong_chap_nhan", "hoan_tat", "ly_do", "ghi_chu"];
async function xlsx() { const book = new ExcelJS.Workbook(); book.addWorksheet("LichSuGiaoHang").addRow(headers); return Buffer.from(await book.xlsx.writeBuffer()); }

async function setup(page: Page, readonly = false) {
  const state = { stock: 620, receipts: [] as any[], requests: [] as any[], imports: 0, errors: [] as string[],
    order: { ma_don_mua: "DM1", ma_ncc: "NCC1", ten_ncc: "Supplier", ma_de_xuat: null, nguoi_tao: "TEST", nguoi_duyet: "TEST", thoi_gian_duyet: "2026-01-01", ly_do_tu_choi: null,
      ngay_dat_hang: "2026-01-01", ngay_du_kien_giao: "2026-01-03", ngay_giao_thuc_te: null as string | null, tong_tien: "100", trang_thai: "DA_DUYET",
      chi_tiet: [{ ma_chi_tiet_don_mua: "DMCT1", ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Robusta", don_vi_do_luong: "kg", so_luong_mua: "100", so_luong_thuc_nhan: "0", don_gia_vnd_kg: "1", thanh_tien: "100", ly_do_khong_nhan: null }] } };
  const metrics = () => ({ ma_ncc: "NCC1", ten_ncc: "Supplier", diem_ncc: "95", ty_le_giao_dung_han_thuc_te: state.order.trang_thai === "DA_NHAN_HANG" ? "0" : null,
    ty_le_giao_du_thuc_te: state.order.chi_tiet[0].so_luong_thuc_nhan, ty_le_chat_luong_dat_thuc_te: state.receipts.length > 1 ? "90.91" : state.receipts.length ? "90" : null,
    thoi_gian_giao_tb_ngay: state.order.trang_thai === "DA_NHAN_HANG" ? "3" : null, so_don: 1, so_don_dang_giao: state.order.trang_thai === "DA_NHAN_HANG" ? 0 : 1, so_phieu: state.receipts.length,
    so_don_da_nhan: state.order.trang_thai === "DA_NHAN_HANG" ? 1 : 0, lich_su_giao: state.receipts,
    don_mua: [{ ma_don: "DM1", nguon: "THUC_TE", hoan_tat: state.order.trang_thai === "DA_NHAN_HANG", ngay_du_kien_giao: "2026-01-03", ngay_nhan_cuoi: "2026-01-04", dung_han: state.order.trang_thai === "DA_NHAN_HANG" ? false : null, ty_le_du: state.order.chi_tiet[0].so_luong_thuc_nhan, so_dot: state.receipts.length }] });
  await page.addInitScript(() => sessionStorage.setItem("access_token", "delivery-test"));
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.route("**/api/**", async (route) => {
    const req = route.request(); const url = new URL(req.url()); const path = url.pathname.slice(4);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "Receiver", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM", chi_tiet: [
      { chuc_nang: "don_mua_nguyen_lieu", thao_tac: "XEM" }, { chuc_nang: "hieu_suat_nha_cung_cap", thao_tac: "XEM" },
      ...(readonly ? [] : [{ chuc_nang: "don_mua_nguyen_lieu", thao_tac: "XAC_NHAN" }, { chuc_nang: "don_mua_nguyen_lieu", thao_tac: "NHAP_FILE" }, { chuc_nang: "nha_cung_cap", thao_tac: "TINH_DIEM" }]),
    ] } });
    if (path === "/don-mua-nguyen-lieu/DM1") return route.fulfill({ json: state.order });
    if (path.endsWith("/lich-su-nhan-hang")) return route.fulfill({ json: state.receipts });
    if (path === "/don-mua-nguyen-lieu/DM1/nhan-hang") {
      const body = req.postDataJSON(); state.requests.push(body); const line = body.chi_tiet[0];
      state.stock += Number(line.so_luong_thuc_nhan); state.order.chi_tiet[0].so_luong_thuc_nhan = String(Number(state.order.chi_tiet[0].so_luong_thuc_nhan) + Number(line.so_luong_thuc_nhan));
      const closed = body.hoan_tat || Number(state.order.chi_tiet[0].so_luong_thuc_nhan) === 100;
      state.order.trang_thai = closed ? "DA_NHAN_HANG" : "DA_DUYET"; state.order.ngay_giao_thuc_te = closed ? body.ngay_giao_thuc_te : null;
      state.receipts.push({ ma_phieu_nhan: `R${state.receipts.length + 1}`, chi_tiet_id: `L${state.receipts.length + 1}`, ma_don_mua: "DM1", ma_don_cu: null,
        nguon: "THUC_TE", ngay_giao_thuc_te: body.ngay_giao_thuc_te, ngay_du_kien_giao: "2026-01-03", so_luong_dat: "100", so_luong_giao: line.so_luong_giao,
        so_luong_dat_chat_luong: line.so_luong_dat_chat_luong, so_luong_khong_dat: line.so_luong_khong_dat, so_luong_nhap_kho: line.so_luong_thuc_nhan,
        ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Robusta", don_vi: "kg", nguoi_xac_nhan: "TEST", ten_nguoi_xac_nhan: "Receiver", dung_han: body.ngay_giao_thuc_te <= "2026-01-03", hoan_tat: closed, ly_do: line.ly_do_khong_nhan, ghi_chu: body.ghi_chu });
      return route.fulfill({ json: state.order });
    }
    if (path === "/dashboard/hieu-suat-nha-cung-cap") return route.fulfill({ json: [metrics()] });
    if (path === "/nha-cung-cap/NCC1/hieu-suat-chi-tiet") return route.fulfill({ json: metrics() });
    if (path === "/giao-nguyen-lieu/lich-su/excel/template") return route.fulfill({ contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", body: await xlsx() });
    if (path.startsWith("/giao-nguyen-lieu/lich-su/excel/")) {
      const invalid = req.postDataBuffer()?.toString().includes('filename="duplicate.xlsx"');
      if (path.endsWith("/import") && !invalid) state.imports++;
      return route.fulfill({ json: { valid: !invalid, imported: path.endsWith("/import") && !invalid ? 1 : 0, total_rows: 1,
        items: [{ code: "OLD1", supplier: "NCC1", delivery: "DOT1", lines: 1, date: "2026-01-02", closed: true }], errors: invalid ? [{ row: 2, message: "Đợt lịch sử đã tồn tại." }] : [] } });
    }
    return route.fulfill({ json: [] });
  });
  return state;
}

test("quality and multi-batch receipts preserve history and supplier trace uses one order", async ({ page }) => {
  const state = await setup(page); await page.goto("/#/don-mua/DM1");
  await page.getByRole("button", { name: "Nhận hàng", exact: true }).click();
  let form = page.getByRole("dialog", { name: "Nhận hàng · DM1", exact: true });
  await form.getByLabel("Ngày giao thực tế *", { exact: true }).fill("2026-01-02");
  await form.getByLabel("Không đạt chất lượng", { exact: true }).fill("10");
  await expect(form.getByLabel("Đạt chất lượng", { exact: true })).toHaveValue("90");
  await expect(form.getByLabel("Số lượng thực nhận", { exact: true })).toHaveValue("90");
  await form.getByLabel("Chốt nhận hàng của đơn", { exact: true }).uncheck();
  await form.getByLabel("Lý do nhận thiếu *", { exact: true }).fill("10 kg bị lỗi");
  await form.getByRole("button", { name: "Xác nhận nhận hàng", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.stock).toBe(710);
  expect(state.requests[0].hoan_tat).toBe(false); expect(state.requests[0].request_id.length).toBeGreaterThan(16);
  await page.getByRole("tab", { name: "Lịch sử nhận hàng", exact: true }).click();
  await expect(page.getByRole("cell", { name: /10 kg bị lỗi/ })).toBeVisible();
  await page.getByRole("button", { name: "Nhận hàng", exact: true }).click();
  form = page.getByRole("dialog", { name: "Nhận hàng · DM1", exact: true });
  await form.getByLabel("Ngày giao thực tế *", { exact: true }).fill("2026-01-04");
  await expect(form.getByLabel("Số lượng giao đợt này", { exact: true })).toHaveValue("10");
  await form.getByRole("button", { name: "Xác nhận nhận hàng", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.stock).toBe(720); expect(state.receipts).toHaveLength(2);
  await expect(page.getByRole("button", { name: "Nhận hàng", exact: true })).toHaveCount(0);
  await expect(page.locator("section.pm-panel").filter({ has: page.getByRole("heading", { name: "Lịch sử nhận hàng", exact: true }) }).locator("tbody tr")).toHaveCount(2);
  await page.goto("/#/hieu-suat");
  await expect(page.getByRole("cell", { name: "90,91%", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nguồn đánh giá NCC", exact: true }).click();
  const detail = page.getByRole("dialog", { name: "Nguồn đánh giá NCC · NCC1", exact: true });
  await expect(detail.getByText("1 đơn · 2 phiếu · 0 đơn đang giao.", { exact: true })).toBeVisible();
  await expect(detail.getByRole("link", { name: "DM1", exact: true })).toBeVisible(); expect(state.errors).toEqual([]);
});

test("historical import preview confirms separately and never updates inventory", async ({ page }) => {
  const state = await setup(page); await page.goto("/#/hieu-suat");
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Template lịch sử", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("Template_lich_su_giao_hang.xlsx");
  const input = page.getByLabel("Chọn Excel lịch sử giao hàng");
  await input.setInputFiles({ name: "duplicate.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await xlsx() });
  const form = page.getByRole("dialog", { name: "Xem trước lịch sử giao hàng", exact: true });
  await expect(form.getByRole("alert")).toContainText("Đợt lịch sử đã tồn tại");
  await expect(form.getByRole("button", { name: "Xác nhận nhập lịch sử", exact: true })).toBeDisabled();
  await form.getByRole("button", { name: "Hủy", exact: true }).click();
  await input.setInputFiles({ name: "valid.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: await xlsx() });
  await expect(form).toBeVisible(); expect(state.imports).toBe(0);
  await form.getByRole("button", { name: "Xác nhận nhập lịch sử", exact: true }).click();
  await expect(form).not.toBeVisible(); expect(state.imports).toBe(1); expect(state.stock).toBe(620); expect(state.requests).toHaveLength(0);
});

test("view-only permissions cannot receive import or recalculate", async ({ page }) => {
  const state = await setup(page, true); await page.goto("/#/don-mua/DM1");
  await expect(page.getByRole("heading", { name: "DM1", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nhận hàng", exact: true })).toHaveCount(0);
  await page.goto("/#/hieu-suat");
  await expect(page.getByRole("button", { name: "Nhập lịch sử giao hàng", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Tính lại tất cả", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nguồn đánh giá NCC", exact: true })).toBeVisible();
  expect(state.requests).toHaveLength(0);
});
