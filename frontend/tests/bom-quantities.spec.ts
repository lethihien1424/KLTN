import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

// Shared expected values are also checked through real backend services/HTTP APIs.
const fixture = JSON.parse(readFileSync(new URL("../../test-fixtures/bom_quantities.json", import.meta.url), "utf8"));
const display = (value: string) => value.replace(".", ",");

async function setup(page: Page, legacy = false) {
  let current = {
    ...structuredClone(fixture.bom), ten_san_pham: fixture.product.ten_san_pham,
    san_pham: structuredClone(fixture.product), chi_tiet: structuredClone(fixture.lines),
  };
  if (legacy) current.ty_le_hao_hut = "0.1";
  const writes: { method: string; path: string; body: any }[] = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem("access_token", "bom-test"));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.slice(4);
    const method = request.method();
    if (method !== "GET") writes.push({ method, path, body: request.postDataJSON() });
    if (path === "/auth/me") return route.fulfill({ json: {
      ma_nguoi_dung: "BOM_TEST", ho_ten: "BOM test", vai_tro: "CUSTOM_PURCHASE_ROLE", trang_thai: "HOAT_DONG", permissions: [],
    } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: {
      ma_nguoi_dung: "BOM_TEST", vai_tro: "CUSTOM_PURCHASE_ROLE",
      chi_tiet: ["cong_thuc", "nguyen_lieu"].flatMap((chuc_nang) => ["XEM", "THEM", "SUA"].map((thao_tac) => ({ chuc_nang, thao_tac }))),
    } });
    if (path === "/nguyen-lieu") return route.fulfill({ json: fixture.lines.map((line: any) => ({ ...line, trang_thai: "DANG_SU_DUNG" })) });
    if (path === "/cong-thuc/san-pham/SP0001/dinh-luong") return route.fulfill({ json: fixture.product });
    if (path === "/cong-thuc" && method === "GET") return route.fulfill({ json: [current] });
    if (path === "/cong-thuc/CT0001" && method === "GET") return route.fulfill({ json: current });
    if ((path === "/cong-thuc" && method === "POST") || (path === "/cong-thuc/CT0001" && method === "PUT")) {
      current = { ...current, ...request.postDataJSON() };
      return route.fulfill({ status: method === "POST" ? 201 : 200, json: current });
    }
    return route.fulfill({ status: 404, json: { detail: `Unexpected API: ${method} ${path}` } });
  });
  await page.goto("/#/cong-thuc");
  await expect(page.getByRole("button", { name: "Chỉnh sửa", exact: true })).toBeVisible();
  return { writes, errors };
}

test("BOM detail CT0001 matches shared backend quantities without writes", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Chi tiết CT0001", exact: true });
  await expect(dialog.getByTestId("bom-input-kg")).toHaveText(`${display(fixture.expected.input_kg)} kg`);
  await expect(dialog.getByTestId("bom-finished-kg")).toHaveText(`${display(fixture.expected.finished_kg)} kg`);
  await expect(dialog.getByTestId("bom-loss-kg")).toHaveText(display(fixture.expected.loss_kg));
  for (const line of fixture.lines)
    await expect(dialog.getByTestId(`bom-kg-${line.ma_nguyen_lieu}`)).toHaveText(display(fixture.expected[line.ma_nguyen_lieu]));
  await expect(dialog.getByLabel("Khối lượng thành phẩm thử tính (g)", { exact: true })).toHaveCount(0);
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("BOM edit recalculates recovery ratios and weight immediately and rejects invalid values", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  const recovery = dialog.getByLabel("Hệ số thu hồi (0–1)", { exact: true });
  const loss = dialog.getByLabel("Tỷ lệ hao hụt (0–1)", { exact: true });
  const ratios = dialog.getByLabel("Tỷ lệ phối trộn (0–1)", { exact: true });
  await recovery.fill("0.5");
  await expect(loss).toHaveValue("0.5000");
  await expect(dialog.getByTestId("bom-input-kg")).toHaveText("0,500000 kg");
  await expect(dialog.getByTestId("bom-kg-NL01")).toHaveText("0,425000");
  await ratios.nth(0).fill("0.5");
  await expect(dialog.getByRole("alert")).toContainText("Tổng tỷ lệ phối trộn phải bằng 100%");
  await ratios.nth(1).fill("0.5");
  await expect(dialog.getByTestId("bom-kg-NL01")).toHaveText("0,250000");
  await dialog.getByLabel("Khối lượng thành phẩm thử tính (g)", { exact: true }).fill("500");
  await expect(dialog.getByTestId("bom-input-kg")).toHaveText("1,000000 kg");
  await expect(dialog.getByTestId("bom-kg-NL02")).toHaveText("0,500000");
  await expect(dialog.getByTestId("bom-loss-kg")).toHaveText("0,500000");
  for (const value of ["0", "1.1", "-0.1"]) {
    await recovery.fill(value);
    await expect(dialog.getByRole("alert")).toContainText("Hệ số thu hồi phải lớn hơn 0");
    await expect(dialog.getByTestId("bom-input-kg")).toHaveCount(0);
  }
  await recovery.fill("0.85");
  await loss.fill("0.1");
  await expect(dialog.getByRole("alert")).toContainText("Hệ số thu hồi + tỷ lệ hao hụt phải bằng 100%");
  await dialog.getByRole("button", { name: "Đóng", exact: true }).click();
  expect(state.writes).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("BOM create uses standard product weight and only writes when saved", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "+ Thêm công thức", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Thêm công thức BOM", exact: true });
  await dialog.getByLabel("Mã sản phẩm", { exact: true }).fill("SP0001");
  await dialog.getByLabel("Tên công thức", { exact: true }).fill("Classic mới");
  await dialog.getByLabel("Nguyên liệu", { exact: true }).selectOption("NL01");
  await expect(dialog.getByTestId("bom-input-kg")).toHaveText("0,250000 kg");
  await dialog.getByLabel("Hệ số thu hồi (0–1)", { exact: true }).fill("0.85");
  await expect(dialog.getByTestId("bom-input-kg")).toHaveText("0,294118 kg");
  expect(state.writes).toEqual([]);
  await dialog.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].method).toBe("POST");
  expect(state.writes[0].body.ma_san_pham).toBe("SP0001");
  expect(state.writes[0].body).not.toHaveProperty("khoi_luong");
});

test("BOM edit save never persists trial weight or alters product and historical endpoints", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  await dialog.getByLabel("Khối lượng thành phẩm thử tính (g)", { exact: true }).fill("500");
  await expect(dialog.getByTestId("bom-kg-NL01")).toHaveText("0,500000");
  await dialog.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].path).toBe("/cong-thuc/CT0001");
  expect(state.writes[0].method).toBe("PUT");
  expect(state.writes[0].body).not.toHaveProperty("ma_san_pham");
  expect(state.writes[0].body).not.toHaveProperty("khoi_luong");
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  await expect(page.getByTestId("bom-kg-NL01")).toHaveText("0,250000");
});

test("BOM legacy inconsistent loss shows warning and remains unchanged", async ({ page }) => {
  const state = await setup(page, true);
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Chi tiết CT0001", exact: true });
  await expect(dialog.getByRole("alert")).toContainText("Hệ số thu hồi + tỷ lệ hao hụt phải bằng 100%");
  await expect(dialog.getByTestId("bom-input-kg")).toHaveCount(0);
  expect(state.writes).toEqual([]);
});
