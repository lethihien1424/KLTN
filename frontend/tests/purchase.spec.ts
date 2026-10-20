import { test, expect, type Page } from "@playwright/test";
import { mountGitBaseline } from "./baseline";
import { mkdirSync } from "node:fs";
const buyer = [
  "DU_BAO_VIEW",
  "NGUYEN_LIEU_VIEW",
  "NGUYEN_LIEU_CREATE",
  "NGUYEN_LIEU_UPDATE",
  "NGUYEN_LIEU_CHANGE_STATUS",
  "CONG_THUC_VIEW",
  "CONG_THUC_CREATE",
  "CONG_THUC_UPDATE",
  "CONG_THUC_CHANGE_STATUS",
  "TON_KHO_VIEW",
  "TON_KHO_CREATE",
  "TON_KHO_UPDATE",
  "TON_KHO_HISTORY_VIEW",
  "NHA_CUNG_CAP_VIEW",
  "NHA_CUNG_CAP_CREATE",
  "NHA_CUNG_CAP_UPDATE",
  "NHA_CUNG_CAP_CHANGE_STATUS",
  "NHA_CUNG_CAP_SCORE",
  "NHA_CUNG_CAP_PERFORMANCE_VIEW",
  "NGUYEN_LIEU_NCC_VIEW",
  "NGUYEN_LIEU_NCC_CREATE",
  "NGUYEN_LIEU_NCC_UPDATE",
  "NHU_CAU_NGUYEN_LIEU_VIEW",
  "GOI_Y_NHA_CUNG_CAP_VIEW",
  "DE_XUAT_NHAP_HANG_VIEW",
  "DE_XUAT_NHAP_HANG_CREATE",
  "DON_MUA_VIEW",
  "DON_MUA_CREATE",
  "DON_MUA_UPDATE",
  "DON_MUA_RECEIVE",
];
const manager = [
  "DU_BAO_VIEW",
  "NGUYEN_LIEU_VIEW",
  "CONG_THUC_VIEW",
  "TON_KHO_VIEW",
  "TON_KHO_HISTORY_VIEW",
  "NHA_CUNG_CAP_VIEW",
  "NHA_CUNG_CAP_PERFORMANCE_VIEW",
  "NGUYEN_LIEU_NCC_VIEW",
  "NHU_CAU_NGUYEN_LIEU_VIEW",
  "GOI_Y_NHA_CUNG_CAP_VIEW",
  "DE_XUAT_NHAP_HANG_VIEW",
  "DE_XUAT_NHAP_HANG_APPROVE",
  "DE_XUAT_NHAP_HANG_REJECT",
  "DON_MUA_VIEW",
  "DON_MUA_APPROVE",
  "DON_MUA_REJECT",
  "DASHBOARD_VIEW",
];
const material = {
  ma_nguyen_lieu: "NL01",
  ten_nguyen_lieu: "Arabica",
  don_vi_do_luong: "kg",
  trang_thai: "DANG_SU_DUNG",
};
const supplier = {
  ma_ncc: "NCC01",
  ten_ncc: "Cà phê Đà Lạt",
  trang_thai: "DANG_HOAT_DONG",
  diem_dieu_kien_thuong_mai: "91.51",
  ty_le_giao_dung_han_thuc_te: null,
  ty_le_giao_du_thuc_te: null,
};
const stock = {
  ...material,
  ngay_ghi_nhan: "2026-10-01",
  ton_kho_thuc_te: "10.00",
  so_luong_book: "5.00",
  ton_kho_kha_dung: "5.00",
  ton_kho_an_toan: "20.00",
  ton_kho_toi_da: "100.00",
};
const bom = {
  ma_cong_thuc: "CT01",
  ten_cong_thuc: "Classic",
  ma_san_pham: "SP01",
  ten_san_pham: "Classic 250g",
  he_so_thu_hoi: "0.85",
  ty_le_hao_hut: "0.15",
  trang_thai: "DANG_SU_DUNG",
  thoi_gian_tao: "2026-10-01T08:00:00+07:00",
  thoi_gian_cap_nhat: "2026-10-01T08:00:00+07:00",
  chi_tiet: [{ ...material, ty_le_phoi_tron: "1.0000" }],
};
const mapping = {
  ...material,
  ...supplier,
  ma_nguyen_lieu_ncc: "MAP01",
  don_gia_nguyen_lieu: "150000.00",
  so_luong_ton_kho: "200.00",
  so_luong_book: "10.00",
  so_luong_xuat: "0.00",
  lead_time_ngay: 2,
  ty_le_chat_luong_dat: "0.95",
  ty_le_giao_dung_han: "0.9",
  ty_le_giao_du: "1",
};
const forecast = {
  ma_lich_su_du_bao: "LSDB01",
  ngay_chay: "2026-10-04",
  so_tuan_du_bao: 4,
  thoi_gian_chay: "2026-10-04T08:00:00+07:00",
  tong_san_pham: 1,
  danh_gia_mo_hinh: [],
  ket_qua: [
    {
      ma_san_pham: "SP01",
      ket_qua: Array.from({ length: 4 }, (_, i) => ({
        tu_ngay: `2026-10-${String(5 + i * 7).padStart(2, "0")}`,
        den_ngay:
          i === 3
            ? "2026-11-01"
            : `2026-10-${String(11 + i * 7).padStart(2, "0")}`,
        so_luong_du_bao: 100,
        can_duoi: 80,
        can_tren: 120,
      })),
    },
  ],
};
async function setup(
  page: Page,
  permissions = buyer,
  role = "CUSTOM_PURCHASE_ROLE",
  authenticated = true,
) {
  const state = {
    reasons: [
      {
        id: "LD1",
        ma_ly_do: "LD1",
        ten_ly_do: "Không còn sử dụng",
        ghi_chu: null as string | null,
        trang_thai: "DANG_SU_DUNG",
        chuc_nang_ap_dung: [
          "DOI_TRANG_THAI_NGUYEN_LIEU",
          "DOI_TRANG_THAI_CONG_THUC",
          "DOI_TRANG_THAI_NHA_CUNG_CAP",
        ],
        created_at: "2026-10-05T00:00:00Z",
      },
      {
        id: "LDOTHER",
        ma_ly_do: "LDOTHER",
        ten_ly_do: "Khác",
        ghi_chu: null as string | null,
        trang_thai: "DANG_SU_DUNG",
        chuc_nang_ap_dung: [
          "DOI_TRANG_THAI_NGUYEN_LIEU",
          "DOI_TRANG_THAI_CONG_THUC",
          "DOI_TRANG_THAI_NHA_CUNG_CAP",
        ],
        created_at: "2026-10-05T00:00:00Z",
      },
    ],
    permissions,
    materials: [{ ...material }],
    stocks: [{ ...stock }],
    suppliers: [{ ...supplier }],
    mappings: [{ ...mapping }],
    proposal: {
      ma_de_xuat: "DX01",
      ngay_de_xuat_nhap_hang: "2026-10-04",
      ngay_tao_de_xuat: "2026-10-04T08:00:00+07:00",
      ghi_chu: "",
      trang_thai: "CHO_DUYET",
      nguoi_tao: "BUY01",
      nguoi_duyet: null as string | null,
      thoi_gian_duyet: null as string | null,
      ly_do_tu_choi: null as string | null,
      chi_tiet: [
        {
          ma_chi_tiet: "DXCT01",
          ...material,
          ...supplier,
          so_luong_de_xuat_kg: "38.28",
          don_gia_du_kien: "150000.00",
        },
      ],
    },
    order: {
      ma_don_mua: "DM01",
      ...supplier,
      ma_de_xuat: "DX01",
      nguoi_tao: "BUY01",
      ngay_dat_hang: "2026-10-01",
      ngay_du_kien_giao: "2026-10-04",
      ngay_giao_thuc_te: null as string | null,
      tong_tien: "5742000.00",
      trang_thai: "CHUA_DUYET",
      nguoi_duyet: null as string | null,
      thoi_gian_duyet: null as string | null,
      ly_do_tu_choi: null as string | null,
      chi_tiet: [
        {
          ma_chi_tiet_don_mua: "DMCT01",
          ...material,
          so_luong_mua: "38.28",
          don_gia_vnd_kg: "150000.00",
          thanh_tien: "5742000.00",
          so_luong_thuc_nhan: "0.00",
          ly_do_khong_nhan: null as string | null,
        },
      ],
    },
    requests: [] as { method: string; path: string; body: any }[],
    errors: [] as string[],
    failure: null as { path: string; status: number; detail: string } | null,
  };
  page.on("pageerror", (error) => state.errors.push(error.message));
  if (authenticated)
    await page.addInitScript(() =>
      sessionStorage.setItem("access_token", "test-session"),
    );
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.slice(4);
    const method = request.method();
    const body = request.postDataJSON();
    state.requests.push({ method, path, body });
    const respond = (value: any, status = 200) =>
      route.fulfill({
        status,
        json: value,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    if (state.failure?.path === path)
      return respond({ detail: state.failure.detail }, state.failure.status);
    if (path === "/ly-do/ap-dung")
      return respond(
        state.reasons.filter(
          (r) =>
            r.trang_thai === "DANG_SU_DUNG" &&
            r.chuc_nang_ap_dung.includes(
              url.searchParams.get("chuc_nang") ?? "",
            ),
        ),
      );
    if (path === "/ly-do" && method === "GET") {
      const items = state.reasons.filter(
        (r) =>
          (!url.searchParams.get("search") ||
            r.ten_ly_do
              .toLowerCase()
              .includes(url.searchParams.get("search")!.toLowerCase())) &&
          (!url.searchParams.get("chuc_nang") ||
            r.chuc_nang_ap_dung.includes(url.searchParams.get("chuc_nang")!)) &&
          (!url.searchParams.get("trang_thai") ||
            r.trang_thai === url.searchParams.get("trang_thai")),
      );
      return respond({ items, total: items.length, page: 1, page_size: 10 });
    }
    if (path === "/ly-do" && method === "POST") {
      const reason = {
        id: "LDNEW",
        ma_ly_do: "LDNEW",
        created_at: "2026-10-05T00:00:00Z",
        ...body,
      };
      state.reasons.push(reason);
      return respond(reason, 201);
    }
    if (path.startsWith("/ly-do/") && method === "PUT") {
      const reason = state.reasons.find((r) => r.id === path.split("/")[2])!;
      Object.assign(reason, body);
      return respond(reason);
    }
    if (path.startsWith("/ly-do/") && method === "PATCH") {
      const reason = state.reasons.find((r) => r.id === path.split("/")[2])!;
      reason.trang_thai = body.trang_thai;
      return respond(reason);
    }
    if (path === "/nhat-ky-hoat-dong") return respond({ items: [], total: 0 });
    if (path === "/auth/login")
      return respond({
        access_token: "test-session",
        token_type: "bearer",
        expires_in: 3600,
        user: {
          ma_nguoi_dung: "CUSTOM01",
          ho_ten: "Nguyễn Minh Anh",
          vai_tro: role,
          permissions: ["STALE_LOGIN_PERMISSION"],
          trang_thai: "HOAT_DONG",
        },
      });
    if (path === "/auth/me")
      return respond({
        ma_nguoi_dung: "CUSTOM01",
        ho_ten: "Nguyễn Minh Anh",
        vai_tro: role,
        role: {
          ma_vai_tro: role,
          ten_vai_tro:
            (
              {
                NHAN_VIEN_BAN_HANG: "Nhân viên bán hàng",
                NHAN_VIEN_MUA_HANG: "Nhân viên mua hàng",
                QUAN_LY_MUA_HANG: "Quản lý mua hàng",
              } as Record<string, string>
            )[role] ?? "Vai trò tùy chỉnh",
        },
        permissions: state.permissions,
        trang_thai: "HOAT_DONG",
      });
    if (path === "/auth/logout") return respond({});
    if (path === "/du-bao/moi-nhat" || path === "/du-bao/lich-su/LSDB01")
      return respond(forecast);
    if (path === "/du-bao/lich-su")
      return respond([
        {
          ...forecast,
          ngay_bat_dau_huan_luyen: "2025-01-01",
          ngay_ket_thuc_huan_luyen: "2026-09-30",
          nguoi_thuc_hien: "CUSTOM01",
          ho_ten_nguoi_thuc_hien: "Nguyễn Minh Anh",
          trang_thai: "THANH_CONG",
        },
      ]);
    if (path === "/nguyen-lieu" && method === "GET")
      return respond(state.materials);
    if (path === "/nguyen-lieu" && method === "POST") {
      state.materials.push(body);
      return respond(body, 201);
    }
    if (path.startsWith("/nguyen-lieu/") && method !== "GET") {
      const row = state.materials.find(
        (r) => r.ma_nguyen_lieu === path.split("/")[2],
      );
      Object.assign(row!, body);
      return respond(row);
    }
    if (path === "/cong-thuc" && method === "GET") return respond([bom]);
    if (path === "/cong-thuc/CT01" && method === "GET") return respond(bom);
    if (path.startsWith("/cong-thuc") && method !== "GET")
      return respond({ ...bom, ...body }, method === "POST" ? 201 : 200);
    if (path === "/ton-kho-nguyen-lieu" && method === "GET")
      return respond(state.stocks);
    if (path === "/ton-kho-nguyen-lieu/NL01" && method === "GET")
      return respond(state.stocks);
    if (path.startsWith("/ton-kho-nguyen-lieu") && method !== "GET") {
      Object.assign(state.stocks[0], body);
      return respond(state.stocks[0]);
    }
    if (path === "/nha-cung-cap" && method === "GET")
      return respond(state.suppliers);
    if (path === "/nha-cung-cap/NCC01" && method === "GET")
      return respond(state.suppliers[0]);
    if (path.includes("/tinh-diem")) {
      Object.assign(state.suppliers[0], {
        ty_le_giao_dung_han_thuc_te: "100.00",
        ty_le_giao_du_thuc_te: "100.00",
      });
      return respond({ so_ncc_da_cap_nhat: 1 });
    }
    if (path === "/nha-cung-cap" && method === "POST")
      return respond({ ...supplier, ...body }, 201);
    if (path.startsWith("/nha-cung-cap/") && method !== "GET") {
      Object.assign(state.suppliers[0], body);
      return respond(state.suppliers[0]);
    }
    if (path === "/nguyen-lieu-nha-cung-cap" && method === "GET")
      return respond(state.mappings);
    if (path.startsWith("/nguyen-lieu-nha-cung-cap") && method !== "GET") {
      Object.assign(state.mappings[0], body);
      return respond(state.mappings[0]);
    }
    if (path === "/nhu-cau-nguyen-lieu/LSDB01")
      return respond({
        ma_lich_su_du_bao: "LSDB01",
        chi_tiet: [
          {
            ...material,
            nhu_cau_du_bao_kg: "43.28",
            ton_kho_kha_dung: "5.00",
            ton_kho_an_toan: "20.00",
            so_luong_dang_ve: "0.00",
            so_luong_thieu_kg: "38.28",
            ton_kho_toi_da: "100.00",
            so_luong_can_mua_kg: "38.28",
          },
        ],
      });
    if (path === "/goi-y-nha-cung-cap")
      return respond({
        ...material,
        so_luong_can_mua: url.searchParams.get("so_luong_can_mua"),
        nha_cung_cap: [
          {
            ...supplier,
            don_gia: "150000.00",
            ton_kho_kha_dung_ncc: "190.00",
            lead_time_ngay: 2,
            diem_ncc: "91.51",
            du_kha_nang_cung_cap: true,
          },
          {
            ...supplier,
            ma_ncc: "NCC02",
            ten_ncc: "NCC thiếu tồn",
            don_gia: "140000.00",
            ton_kho_kha_dung_ncc: "5.00",
            lead_time_ngay: 1,
            diem_ncc: null,
            du_kha_nang_cung_cap: false,
          },
        ],
      });
    if (path === "/de-xuat-nhap-hang" && method === "GET")
      return respond([state.proposal]);
    if (path === "/de-xuat-nhap-hang" && method === "POST") {
      state.proposal.ghi_chu = body.ghi_chu;
      return respond(state.proposal, 201);
    }
    if (path === "/de-xuat-nhap-hang/DX01") return respond(state.proposal);
    if (path === "/de-xuat-nhap-hang/DX01/duyet") {
      state.proposal.trang_thai = "DA_DUYET";
      state.proposal.nguoi_duyet = "MANAGER";
      return respond(state.proposal);
    }
    if (path === "/de-xuat-nhap-hang/DX01/tu-choi") {
      state.proposal.trang_thai = "TU_CHOI";
      state.proposal.ly_do_tu_choi = body.ly_do_tu_choi;
      return respond(state.proposal);
    }
    if (path === "/de-xuat-nhap-hang/DX01/tao-don-mua")
      return respond({ ma_de_xuat: "DX01", don_mua: [state.order] });
    if (path === "/don-mua-nguyen-lieu" && method === "GET")
      return respond([state.order]);
    if (path === "/don-mua-nguyen-lieu/DM01" && method === "GET")
      return respond(state.order);
    if (path === "/don-mua-nguyen-lieu/DM01/duyet") {
      state.order.trang_thai = "DA_DUYET";
      return respond(state.order);
    }
    if (path === "/don-mua-nguyen-lieu/DM01/tu-choi") {
      state.order.trang_thai = "TU_CHOI";
      state.order.ly_do_tu_choi = body.ly_do_tu_choi;
      return respond(state.order);
    }
    if (path === "/don-mua-nguyen-lieu/DM01/nhan-hang") {
      state.order.trang_thai = "DA_NHAN_HANG";
      state.order.ngay_giao_thuc_te = body.ngay_giao_thuc_te;
      Object.assign(state.order.chi_tiet[0], body.chi_tiet[0]);
      state.stocks[0].ton_kho_thuc_te = String(
        10 + Number(body.chi_tiet[0].so_luong_thuc_nhan),
      );
      return respond(state.order);
    }
    if (
      (path === "/don-mua-nguyen-lieu" && method === "POST") ||
      (path === "/don-mua-nguyen-lieu/DM01" && method === "PUT")
    )
      return respond({ ...state.order, ...body });
    if (path === "/dashboard/hieu-suat-nha-cung-cap")
      return respond(
        state.suppliers.map((r) => ({
          ...r,
          diem_ncc: r.diem_dieu_kien_thuong_mai,
        })),
      );
    if (path === "/dashboard/tong-quan")
      return respond({
        nguyen_lieu: { tong_so: 1, duoi_ton_an_toan: 1 },
        de_xuat_nhap_hang: { CHO_DUYET: 0, DA_DUYET: 1, TU_CHOI: 0 },
        don_mua: { CHUA_DUYET: 0, DA_DUYET: 0, DA_NHAN_HANG: 1, TU_CHOI: 0 },
        mua_hang: {
          gia_tri_da_duyet: "0.00",
          gia_tri_da_nhan_hang: "5742000.00",
        },
        nha_cung_cap: { tong_so: 1, co_du_lieu_hieu_suat_thuc_te: 1 },
      });
    if (path === "/dashboard/canh-bao-ton-kho")
      return respond([{ ...stock, so_luong_thieu_an_toan: "15.00" }]);
    return respond({ detail: `Unexpected API: ${method} ${path}` }, 500);
  });
  return state;
}
const refreshRights = async (page: Page) =>
  page.getByRole("button", { name: "Làm mới quyền" }).click();
test("NVBH forecast matches Git baseline; only three authorized legacy menu items", async ({
  page,
  context,
}) => {
  const permissions = ["IMPORT_DON_HANG", "DU_BAO_VIEW", "DU_BAO_RUN"];
  await setup(page, permissions, "NHAN_VIEN_BAN_HANG");
  await page.goto("/#/du-bao");
  await expect(page.locator(".db-result")).toBeVisible();
  await expect(page.locator(".dashboard-sidebar nav button")).toHaveCount(3);
  const reference = await context.newPage();
  await setup(reference, permissions, "NHAN_VIEN_BAN_HANG");
  await mountGitBaseline(reference);
  await reference.goto("/__baseline");
  await reference
    .locator(".dashboard-sidebar")
    .getByRole("button", { name: "Dự báo nhu cầu", exact: true })
    .click();
  await expect(reference.locator(".db-result")).toBeVisible();
  const selectors = [
    ".dashboard-sidebar",
    ".dashboard-topbar",
    ".dashboard-main",
    ".db-heading",
    ".db-tabs",
    ".db-run-panel",
    ".db-button.db-primary",
    ".db-table",
  ];
  const metrics = async (target: Page) =>
    target.evaluate(
      (items) =>
        items.map((selector) => {
          const element = document.querySelector(selector)!;
          const css = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            selector,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            font: css.font,
            background: css.backgroundColor,
            color: css.color,
            padding: css.padding,
            radius: css.borderRadius,
          };
        }),
      selectors,
    );
  expect(await metrics(page)).toEqual(await metrics(reference));
  mkdirSync("reports/ui-restore", { recursive: true });
  const before = await reference.locator(".db-page").screenshot({
    path: "reports/ui-restore/forecast-baseline.png",
    animations: "disabled",
  });
  const after = await page.locator(".db-page").screenshot({
    path: "reports/ui-restore/forecast-restored.png",
    animations: "disabled",
  });
  // Chromium can round gradient channels by one level between captures.
  // Compare decoded pixels and allow only that rounding, with zero layout tolerance.
  const { createRequire } = await import("node:module");
  const { PNG } = createRequire(import.meta.url)(
    "playwright-core/lib/utilsBundle",
  );
  const baselinePixels = PNG.sync.read(before);
  const restoredPixels = PNG.sync.read(after);
  expect(restoredPixels.width).toBe(baselinePixels.width);
  expect(restoredPixels.height).toBe(baselinePixels.height);
  let largestChannelDifference = 0;
  for (let i = 0; i < baselinePixels.data.length; i++) {
    largestChannelDifference = Math.max(
      largestChannelDifference,
      Math.abs(baselinePixels.data[i] - restoredPixels.data[i]),
    );
  }
  expect(largestChannelDifference).toBeLessThanOrEqual(1);
  await page.screenshot({
    path: "reports/ui-restore/forecast-restored-shell.png",
    fullPage: true,
  });
});
test("legacy overview and working sales import keep the original shell", async ({
  page,
  context,
}) => {
  const permissions = ["IMPORT_DON_HANG", "DU_BAO_VIEW", "DU_BAO_RUN"];
  await setup(page, permissions, "NHAN_VIEN_BAN_HANG");
  await page.goto("/");
  const reference = await context.newPage();
  await setup(reference, permissions, "NHAN_VIEN_BAN_HANG");
  await mountGitBaseline(reference);
  await reference.goto("/__baseline");
  await expect(reference.locator(".dashboard-main")).toContainText(
    "Bảng Điều Khiển Nhân Viên Bán Hàng",
  );
  await expect(page.locator(".dashboard-main")).toHaveText(
    (await reference.locator(".dashboard-main").textContent())!,
  );
  await page.screenshot({
    path: "reports/ui-restore/overview-restored.png",
    fullPage: true,
  });
  await reference.screenshot({
    path: "reports/ui-restore/overview-baseline.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Nhập dữ liệu bán hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Nhập dữ liệu bán hàng", exact: true }),
  ).toBeVisible();
  await expect(page.locator('input[type="file"]')).toBeVisible();
  await expect(page.locator(".dashboard-sidebar nav button")).toHaveCount(3);
  await page.screenshot({
    path: "reports/ui-restore/sales-import-restored.png",
    fullPage: true,
  });
});

test("MH01 and QLMH keep the same original shell with permission-specific actions", async ({
  page,
}) => {
  const state = await setup(page, buyer, "NHAN_VIEN_MUA_HANG");
  await page.goto("/#/nguyen-lieu");
  await expect(page.locator(".dashboard-brand-text")).toContainText(
    "FORECAST SYSTEM",
  );
  await expect(page.locator(".dashboard-sidebar")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.getByRole("button", { name: "+ Thêm nguyên liệu" }),
  ).toBeVisible();
  await expect(page.locator(".pm-shell")).toHaveCount(0);
  await page.screenshot({
    path: "reports/ui-restore/materials-restored.png",
    fullPage: true,
  });
  state.permissions = manager;
  await refreshRights(page);
  await expect(
    page.getByRole("button", { name: "+ Thêm nguyên liệu" }),
  ).toHaveCount(0);
  await page.goto("/#/de-xuat/DX01");
  await expect(
    page.getByRole("button", { name: "Duyệt đề xuất" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Từ chối", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "reports/ui-restore/proposal-restored.png",
    fullPage: true,
  });
});
test("login obtains current permissions from /me before showing the shell", async ({
  page,
}) => {
  const state = await setup(page, ["NGUYEN_LIEU_VIEW"], "CUSTOM_ROLE", false);
  await page.goto("/");
  await page.screenshot({
    path: "reports/ui-restore/login-restored.png",
    fullPage: true,
  });
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill("CUSTOM01");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("test-only-password");
  await page.getByRole("button", { name: "ĐĂNG NHẬP", exact: true }).click();
  await expect(
    page
      .locator(".dashboard-sidebar")
      .getByRole("button", { name: "Nguyên liệu", exact: true }),
  ).toBeVisible();
  expect(state.requests.map((r) => r.path).slice(0, 2)).toEqual([
    "/auth/login",
    "/auth/me",
  ]);
  expect(
    await page.evaluate(() => sessionStorage.getItem("access_token")),
  ).toBe("test-session");
});
test("forecast → demand → proposal → approvals → receipt → stock → performance → dashboard", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/#/du-bao");
  await expect(
    page.getByRole("button", { name: /Xem nhu cầu nguyên liệu/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Xem nhu cầu nguyên liệu/ }).click();
  await expect(
    page.getByRole("heading", { name: "Nhu cầu nguyên liệu", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Xem NCC/ }).click();
  await expect(
    page.getByRole("button", { name: "Chọn NCC", exact: true }).nth(1),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Chọn NCC", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Tạo đề xuất nhập hàng/ }).click();
  await page.getByRole("button", { name: "Gửi đề xuất chờ duyệt" }).click();
  await expect(
    page.getByRole("heading", { name: "DX01", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Duyệt đề xuất" })).toHaveCount(
    0,
  );
  state.permissions = manager;
  await refreshRights(page);
  await page.getByRole("button", { name: "Duyệt đề xuất" }).click();
  await page
    .getByRole("button", { name: "Xác nhận duyệt", exact: true })
    .click();
  await expect(
    page.locator(".pm-summary").filter({ hasText: "Trạng thái" }),
  ).toContainText("Đã duyệt");
  await expect(
    page.getByRole("button", { name: "Tạo đơn mua", exact: true }),
  ).toHaveCount(0);
  state.permissions = buyer;
  await refreshRights(page);
  await page.getByRole("button", { name: "Tạo đơn mua", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Tạo đơn mua", exact: true })
    .click();
  await page.getByRole("link", { name: /DM01 ·/ }).click();
  await expect(
    page.getByRole("heading", { name: "DM01", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Nhận hàng", exact: true }),
  ).toHaveCount(0);
  state.permissions = manager;
  await refreshRights(page);
  await page.getByRole("button", { name: "Duyệt đơn mua" }).click();
  await page
    .getByRole("button", { name: "Xác nhận duyệt", exact: true })
    .click();
  state.permissions = buyer;
  await refreshRights(page);
  await page.getByRole("button", { name: "Nhận hàng", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận nhận hàng" }).click();
  await expect(
    page.locator(".pm-summary").filter({ hasText: "Trạng thái" }),
  ).toContainText("Đã nhận hàng");
  await expect(
    page.getByRole("button", { name: "Nhận hàng", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Xem tồn kho →", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "48,28", exact: true }),
  ).toBeVisible();
  await page
    .locator(".dashboard-sidebar")
    .getByRole("button", { name: "Hiệu suất nhà cung cấp", exact: true })
    .click();
  await page.getByRole("button", { name: "Tính lại tất cả" }).click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "100%", exact: true }),
  ).toHaveCount(2);
  state.permissions = manager;
  await refreshRights(page);
  await page
    .locator(".dashboard-sidebar")
    .getByRole("button", { name: "Dashboard mua hàng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Dashboard mua hàng", exact: true }),
  ).toBeVisible();
  expect(
    state.requests.find(
      (r) => r.method === "POST" && r.path === "/de-xuat-nhap-hang",
    )?.body.chi_tiet,
  ).toEqual([
    { ma_nguyen_lieu: "NL01", ma_ncc: "NCC01", so_luong_de_xuat_kg: "38.28" },
  ]);
  expect(
    state.requests.filter((r) => r.path.endsWith("/nhan-hang")),
  ).toHaveLength(1);
  expect(state.errors).toEqual([]);
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
});
test("custom read permission gates menu, actions and direct routes", async ({
  page,
}) => {
  const state = await setup(page, ["NGUYEN_LIEU_VIEW"]);
  await page.goto("/#/nguyen-lieu");
  await expect(
    page.getByRole("cell", { name: "Arabica", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Thêm nguyên liệu|Sửa|Đổi trạng thái/ }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".dashboard-sidebar")
      .getByRole("button", { name: "Đơn mua nguyên liệu" }),
  ).toHaveCount(0);
  await page.goto("/#/don-mua");
  await expect(
    page.getByText("Bạn chưa có quyền truy cập màn hình này"),
  ).toBeVisible();
  expect(
    state.requests.filter((r) => r.path.startsWith("/don-mua-nguyen-lieu")),
  ).toHaveLength(0);
});
test("ADMIN without permissions receives no bypass", async ({ page }) => {
  const state = await setup(page, [], "ADMIN");
  await page.goto("/");
  await expect(
    page.getByText("Chưa có chức năng được cấp quyền"),
  ).toBeVisible();
  expect(state.requests.every((r) => r.path === "/auth/me")).toBeTruthy();
});
test("receipt validates excess and missing reason, sends all lines and zero quantity", async ({
  page,
}) => {
  const state = await setup(page);
  state.order.trang_thai = "DA_DUYET";
  await page.goto("/#/don-mua/DM01");
  await page.getByRole("button", { name: "Nhận hàng", exact: true }).click();
  await page.getByLabel("Số lượng thực nhận").fill("40");
  await page.getByRole("button", { name: "Xác nhận nhận hàng" }).click();
  expect(
    await page
      .getByLabel("Số lượng thực nhận")
      .evaluate((el: HTMLInputElement) => el.validity.rangeOverflow),
  ).toBeTruthy();
  await page.getByLabel("Số lượng thực nhận").fill("0");
  await page.getByRole("button", { name: "Xác nhận nhận hàng" }).click();
  expect(
    state.requests.filter((r) => r.path.endsWith("/nhan-hang")),
  ).toHaveLength(0);
  await page.getByLabel("Lý do nhận thiếu *").fill("Không giao được hàng");
  await page.getByRole("button", { name: "Xác nhận nhận hàng" }).click();
  await expect(
    page.getByText("Đã nhận hàng và cập nhật tồn kho.", { exact: true }),
  ).toBeVisible();
  expect(
    state.requests.find((r) => r.path.endsWith("/nhan-hang"))?.body.chi_tiet,
  ).toEqual([
    {
      ma_chi_tiet_don_mua: "DMCT01",
      so_luong_thuc_nhan: "0",
      ly_do_khong_nhan: "Không giao được hàng",
    },
  ]);
});
test("proposal rejection requires a nonblank reason and removes approval controls", async ({
  page,
}) => {
  const state = await setup(page, manager);
  await page.goto("/#/de-xuat/DX01");
  await page.getByRole("button", { name: "Từ chối", exact: true }).click();
  await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
  expect(
    state.requests.filter((r) => r.path.endsWith("/tu-choi")),
  ).toHaveLength(0);
  await page.getByLabel("Lý do từ chối *").fill("Giá chưa phù hợp");
  await page.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(page.getByText("Lý do từ chối: Giá chưa phù hợp")).toBeVisible();
  await expect(page.getByRole("button", { name: "Duyệt đề xuất" })).toHaveCount(
    0,
  );
});
test("BOM rejects incorrect total before sending and saves decimal strings", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/#/cong-thuc");
  await page.getByRole("button", { name: "+ Thêm công thức" }).click();
  await page.getByLabel("Mã sản phẩm").fill("SP01");
  await page.getByLabel("Tên công thức", { exact: true }).fill("Công thức mới");
  await page
    .getByRole("dialog")
    .getByLabel("Nguyên liệu", { exact: true })
    .selectOption("NL01");
  await page.getByLabel("Tỷ lệ phối trộn (0–1)").fill("0.5");
  await page.getByRole("button", { name: "Lưu công thức" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Tổng tỷ lệ phối trộn phải bằng 100%",
  );
  expect(
    state.requests.filter(
      (r) => r.path === "/cong-thuc" && r.method === "POST",
    ),
  ).toHaveLength(0);
  await page.getByLabel("Tỷ lệ phối trộn (0–1)").fill("1");
  await page.getByRole("button", { name: "Lưu công thức" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    state.requests.find((r) => r.path === "/cong-thuc" && r.method === "POST")
      ?.body.chi_tiet[0].ty_le_phoi_tron,
  ).toBe("1");
});
test("materials create, edit and status update use separate endpoints", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/#/nguyen-lieu");
  await page.getByRole("button", { name: "+ Thêm nguyên liệu" }).click();
  await page.getByLabel("Mã nguyên liệu", { exact: true }).fill("NL02");
  await page.getByLabel("Tên nguyên liệu", { exact: true }).fill("Robusta");
  await page.getByRole("button", { name: "Lưu nguyên liệu" }).click();
  const row = page.getByRole("row").filter({ hasText: "Robusta" });
  await row.getByRole("button", { name: "Sửa", exact: true }).click();
  await page
    .getByLabel("Tên nguyên liệu", { exact: true })
    .fill("Robusta rang");
  await page.getByRole("button", { name: "Lưu nguyên liệu" }).click();
  await page
    .getByRole("row")
    .filter({ hasText: "Robusta rang" })
    .getByRole("button", { name: "Đổi trạng thái" })
    .click();
  await page.getByLabel("Lý do *", { exact: true }).selectOption("LD1");
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Robusta rang" }),
  ).toContainText("Ngưng sử dụng");
  expect(
    state.requests.find(
      (r) => r.method === "PUT" && r.path === "/nguyen-lieu/NL02",
    )?.body,
  ).toEqual({ ten_nguyen_lieu: "Robusta rang", don_vi_do_luong: "kg" });
});
test("stock bounds validated and history uses its independent permission", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/#/ton-kho");
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  await page.getByLabel("Tồn an toàn", { exact: true }).fill("200");
  await page.getByRole("button", { name: "Lưu tồn kho" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Tồn kho tối đa phải lớn hơn hoặc bằng tồn an toàn",
  );
  expect(state.requests.filter((r) => r.method === "PUT")).toHaveLength(0);
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await page.getByRole("button", { name: "Lịch sử", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Lịch sử tồn kho · Arabica" }),
  ).toBeVisible();
});
test("supplier detail tabs and mapping constraints", async ({ page }) => {
  const state = await setup(page);
  await page.goto("/#/nha-cung-cap/NCC01");
  await page
    .getByRole("button", { name: "Nguyên liệu cung cấp", exact: true })
    .click();
  await page.getByRole("button", { name: "Sửa", exact: true }).click();
  await page.getByLabel("Đã book", { exact: true }).fill("999");
  await page.getByRole("button", { name: "Lưu cung ứng" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "không được vượt tồn kho NCC",
  );
  await page.getByLabel("Đã book", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Lưu cung ứng" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    state.requests.find((r) => r.method === "PUT")?.body,
  ).not.toHaveProperty("ma_ncc");
  await page.getByRole("button", { name: "Hiệu suất", exact: true }).click();
  await expect(page.getByText("Chưa có dữ liệu", { exact: true })).toHaveCount(
    2,
  );
});
test("403 refreshes permissions and removes stale write action", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/#/nguyen-lieu");
  await page.getByRole("button", { name: "+ Thêm nguyên liệu" }).click();
  await page.getByLabel("Mã nguyên liệu", { exact: true }).fill("NL02");
  await page.getByLabel("Tên nguyên liệu", { exact: true }).fill("Robusta");
  state.permissions = ["NGUYEN_LIEU_VIEW"];
  state.failure = {
    path: "/nguyen-lieu",
    status: 403,
    detail: "Quyền tạo đã bị thu hồi.",
  };
  await page.getByRole("button", { name: "Lưu nguyên liệu" }).click();
  await expect(
    page.getByRole("button", { name: "Lưu nguyên liệu" }),
  ).toBeDisabled();
  await expect(page.getByRole("alert")).toContainText(
    "Quyền tạo đã bị thu hồi.",
  );
  await page.getByRole("button", { name: "Đóng", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "+ Thêm nguyên liệu" }),
  ).toHaveCount(0);
});
test("API error offers retry; 401 ends session", async ({ page }) => {
  const state = await setup(page);
  state.failure = {
    path: "/nguyen-lieu",
    status: 500,
    detail: "Lỗi kết nối dữ liệu",
  };
  await page.goto("/#/nguyen-lieu");
  await expect(page.getByRole("alert")).toContainText("Lỗi kết nối dữ liệu");
  state.failure = null;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(
    page.getByRole("cell", { name: "Arabica", exact: true }),
  ).toBeVisible();
  state.failure = {
    path: "/nguyen-lieu",
    status: 401,
    detail: "Phiên hết hạn",
  };
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await expect(page.locator(".dashboard-sidebar")).toHaveCount(0);
  expect(
    await page.evaluate(() => sessionStorage.getItem("access_token")),
  ).toBeNull();
});
test("small viewport has accessible navigation and no page overflow", async ({
  page,
}) => {
  const state = await setup(page, ["NGUYEN_LIEU_VIEW", "DON_MUA_VIEW"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/nguyen-lieu");
  await expect(
    page.getByRole("cell", { name: "Arabica", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(state.errors).toEqual([]);
  await page.screenshot({
    path: "test-results/materials-mobile.png",
    fullPage: true,
  });
});

const purchaseMenuCases = [
  ["Nguyên liệu", "/nguyen-lieu", "NGUYEN_LIEU_VIEW", "Mã nguyên liệu"],
  ["Công thức / BOM", "/cong-thuc", "CONG_THUC_VIEW", "Mã công thức"],
  ["Tồn kho nguyên liệu", "/ton-kho", "TON_KHO_VIEW", "Ngày ghi nhận"],
  ["Nhà cung cấp", "/nha-cung-cap", "NHA_CUNG_CAP_VIEW", "Mã NCC"],
  [
    "Nhu cầu nguyên liệu",
    "/nhu-cau-nguyen-lieu",
    "NHU_CAU_NGUYEN_LIEU_VIEW",
    "",
  ],
  [
    "Đề xuất nhập hàng",
    "/de-xuat-nhap-hang",
    "DE_XUAT_NHAP_HANG_VIEW",
    "Mã đề xuất",
  ],
  ["Đơn mua nguyên liệu", "/don-mua-nguyen-lieu", "DON_MUA_VIEW", "Mã đơn"],
];
for (const [account, permissions, role] of [
  ["MH01", buyer, "NHAN_VIEN_MUA_HANG"],
  ["QLMH", manager, "QUAN_LY_MUA_HANG"],
] as const) {
  test(
    account + " login exposes seven authorized purchase routes and actions",
    async ({ page }) => {
      const state = await setup(page, [...permissions], role, false);
      await page.goto("/");
      await page.getByLabel("Tên đăng nhập", { exact: true }).fill(account);
      await page
        .getByLabel("Mật khẩu", { exact: true })
        .fill("test-only-password");
      await page
        .getByRole("button", { name: "ĐĂNG NHẬP", exact: true })
        .click();
      for (const [label, route, permission, column] of purchaseMenuCases) {
        await page
          .locator(".dashboard-sidebar")
          .getByRole("button", { name: label, exact: true })
          .click();
        await expect(page).toHaveURL(new RegExp("#" + route + "$"));
        if (column)
          await expect(
            page.getByRole("columnheader", { name: column, exact: true }),
          ).toBeVisible();
        else {
          await page.getByLabel("Lần dự báo").selectOption("LSDB01");
          await page
            .getByRole("button", { name: "Xem nhu cầu", exact: true })
            .click();
          await expect(
            page.getByRole("cell").filter({ hasText: "Arabica" }),
          ).toBeVisible();
        }
        expect(state.permissions).toContain(permission);
      }
      await page.goto("/#/de-xuat-nhap-hang/DX01");
      await expect(
        page.getByRole("heading", { name: "DX01", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Duyệt đề xuất", exact: true }),
      ).toHaveCount(account === "QLMH" ? 1 : 0);
      await expect(
        page.getByRole("button", { name: "Từ chối", exact: true }),
      ).toHaveCount(account === "QLMH" ? 1 : 0);
      await page.goto("/#/don-mua-nguyen-lieu/DM01");
      await expect(
        page.getByRole("heading", { name: "DM01", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Duyệt đơn mua", exact: true }),
      ).toHaveCount(account === "QLMH" ? 1 : 0);
      state.order.trang_thai = "DA_DUYET";
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "DM01", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Nhận hàng", exact: true }),
      ).toHaveCount(account === "MH01" ? 1 : 0);
      expect(state.errors).toEqual([]);
    },
  );
}
test("new full route names reject direct access without VIEW permissions", async ({
  page,
}) => {
  const state = await setup(page, [], "ADMIN");
  for (const [label, route] of purchaseMenuCases) {
    await page.goto("/#" + route);
    await expect(
      page.getByText("Bạn chưa có quyền truy cập màn hình này", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page
        .locator(".dashboard-sidebar")
        .getByRole("button", { name: label, exact: true }),
    ).toHaveCount(0);
  }
  expect(state.requests.filter((r) => r.path !== "/auth/me")).toEqual([]);
});

test("sidebar groups collapse and reopen on detail navigation and refresh", async ({
  page,
}) => {
  await setup(page, buyer);
  await page.goto("/#/nguyen-lieu");
  for (const label of ["Nguyên liệu", "Nhà cung cấp", "Mua hàng"])
    await expect(
      page.getByRole("button", { name: "Module " + label, exact: true }),
    ).toBeVisible();
  const toggle = page.getByRole("button", {
    name: "Module Mua hàng",
    exact: true,
  });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("group", { name: "Mua hàng", exact: true }),
  ).toBeHidden();
  await page.goto("/#/de-xuat-nhap-hang/DX01");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "Đề xuất nhập hàng", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("button", { name: "Đề xuất nhập hàng", exact: true }),
  ).toHaveClass(/active/);
});
test("sidebar modules only contain permitted children and disappear on revocation", async ({
  page,
}) => {
  const state = await setup(page, ["DON_MUA_VIEW"], "CUSTOM_ROLE");
  await page.goto("/#/don-mua-nguyen-lieu");
  await expect(
    page.getByRole("button", { name: "Module Mua hàng", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Module Nguyên liệu", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Module Nhà cung cấp", exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "Mua hàng", exact: true })
      .getByRole("button"),
  ).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Nhu cầu nguyên liệu", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Đề xuất nhập hàng", exact: true }),
  ).toHaveCount(0);
  state.permissions = [];
  await page
    .getByRole("button", { name: "Làm mới quyền", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Module Mua hàng", exact: true }),
  ).toHaveCount(0);
});

test("configuration opens overview then reason management with existing permissions", async ({
  page,
}) => {
  const state = await setup(
    page,
    [
      "VIEW_REASON_CONFIG",
      "CREATE_REASON_CONFIG",
      "UPDATE_REASON_CONFIG",
      "CHANGE_REASON_CONFIG_STATUS",
    ],
    "CUSTOM_ROLE",
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Cấu hình", exact: true }).click();
  await expect(page).toHaveURL(/#\/cau-hinh$/);
  await expect(page.getByRole("heading", { name: "Cấu hình", exact: true })).toBeVisible();
  await expect(page.locator(".settings-card")).toHaveCount(1);
  expect(state.requests.filter((r) => r.path === "/ly-do")).toEqual([]);
  await expect(page.getByRole("link", { name: /Người dùng/ })).toHaveCount(0);
  await page.locator('.settings-card[href="#/cau-hinh/quan-ly-ly-do"]').click();
  await expect(page).toHaveURL(/#\/cau-hinh\/quan-ly-ly-do$/);
  await expect(page.getByRole("heading", { name: "Quản lý lý do", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "+ Thêm lý do", exact: true }).click();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Vui lòng nhập lý do");
  await page.getByLabel("Tên lý do *", { exact: true }).fill("Chất lượng test");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Vui lòng chọn chức năng",
  );
  await page.getByLabel("Chọn tất cả", { exact: true }).check();
  await page.getByLabel("Đổi trạng thái công thức", { exact: true }).uncheck();
  await expect(
    page.getByLabel("Chọn tất cả", { exact: true }),
  ).not.toBeChecked();
  await page.getByLabel("Chọn tất cả", { exact: true }).check();
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "Chất lượng test" });
  await row.getByRole("button", { name: "Sửa", exact: true }).click();
  await page.getByLabel("Tên lý do *", { exact: true }).fill("Chất lượng đã sửa");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("row")
    .filter({ hasText: "Chất lượng đã sửa" })
    .getByRole("button", { name: "Ngừng sử dụng", exact: true })
    .click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(state.reasons.find((r) => r.id === "LDNEW")?.trang_thai).toBe(
    "NGUNG_SU_DUNG",
  );
  await page.getByLabel("Tìm kiếm", { exact: true }).fill("đã sửa");
  await expect(
    page.getByRole("cell", { name: "Chất lượng đã sửa", exact: true }),
  ).toBeVisible();
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Cấu hình", exact: true }).click();
  await expect(page).toHaveURL(/#\/cau-hinh$/);
  await expect(page.locator(".settings-card")).toHaveCount(1);
  expect(state.errors).toEqual([]);
});
test("status changes require an applicable reason and Other notes", async ({
  page,
}) => {
  const state = await setup(page);
  await page.goto("/#/nguyen-lieu");
  await page
    .getByRole("button", { name: "Đổi trạng thái", exact: true })
    .click();
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Vui lòng chọn lý do");
  await page.getByLabel("Lý do *", { exact: true }).selectOption("LDOTHER");
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Vui lòng nhập ghi chú");
  await page
    .getByLabel("Ghi chú *", { exact: true })
    .fill("Đổi theo yêu cầu test");
  await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    state.requests.find(
      (r) => r.method === "PATCH" && r.path === "/nguyen-lieu/NL01/trang-thai",
    )?.body,
  ).toEqual({
    trang_thai: "NGUNG_SU_DUNG",
    ly_do_id: "LDOTHER",
    ghi_chu: "Đổi theo yêu cầu test",
  });
});
test("unauthorized configuration URLs and cards are blocked", async ({
  page,
}) => {
  await setup(page, ["IMPORT_DON_HANG"], "ADMIN");
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Cấu hình", exact: true }),
  ).toHaveCount(0);
  for (const path of [
    "/cau-hinh",
    "/cau-hinh/quan-ly-ly-do",
    "/cau-hinh/nhat-ky",
    "/cau-hinh/nguoi-dung",
    "/cau-hinh/vai-tro",
  ]) {
    await page.goto("/#" + path);
    await expect(
      page.getByText("Bạn chưa có quyền truy cập màn hình này", {
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("settings overview contains reason and audit cards and reason list retains view permissions", async ({ page }) => {
  await setup(page, ["VIEW_REASON_CONFIG", "USER_VIEW", "ROLE_VIEW", "VIEW_AUDIT_LOG", "VIEW_SETTING"], "CUSTOM_ROLE");
  await page.goto("/#/cau-hinh");
  await expect(page.locator(".settings-card")).toHaveCount(2);
  await expect(page.locator(".settings-card").getByRole("heading", { name: "Quản lý lý do", exact: true })).toBeVisible();
  await expect(page.locator(".settings-card").getByRole("heading", { name: "Nhật ký hoạt động", exact: true })).toBeVisible();
  for (const title of ["Người dùng", "Vai trò & phân quyền", "Cấu hình chung"]) {
    await expect(page.locator(".settings-card").filter({ has: page.getByRole("heading", { name: title, exact: true }) })).toHaveCount(0);
  }
  for (const path of ["/cau-hinh/quan-ly-ly-do"]) {
    await page.goto("/#" + path);
    await expect(page.getByRole("heading", { name: "Quản lý lý do", exact: true })).toBeVisible();
    await expect(page.locator(".settings-card")).toHaveCount(0);
    for (const name of ["Người dùng", "Vai trò & phân quyền", "Nhật ký hoạt động", "Cấu hình chung"]) {
      await expect(page.getByRole("link", { name, exact: true })).toHaveCount(0);
    }
    await expect(page.getByRole("columnheader")).toHaveText(["Mã lý do", "Tên lý do", "Nhóm áp dụng", "Trạng thái", "Thao tác"]);
    await expect(page.getByRole("cell", { name: "LD1", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Thêm lý do", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Sửa", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Ngừng sử dụng", exact: true })).toHaveCount(0);
  }
});

test("administrative permissions alone do not grant reason configuration access", async ({ page }) => {
  await setup(page, ["USER_VIEW", "ROLE_VIEW", "VIEW_AUDIT_LOG", "VIEW_SETTING"], "ADMIN");
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Cấu hình", exact: true })).toBeVisible();
  await page.goto("/#/cau-hinh");
  await expect(page.locator(".settings-card")).toHaveCount(1);
  await expect(page.locator('.settings-card[href="#/cau-hinh/quan-ly-ly-do"]')).toHaveCount(0);
  await page.goto("/#/cau-hinh/quan-ly-ly-do");
  await expect(page.getByText("Bạn chưa có quyền truy cập màn hình này", { exact: true })).toBeVisible();
  await page.goto("/#/cau-hinh/vai-tro");
  await expect(page.getByRole("heading", { name: "Vai trò & phân quyền", exact: true })).toBeVisible();
});

test("activity audit filters, compares changes, paginates and returns to settings", async ({ page }) => {
  await setup(page, ["VIEW_AUDIT_LOG"], "CUSTOM_ROLE");
  const requests: URL[] = [];
  await page.route("**/api/nhat-ky-hoat-dong*", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const secondPage = url.searchParams.get("page") === "2";
    await route.fulfill({ json: {
      total: 11,
      actors: [{ ma_nguoi_dung: "CUSTOM01", ho_ten: "Nguyễn Minh Anh" }],
      items: [{
        ma_nhat_ky: secondPage ? "NK_OLD" : "NK_NEW", thoi_gian: "2026-10-12T03:00:00Z",
        ma_nguoi_dung: "CUSTOM01", ho_ten: "Nguyễn Minh Anh", module: "Nguyên liệu",
        chuc_nang: "Nguyên liệu", hanh_dong: "CHINH_SUA", ma_doi_tuong: "NL01", ket_qua: "THANH_CONG",
        du_lieu_truoc: { ten_nguyen_lieu: "Arabica", don_vi_do_luong: "kg" },
        du_lieu_sau: { ten_nguyen_lieu: "Arabica mới", don_vi_do_luong: "kg" }, mo_ta: "{}",
      }],
    } });
  });
  await page.goto("/#/cau-hinh");
  await expect(page.locator(".settings-card")).toHaveCount(1);
  await page.locator('.settings-card[href="#/cau-hinh/nhat-ky"]').click();
  await expect(page).toHaveURL(/#\/cau-hinh\/nhat-ky$/);
  await expect(page.getByRole("cell", { name: "NK_NEW", exact: true })).toBeVisible();
  await page.getByLabel("Tìm kiếm", { exact: true }).fill("NL01");
  await page.getByLabel("Module", { exact: true }).selectOption("Nguyên liệu");
  await page.getByLabel("Hành động", { exact: true }).selectOption("CHINH_SUA");
  await page.getByLabel("Người thao tác", { exact: true }).selectOption("CUSTOM01");
  await page.getByLabel("Từ ngày", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Đến ngày", { exact: true }).fill("2026-10-12");
  await expect.poll(() => requests.at(-1)?.searchParams.get("den_ngay")).toBe("2026-10-12");
  const params = requests.at(-1)!.searchParams;
  for (const [key, value] of Object.entries({ search: "NL01", module: "Nguyên liệu", hanh_dong: "CHINH_SUA", nguoi_thao_tac: "CUSTOM01", tu_ngay: "2026-10-01" })) {
    expect(params.get(key)).toBe(value);
  }
  await page.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("cell", { name: "Tên nguyên liệu", exact: true })).toBeVisible();
  await expect(dialog.getByRole("cell", { name: "Arabica", exact: true })).toBeVisible();
  await expect(dialog.getByRole("cell", { name: "Arabica mới", exact: true })).toBeVisible();
  await expect(dialog.getByRole("cell", { name: "Đơn vị đo lường", exact: true })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Sửa", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Đóng", exact: true }).last().click();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.getByRole("cell", { name: "NK_OLD", exact: true })).toBeVisible();
  await page.getByLabel("Module", { exact: true }).selectOption("Mua hàng");
  await expect(page.getByRole("cell", { name: "NK_NEW", exact: true })).toBeVisible();
  expect(requests.at(-1)?.searchParams.get("page")).toBe("1");
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Cấu hình", exact: true }).click();
  await expect(page).toHaveURL(/#\/cau-hinh$/);
});

for (const entry of [
  { path: "/nguyen-lieu", entity: "nguyen-lieu", code: "NL01" },
  { path: "/nha-cung-cap", entity: "nha-cung-cap", code: "NCC01" },
  { path: "/don-mua", entity: "don-mua-nguyen-lieu", code: "DM01" },
  { path: "/de-xuat", entity: "de-xuat-nhap-hang", code: "DX01" },
  { path: "/don-mua/DM01", entity: "don-mua-nguyen-lieu", code: "DM01" },
  { path: "/de-xuat/DX01", entity: "de-xuat-nhap-hang", code: "DX01" },
  { path: "/cong-thuc", entity: "cong-thuc", code: "CT01" },
  { path: "/ton-kho", entity: "ton-kho-nguyen-lieu", code: "NL01/2026-10-01" },
  { path: "/nha-cung-cap/cung-ung", entity: "nguyen-lieu-nha-cung-cap", code: "MAP01" },
]) {
  test(`record history opens in module ${entry.path} without aggregate audit permission`, async ({ page }) => {
    const state = await setup(page);
    const historyRequests: { path: string; method: string }[] = [];
    await page.route("**/api/nhat-ky-hoat-dong/doi-tuong/**", async (route) => {
      historyRequests.push({ path: decodeURIComponent(new URL(route.request().url()).pathname), method: route.request().method() });
      await route.fulfill({ json: {
        total: 1, actors: [{ ma_nguoi_dung: "CUSTOM01", ho_ten: "Nguyễn Minh Anh" }],
        items: [{ ma_nhat_ky: "NK_RECORD", thoi_gian: "2026-10-12T03:00:00Z",
          ma_nguoi_dung: "CUSTOM01", ho_ten: "Nguyễn Minh Anh", module: "Mua hàng", chuc_nang: "Nghiệp vụ",
          hanh_dong: "CHINH_SUA", ma_doi_tuong: entry.code, ket_qua: "THANH_CONG",
          du_lieu_truoc: { ghi_chu: "Ghi chú cũ" }, du_lieu_sau: { ghi_chu: "Ghi chú mới" }, mo_ta: "{}" }],
      } });
    });
    await page.goto("/#" + entry.path);
    await expect(page.getByRole("button", { name: "Lịch sử thay đổi", exact: true })).toBeVisible();
    expect(historyRequests).toHaveLength(0);
    await page.getByRole("button", { name: "Lịch sử thay đổi", exact: true }).click();
    const history = page.getByRole("dialog", { name: `Lịch sử thay đổi · ${entry.code}`, exact: true });
    await expect(history.getByRole("cell", { name: "NK_RECORD", exact: true })).toBeVisible();
    expect(historyRequests[0].path).toBe(`/api/nhat-ky-hoat-dong/doi-tuong/${entry.entity}/${entry.code}`);
    await history.getByRole("button", { name: "Xem chi tiết", exact: true }).click();
    const detail = page.getByRole("dialog", { name: "Chi tiết nhật ký hoạt động", exact: true });
    await expect(detail.getByRole("cell", { name: "Ghi chú cũ", exact: true })).toBeVisible();
    await expect(detail.getByRole("cell", { name: "Ghi chú mới", exact: true })).toBeVisible();
    await detail.getByRole("button", { name: "Đóng", exact: true }).last().click();
    await history.getByRole("button", { name: "Đóng lịch sử", exact: true }).click();
    await expect(history).not.toBeVisible();
    expect(new URL(page.url()).hash).toBe("#" + entry.path);
    expect(historyRequests.every((r) => r.method === "GET")).toBeTruthy();
    expect(state.requests.every((r) => r.method === "GET")).toBeTruthy();
  });
}
