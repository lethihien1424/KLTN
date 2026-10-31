import DataTable from "../../components/common/DataTable";
import { FormDrawer, LoadingState, ErrorState, EmptyState, useResource, formatDate, formatNumber, number } from "../../components/common/PurchaseUI";
import { api } from "../../services/apiClient";
import type { ForecastDemandDetail } from "../../services/purchaseTypes";

// More precision than the aggregate table is needed to explain a per-product BOM.
const quantity = (value: string | number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 8 }).format(number(value));

export default function ForecastDetailDrawer({ code, onClose }: { code: string; onClose: () => void }) {
  const detail = useResource(async () => {
    const result = await api<ForecastDemandDetail>(`/nhu-cau-nguyen-lieu/${encodeURIComponent(code)}/chi-tiet`);
    if (result.ma_lich_su_du_bao !== code) throw new Error("Chi tiết trả về không khớp lần dự báo đã chọn.");
    return result;
  }, [code]);
  const data = detail.data;
  return (
    <FormDrawer open title={`Chi tiết lần dự báo ${code}`} onClose={onClose}>
      {detail.loading ? <LoadingState /> : detail.error ? (
        <ErrorState message={detail.error} retry={detail.refetch} />
      ) : data ? (
        <>
          <section className="pm-panel" aria-label="Thông tin lần dự báo">
            <h3>Phần 1 – Thông tin lần dự báo</h3>
            <dl>
              <dt>Mã lần dự báo</dt><dd>{data.ma_lich_su_du_bao}</dd>
              <dt>Ngày chạy dự báo</dt><dd>{formatDate(data.thoi_gian_chay)}</dd>
              <dt>Khoảng thời gian dự báo</dt>
              <dd>{data.tu_ngay && data.den_ngay ? `${formatDate(data.tu_ngay)} – ${formatDate(data.den_ngay)}` : "—"}</dd>
              <dt>Số tuần dự báo</dt><dd>{data.so_tuan_du_bao} tuần</dd>
              <dt>Tổng số sản phẩm dự báo</dt><dd>{formatNumber(data.tong_san_pham)}</dd>
              {data.trang_thai && <><dt>Trạng thái</dt><dd>{data.trang_thai}</dd></>}
            </dl>
          </section>
          <section className="pm-panel" aria-label="Chi tiết sản phẩm dự báo">
            <h3>Phần 2 – Chi tiết sản phẩm dự báo</h3>
            <p className="pm-small">Số lượng lấy từ lần dự báo đã lưu. Quy đổi nguyên liệu dùng BOM đang có hiệu lực; chưa có bản lưu BOM tại thời điểm chạy dự báo.</p>
            <DataTable rows={data.san_pham} rowKey={(row) => row.ma_san_pham} columns={[
              { key: "product", label: "Sản phẩm", render: (row) => <><strong>{row.ten_san_pham}</strong><div className="pm-small">{row.ma_san_pham}</div></> },
              { key: "quantity", label: "Số lượng dự báo", numeric: true, render: (row) => formatNumber(row.so_luong_du_bao) },
              { key: "bom", label: "Công thức/BOM", render: (row) => row.bom ? <>{row.bom.ten_cong_thuc}<div className="pm-small">{row.bom.ma_cong_thuc}</div></> : <span role="status">{row.loi_bom || "Chưa có BOM"}</span> },
              { key: "weight", label: "Khối lượng thành phẩm (kg/SP)", numeric: true, render: (row) => row.bom ? quantity(row.bom.khoi_luong_thanh_pham_kg) : "—" },
              { key: "recovery", label: "Thu hồi / Hao hụt", render: (row) => row.bom ? `${quantity(number(row.bom.he_so_thu_hoi) * 100)}% / ${quantity(number(row.bom.ty_le_hao_hut) * 100)}%` : "—" },
            ]} />
          </section>
          <section className="pm-panel" aria-label="Chi tiết nhu cầu nguyên liệu">
            <h3>Phần 3 – Chi tiết nhu cầu nguyên liệu</h3>
            <p className="pm-small">Kg nguyên liệu = Số lượng dự báo × Khối lượng thành phẩm (kg/SP) ÷ Hệ số thu hồi × Tỷ lệ phối trộn. Cộng nhu cầu từ tất cả sản phẩm rồi làm tròn đến 0,01 kg.</p>
            {!data.du_bom ? <EmptyState title="Chưa thể tính đầy đủ nhu cầu nguyên liệu" description={data.san_pham.length ? "Kiểm tra BOM của các sản phẩm ở Phần 2. Không hiển thị tổng thiếu thành phần." : "Lần dự báo này chưa có chi tiết sản phẩm đã lưu."} /> : (
              <DataTable rows={data.nguyen_lieu} rowKey={(row) => row.ma_nguyen_lieu} columns={[
                { key: "material", label: "Nguyên liệu", render: (row) => <><strong>{row.ten_nguyen_lieu}</strong><div className="pm-small">{row.ma_nguyen_lieu}</div></> },
                { key: "kg", label: "Nhu cầu (kg)", numeric: true, render: (row) => formatNumber(row.nhu_cau_du_bao_kg) },
                { key: "calculation", label: "Cách tính từ BOM", render: (row) => row.cach_tinh.map((line) => <div key={`${line.ma_san_pham}:${line.ma_cong_thuc}`}>
                  <strong>{line.ma_san_pham} · {line.ma_cong_thuc}</strong>: {quantity(line.so_luong_du_bao)} × {quantity(line.khoi_luong_thanh_pham_kg)} ÷ {quantity(line.he_so_thu_hoi)} × {quantity(line.ty_le_phoi_tron)} = {quantity(line.nhu_cau_kg)} kg
                </div>) },
              ]} />
            )}
          </section>
        </>
      ) : <EmptyState title="Chưa có chi tiết dự báo" />}
    </FormDrawer>
  );
}
