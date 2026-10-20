//D:\KLTN\KLTN\frontend\src\components\common\EntityFields.tsx
import { useAuth } from "../../auth/AuthContext";
import { listMaterials } from "../../services/nguyenLieuService";
import { listSuppliers } from "../../services/nhaCungCapService";
import { Field, useResource } from "./PurchaseUI";
export function MaterialField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { can } = useAuth();
  const resource = useResource(
    () => (can("NGUYEN_LIEU_VIEW") ? listMaterials() : Promise.resolve([])),
    [can("NGUYEN_LIEU_VIEW")],
  );
  return (
    <Field label="Nguyên liệu" hint={resource.error || undefined}>
      {resource.data?.length ? (
        <select
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Chọn nguyên liệu</option>
          {resource.data
            .filter(
              (row) =>
                row.trang_thai === "DANG_SU_DUNG" ||
                row.ma_nguyen_lieu === value,
            )
            .map((row) => (
              <option key={row.ma_nguyen_lieu} value={row.ma_nguyen_lieu}>
                {row.ma_nguyen_lieu} · {row.ten_nguyen_lieu}
              </option>
            ))}
        </select>
      ) : (
        <input
          required
          disabled={disabled}
          maxLength={20}
          placeholder="Nhập mã nguyên liệu"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}
export function SupplierField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const { can } = useAuth();
  const resource = useResource(
    () => (can("NHA_CUNG_CAP_VIEW") ? listSuppliers() : Promise.resolve([])),
    [can("NHA_CUNG_CAP_VIEW")],
  );
  return (
    <Field label="Nhà cung cấp" hint={resource.error || undefined}>
      {resource.data?.length ? (
        <select
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Chọn nhà cung cấp</option>
          {resource.data
            .filter(
              (row) =>
                row.trang_thai === "DANG_HOAT_DONG" || row.ma_ncc === value,
            )
            .map((row) => (
              <option key={row.ma_ncc} value={row.ma_ncc}>
                {row.ma_ncc} · {row.ten_ncc}
              </option>
            ))}
        </select>
      ) : (
        <input
          required
          disabled={disabled}
          maxLength={20}
          placeholder="Nhập mã nhà cung cấp"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}
