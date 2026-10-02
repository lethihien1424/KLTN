import { getToken } from "./authService";

export type SoTuanDuBao = 4 | 8;

export interface ChiTietDuBao {
  tu_ngay: string;
  den_ngay: string;
  so_luong_du_bao: number;
  can_duoi: number;
  can_tren: number;
}

export interface DuBaoSanPham {
  ma_san_pham: string;
  ket_qua: ChiTietDuBao[];
}

export interface ChiTietBacktest {
  fold: number;
  tu_ngay: string;
  den_ngay: string;
  thuc_te: number;
  du_bao: number;
  sai_so: number;
  sai_so_tuyet_doi: number;
}

export interface DanhGiaMoHinh {
  ma_san_pham: string;
  mo_hinh: string;
  horizon: number;
  so_fold: number;
  so_diem_danh_gia: number;
  chu_ky: number | null;
  mae: number;
  rmse: number;
  wape: number | null;
  smape: number;
  chi_tiet: ChiTietBacktest[];
}

export interface DuBaoResponse {
  ma_lich_su_du_bao: string;
  ngay_chay: string;
  so_tuan_du_bao: SoTuanDuBao;
  thoi_gian_chay: string;
  tong_san_pham: number;
  danh_gia_mo_hinh: DanhGiaMoHinh[];
  ket_qua: DuBaoSanPham[];
}

const API_BASE_URL = "http://localhost:8000/api";

const DATA_ERROR =
  "Dữ liệu dự báo trả về không đúng cấu trúc.";

function docObject(
  value: unknown,
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(DATA_ERROR);
  }

  return value as Record<string, unknown>;
}

function docMang(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(DATA_ERROR);
  }

  return value as unknown[];
}

function docChuoi(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(DATA_ERROR);
  }

  return value;
}

function docSo(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    throw new Error(DATA_ERROR);
  }

  return value;
}

function docSoNguyen(
  value: unknown,
  minimum = 0,
): number {
  const number = docSo(value);

  if (
    !Number.isInteger(number) ||
    number < minimum
  ) {
    throw new Error(DATA_ERROR);
  }

  return number;
}

function docNgay(value: unknown): string {
  const text = docChuoi(value);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error(DATA_ERROR);
  }

  const date = new Date(`${text}T00:00:00Z`);

  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== text
  ) {
    throw new Error(DATA_ERROR);
  }

  return text;
}

function docChiTietDuBao(
  value: unknown,
): ChiTietDuBao {
  const row = docObject(value);

  const start = docNgay(row.tu_ngay);
  const end = docNgay(row.den_ngay);
  const quantity = docSoNguyen(row.so_luong_du_bao);
  const lower = docSoNguyen(row.can_duoi);
  const upper = docSoNguyen(row.can_tren);

  if (
    start > end ||
    lower > quantity ||
    upper < quantity
  ) {
    throw new Error(DATA_ERROR);
  }

  return {
    tu_ngay: start,
    den_ngay: end,
    so_luong_du_bao: quantity,
    can_duoi: lower,
    can_tren: upper,
  };
}

function docSanPham(
  value: unknown,
  soTuan: SoTuanDuBao,
): DuBaoSanPham {
  const row = docObject(value);

  const weeks = docMang(row.ket_qua).map(docChiTietDuBao);

  if (weeks.length !== soTuan) {
    throw new Error(DATA_ERROR);
  }

  const dates = new Set(weeks.map((week) => week.tu_ngay));

  if (dates.size !== weeks.length) {
    throw new Error(DATA_ERROR);
  }

  return {
    ma_san_pham: docChuoi(row.ma_san_pham),
    ket_qua: weeks,
  };
}

function docBacktest(value: unknown): ChiTietBacktest {
  const row = docObject(value);

  return {
    fold: docSoNguyen(row.fold),
    tu_ngay: docNgay(row.tu_ngay),
    den_ngay: docNgay(row.den_ngay),
    thuc_te: docSo(row.thuc_te),
    du_bao: docSo(row.du_bao),
    sai_so: docSo(row.sai_so),
    sai_so_tuyet_doi: docSo(row.sai_so_tuyet_doi),
  };
}

function docDanhGia(
  value: unknown,
  soTuan: SoTuanDuBao,
): DanhGiaMoHinh {
  const row = docObject(value);
  const horizon = docSoNguyen(row.horizon, 1);

  if (horizon !== soTuan) {
    throw new Error(DATA_ERROR);
  }

  return {
    ma_san_pham: docChuoi(row.ma_san_pham),
    mo_hinh: docChuoi(row.mo_hinh),
    horizon,
    so_fold: docSoNguyen(row.so_fold),
    so_diem_danh_gia: docSoNguyen(row.so_diem_danh_gia),
    chu_ky:
      row.chu_ky == null ? null : docSoNguyen(row.chu_ky, 1),
    mae: docSo(row.mae),
    rmse: docSo(row.rmse),
    wape: row.wape == null ? null : docSo(row.wape),
    smape: docSo(row.smape),
    chi_tiet:
      row.chi_tiet == null
        ? []
        : docMang(row.chi_tiet).map(docBacktest),
  };
}

function docResponse(
  value: unknown,
  soTuan: SoTuanDuBao,
): DuBaoResponse {
  const row = docObject(value);

  if (row.so_tuan_du_bao !== soTuan) {
    throw new Error(DATA_ERROR);
  }

  const runTime = docChuoi(row.thoi_gian_chay);

  if (!Number.isFinite(Date.parse(runTime))) {
    throw new Error(DATA_ERROR);
  }

  const products = docMang(row.ket_qua).map((product) =>
    docSanPham(product, soTuan),
  );

  const productIds = new Set(
    products.map((product) => product.ma_san_pham),
  );

  const totalProducts = docSoNguyen(row.tong_san_pham);

  if (
    productIds.size !== products.length ||
    totalProducts !== products.length
  ) {
    throw new Error(DATA_ERROR);
  }

  return {
    ma_lich_su_du_bao: docChuoi(row.ma_lich_su_du_bao),
    ngay_chay: docNgay(row.ngay_chay),
    so_tuan_du_bao: soTuan,
    thoi_gian_chay: runTime,
    tong_san_pham: totalProducts,
    ket_qua: products,
    danh_gia_mo_hinh: docMang(row.danh_gia_mo_hinh).map(
      (score) => docDanhGia(score, soTuan),
    ),
  };
}

// Thông báo hiển thị cho người dùng cuối — luôn ngắn gọn,
// không nhắc đến thuật ngữ kỹ thuật (API, backend, CORS...).
// Chi tiết lỗi thật sự nên được log ở console cho dev debug,
// việc này do nơi gọi hàm (component) đảm nhiệm.
function layThongBaoLoi(
  body: unknown,
  status: number,
): string {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return "Tài khoản của bạn không có quyền chạy dự báo.";
  }

  if (status === 422) {
    return "Yêu cầu dự báo không hợp lệ. Vui lòng chọn lại kỳ dự báo 4 hoặc 8 tuần.";
  }

  if (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  ) {
    const row = body as Record<string, unknown>;

    if (typeof row.detail === "string" && row.detail.trim()) {
      // Thông điệp từ server thường đã được viết cho người dùng
      // cuối (không lộ chi tiết kỹ thuật), nên có thể hiển thị.
      return row.detail;
    }
  }

  return "Không thể chạy dự báo lúc này. Vui lòng thử lại sau ít phút.";
}

export async function duBaoNhuCau(
  soTuan: SoTuanDuBao,
  signal?: AbortSignal,
): Promise<DuBaoResponse> {
  if (soTuan !== 4 && soTuan !== 8) {
    throw new Error("Chỉ hỗ trợ dự báo 4 hoặc 8 tuần.");
  }

  // Dùng chung hàm lấy token với App.tsx.
  const token = getToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/du-bao/nhu-cau`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ so_tuan_du_bao: soTuan }),
    });
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }

    // Log chi tiết kỹ thuật cho dev, chỉ đưa câu thân thiện
    // ra cho người dùng.
    console.error("Lỗi kết nối khi gọi API dự báo:", error);

    throw new Error(
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
    );
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(layThongBaoLoi(body, response.status));
  }

  return docResponse(body, soTuan);
}