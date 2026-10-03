/// D:\KLTN\KLTN\frontend\src\services\duBaoService.ts
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

export interface LichSuDuBao {
  ma_lich_su_du_bao: string;
  thoi_gian_chay: string;
  ngay_bat_dau_huan_luyen: string | null;
  ngay_ket_thuc_huan_luyen: string | null;
  so_tuan_du_bao: SoTuanDuBao;
  nguoi_thuc_hien: string | null;
  ho_ten_nguoi_thuc_hien: string | null;
  trang_thai: string;
}

const API_BASE_URL = `${
  (import.meta.env.VITE_API_URL || "http://localhost:8000")
    .replace(/\/+$/, "")
}/api`;

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

  return value;
}

function docChuoi(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error(DATA_ERROR);
  }

  return value;
}

function docChuoiNullable(
  value: unknown,
): string | null {
  return value == null ? null : docChuoi(value);
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

function docSoTuan(value: unknown): SoTuanDuBao {
  if (value !== 4 && value !== 8) {
    throw new Error(DATA_ERROR);
  }

  return value;
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

function docNgayNullable(
  value: unknown,
): string | null {
  return value == null ? null : docNgay(value);
}

function docThoiGian(value: unknown): string {
  const text = docChuoi(value);

  if (!Number.isFinite(Date.parse(text))) {
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

  const weeks = docMang(row.ket_qua)
    .map(docChiTietDuBao)
    .sort((a, b) => a.tu_ngay.localeCompare(b.tu_ngay));

  const starts = new Set(
    weeks.map(week => week.tu_ngay),
  );

  if (
    weeks.length !== soTuan ||
    starts.size !== weeks.length
  ) {
    throw new Error(DATA_ERROR);
  }

  return {
    ma_san_pham: docChuoi(row.ma_san_pham),
    ket_qua: weeks,
  };
}

function docBacktest(
  value: unknown,
): ChiTietBacktest {
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
      row.chu_ky == null
        ? null
        : docSoNguyen(row.chu_ky, 1),

    mae: docSo(row.mae),
    rmse: docSo(row.rmse),

    wape:
      row.wape == null
        ? null
        : docSo(row.wape),

    smape: docSo(row.smape),

    chi_tiet:
      row.chi_tiet == null
        ? []
        : docMang(row.chi_tiet).map(docBacktest),
  };
}

function docResponse(
  value: unknown,
  expectedWeeks?: SoTuanDuBao,
): DuBaoResponse {
  const row = docObject(value);
  const weeks = docSoTuan(row.so_tuan_du_bao);

  if (
    expectedWeeks !== undefined &&
    weeks !== expectedWeeks
  ) {
    throw new Error(DATA_ERROR);
  }

  const products = docMang(row.ket_qua).map(
    product => docSanPham(product, weeks),
  );

  const productIds = new Set(
    products.map(product => product.ma_san_pham),
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
    so_tuan_du_bao: weeks,
    thoi_gian_chay: docThoiGian(row.thoi_gian_chay),
    tong_san_pham: totalProducts,

    danh_gia_mo_hinh: docMang(
      row.danh_gia_mo_hinh,
    ).map(score => docDanhGia(score, weeks)),

    ket_qua: products,
  };
}

function docLichSu(
  value: unknown,
): LichSuDuBao {
  const row = docObject(value);

  const start = docNgayNullable(
    row.ngay_bat_dau_huan_luyen,
  );

  const end = docNgayNullable(
    row.ngay_ket_thuc_huan_luyen,
  );

  if (start && end && start > end) {
    throw new Error(DATA_ERROR);
  }

  return {
    ma_lich_su_du_bao: docChuoi(row.ma_lich_su_du_bao),
    thoi_gian_chay: docThoiGian(row.thoi_gian_chay),
    ngay_bat_dau_huan_luyen: start,
    ngay_ket_thuc_huan_luyen: end,
    so_tuan_du_bao: docSoTuan(row.so_tuan_du_bao),

    nguoi_thuc_hien: docChuoiNullable(
      row.nguoi_thuc_hien,
    ),

    ho_ten_nguoi_thuc_hien: docChuoiNullable(
      row.ho_ten_nguoi_thuc_hien,
    ),

    trang_thai: docChuoi(row.trang_thai),
  };
}

function layThongBaoLoi(
  body: unknown,
  status: number,
  isRun: boolean,
): string {
  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (status === 403) {
    return isRun
      ? "Tài khoản của bạn không có quyền chạy dự báo."
      : "Tài khoản của bạn không có quyền xem dữ liệu dự báo.";
  }

  if (status === 422 && isRun) {
    return "Vui lòng chọn kỳ dự báo 4 hoặc 8 tuần.";
  }

  if (
    body !== null &&
    typeof body === "object" &&
    !Array.isArray(body)
  ) {
    const row = body as Record<string, unknown>;

    if (
      typeof row.detail === "string" &&
      row.detail.trim() &&
      row.detail !== "Not Found"
    ) {
      return row.detail;
    }
  }

  if (status === 404) {
    return "Chưa tìm thấy dữ liệu dự báo.";
  }

  return isRun
    ? "Không thể chạy dự báo lúc này. Vui lòng thử lại."
    : "Không thể tải dữ liệu dự báo. Vui lòng thử lại.";
}

async function requestDuBao(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body != null) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (cause) {
    if (options.signal?.aborted) {
      throw cause;
    }

    throw new Error(
      "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.",
    );
  }

  const isRun = options.method === "POST";

  if (response.status === 204 && response.ok) {
    return null;
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    if (options.signal?.aborted) {
      throw new Error("Yêu cầu đã được hủy.");
    }

    if (!response.ok) {
      throw new Error(
        layThongBaoLoi(null, response.status, isRun),
      );
    }

    throw new Error(DATA_ERROR);
  }

  if (!response.ok) {
    throw new Error(
      layThongBaoLoi(body, response.status, isRun),
    );
  }

  return body;
}

export async function duBaoNhuCau(
  soTuan: SoTuanDuBao,
  signal?: AbortSignal,
): Promise<DuBaoResponse> {
  if (soTuan !== 4 && soTuan !== 8) {
    throw new Error("Chỉ hỗ trợ dự báo 4 hoặc 8 tuần.");
  }

  const body = await requestDuBao("/du-bao/nhu-cau", {
    method: "POST",
    signal,
    body: JSON.stringify({
      so_tuan_du_bao: soTuan,
    }),
  });

  return docResponse(body, soTuan);
}

export async function layLichSuDuBao(
  signal?: AbortSignal,
): Promise<LichSuDuBao[]> {
  const body = await requestDuBao("/du-bao/lich-su", {
    signal,
  });

  const history = docMang(body).map(docLichSu);

  const ids = new Set(
    history.map(item => item.ma_lich_su_du_bao),
  );

  if (ids.size !== history.length) {
    throw new Error(DATA_ERROR);
  }

  return history.sort(
    (a, b) =>
      Date.parse(b.thoi_gian_chay) -
      Date.parse(a.thoi_gian_chay),
  );
}

export async function layChiTietDuBao(
  id: string,
  signal?: AbortSignal,
): Promise<DuBaoResponse> {
  if (!id.trim()) {
    throw new Error("Thiếu mã lần dự báo.");
  }

  const body = await requestDuBao(
    `/du-bao/lich-su/${encodeURIComponent(id)}`,
    { signal },
  );

  const result = docResponse(body);

  if (result.ma_lich_su_du_bao !== id) {
    throw new Error(DATA_ERROR);
  }

  return result;
}

export async function layDuBaoMoiNhat(
  signal?: AbortSignal,
): Promise<DuBaoResponse | null> {
  const body = await requestDuBao("/du-bao/moi-nhat", {
    signal,
  });

  return body === null ? null : docResponse(body);
}