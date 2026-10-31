import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Field, Feedback, LoadingState, useResource } from "../../components/common/PurchaseUI";
import { getBomProduct, type BomInput, type BomProduct } from "../../services/congThucService";
import { calculateBomQuantities, productGrams } from "../../services/bomQuantities";
import { listMaterials } from "../../services/nguyenLieuService";

const kg = (value: number) => new Intl.NumberFormat("vi-VN", { minimumFractionDigits: 6, maximumFractionDigits: 6 }).format(value);
const percent = (value: string) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 }).format(Number(value) * 100) + "%";

export default function BomQuantification({ productCode, initialProduct, bom, editable = false, materialNames = {} }: {
  productCode: string;
  initialProduct?: BomProduct | null;
  bom: Pick<BomInput, "he_so_thu_hoi" | "ty_le_hao_hut" | "chi_tiet">;
  editable?: boolean;
  materialNames?: Record<string, string>;
}) {
  const { can } = useAuth();
  const materials = useResource(() => editable && can("NGUYEN_LIEU_VIEW") ? listMaterials() : Promise.resolve([]), [editable]);
  const [product, setProduct] = useState<BomProduct | null>(null);
  const [grams, setGrams] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setProduct(null);
    setGrams("");
    setLoadError("");
    setLoading(Boolean(productCode));
    const apply = (value: BomProduct) => {
      setProduct(value);
      setGrams(String(productGrams(value)));
    };
    if (initialProduct?.ma_san_pham === productCode) {
      try { apply(initialProduct); } catch (cause) { setLoadError((cause as Error).message); }
      setLoading(false);
      return () => controller.abort();
    }
    const timer = window.setTimeout(async () => {
      if (!productCode) return;
      try {
        const value = await getBomProduct(productCode, controller.signal);
        if (!controller.signal.aborted) apply(value);
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(cause instanceof Error ? cause.message : "Không thể tải khối lượng sản phẩm.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [productCode, initialProduct]);
  let quantities: ReturnType<typeof calculateBomQuantities> | null = null;
  let error = loadError;
  if (!error && product && !loading) {
    try { quantities = calculateBomQuantities(Number(grams), bom); }
    catch (cause) { error = (cause as Error).message; }
  }
  const names = { ...Object.fromEntries((materials.data ?? []).map((row) => [row.ma_nguyen_lieu, row.ten_nguyen_lieu])), ...materialNames };
  let standardGrams = 0;
  if (product && !loadError) standardGrams = productGrams(product);
  return (
    <section className="pm-line-item" aria-label="Định lượng nguyên liệu cho 1 sản phẩm">
      <h3>Định lượng nguyên liệu cho 1 sản phẩm</h3>
      {!productCode && <p className="pm-help">Chọn sản phẩm để lấy khối lượng chuẩn từ danh mục.</p>}
      {loading && <LoadingState />}
      {product && <>
        <p><strong>{product.ten_san_pham}</strong> · Khối lượng chuẩn: {standardGrams} g</p>
        {editable && !loadError && <Field label="Khối lượng thành phẩm thử tính (g)" hint="Chỉ dùng để thử tính, không lưu vào sản phẩm hoặc BOM. Muốn đổi khối lượng chuẩn, hãy cập nhật tại danh mục Sản phẩm.">
          <input type="number" min="0" step="any" value={grams} onChange={(event) => setGrams(event.target.value)} />
        </Field>}
        {editable && Number(grams) !== standardGrams && <p className="pm-help">Đang thử tính với {grams || "—"} g. Nhu cầu nguyên liệu và BOM sau khi lưu vẫn dùng khối lượng chuẩn {standardGrams} g.</p>}
        <dl className="pm-info">
          <div><dt>Hệ số thu hồi</dt><dd>{percent(bom.he_so_thu_hoi)}</dd></div>
          <div><dt>Tỷ lệ hao hụt</dt><dd>{percent(bom.ty_le_hao_hut)}</dd></div>
        </dl>
      </>}
      <Feedback error={error} success="" />
      {quantities && <>
        <dl className="pm-info">
          <div><dt>Khối lượng thành phẩm</dt><dd data-testid="bom-finished-kg">{kg(quantities.finished)} kg</dd></div>
          <div><dt>Tổng kg nguyên liệu đầu vào</dt><dd data-testid="bom-input-kg">{kg(quantities.total)} kg</dd></div>
        </dl>
        <div className="pm-table-scroll"><table className="pm-table">
          <thead><tr><th>Nguyên liệu</th><th>Tỷ lệ phối trộn</th><th>Khối lượng cần dùng (kg)</th></tr></thead>
          <tbody>{quantities.lines.map((line) => <tr key={line.ma_nguyen_lieu}>
            <td>{names[line.ma_nguyen_lieu] || line.ma_nguyen_lieu}</td>
            <td>{percent(line.ty_le_phoi_tron)}</td>
            <td data-testid={`bom-kg-${line.ma_nguyen_lieu}`}>{kg(line.kg)}</td>
          </tr>)}</tbody>
        </table></div>
        <p><strong>Tổng kg hao hụt: <span data-testid="bom-loss-kg">{kg(quantities.loss)}</span> kg</strong></p>
      </>}
      <p className="pm-help">Đầu vào = khối lượng thành phẩm (kg) / hệ số thu hồi. Không cộng thêm hao hụt. Số kg hiển thị làm tròn 6 chữ số thập phân.</p>
    </section>
  );
}
