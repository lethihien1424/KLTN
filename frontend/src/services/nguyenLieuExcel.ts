import type { Cell, Workbook } from "exceljs";
import { createMaterial, listMaterials } from "./nguyenLieuService";
import type { Material } from "./purchaseTypes";

const columns = [
  { header: "ma_nguyen_lieu", key: "ma_nguyen_lieu", width: 24 },
  { header: "ten_nguyen_lieu", key: "ten_nguyen_lieu", width: 42 },
  { header: "don_vi_do_luong", key: "don_vi_do_luong", width: 24 },
  { header: "trang_thai", key: "trang_thai", width: 24 },
];

async function download(workbook: Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadMaterialExcel(rows?: Material[]) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("NguyenLieu");
  sheet.columns = columns;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.getRow(1).font = { bold: true };
  sheet.autoFilter = "A1:D1";
  sheet.getCell("A1").note = "Bắt buộc, tối đa 20 ký tự. Mã và tên nguyên liệu không được trùng.";
  sheet.getCell("B1").note = "Bắt buộc, tối đa 100 ký tự.";
  sheet.getCell("C1").note = "Bắt buộc, tối đa 20 ký tự (ví dụ: kg, g, lít).";
  sheet.getCell("D1").note = "DANG_SU_DUNG hoặc NGUNG_SU_DUNG. Để trống sẽ dùng DANG_SU_DUNG.";
  if (rows) sheet.addRows(rows);
  else {
    for (let row = 2; row <= 1001; row += 1) {
      sheet.getCell(`D${row}`).dataValidation = {
        type: "list", allowBlank: true,
        formulae: ['"DANG_SU_DUNG,NGUNG_SU_DUNG"'],
        showErrorMessage: true, errorTitle: "Trạng thái không hợp lệ",
        error: "Chọn DANG_SU_DUNG hoặc NGUNG_SU_DUNG.",
      };
    }
  }
  await download(workbook, rows ? "danh_sach_nguyen_lieu.xlsx" : "template_nguyen_lieu.xlsx");
}

function cellText(cell: Cell, row: number): string {
  const value = cell.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object" && "richText" in value)
    return value.richText.map((part) => part.text).join("").trim();
  throw new Error(`Dòng ${row}, cột ${cell.col}: chỉ chấp nhận văn bản hoặc số, không dùng công thức.`);
}

export async function readMaterialExcel(file: File): Promise<{ row: number; material: Material }[]> {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Vui lòng chọn file Excel .xlsx.");
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("Không thể đọc file .xlsx. File có thể bị hỏng hoặc được bảo vệ bằng mật khẩu.");
  }
  const sheet = workbook.getWorksheet("NguyenLieu") ?? workbook.worksheets[0];
  if (!sheet) throw new Error("File không có trang dữ liệu.");
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, index) => {
    const name = cellText(cell, 1);
    if (!name) return;
    if (!columns.some((column) => column.key === name))
      throw new Error(`Cột không hợp lệ: ${name}. Vui lòng sử dụng template nguyên liệu.`);
    if (headers.has(name)) throw new Error(`Cột bị trùng: ${name}.`);
    headers.set(name, index);
  });
  for (const column of columns.slice(0, 3)) {
    if (!headers.has(column.key)) throw new Error(`Thiếu cột ${column.header}. Vui lòng sử dụng template nguyên liệu.`);
  }
  const result: { row: number; material: Material }[] = [];
  const codes = new Set<string>();
  const names = new Set<string>();
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const values = columns.map((column) => {
      const position = headers.get(column.key);
      return position ? cellText(row.getCell(position), index) : "";
    });
    if (values.every((value) => !value)) return;
    const [code, name, unit, status = ""] = values;
    for (const [value, label, limit] of [
      [code, "Mã nguyên liệu", 20], [name, "Tên nguyên liệu", 100], [unit, "Đơn vị đo lường", 20],
    ] as const) {
      if (!value || [...value].length > limit)
        throw new Error(`Dòng ${index}: ${label} bắt buộc và tối đa ${limit} ký tự.`);
    }
    if (status && !["DANG_SU_DUNG", "NGUNG_SU_DUNG"].includes(status))
      throw new Error(`Dòng ${index}: trạng thái phải là DANG_SU_DUNG hoặc NGUNG_SU_DUNG.`);
    if (codes.has(code) || names.has(name))
      throw new Error(`Dòng ${index}: mã hoặc tên nguyên liệu bị trùng trong file.`);
    codes.add(code);
    names.add(name);
    result.push({ row: index, material: {
      ma_nguyen_lieu: code, ten_nguyen_lieu: name, don_vi_do_luong: unit,
      trang_thai: status || "DANG_SU_DUNG",
    } });
  });
  if (!result.length) throw new Error("File không có nguyên liệu để nhập. Hãy điền dữ liệu từ dòng 2.");
  return result;
}

export async function importMaterialExcel(file: File): Promise<number> {
  // Validate the entire workbook and current catalog before creating any records.
  const entries = await readMaterialExcel(file);
  const existing = await listMaterials();
  const codes = new Set(existing.map((item) => item.ma_nguyen_lieu));
  const names = new Set(existing.map((item) => item.ten_nguyen_lieu));
  for (const { row, material } of entries) {
    if (codes.has(material.ma_nguyen_lieu) || names.has(material.ten_nguyen_lieu))
      throw new Error(`Dòng ${row}: mã hoặc tên nguyên liệu đã tồn tại trong hệ thống. Chưa nhập dữ liệu.`);
  }
  let imported = 0;
  for (const { row, material } of entries) {
    try {
      await createMaterial(material);
      imported += 1;
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Không thể lưu nguyên liệu.";
      throw new Error(`Đã nhập ${imported}/${entries.length} nguyên liệu. Dừng tại dòng ${row}: ${message} Các dòng còn lại chưa được nhập; hãy kiểm tra danh sách trước khi nhập lại.`);
    }
  }
  return imported;
}
