/// D:\KLTN\KLTN\frontend\src\services\duBaoService.ts
/// D:\KLTN\KLTN\frontend\src\services\duBaoService.ts
import { getToken } from "./authService";

export type SoTuanDuBao = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SanPhamDuBao {
  ma: string;
  ten: string;
}

export type LoaiKyTruoc =
  | "THUC_TE_TUAN_TRUOC"
  | "THUC_TE_GAN_NHAT"
  | "DU_BAO_TUAN_TRUOC"
  | "CHUA_CO_DU_LIEU";

export interface YeuToDuBao {
  ten: string;
  so_luong: number;
  dien_giai: string;
}

export interface ChiTietDuBao {
  tu_ngay: string;
  den_ngay: string;
  so_luong_du_bao: number;
  can_duoi: number;
  can_tren: number;
  ky_truoc?: number | null;
  loai_ky_truoc?: LoaiKyTruoc;
  ky_truoc_tu_ngay?: string | null;
  chenh_lech?: number | null;
  ty_le_thay_doi?: number | null;
  cung_ky?: number | null;
  ngay_le?: string[];
  chuong_trinh_km?: string | null;
  muc_giam_gia?: number;
  so_luong_du_bao_kg?: number | null;
  yeu_to?: YeuToDuBao[];
}

export interface DuBaoSanPham {
  ma_san_pham: string;
  ten_san_pham?: string;
  ket_qua: ChiTietDuBao[];
  tong_du_bao?: number;
  tong_ky_truoc?: number | null;
  loai_tong_ky_truoc?: string;
  tong_ky_truoc_tu_ngay?: string | null;
  tong_ky_truoc_den_ngay?: string | null;
  chenh_lech?: number | null;
  ty_le_thay_doi?: number | null;
  phan_loai?: string;
  dien_giai?: string;
  yeu_to?: YeuToDuBao[];
  cau_hinh?: Record<string, unknown>;
  canh_bao?: string[];
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

export interface SoSanhMoHinh {
  ma_san_pham: string;
  prophet_mae: number;
  seasonal_naive_mae: number;
  prophet_rmse: number;
  seasonal_naive_rmse: number;
  prophet_smape: number;
  seasonal_naive_smape: number;
  prophet_wape: number | null;
  seasonal_naive_wape: number | null;
  mo_hinh_tot_hon_theo_mae: string;
  chenh_lech_mae: number;
  ty_le_cai_thien_mae: number | null;
  dien_giai: string;
}

export interface DuBaoResponse {
  ma_lich_su_du_bao: string;
  ngay_chay: string;
  so_tuan_du_bao: SoTuanDuBao;
  thoi_gian_chay: string;
  tong_san_pham: number;
  ngay_bat_dau_huan_luyen?: string | null;
  ngay_ket_thuc_huan_luyen?: string | null;
  ngay_du_lieu_cuoi?: string | null;
  danh_gia_mo_hinh: DanhGiaMoHinh[];
  ket_qua: DuBaoSanPham[];
  so_sanh_mo_hinh?: SoSanhMoHinh[];
  canh_bao?: string[];
  ghi_chu_danh_gia?: string;
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
  tong_san_pham?: number;
  kieu_du_bao?: string;
}

export interface KhuyenMaiDuKien {
  ma_san_pham: string;
  tu_ngay: string;
  chuong_trinh_km: string;
  muc_giam_gia: number;
}

export interface YeuCauDuBao {
  so_tuan_du_bao: SoTuanDuBao;
  ma_san_pham?: string[] | null;
  khuyen_mai?: KhuyenMaiDuKien[];
}

const API_BASE_URL = `${
  import.meta.env.VITE_API_URL || "http://localhost:8000"
}`.replace(/\/+$/, "") + "/api";

async function requestDuBao(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    );
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }

    throw new Error(
      "Không thể kết nối backend. Kiểm tra Docker và cổng 8000.",
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  let body: unknown = null;

  if (response.status !== 204) {
    if (contentType.includes("application/json")) {
      body = await response.json();
    } else {
      body = await response.text();
    }
  }

  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status}).`;

    if (body && typeof body === "object") {
      const detail = (body as { detail?: unknown }).detail;

      if (typeof detail === "string") {
        message = detail;
      } else if (Array.isArray(detail)) {
        message = detail
          .map(item =>
            typeof item?.msg === "string"
              ? item.msg
              : JSON.stringify(item),
          )
          .join("; ");
      }
    } else if (typeof body === "string" && body.trim()) {
      message = body;
    }

    throw new Error(message);
  }

  return body;
}

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function readForecast(value: unknown): DuBaoResponse {
  if (!isObject(value)) {
    throw new Error("Backend trả về kết quả dự báo không hợp lệ.");
  }

  if (
    !Array.isArray(value.ket_qua) ||
    !Array.isArray(value.danh_gia_mo_hinh) ||
    typeof value.so_tuan_du_bao !== "number" ||
    value.so_tuan_du_bao < 1 ||
    value.so_tuan_du_bao > 8
  ) {
    throw new Error(
      "Kết quả dự báo thiếu danh sách sản phẩm hoặc tuần dự báo.",
    );
  }

  for (const item of value.ket_qua) {
    if (
      !isObject(item) ||
      typeof item.ma_san_pham !== "string" ||
      !Array.isArray(item.ket_qua)
    ) {
      throw new Error(
        "Kết quả dự báo có dữ liệu sản phẩm không hợp lệ.",
      );
    }

    for (const week of item.ket_qua) {
      if (
        !isObject(week) ||
        typeof week.tu_ngay !== "string" ||
        typeof week.den_ngay !== "string" ||
        typeof week.so_luong_du_bao !== "number"
      ) {
        throw new Error(
          "Kết quả dự báo có dữ liệu tuần không hợp lệ.",
        );
      }
    }
  }

  return value as unknown as DuBaoResponse;
}

export async function laySanPhamDuBao(
  signal?: AbortSignal,
): Promise<SanPhamDuBao[]> {
  const body = await requestDuBao("/du-bao/san-pham", {
    signal,
  });

  if (!Array.isArray(body)) {
    throw new Error(
      "API danh sách sản phẩm trả về không đúng cấu trúc.",
    );
  }

  return body.map(item => {
    if (
      !isObject(item) ||
      typeof item.ma !== "string" ||
      typeof item.ten !== "string"
    ) {
      throw new Error(
        "Danh sách sản phẩm có dữ liệu không hợp lệ.",
      );
    }

    return {
      ma: item.ma,
      ten: item.ten,
    };
  });
}

export async function duBaoNhuCau(
  soTuan: SoTuanDuBao,
  signal?: AbortSignal,
): Promise<DuBaoResponse> {
  return chayDuBaoTheoYeuCau(
    {
      so_tuan_du_bao: soTuan,
      ma_san_pham: null,
      khuyen_mai: [],
    },
    signal,
  );
}

export async function chayDuBaoTheoYeuCau(
  request: YeuCauDuBao,
  signal?: AbortSignal,
): Promise<DuBaoResponse> {
  const weeks = request.so_tuan_du_bao;

  if (!Number.isInteger(weeks) || weeks < 1 || weeks > 8) {
    throw new Error("Chỉ được dự báo từ 1 đến 8 tuần.");
  }

  if (
    request.ma_san_pham !== null &&
    request.ma_san_pham !== undefined &&
    (!Array.isArray(request.ma_san_pham) ||
      request.ma_san_pham.length === 0)
  ) {
    throw new Error("Vui lòng chọn ít nhất một sản phẩm.");
  }

  const body = await requestDuBao("/du-bao/nhu-cau", {
    method: "POST",
    signal,
    body: JSON.stringify({
      so_tuan_du_bao: weeks,
      ma_san_pham: request.ma_san_pham ?? null,
      khuyen_mai: request.khuyen_mai ?? [],
    }),
  });

  const result = readForecast(body);

  if (result.so_tuan_du_bao !== weeks) {
    throw new Error(
      "Số tuần backend trả về không khớp yêu cầu.",
    );
  }

  return result;
}

export async function layLichSuDuBao(
  signal?: AbortSignal,
): Promise<LichSuDuBao[]> {
  const body = await requestDuBao("/du-bao/lich-su", {
    signal,
  });

  if (!Array.isArray(body)) {
    throw new Error("Không đọc được lịch sử dự báo.");
  }

  return body as LichSuDuBao[];
}

export async function layChiTietDuBao(
  maLichSu: string,
  signal?: AbortSignal,
): Promise<DuBaoResponse> {
  const body = await requestDuBao(
    `/du-bao/lich-su/${encodeURIComponent(maLichSu)}`,
    { signal },
  );

  return readForecast(body);
}

export async function layDuBaoMoiNhat(
  signal?: AbortSignal,
): Promise<DuBaoResponse | null> {
  const body = await requestDuBao("/du-bao/moi-nhat", {
    signal,
  });

  return body === null ? null : readForecast(body);
}