import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync(new URL("../../test-fixtures/bom_quantities.json", import.meta.url), "utf8"));
async function setup(page: Page, initialStatus = "DANG_SU_DUNG", allowStatus = true, conflict = false) {
  let bom = { ...structuredClone(fixture.bom), trang_thai: initialStatus, ten_san_pham: fixture.product.ten_san_pham,
    san_pham: structuredClone(fixture.product), chi_tiet: structuredClone(fixture.lines) };
  const state = { writes: [] as { method: string; body: any }[], reasonGroups: [] as string[], errors: [] as string[] };
  const reasons = [
    { id: "STOP", ten_ly_do: "Tạm ngừng sử dụng", trang_thai: "DANG_SU_DUNG", chuc_nang_ap_dung: ["DOI_TRANG_THAI_CONG_THUC"] },
    { id: "REOPEN", ten_ly_do: "Kích hoạt lại", trang_thai: "DANG_SU_DUNG", chuc_nang_ap_dung: ["DOI_TRANG_THAI_CONG_THUC"] },
    { id: "OTHER", ten_ly_do: "Khác", trang_thai: "DANG_SU_DUNG", chuc_nang_ap_dung: ["DOI_TRANG_THAI_CONG_THUC"] },
    { id: "WRONG", ten_ly_do: "Nhà cung cấp", trang_thai: "DANG_SU_DUNG", chuc_nang_ap_dung: ["DOI_TRANG_THAI_NHA_CUNG_CAP"] },
    { id: "DISABLED", ten_ly_do: "Lý do đã ngừng", trang_thai: "NGUNG_SU_DUNG", chuc_nang_ap_dung: ["DOI_TRANG_THAI_CONG_THUC"] },
  ];
  page.on("pageerror", (error) => state.errors.push(error.message));
  await page.addInitScript(() => sessionStorage.setItem("access_token", "bom-edit-status-test"));
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(4);
    if (path === "/auth/me") return route.fulfill({ json: { ma_nguoi_dung: "TEST", ho_ten: "BOM tester", vai_tro: "CUSTOM", trang_thai: "HOAT_DONG" } });
    if (path === "/phan-quyen/cua-toi") return route.fulfill({ json: { ma_nguoi_dung: "TEST", vai_tro: "CUSTOM",
      chi_tiet: ["XEM", "SUA", "THEM", ...(allowStatus ? ["XAC_NHAN"] : [])].map((thao_tac) => ({ chuc_nang: "cong_thuc", thao_tac })) } });
    if (path === "/ly-do/ap-dung") {
      const group = url.searchParams.get("chuc_nang") ?? "";
      state.reasonGroups.push(group);
      return route.fulfill({ json: reasons.filter((reason) => reason.trang_thai === "DANG_SU_DUNG" && reason.chuc_nang_ap_dung.includes(group)) });
    }
    if (path === "/cong-thuc") return route.fulfill({ json: [bom] });
    if (path === "/cong-thuc/CT0001" && request.method() === "GET") return route.fulfill({ json: bom });
    if (path === "/nguyen-lieu") return route.fulfill({ json: fixture.lines.map((line: any) => ({ ...line, trang_thai: "DANG_SU_DUNG" })) });
    if (path === "/cong-thuc/CT0001" && request.method() === "PUT") {
      const body = request.postDataJSON();
      state.writes.push({ method: "PUT", body });
      if (conflict && body.thay_doi_trang_thai) return route.fulfill({ status: 422, json: { detail: "Sản phẩm đã có BOM đang sử dụng." } });
      bom = { ...bom, ...body, trang_thai: body.thay_doi_trang_thai?.trang_thai ?? bom.trang_thai };
      return route.fulfill({ json: bom });
    }
    if (path === "/cong-thuc/CT0001/trang-thai" && request.method() === "PATCH") {
      const body = request.postDataJSON();
      state.writes.push({ method: "PATCH", body });
      bom = { ...bom, trang_thai: body.trang_thai };
      return route.fulfill({ json: bom });
    }
    return route.fulfill({ status: 404, json: { detail: `Unexpected API: ${request.method()} ${path}` } });
  });
  await page.goto("/#/cong-thuc");
  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Cập nhật công thức", exact: true })).toBeVisible();
  return state;
}

for (const [oldStatus, newStatus, title, reason] of [
  ["DANG_SU_DUNG", "NGUNG_SU_DUNG", "Lý do ngừng sử dụng công thức", "STOP"],
  ["NGUNG_SU_DUNG", "DANG_SU_DUNG", "Lý do kích hoạt lại công thức", "REOPEN"],
]) {
  test(`BOM edit ${oldStatus} to ${newStatus} confirms reason in one atomic PUT`, async ({ page }) => {
    const state = await setup(page, oldStatus);
    const edit = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
    await edit.getByLabel("Tên công thức", { exact: true }).fill("Updated Classic");
    await edit.getByLabel("Trạng thái", { exact: true }).selectOption(newStatus);
    await edit.getByRole("button", { name: "Lưu công thức", exact: true }).click();
    const confirmation = page.getByRole("dialog", { name: title, exact: true });
    await expect(confirmation).toContainText("CT0001 · Updated Classic");
    await expect(confirmation).toContainText("Đang sử dụng");
    await expect(confirmation).toContainText("Ngưng sử dụng");
    await expect(page.getByRole("dialog")).toHaveCount(2);
    expect(state.writes).toEqual([]);
    await confirmation.getByLabel("Lý do *", { exact: true }).selectOption(reason);
    await expect(confirmation.getByRole("option", { name: "Nhà cung cấp", exact: true })).toHaveCount(0);
    await expect(confirmation.getByRole("option", { name: "Lý do đã ngừng", exact: true })).toHaveCount(0);
    await confirmation.getByLabel("Ghi chú", { exact: true }).fill("  Ghi chú kiểm thử  ");
    await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect(confirmation).not.toBeVisible();
    await expect(edit).not.toBeVisible();
    expect(state.reasonGroups).toEqual(["DOI_TRANG_THAI_CONG_THUC"]);
    expect(state.writes).toHaveLength(1);
    expect(state.writes[0]).toMatchObject({ method: "PUT", body: { ten_cong_thuc: "Updated Classic", thay_doi_trang_thai: {
      trang_thai: newStatus, trang_thai_cu: oldStatus, ly_do_id: reason, ghi_chu: "Ghi chú kiểm thử",
    } } });
    expect(state.writes[0].body).not.toHaveProperty("trang_thai");
    expect(state.errors).toEqual([]);
  });
}

test("BOM edit cancel reason dialog keeps edited fields and performs no writes", async ({ page }) => {
  const state = await setup(page);
  const edit = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  await edit.getByLabel("Tên công thức", { exact: true }).fill("Pending Classic");
  await edit.getByLabel("Trạng thái", { exact: true }).selectOption("NGUNG_SU_DUNG");
  await edit.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Lý do ngừng sử dụng công thức", exact: true });
  await confirmation.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(edit).toBeVisible();
  await expect(edit.getByLabel("Tên công thức", { exact: true })).toHaveValue("Pending Classic");
  await expect(edit.getByLabel("Trạng thái", { exact: true })).toHaveValue("NGUNG_SU_DUNG");
  await expect(edit.getByTestId("bom-input-kg")).toHaveText("0,294118 kg");
  expect(state.writes).toEqual([]);
});

test("BOM edit unchanged status saves normally with no reason request", async ({ page }) => {
  const state = await setup(page);
  const edit = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  await edit.getByLabel("Tên công thức", { exact: true }).fill("Name only");
  await edit.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  await expect(edit).not.toBeVisible();
  expect(state.reasonGroups).toEqual([]);
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].body).not.toHaveProperty("thay_doi_trang_thai");
});

test("BOM edit reuses required reason and Other note validation", async ({ page }) => {
  const state = await setup(page);
  const edit = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  await edit.getByLabel("Trạng thái", { exact: true }).selectOption("NGUNG_SU_DUNG");
  await edit.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Lý do ngừng sử dụng công thức", exact: true });
  await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(confirmation.getByRole("alert")).toContainText("Vui lòng chọn lý do.");
  await confirmation.getByLabel("Lý do *", { exact: true }).selectOption("OTHER");
  await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(confirmation.getByRole("alert")).toContainText('Vui lòng nhập ghi chú khi chọn lý do "Khác".');
  expect(state.writes).toEqual([]);
  await confirmation.getByLabel("Ghi chú *", { exact: true }).fill("Lý do khác có ghi chú");
  await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  expect(state.writes).toHaveLength(1);
});

test("BOM edit without status permission can edit information only", async ({ page }) => {
  const state = await setup(page, "DANG_SU_DUNG", false);
  const edit = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  await expect(edit.getByLabel("Trạng thái", { exact: true })).toBeDisabled();
  await edit.getByLabel("Tên công thức", { exact: true }).fill("Information only");
  await edit.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  await expect(edit).not.toBeVisible();
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].body).not.toHaveProperty("thay_doi_trang_thai");
});

test("BOM edit activation conflict keeps pending form and reason dialog", async ({ page }) => {
  const state = await setup(page, "NGUNG_SU_DUNG", true, true);
  const edit = page.getByRole("dialog", { name: "Cập nhật công thức", exact: true });
  await edit.getByLabel("Tên công thức", { exact: true }).fill("Pending activation");
  await edit.getByLabel("Trạng thái", { exact: true }).selectOption("DANG_SU_DUNG");
  await edit.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Lý do kích hoạt lại công thức", exact: true });
  await confirmation.getByLabel("Lý do *", { exact: true }).selectOption("REOPEN");
  await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(confirmation.getByRole("alert")).toContainText("Sản phẩm đã có BOM đang sử dụng.");
  await confirmation.getByRole("button", { name: "Hủy", exact: true }).click();
  await expect(edit.getByLabel("Tên công thức", { exact: true })).toHaveValue("Pending activation");
  await expect(edit.getByLabel("Trạng thái", { exact: true })).toHaveValue("DANG_SU_DUNG");
  expect(state.writes).toHaveLength(1);
});

test("BOM list status icon still uses the same reason dialog and PATCH", async ({ page }) => {
  const state = await setup(page);
  await page.getByRole("dialog", { name: "Cập nhật công thức", exact: true }).getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Đổi trạng thái", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Đổi trạng thái công thức", exact: true });
  await confirmation.getByLabel("Lý do *", { exact: true }).selectOption("STOP");
  await confirmation.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(confirmation).not.toBeVisible();
  expect(state.writes).toHaveLength(1);
  expect(state.writes[0].method).toBe("PATCH");
});
