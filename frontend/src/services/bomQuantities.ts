import type { BomInput, BomProduct } from "./congThucService";

export function validateBomRatios(bom: Pick<BomInput, "he_so_thu_hoi" | "ty_le_hao_hut" | "chi_tiet">): string {
  const recovery = Number(bom.he_so_thu_hoi);
  const loss = Number(bom.ty_le_hao_hut);
  if (!bom.he_so_thu_hoi.trim() || !Number.isFinite(recovery) || recovery <= 0 || recovery > 1)
    return "Hệ số thu hồi phải lớn hơn 0 và không vượt quá 100%.";
  if (!bom.ty_le_hao_hut.trim() || !Number.isFinite(loss) || loss < 0 || loss >= 1 || Math.abs(recovery + loss - 1) > 1e-9)
    return "Hệ số thu hồi + tỷ lệ hao hụt phải bằng 100%.";
  if (!bom.chi_tiet.length || bom.chi_tiet.some((line) => !line.ty_le_phoi_tron.trim() || !Number.isFinite(Number(line.ty_le_phoi_tron)) || Number(line.ty_le_phoi_tron) <= 0 || Number(line.ty_le_phoi_tron) > 1))
    return "Tỷ lệ phối trộn từng nguyên liệu phải lớn hơn 0 và không vượt quá 100%.";
  if (Math.abs(bom.chi_tiet.reduce((sum, line) => sum + Number(line.ty_le_phoi_tron), 0) - 1) > 1e-9)
    return "Tổng tỷ lệ phối trộn phải bằng 100%.";
  const codes = bom.chi_tiet.map((line) => line.ma_nguyen_lieu.trim());
  if (codes.some((code) => !code)) return "Vui lòng chọn đủ nguyên liệu.";
  if (new Set(codes).size !== codes.length) return "Không được chọn trùng nguyên liệu.";
  return "";
}

export function productGrams(product: BomProduct): number {
  const unit = product.don_vi_do_luong?.trim().toLowerCase();
  const weight = Number(product.khoi_luong);
  if (!Number.isFinite(weight) || weight <= 0 || !["kg", "g"].includes(unit ?? ""))
    throw new Error("Sản phẩm thiếu khối lượng chuẩn hoặc đơn vị kg/g hợp lệ. Vui lòng kiểm tra danh mục Sản phẩm.");
  return unit === "kg" ? weight * 1000 : weight;
}

export function calculateBomQuantities(grams: number, bom: Pick<BomInput, "he_so_thu_hoi" | "ty_le_hao_hut" | "chi_tiet">) {
  const error = validateBomRatios(bom);
  if (error) throw new Error(error);
  if (!Number.isFinite(grams) || grams <= 0) throw new Error("Khối lượng thành phẩm phải lớn hơn 0 g.");
  const finished = grams / 1000;
  const total = finished / Number(bom.he_so_thu_hoi);
  return { finished, total, loss: total - finished, lines: bom.chi_tiet.map((line) => ({
    ...line, kg: total * Number(line.ty_le_phoi_tron),
  })) };
}
