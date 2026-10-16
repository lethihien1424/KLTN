/// frontend/src/pages/san-pham/SanPhamPage.tsx
/// frontend/src/pages/san-pham/SanPhamPage.tsx
/// frontend/src/pages/san-pham/SanPhamPage.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import {
  useDashboardPermissions,
} from "../../components/dashboard/DashboardBase";

import {
  createProduct,
  deleteProduct,
  downloadProductTemplate,
  getProduct,
  getProductGroups,
  getProducts,
  importProducts,
  updateProduct,
  type Product,
  type ProductInput,
  type ProductStatus,
} from "../../services/sanPhamService";

// SanPham.css được tải trong index.html từ thư mục public.

const GROUP_NAMES: Record<string, string> = {
  CA_PHE_BOT_TRUYEN_THONG: "Cà phê bột truyền thống",
  CA_PHE_BOT_HUONG_VI: "Cà phê bột hương vị",
  CA_PHE_HAT: "Cà phê hạt",
  CA_PHE_BOT: "Cà phê bột",
};

const PAGE_SIZE = 7;

type ProductForm = {
  name: string;
  weight: string;
  group: string;
  status: ProductStatus;
  price: string;
};

type ModalState = {
  mode: "create" | "edit" | "view";
  product: Product | null;
};

function initialForm(): ProductForm {
  return {
    name: "",
    weight: "",
    group: "",
    status: "DANG_KINH_DOANH",
    price: "",
  };
}

function money(value: string | number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function grams(product: Product): number {
  return Math.round(
    Number(product.khoi_luong) *
      (product.don_vi_do_luong.toLowerCase() === "kg" ? 1000 : 1),
  );
}

function groupName(value: string | null): string {
  return value ? GROUP_NAMES[value] || value : "Chưa phân nhóm";
}

function statusName(value: ProductStatus): string {
  return value === "DANG_KINH_DOANH"
    ? "Đang kinh doanh"
    : "Ngưng kinh doanh";
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Không thể thực hiện thao tác.";
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function matchesSearch(product: Product, search: string): boolean {
  const keyword = normalize(search);

  if (!keyword) return true;

  const values = [
    product.ma_san_pham,
    product.ten_san_pham,
    product.nhom_san_pham || "",
    groupName(product.nhom_san_pham),
    String(grams(product)),
    `${money(grams(product))} g`,
    String(product.don_gia),
    money(product.don_gia),
    product.don_vi_tien_te,
    product.trang_thai,
    statusName(product.trang_thai),
  ];

  if (values.some(value => normalize(value).includes(keyword))) {
    return true;
  }

  const compact = keyword.replace(/[,\s]/g, "");

  return /^\d+(?:\.\d+)?$/.test(compact) &&
    [
      String(product.don_gia),
      String(Number(product.don_gia)),
      String(grams(product)),
    ].some(value => value.replace(/[,\s]/g, "").includes(compact));
}

function priceInput(raw: string): string | null {
  const value = raw.replace(/,/g, "");

  if (!/^\d*(\.\d{0,2})?$/.test(value)) return null;

  const [whole, fraction] = value.split(".");
  const formatted = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return fraction === undefined
    ? formatted
    : `${formatted}.${fraction}`;
}

async function loadAllProducts(
  signal: AbortSignal,
): Promise<Product[]> {
  const products: Product[] = [];
  const seen = new Set<string>();
  let page = 1;
  let expectedTotal: number | null = null;

  while (true) {
    const result = await getProducts(
      { search: "", nhom: "", trang_thai: "" },
      page,
      100,
      signal,
    );

    if (signal.aborted) {
      throw new DOMException("Đã hủy tải dữ liệu.", "AbortError");
    }

    if (expectedTotal === null) {
      expectedTotal = result.total;
    } else if (result.total !== expectedTotal) {
      throw new Error(
        "Danh sách sản phẩm vừa thay đổi. Vui lòng tải lại.",
      );
    }

    if (!result.items.length) {
      if (products.length < expectedTotal) {
        throw new Error(
          "Chưa tải đủ danh sách sản phẩm. Vui lòng tải lại.",
        );
      }
      break;
    }

    for (const product of result.items) {
      if (seen.has(product.ma_san_pham)) {
        throw new Error(
          "Danh sách thay đổi trong lúc tải. Vui lòng tải lại.",
        );
      }

      seen.add(product.ma_san_pham);
      products.push(product);
    }

    if (products.length >= expectedTotal) break;
    page += 1;
  }

  return products;
}

async function exportVisibleProducts(
  products: Product[],
): Promise<void> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const importSheet = workbook.addWorksheet("SanPham");
  const reportSheet = workbook.addWorksheet("DanhSach");

  importSheet.addRow([
    "ten_san_pham",
    "khoi_luong",
    "don_vi_do_luong",
    "nhom_san_pham",
    "trang_thai",
    "don_gia",
    "don_vi_tien_te",
  ]);

  reportSheet.addRow([
    "Mã sản phẩm",
    "Tên sản phẩm",
    "Nhóm sản phẩm",
    "Khối lượng (g)",
    "Đơn giá",
    "Đơn vị tiền tệ",
    "Trạng thái",
    "Thời gian tạo",
    "Thời gian cập nhật",
  ]);

  for (const product of products) {
    const weightKg =
      product.don_vi_do_luong.toLowerCase() === "kg"
        ? Number(product.khoi_luong)
        : Number(product.khoi_luong) / 1000;

    importSheet.addRow([
      product.ten_san_pham,
      weightKg,
      "kg",
      product.nhom_san_pham || "",
      product.trang_thai,
      Number(product.don_gia),
      product.don_vi_tien_te || "VND",
    ]);

    reportSheet.addRow([
      product.ma_san_pham,
      product.ten_san_pham,
      groupName(product.nhom_san_pham),
      grams(product),
      Number(product.don_gia),
      product.don_vi_tien_te || "VND",
      statusName(product.trang_thai),
      product.thoi_gian_tao,
      product.thoi_gian_cap_nhat,
    ]);
  }

  for (const sheet of [importSheet, reportSheet]) {
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columnCount },
    };

    sheet.columns.forEach(column => {
      column.width = 24;
    });

    sheet.getRow(1).height = 32;
    sheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2563EB" },
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
    });
  }

  importSheet.getColumn(1).width = 45;
  importSheet.getColumn(2).numFmt = "0.000";
  importSheet.getColumn(6).numFmt = "#,##0.##";

  reportSheet.getColumn(2).width = 45;
  reportSheet.getColumn(3).width = 30;
  reportSheet.getColumn(4).numFmt = "#,##0";
  reportSheet.getColumn(5).numFmt = "#,##0.##";

  const buffer = await workbook.xlsx.writeBuffer();
  const source = new Uint8Array(buffer as unknown as ArrayBuffer);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);

  const url = URL.createObjectURL(new Blob([copy.buffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));

  const link = document.createElement("a");
  link.href = url;
  link.download = "SanPham_Milano.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function SanPhamPage() {
  const {
    can,
    loading: permissionLoading,
  } = useDashboardPermissions();

  const canView = can("san_pham", "XEM");
  const canDelete = can("san_pham", "XOA");

  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [modal, setModal] = useState<ModalState | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [formError, setFormError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const dialog = useRef<HTMLDialogElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const operation = useRef(false);

  const availableGroups = useMemo(() => Array.from(new Set([
    ...groups,
    ...products
      .map(product => product.nhom_san_pham)
      .filter((value): value is string => Boolean(value)),
  ])).sort((a, b) => a.localeCompare(b, "vi")), [groups, products]);

  const filteredProducts = useMemo(() => products.filter(product => {
    if (group && product.nhom_san_pham !== group) return false;
    if (status && product.trang_thai !== status) return false;
    return matchesSearch(product, search);
  }), [products, search, group, status]);

  const total = filteredProducts.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const items = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (!canView || permissionLoading) {
      setProducts([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setProducts([]);
    setError("");

    loadAllProducts(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setProducts(result);
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setProducts([]);
          setError(errorMessage(cause));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [canView, permissionLoading, version]);

  useEffect(() => {
    if (!canView || permissionLoading) {
      setGroups([]);
      return;
    }

    const controller = new AbortController();

    getProductGroups(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setGroups(result);
      })
      .catch(() => {
        // Vẫn lấy nhóm từ danh sách sản phẩm.
      });

    return () => controller.abort();
  }, [canView, permissionLoading, version]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  useEffect(() => {
    if (modal && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [modal]);

  useEffect(() => {
    if (
      deleteTarget &&
      deleteDialog.current &&
      !deleteDialog.current.open
    ) {
      deleteDialog.current.showModal();
    }
  }, [deleteTarget]);

  useEffect(() => {
    if (permissionLoading) return;

    if (
      modal &&
      (
        !canView ||
        (modal.mode === "edit" && !can("san_pham", "SUA")) ||
        (modal.mode === "create" && !can("san_pham", "THEM"))
      )
    ) {
      setModal(null);
    }

    if (!canView || !canDelete) setDeleteTarget(null);
  }, [permissionLoading, canView, canDelete, can, modal]);

  function closeModal(): void {
    if (!operation.current) setModal(null);
  }

  function closeDelete(): void {
    if (!operation.current) {
      setDeleteTarget(null);
      setDeleteError("");
    }
  }

  function refresh(text: string): void {
    setNotice(text);
    setVersion(value => value + 1);
  }

  async function run(
    action: string,
    work: () => Promise<void>,
  ): Promise<void> {
    if (operation.current) return;

    if (!can("san_pham", action)) {
      setError("Bạn chưa được cấp quyền thực hiện thao tác này.");
      return;
    }

    operation.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      await work();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function openProduct(
    product: Product,
    mode: "view" | "edit",
  ): Promise<void> {
    await run(mode === "view" ? "XEM" : "SUA", async () => {
      const current = await getProduct(product.ma_san_pham);

      setForm({
        name: current.ten_san_pham,
        weight: String(grams(current)),
        group: current.nhom_san_pham || "",
        status: current.trang_thai,
        price: money(current.don_gia),
      });

      setFormError("");
      setModal({ mode, product: current });
    });
  }

  async function confirmDelete(): Promise<void> {
    if (!deleteTarget || operation.current) return;

    if (!can("san_pham", "XOA")) {
      setDeleteError("Bạn chưa được cấp quyền xóa sản phẩm.");
      return;
    }

    const target = deleteTarget;
    operation.current = true;
    setBusy(true);
    setDeleteError("");
    setError("");
    setNotice("");

    try {
      await deleteProduct(target.ma_san_pham);
      setDeleteTarget(null);
      refresh(`Đã xóa sản phẩm ${target.ma_san_pham}.`);
    } catch (cause) {
      // Giữ hộp thoại mở và hiển thị lỗi ngay tại đây.
      setDeleteError(errorMessage(cause));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!modal || modal.mode === "view" || operation.current) return;

    const action = modal.mode === "create" ? "THEM" : "SUA";

    if (!can("san_pham", action)) {
      setFormError("Bạn chưa được cấp quyền lưu sản phẩm.");
      return;
    }

    const weight = Number(form.weight);
    const rawPrice = form.price.replace(/,/g, "");

    if (!form.name.trim()) {
      setFormError("Vui lòng nhập tên sản phẩm.");
      return;
    }

    if (
      !Number.isSafeInteger(weight) ||
      weight <= 0 ||
      weight > 9999999999
    ) {
      setFormError(
        "Khối lượng phải là số gam nguyên từ 1 đến 9,999,999,999.",
      );
      return;
    }

    if (
      !/^\d+(\.\d{1,2})?$/.test(rawPrice) ||
      Number(rawPrice) > 9999999999999.99
    ) {
      setFormError(
        "Vui lòng nhập đơn giá hợp lệ, tối đa 2 chữ số thập phân.",
      );
      return;
    }

    if (modal.mode === "edit" && !modal.product) {
      setFormError("Không tìm thấy sản phẩm cần sửa.");
      return;
    }

    const input: ProductInput = {
      ten_san_pham: form.name.trim(),
      khoi_luong: String(weight / 1000),
      don_vi_do_luong: "kg",
      nhom_san_pham: form.group.trim() || null,
      trang_thai: form.status,
      don_gia: rawPrice,
      don_vi_tien_te: "VND",
    };

    operation.current = true;
    setBusy(true);
    setFormError("");
    setError("");

    try {
      const result = modal.mode === "create"
        ? await createProduct(input)
        : await updateProduct(modal.product!.ma_san_pham, input);

      setModal(null);
      refresh(`Đã lưu sản phẩm ${result.ma_san_pham}.`);
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  async function upload(file: File): Promise<void> {
    await run("NHAP_FILE", async () => {
      if (!/\.(xlsx|csv)$/i.test(file.name)) {
        throw new Error("Chỉ chấp nhận file .xlsx hoặc .csv.");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Dung lượng file tối đa 10 MB.");
      }

      const result = await importProducts(file);

      if (!result.success) {
        throw new Error(result.message || "Nhập sản phẩm thất bại.");
      }

      refresh(result.message);
      setPage(1);
    });
  }

  const isView = modal?.mode === "view";

  const countAll = products.length;
  const countActive = products.filter(p => p.trang_thai === "DANG_KINH_DOANH").length;
  const countInactive = products.filter(p => p.trang_thai === "NGUNG_BAN").length;
  const countGroups = availableGroups.length;

  if (permissionLoading) {
    return <p role="status">Đang tải quyền truy cập...</p>;
  }

  if (!canView) {
    return <p role="alert">Bạn chưa được cấp quyền xem sản phẩm.</p>;
  }

  return (
    <section className="sp-page">
      {/* Một thẻ lớn: header sát mép trên -> tabs -> nội dung */}
      <div className="sp-card-wrapper">
        {/* Header với icon xanh */}
        <div className="sp-page-header">
          <div className="sp-header-icon" aria-hidden="true">
            <ShoppingOutlined />
          </div>
          <div className="sp-header-text">
            <h2>Quản lý sản phẩm</h2>
            <p>Quản lý mã sản phẩm, nhóm hàng, khối lượng, đơn giá và trạng thái kinh doanh.</p>
          </div>
        </div>

        {/* Tabs lọc trạng thái */}
        <div className="sp-tabs" role="tablist" aria-label="Bộ lọc trạng thái kinh doanh">
          <button
            type="button"
            role="tab"
            aria-selected={status === ""}
            className={`sp-tab ${status === "" ? "is-active" : ""}`}
            onClick={() => {
              setStatus("");
              setPage(1);
            }}
          >
            Tất cả
            <span className="sp-tab-badge">{countAll}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={status === "DANG_KINH_DOANH"}
            className={`sp-tab ${status === "DANG_KINH_DOANH" ? "is-active" : ""}`}
            onClick={() => {
              setStatus("DANG_KINH_DOANH");
              setPage(1);
            }}
          >
            Đang kinh doanh
            <span className="sp-tab-badge">{countActive}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={status === "NGUNG_BAN"}
            className={`sp-tab ${status === "NGUNG_BAN" ? "is-active" : ""}`}
            onClick={() => {
              setStatus("NGUNG_BAN");
              setPage(1);
            }}
          >
            Ngừng kinh doanh
            <span className="sp-tab-badge">{countInactive}</span>
          </button>
        </div>

        <div className="sp-card-body">
          {/* 4 Thẻ thống kê */}
          <div className="sp-stats-grid">
            <div className="sp-stat-card">
              <span className="sp-stat-title">Tổng sản phẩm</span>
              <strong className="sp-stat-value blue">{countAll}</strong>
              <span className="sp-stat-desc">Sản phẩm đã lưu trong hệ thống</span>
            </div>

            <div className="sp-stat-card">
              <span className="sp-stat-title">Đang kinh doanh</span>
              <strong className="sp-stat-value green">{countActive}</strong>
              <span className="sp-stat-desc">Được phép đưa vào dự báo</span>
            </div>

            <div className="sp-stat-card">
              <span className="sp-stat-title">Ngừng kinh doanh</span>
              <strong className="sp-stat-value orange">{countInactive}</strong>
              <span className="sp-stat-desc">Tạm ẩn khỏi dự báo</span>
            </div>

            <div className="sp-stat-card">
              <span className="sp-stat-title">Nhóm sản phẩm</span>
              <strong className="sp-stat-value purple">{countGroups}</strong>
              <span className="sp-stat-desc">Nhóm hàng đang sử dụng</span>
            </div>
          </div>

          {/* Thông báo nếu có */}
          {(notice || error) && (
            <div className="sp-toast-wrap">
              <div
                className={`sp-toast ${error ? "sp-toast-error" : "sp-toast-success"}`}
                role={error ? "alert" : "status"}
              >
                <span className="sp-toast-icon" aria-hidden="true">
                  {error ? "!" : "✓"}
                </span>

                <div className="sp-toast-content">
                  <strong>{error ? "Thao tác chưa hoàn tất" : "Thao tác thành công"}</strong>
                  <p>{error || notice}</p>
                </div>

                <button
                  type="button"
                  className="sp-toast-close"
                  aria-label="Đóng thông báo"
                  onClick={() => {
                    setNotice("");
                    setError("");
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Danh sách sản phẩm Section Header */}
          <div className="sp-section-head">
            <div className="sp-section-head-left">
              <h3>Danh sách sản phẩm</h3>
              <p>Nhấn vào biểu tượng ở cột thao tác để xem, sửa hoặc xóa.</p>
            </div>

            <div className="sp-toolbar">
              {can("san_pham", "NHAP_FILE") && (
                <>
                  <button
                    type="button"
                    className="sp-btn-secondary"
                    disabled={busy}
                    onClick={() =>
                      void run("NHAP_FILE", downloadProductTemplate)
                    }
                  >
                    <DownloadOutlined /> Tải template
                  </button>

                  <button
                    type="button"
                    className="sp-btn-secondary"
                    disabled={busy || loading}
                    onClick={() => fileInput.current?.click()}
                  >
                    <UploadOutlined /> Nhập Excel
                  </button>

                  <input
                    ref={fileInput}
                    type="file"
                    accept=".xlsx,.csv"
                    hidden
                    onChange={event => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (file) void upload(file);
                    }}
                  />
                </>
              )}

              {can("san_pham", "XUAT_EXCEL") && (
                <button
                  type="button"
                  className="sp-btn-secondary"
                  disabled={busy || loading || !filteredProducts.length}
                  onClick={() => void run("XUAT_EXCEL", async () => {
                    if (!filteredProducts.length) {
                      throw new Error("Không có sản phẩm phù hợp để xuất.");
                    }

                    await exportVisibleProducts(filteredProducts);
                    setNotice(`Đã xuất ${filteredProducts.length} sản phẩm.`);
                  })}
                >
                  <DownloadOutlined /> Xuất Excel
                </button>
              )}

              {can("san_pham", "THEM") && (
                <button
                  type="button"
                  className="sp-btn-primary"
                  disabled={busy || loading}
                  onClick={() => {
                    setForm(initialForm());
                    setFormError("");
                    setModal({ mode: "create", product: null });
                  }}
                >
                  <PlusOutlined /> Thêm sản phẩm
                </button>
              )}
            </div>
          </div>

          {/* Bộ lọc và Tìm kiếm */}
          <div className="sp-filter-row">
            <div className="sp-search-box">
              <SearchOutlined className="sp-search-icon" />
              <input
                type="search"
                maxLength={150}
                placeholder="Tìm mã, tên, khối lượng, đơn giá..."
                aria-label="Tìm kiếm sản phẩm"
                value={search}
                onChange={event => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>

            <select
              className="sp-select"
              aria-label="Lọc nhóm sản phẩm"
              value={group}
              onChange={event => {
                setGroup(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Tất cả nhóm</option>
              {availableGroups.map(item => (
                <option key={item} value={item}>{groupName(item)}</option>
              ))}
            </select>

            <button
              type="button"
              className="sp-btn-reload"
              title="Tải lại sản phẩm"
              aria-label="Tải lại sản phẩm"
              disabled={loading || busy}
              onClick={() => setVersion(value => value + 1)}
            >
              <ReloadOutlined spin={loading} />
            </button>
          </div>

          {/* Bảng Dữ Liệu */}
          <div className="sp-table-container">
            <table className="sp-table" aria-label="Danh sách sản phẩm">
              <thead>
                <tr>
                  <th style={{ width: "25%" }}>Sản phẩm</th>
                  <th style={{ width: "23%" }}>Nhóm sản phẩm</th>
                  <th style={{ width: "11%", textAlign: "center" }}>Khối lượng</th>
                  <th style={{ width: "12%", textAlign: "center" }}>Đơn giá</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Đơn vị tiền tệ</th>
                  <th style={{ width: "11%" }}>Trạng thái</th>
                  <th style={{ width: "8%", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {!loading && items.map(product => (
                  <tr key={product.ma_san_pham}>
                    <td>
                      <div className="sp-product-info">
                        <strong className="sp-product-code">{product.ma_san_pham}</strong>
                        <span className="sp-product-name">{product.ten_san_pham}</span>
                      </div>
                    </td>

                    <td>
                      <span className="sp-group-badge">
                        {groupName(product.nhom_san_pham)}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span className="sp-weight-text">{money(grams(product))} g</span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <strong className="sp-price-text">{money(product.don_gia)}</strong>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span className="sp-currency-text">{product.don_vi_tien_te || "VND"}</span>
                    </td>

                    <td>
                      <span
                        className={`sp-status-badge ${
                          product.trang_thai === "DANG_KINH_DOANH" ? "active" : "inactive"
                        }`}
                      >
                        <span className="sp-dot" />
                        {statusName(product.trang_thai)}
                      </span>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <div className="sp-action-group">
                        <button
                          type="button"
                          className="sp-action-btn"
                          title="Xem sản phẩm"
                          aria-label={`Xem ${product.ma_san_pham}`}
                          disabled={busy}
                          onClick={() => void openProduct(product, "view")}
                        >
                          <EyeOutlined />
                        </button>

                        {can("san_pham", "SUA") && (
                          <button
                            type="button"
                            className="sp-action-btn"
                            title="Sửa sản phẩm"
                            aria-label={`Sửa ${product.ma_san_pham}`}
                            disabled={busy}
                            onClick={() =>
                              void openProduct(product, "edit")
                            }
                          >
                            <EditOutlined />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            className="sp-action-btn danger"
                            title="Xóa sản phẩm"
                            aria-label={`Xóa ${product.ma_san_pham}`}
                            disabled={busy}
                            onClick={() => {
                              setDeleteError("");
                              setDeleteTarget(product);
                            }}
                          >
                            <DeleteOutlined />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {(loading || items.length === 0) && (
                  <tr>
                    <td colSpan={7} className="sp-empty">
                      {loading
                        ? "Đang tải danh sách sản phẩm..."
                        : "Không có sản phẩm phù hợp."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          <footer className="sp-pagination">
            <span className="sp-pagination-text">
              {loading
                ? "Đang tải dữ liệu..."
                : total
                  ? `Hiển thị ${
                      (currentPage - 1) * PAGE_SIZE + 1
                    }–${
                      Math.min(currentPage * PAGE_SIZE, total)
                    } / ${total} sản phẩm`
                  : "0 sản phẩm"}
            </span>

            <div className="sp-page-nav">
              <button
                type="button"
                className="sp-page-btn"
                disabled={currentPage <= 1 || loading || busy}
                onClick={() => setPage(currentPage - 1)}
              >
                Trước
              </button>
              <span className="sp-page-info">
                Trang {currentPage} / {pageCount}
              </span>
              <button
                type="button"
                className="sp-page-btn"
                disabled={currentPage >= pageCount || loading || busy}
                onClick={() => setPage(currentPage + 1)}
              >
                Sau
              </button>
            </div>
          </footer>
        </div>
      </div>

      {modal && (
        <dialog
          ref={dialog}
          className="sp-dialog"
          aria-labelledby="sp-dialog-title"
          onCancel={event => {
            event.preventDefault();
            closeModal();
          }}
        >
          <form onSubmit={save} noValidate>
            <header className="sp-dialog-header">
              <div>
                <h2 id="sp-dialog-title">
                  {modal.mode === "create"
                    ? "Thêm sản phẩm"
                    : modal.mode === "edit"
                      ? "Chỉnh sửa sản phẩm"
                      : "Thông tin sản phẩm"}
                </h2>
                <p>
                  {modal.product?.ma_san_pham ||
                    "Mã sản phẩm được tạo tự động khi lưu."}
                </p>
              </div>

              <button
                type="button"
                aria-label="Đóng"
                disabled={busy}
                onClick={closeModal}
              >
                <CloseOutlined />
              </button>
            </header>

            <div className="sp-form-grid">
              <label className="sp-full">
                <span className="sp-label-text">
                  Tên sản phẩm
                  {!isView && <i aria-hidden="true">*</i>}
                </span>
                <input
                  autoFocus
                  required
                  maxLength={150}
                  disabled={busy}
                  readOnly={isView}
                  value={form.name}
                  onChange={event =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>

              <label>
                <span className="sp-label-text">
                  Khối lượng (g)
                  {!isView && <i aria-hidden="true">*</i>}
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={9999999999}
                  step={1}
                  disabled={busy}
                  readOnly={isView}
                  value={form.weight}
                  onChange={event =>
                    setForm({ ...form, weight: event.target.value })
                  }
                />
              </label>

              <label>
                <span className="sp-label-text">
                  Đơn giá
                  {!isView && <i aria-hidden="true">*</i>}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  disabled={busy}
                  readOnly={isView}
                  placeholder="125,000"
                  value={form.price}
                  onChange={event => {
                    const price = priceInput(event.target.value);
                    if (price !== null) setForm({ ...form, price });
                  }}
                />
              </label>

              <label>
                <span className="sp-label-text">Nhóm sản phẩm</span>
                <input
                  list="sp-groups"
                  maxLength={100}
                  disabled={busy}
                  readOnly={isView}
                  placeholder="Chọn hoặc nhập mã nhóm"
                  value={form.group}
                  onChange={event =>
                    setForm({ ...form, group: event.target.value })
                  }
                />
                <datalist id="sp-groups">
                  {availableGroups.map(item => (
                    <option key={item} value={item}>
                      {groupName(item)}
                    </option>
                  ))}
                </datalist>
              </label>

              <label>
                <span className="sp-label-text">Đơn vị tiền tệ</span>
                <input
                  readOnly
                  value={modal.product?.don_vi_tien_te || "VND"}
                />
              </label>

              <label className="sp-full">
                <span className="sp-label-text">Trạng thái</span>
                <select
                  disabled={busy || isView}
                  value={form.status}
                  onChange={event => setForm({
                    ...form,
                    status: event.target.value as ProductStatus,
                  })}
                >
                  <option value="DANG_KINH_DOANH">
                    Đang kinh doanh
                  </option>
                  <option value="NGUNG_BAN">Ngưng kinh doanh</option>
                </select>
              </label>

              {modal.product && (
                <div className="sp-full sp-metadata">
                  Tạo:{" "}
                  {new Date(
                    modal.product.thoi_gian_tao,
                  ).toLocaleString("vi-VN")}
                  <br />
                  Cập nhật:{" "}
                  {new Date(
                    modal.product.thoi_gian_cap_nhat,
                  ).toLocaleString("vi-VN")}
                </div>
              )}
            </div>

            {formError && (
              <p className="sp-error sp-form-error" role="alert">
                {formError}
              </p>
            )}

            <footer className="sp-dialog-footer">
              <button
                type="button"
                disabled={busy}
                onClick={closeModal}
              >
                {isView ? "Đóng" : "Hủy"}
              </button>

              {!isView && (
                <button
                  type="submit"
                  className="sp-primary"
                  disabled={busy}
                >
                  {busy ? "Đang lưu..." : "Lưu sản phẩm"}
                </button>
              )}
            </footer>
          </form>
        </dialog>
      )}

      {/* Hộp xác nhận xóa: gọn, có icon, tên đối tượng và 2 nút cùng hàng */}
      {deleteTarget && (
        <dialog
          ref={deleteDialog}
          className="sp-dialog sp-dialog-confirm"
          aria-labelledby="sp-delete-title"
          onCancel={event => {
            event.preventDefault();
            closeDelete();
          }}
        >
          <div className="sp-confirm-body">
            <span className="sp-confirm-icon" aria-hidden="true">
              <DeleteOutlined />
            </span>

            <h2 id="sp-delete-title">Xóa sản phẩm?</h2>

            <div className="sp-confirm-name">
              {deleteTarget.ma_san_pham} · {deleteTarget.ten_san_pham}
            </div>

            <p className="sp-confirm-text">Không thể hoàn tác.</p>

            {deleteError && (
              <div className="sp-error" role="alert">
                {deleteError}
              </div>
            )}
          </div>

          <div className="sp-confirm-actions">
            <button
              type="button"
              autoFocus
              disabled={busy}
              onClick={closeDelete}
            >
              Hủy
            </button>

            <button
              type="button"
              className="sp-danger"
              disabled={busy || !canDelete}
              onClick={() => void confirmDelete()}
            >
              <DeleteOutlined /> {busy ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}