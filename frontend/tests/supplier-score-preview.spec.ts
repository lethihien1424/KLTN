import { test, expect, type Page } from "@playwright/test";

function item(code = "NCC1", missing = false) {
  const keys = ["quality_ratio", "on_time_ratio", "full_ratio", "lead_time"];
  const names = ["Chất lượng", "Đúng hạn", "Giao đủ", "Đáp ứng thời gian giao"];
  return { ma_ncc: code, ten_ncc: code === "NCC1" ? "Coffee Tây Nguyên" : "NCC chưa có mẫu",
    diem_hien_tai: "50.00", diem_moi: missing ? null : "55.00", chenh_lech: missing ? null : "5.00",
    do_day_du: missing ? "0" : "100", tinh_trang: missing ? "CHUA_DU_DU_LIEU" : "DU_DU_LIEU",
    so_phieu: missing ? 0 : 3, so_lan_giao: missing ? 0 : 3, so_don: missing ? 0 : 2, so_don_da_chot: missing ? 0 : 1,
    so_dong_kiem_dinh_hop_le: missing ? 0 : 1, so_phieu_thuc_te: missing ? 0 : 2, so_phieu_lich_su: missing ? 0 : 1, so_don_cu: 0,
    giai_thich_tong: missing ? "Chưa có dữ liệu" : "Điểm NCC = trung bình điểm các mapping hợp lệ: (55) / 1 = 55 điểm. Làm tròn HALF_UP đến 0,01 = 55.",
    mapping: [{ ma_nguyen_lieu_ncc: "MAP1", ma_nguyen_lieu: "NL1", ten_nguyen_lieu: "Cà phê Robusta", diem: missing ? null : "55", do_day_du: missing ? "0" : "100",
      lead_time_khai_bao_ngay: 2, lead_time_thuc_te_ngay: missing ? null : "4",
      khai_bao_khong_dung_lam_kpi: { chat_luong: "1", dung_han: "1", giao_du: "1" },
      tieu_chi: keys.map((key, i) => ({ key, ten: names[i], trong_so: ["35", "30", "20", "15"][i],
        trong_so_ap_dung: missing ? null : ["35", "30", "20", "15"][i], gia_tri: missing ? null : ["0.9", "0", "0.8", "0.5"][i],
        diem: missing ? null : ["90", "0", "80", "50"][i], dong_gop: missing ? null : ["31.5", "0", "16", "7.5"][i],
        phep_tinh: missing ? "Chưa có dữ liệu; không tham gia tính điểm." : ["90 × 35% = 31,5 điểm", "0 × 30% = 0 điểm", "80 × 20% = 16 điểm", "50 × 15% = 7,5 điểm"][i],
        giai_thich: { cong_thuc_ngan: missing ? "Chưa có dữ liệu; không tham gia tính điểm." : `${names[i]}: công thức ngắn từ backend`,
          tom_tat: missing ? "Chưa có dữ liệu; không tham gia tính điểm." : ["KPI chất lượng = (90) / 1 = 90%", "KPI đúng hạn = 0 đơn đúng hạn / 1 đơn đã chốt × 100 = 0%", "KPI giao đủ = (80) / 1 = 80%", "KPI = min(1, 2 / 4) × 100 = 50%"][i],
          tong_hop_kiem_dinh: i === 0 ? { so_dong_hop_le: missing ? 0 : 1, so_dong_chua_kiem_dinh: missing ? 0 : 1, theo_don_vi: missing ? [] : [
            { don_vi: "kg", so_luong_giao: "100", so_luong_dat: "90", so_luong_khong_dat: "10", so_dong_hop_le: 1, phep_tinh: "90 / 100 × 100 = 90%", chuoi_du_lieu: "100 kg giao → 90 kg đạt → 90% chất lượng" },
          ] } : undefined,
          ghi_chu: "Mỗi đơn chỉ là một mẫu dù nhận nhiều đợt.", dong: missing ? [] : [{ tieu_de: i === 0 ? "PN0001 · NL1" : "DM1", ma_don: "DM1", nguon: "THUC_TE",
            noi_dung: i === 0 ? ["Số lượng giao: 100 kg.", "Số lượng đạt: 90 kg; không đạt: 10 kg.", "Tỷ lệ chất lượng = 90 / 100 × 100 = 90%."] : ["Dự kiến giao: 2026-01-03; giao cuối: 2026-01-05.", "Trễ hạn"],
            phieu: [{ ma_phieu_nhan: "PH1", ma_phieu_nhap: "PN0001" }] },
            { tieu_de: "PN0002 · NL1", ma_don: "OLD1", nguon: "LICH_SU", noi_dung: ["Số lượng giao: 30 kg."], phieu: [{ ma_phieu_nhan: "PH2", ma_phieu_nhap: "PN0002" }] }] },
        nguon: missing ? "CHUA_DU_DU_LIEU" : i === 3 ? "THUC_TE_VA_KHAI_BAO" : "THUC_TE", so_mau: missing ? 0 : 1 })) }],
  };
}

async function setup(page: Page, documents = false) {
  const state = { writes: [] as { path: string; body: any }[], previews: 0, listReads: 0, score: "50.00", stale: false, failPreview: false, canScore: true, noReasons: false, failReasons: false, multiple: false, qualityAggregate: false, mixedQuality: false, errors: [] as string[] };
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem("access_token", "score-test"));
  await page.route("**/api/**", (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname.slice(4);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "Test", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM", chi_tiet: [
      { chuc_nang: "nha_cung_cap", thao_tac: "XEM" }, ...(state.canScore ? [{ chuc_nang: "nha_cung_cap", thao_tac: "TINH_DIEM" }] : []),
      { chuc_nang: "hieu_suat_nha_cung_cap", thao_tac: "XEM" },
      ...(documents ? [{ chuc_nang: "don_mua_nguyen_lieu", thao_tac: "XEM" }, { chuc_nang: "nguyen_lieu_nha_cung_cap", thao_tac: "XEM" }] : []),
    ] } });
    if (path === "/ly-do/ap-dung") {
      expect(new URL(request.url()).searchParams.get("chuc_nang")).toBe("TINH_LAI_DIEM_NCC");
      return state.failReasons ? route.fulfill({ status: 500, json: { detail: "Không tải được lý do." } }) : route.fulfill({ json: state.noReasons ? [] : [
        { id: "LD1", ten_ly_do: "Đối chiếu phiếu nhận", trang_thai: "DANG_SU_DUNG" }, { id: "LD2", ten_ly_do: "Khác", trang_thai: "DANG_SU_DUNG" },
      ] });
    }
    if (path === "/giao-nguyen-lieu/lich-su/phieu/PH1") return route.fulfill({ json: {
      ma_phieu_nhan: "PH1", ma_phieu_nhap: "PN0001", ma_don_mua: "DM1", ma_ncc: "NCC1", ten_ncc: "Coffee Tây Nguyên", nguon: "THUC_TE",
      ngay_du_kien_giao: "2026-01-03", ngay_giao_thuc_te: "2026-01-05", hoan_tat: true, dung_han: false, chi_tiet: [],
    } });
    if (path === "/nha-cung-cap") {
      state.listReads++;
      return route.fulfill({ json: [item(), item("NCC2", true)].map((row) => ({ ma_ncc: row.ma_ncc, ten_ncc: row.ten_ncc, trang_thai: "DANG_HOAT_DONG",
        diem_dieu_kien_thuong_mai: state.score, ty_le_giao_dung_han_thuc_te: null, ty_le_giao_du_thuc_te: null })) });
    }
    if (path.endsWith("/tinh-diem/preview")) {
      state.previews++;
      if (state.failPreview) return route.fulfill({ status: 500, json: { detail: "Không tải được Preview." } });
      const supplier = item();
      const quality = supplier.mapping[0].tieu_chi[0];
      if (state.qualityAggregate) {
        quality.so_mau = 2;
        quality.diem = "98.97435897435897435897435897"; quality.dong_gop = "34.64102564102564102564102564";
        quality.phep_tinh = "98,974359 × 35% = 34,641026 điểm";
        quality.giai_thich.tom_tat = "KPI chất lượng = (98,974359) / 1 = 98,974359%";
        quality.giai_thich.tong_hop_kiem_dinh = { so_dong_hop_le: 2, so_dong_chua_kiem_dinh: 1, theo_don_vi: [
          { don_vi: "kg", so_luong_giao: "390", so_luong_dat: "386", so_luong_khong_dat: "4", so_dong_hop_le: 2, phep_tinh: "386 / 390 × 100 = 98,974359%", chuoi_du_lieu: "390 kg giao → 386 kg đạt → 98,974359% chất lượng" },
        ] };
      }
      if (state.mixedQuality) {
        quality.so_mau = 2; quality.giai_thich.tong_hop_kiem_dinh!.so_dong_hop_le = 2;
        quality.diem = "70"; quality.dong_gop = "24.5"; quality.phep_tinh = "70 × 35% = 24,5 điểm";
        quality.giai_thich.tom_tat = "KPI chất lượng = (90 + 50) / 2 = 70%";
        quality.giai_thich.tong_hop_kiem_dinh!.theo_don_vi.push({ don_vi: "l", so_luong_giao: "10", so_luong_dat: "5", so_luong_khong_dat: "5", so_dong_hop_le: 1, phep_tinh: "5 / 10 × 100 = 50%", chuoi_du_lieu: "10 l giao → 5 l đạt → 50% chất lượng" });
      }
      if (state.multiple) {
        supplier.mapping.push({ ...supplier.mapping[0], ma_nguyen_lieu_ncc: "MAP2", ma_nguyen_lieu: "NL2", ten_nguyen_lieu: "Sữa tươi", diem: "62.5", lead_time_khai_bao_ngay: 4,
          tieu_chi: supplier.mapping[0].tieu_chi.map(c => c.key === "lead_time" ? { ...c, diem: "100", dong_gop: "15", phep_tinh: "100 × 15% = 15 điểm" } : c) });
        supplier.diem_moi = "58.75"; supplier.chenh_lech = "8.75"; supplier.giai_thich_tong = "Điểm NCC = (55 + 62,5) / 2 = 58,75 điểm.";
      }
      return route.fulfill({ json: { tinh_luc: "2026-11-01T08:30:00Z", preview_token: `preview-${state.previews}`,
        chinh_sach: { version: "supplier-score-v2", weights: { quality_ratio: "35", on_time_ratio: "30", full_ratio: "20", lead_time: "15" },
          missing: "Bỏ tiêu chí thiếu dữ liệu khỏi mẫu số; không thay bằng 0.", formula: "100 × Σ(w × KPI) / Σ(w có dữ liệu). Trung bình các mapping.",
          sources: "Không dùng tồn NCC demo hoặc tỷ lệ khai báo làm KPI. Gồm chứng từ thực tế và lịch sử Excel.",
          quality: "Q = đạt/giao theo đơn vị.", on_time: "O = đúng hạn/đơn đã chốt.", full: "F = trung bình nhập/đặt theo đơn.", lead: "L = min(1, khai báo/thực tế)." },
        nha_cung_cap: path === "/nha-cung-cap/tinh-diem/preview" ? [supplier, item("NCC2", true)] : [path.includes("NCC2") ? item("NCC2", true) : supplier],
      } });
    }
    if (request.method() === "POST" && path.endsWith("/tinh-diem")) {
      state.writes.push({ path, body: request.postDataJSON() });
      if (state.stale) return route.fulfill({ status: 409, json: { detail: "Dữ liệu nguồn đã thay đổi. Vui lòng tính lại Preview." } });
      state.score = "55.00";
      return route.fulfill({ json: { so_ncc_da_cap_nhat: 2, diem_dieu_kien_thuong_mai: "55.00" } });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/#/nha-cung-cap");
  return state;
}

const openSingle = async (page: Page) => {
  await page.getByRole("row").filter({ has: page.getByRole("button", { name: "NCC1", exact: true }) }).getByRole("button", { name: "Tính lại điểm", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tính lại điểm nhà cung cấp", exact: true });
  await expect(dialog.getByRole("region", { name: "Điểm tổng NCC", exact: true })).toBeVisible();
  return dialog;
};

test("single supplier preview explains evidence and cancellation writes nothing", async ({ page }) => {
  const state = await setup(page); const dialog = await openSingle(page);
  await expect(dialog).toContainText("Coffee Tây Nguyên");
  await expect(dialog.locator(".score-kpi-card")).toHaveCount(4);
  await expect(dialog.locator(".score-kpi-detail")).toHaveCount(0);
  await expect(dialog).toContainText("1/1 nguyên liệu");
  await expect(dialog).toContainText("+5");
  await expect(dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true })).toBeDisabled();
  expect(state.writes).toHaveLength(0);
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.writes).toHaveLength(0); expect(state.score).toBe("50.00"); expect(state.errors).toEqual([]);
});

test("explicit confirmation sends token reason and note then refreshes supplier table", async ({ page }) => {
  const state = await setup(page); const dialog = await openSingle(page);
  await dialog.getByLabel("Lý do tính lại điểm *", { exact: true }).selectOption("LD1");
  await dialog.getByLabel("Ghi chú", { exact: true }).fill("Kỳ tháng 11");
  const reads = state.listReads;
  await dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true }).click();
  await expect(dialog).toHaveCount(0); await expect.poll(() => state.listReads).toBeGreaterThan(reads);
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0]).toMatchObject({ path: "/nha-cung-cap/NCC1/tinh-diem", body: { ly_do_id: "LD1", ly_do: "Đối chiếu phiếu nhận", ghi_chu: "Kỳ tháng 11" } });
  expect(state.writes[0].body.preview_token).toMatch(/^preview-/);
  expect(state.writes[0].body).not.toHaveProperty("diem_moi"); expect(state.errors).toEqual([]);
});

test("stale confirmation requires a fresh preview and another explicit confirmation", async ({ page }) => {
  const state = await setup(page); state.stale = true;
  const dialog = await openSingle(page);
  await dialog.getByLabel("Lý do tính lại điểm *", { exact: true }).selectOption("LD1");
  const confirm = dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true });
  await confirm.click();
  await expect(dialog.getByRole("alert")).toContainText("Dữ liệu nguồn đã thay đổi");
  await expect(confirm).toBeDisabled();
  const oldToken = state.writes[0].body.preview_token;
  state.stale = false;
  await dialog.getByRole("button", { name: "Tính lại Preview", exact: true }).click();
  await expect(confirm).toBeEnabled(); expect(state.writes).toHaveLength(1);
  await confirm.click(); await expect(dialog).toHaveCount(0);
  expect(state.writes[1].body.preview_token).not.toBe(oldToken); expect(state.errors).toEqual([]);
});

test("batch preview shows missing evidence clearly and only writes on confirmation", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Tính điểm tất cả", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Tính điểm tất cả nhà cung cấp", exact: true });
  expect(state.writes).toHaveLength(0);
  await dialog.getByLabel("Nhà cung cấp · 2 NCC sẽ được cập nhật").selectOption("NCC2");
  await expect(dialog.getByRole("region", { name: "Điểm tổng NCC", exact: true })).toContainText("Chưa có dữ liệu");
  await expect(dialog).toContainText("0/1 nguyên liệu");
  await dialog.getByLabel("Lý do tính lại điểm *", { exact: true }).selectOption("LD1");
  await dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(state.writes).toHaveLength(1); expect(state.writes[0].path).toBe("/nha-cung-cap/tinh-diem"); expect(state.errors).toEqual([]);
});

test("preview errors can retry and permission revocation hides the score operation", async ({ page }) => {
  const state = await setup(page); state.failPreview = true;
  await page.getByRole("button", { name: "Tính lại điểm", exact: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "Tính lại điểm nhà cung cấp", exact: true });
  await expect(dialog.getByRole("alert")).toContainText("Không tải được Preview");
  await expect(dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true })).toBeDisabled();
  state.failPreview = false;
  await dialog.getByRole("button", { name: /Thử lại/ }).click();
  await expect(dialog.getByRole("region", { name: "Điểm tổng NCC", exact: true })).toBeVisible();
  state.canScore = false;
  await page.evaluate(() => window.dispatchEvent(new Event("auth-permissions-refresh")));
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tính lại điểm", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tính điểm tất cả", exact: true })).toHaveCount(0);
  expect(state.writes).toHaveLength(0); expect(state.errors).toEqual([]);
});

test("criterion expansion traces real inputs to receipt and permission-gated source links", async ({ page }) => {
  const state = await setup(page, true); const dialog = await openSingle(page);
  await dialog.getByRole("button", { name: /^Chất lượng/ }).click();
  await expect(dialog.getByRole("heading", { name: "Dữ liệu thực tế lấy từ đâu?", exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Cách tính điểm đóng góp", exact: true })).toBeVisible();
  await expect(dialog.getByText("KPI chất lượng = (90) / 1 = 90%", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Số lượng giao: 100 kg.", { exact: true })).toBeHidden();
  await dialog.getByText("Xem chi tiết chứng từ", { exact: false }).click();
  await expect(dialog.getByText("Số lượng giao: 100 kg.", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Tỷ lệ chất lượng = 90 / 100 × 100 = 90%.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Đơn mua DM1 ↗", exact: true }).first()).toHaveAttribute("href", "#/don-mua/DM1");
  await expect(dialog.getByRole("link", { name: /Thông tin thời gian giao NCC/ })).toHaveAttribute("href", "#/nha-cung-cap/cung-ung?ncc=NCC1");
  await dialog.getByRole("button", { name: "Xem PN0001", exact: true }).first().click();
  const receipt = page.getByRole("dialog", { name: "Chi tiết lần nhập · PN0001", exact: true });
  await expect(receipt).toBeVisible();
  await receipt.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Số lượng giao: 100 kg.", { exact: true })).toBeVisible();
  expect(state.writes).toHaveLength(0); expect(state.errors).toEqual([]);
});

test("document selector renders one receipt at a time and retains historical sources", async ({ page }) => {
  const state = await setup(page); const dialog = await openSingle(page);
  await dialog.getByRole("button", { name: /^Chất lượng/ }).click();
  await dialog.getByText("Xem chi tiết chứng từ", { exact: false }).click();
  await expect(dialog.locator(".score-evidence")).toHaveCount(1);
  await expect(dialog.getByText("Số lượng giao: 100 kg.", { exact: true })).toBeVisible();
  await dialog.getByLabel("Chọn chứng từ kiểm định", { exact: true }).selectOption("1");
  await expect(dialog.locator(".score-evidence")).toHaveCount(1);
  await expect(dialog.getByText("Số lượng giao: 100 kg.", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Số lượng giao: 30 kg.", { exact: true })).toBeVisible();
  await expect(dialog.locator(".score-evidence")).toContainText("Lịch sử Excel");
  expect(state.writes).toHaveLength(0);
});

test("quality shows aggregate inputs and contribution before collapsed document evidence", async ({ page }) => {
  const state = await setup(page); state.qualityAggregate = true; const dialog = await openSingle(page);
  await dialog.getByRole("button", { name: /^Chất lượng/ }).click();
  const summary = dialog.getByRole("region", { name: "Tổng hợp dữ liệu kiểm định", exact: true });
  await expect(summary).toContainText("390 kg"); await expect(summary).toContainText("386 kg");
  await expect(summary).toContainText("4 kg"); await expect(summary).toContainText("2 dòng kiểm định hợp lệ");
  await expect(summary).toContainText("386 / 390 × 100 = 98,974359%");
  await expect(summary).toContainText("390 kg giao → 386 kg đạt → 98,974359% chất lượng → 34,641026 điểm");
  const contribution = dialog.getByText("98,974359 × 35% = 34,641026 điểm", { exact: true });
  await expect(contribution).toBeVisible();
  expect(await contribution.evaluate(el => Boolean(el.compareDocumentPosition(el.closest(".score-kpi-detail")!.querySelector(".score-documents")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(dialog.getByLabel("Chọn chứng từ kiểm định", { exact: true })).toBeHidden();
  await summary.screenshot({ path: "test-results/quality-inspection-summary.png" });
  await dialog.getByText("Xem chi tiết chứng từ", { exact: false }).click();
  await expect(dialog.getByText(/Tỷ lệ của riêng chứng từ.*không phải KPI chất lượng tổng NCC/)).toBeVisible();
  await dialog.getByLabel("Chọn chứng từ kiểm định", { exact: true }).selectOption("1");
  await expect(summary).toContainText("386 / 390 × 100 = 98,974359%");
  await expect(contribution).toBeVisible();
  expect(state.writes).toHaveLength(0); expect(state.errors).toEqual([]);
});

test("quality keeps quantities separate by unit and explains the supplier average", async ({ page }) => {
  const state = await setup(page); state.mixedQuality = true; const dialog = await openSingle(page);
  await dialog.getByRole("button", { name: /^Chất lượng/ }).click();
  const summary = dialog.getByRole("region", { name: "Tổng hợp dữ liệu kiểm định", exact: true });
  await expect(summary.locator(".score-quality-unit")).toHaveCount(2);
  await expect(summary).toContainText("90 / 100 × 100 = 90%");
  await expect(summary).toContainText("5 / 10 × 100 = 50%");
  await expect(summary).toContainText("không cộng các đơn vị khác nhau");
  await expect(dialog).toContainText("KPI chất lượng = (90 + 50) / 2 = 70%");
  await expect(dialog.getByText("70 × 35% = 24,5 điểm", { exact: true })).toBeVisible();
  expect(state.writes).toHaveLength(0);
});

test("source actions stay hidden without document permissions and the popup fits mobile", async ({ page }) => {
  const state = await setup(page); const dialog = await openSingle(page);
  await dialog.getByRole("button", { name: /^Chất lượng/ }).click();
  await dialog.getByText("Xem chi tiết chứng từ", { exact: false }).click();
  await expect(dialog.getByRole("button", { name: "Xem PN0001", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: "DM1", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("link", { name: /Thông tin thời gian giao NCC/ })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog.getByRole("button", { name: "Hủy", exact: true })).toBeVisible();
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  const body = dialog.locator(".pm-dialog-body");
  expect(await body.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  for (const table of await dialog.locator(".pm-table-scroll").all()) {
    expect(await table.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
  const headingBefore = await dialog.locator(".pm-dialog-heading").boundingBox();
  const footerBefore = await dialog.locator(".pm-dialog-footer").boundingBox();
  await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
  expect((await dialog.locator(".pm-dialog-heading").boundingBox())?.y).toBe(headingBefore?.y);
  expect((await dialog.locator(".pm-dialog-footer").boundingBox())?.y).toBe(footerBefore?.y);
  await dialog.screenshot({ path: "test-results/score-redesign-mobile.png" });
  expect(state.writes).toHaveLength(0); expect(state.errors).toEqual([]);
});

test("selecting a material shows one set of criteria and preserves the supplier average", async ({ page }) => {
  const state = await setup(page); state.multiple = true; const dialog = await openSingle(page);
  await expect(dialog).toContainText("2/2 nguyên liệu");
  await expect(dialog).toContainText("(55 + 62,5) / 2 = 58,75");
  await dialog.screenshot({ path: "test-results/score-redesign-overview.png" });
  await dialog.getByRole("button", { name: /^Đáp ứng thời gian giao/ }).click();
  await expect(dialog.locator(".score-kpi-detail")).toContainText("50 × 15% = 7,5 điểm");
  await dialog.getByRole("button", { name: /^Sữa tươi/ }).click();
  await expect(dialog.locator(".score-kpi-card")).toHaveCount(4);
  await expect(dialog.locator(".score-kpi-detail")).toHaveCount(0);
  await dialog.getByRole("button", { name: /^Đáp ứng thời gian giao/ }).click();
  await expect(dialog.locator(".score-kpi-detail")).toContainText("100 × 15% = 15 điểm");
  await dialog.getByRole("button", { name: /^Chất lượng/ }).click();
  await expect(dialog.locator(".score-kpi-detail")).toHaveCount(1);
  await dialog.screenshot({ path: "test-results/score-redesign-desktop.png" });
  expect(state.writes).toHaveLength(0);
});

test("configured other reason requires a note and missing reasons block confirmation", async ({ page }) => {
  const state = await setup(page); let dialog = await openSingle(page);
  await dialog.getByLabel("Lý do tính lại điểm *", { exact: true }).selectOption("LD2");
  const confirm = dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Ghi chú *", { exact: true }).fill("Đối soát bổ sung");
  await expect(confirm).toBeEnabled();
  await dialog.getByRole("button", { name: "Hủy", exact: true }).click();
  state.noReasons = true; dialog = await openSingle(page);
  await expect(dialog).toContainText("Chưa có lý do áp dụng");
  await expect(dialog.getByRole("button", { name: "Xác nhận lưu điểm", exact: true })).toBeDisabled();
  expect(state.writes).toHaveLength(0);
});
