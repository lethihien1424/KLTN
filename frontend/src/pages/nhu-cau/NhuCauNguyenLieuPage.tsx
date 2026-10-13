import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { navigate } from "../../routes/navigation";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  SearchInput,
  FilterSelect,
  Field,
  LoadingState,
  ErrorState,
  EmptyState,
  useResource,
  formatNumber,
  number,
  formatDate,
} from "../../components/common/PurchaseUI";
import { api } from "../../services/apiClient";
import { layLichSuDuBao } from "../../services/duBaoService";
import type { Demand } from "../../services/purchaseTypes";
export default function NhuCauNguyenLieuPage({
  forecast = "",
}: {
  forecast?: string;
}) {
  const { can } = useAuth();
  const [selected, setSelected] = useState(forecast);
  const [draft, setDraft] = useState(forecast);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const history = useResource(
    () => (can("DU_BAO_VIEW") ? layLichSuDuBao() : Promise.resolve([])),
    [can("DU_BAO_VIEW")],
  );
  const resource = useResource(
    () =>
      selected
        ? api<Demand>(`/nhu-cau-nguyen-lieu/${encodeURIComponent(selected)}`)
        : Promise.resolve(null),
    [selected],
  );
  const rows = useMemo(
    () =>
      (resource.data?.chi_tiet ?? []).filter(
        (r) =>
          (!status ||
            (status === "CAN_NHAP") === number(r.so_luong_can_mua_kg) > 0) &&
          `${r.ma_nguyen_lieu} ${r.ten_nguyen_lieu}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [resource.data, search, status],
  );
  return (
    <>
      <PageHeader
        title="Nhu cầu nguyên liệu"
        description="Chuyển kết quả dự báo thành nhu cầu mua nguyên liệu theo BOM và tồn kho."
        actions={
          can("DU_BAO_VIEW") && (
            <a className="pm-btn" href="#/du-bao">
              Xem dự báo
            </a>
          )
        }
      />
      <section className="pm-panel">
        <form
          className="pm-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setSelected(draft.trim());
          }}
        >
          <Field label="Lần dự báo">
            {history.data?.length ? (
              <select
                required
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              >
                <option value="">Chọn lần dự báo</option>
                {history.data.map((r) => (
                  <option key={r.ma_lich_su_du_bao} value={r.ma_lich_su_du_bao}>
                    {r.ma_lich_su_du_bao} · {formatDate(r.thoi_gian_chay)} ·{" "}
                    {r.so_tuan_du_bao} tuần
                  </option>
                ))}
              </select>
            ) : (
              <input
                required
                placeholder="Nhập mã lần dự báo"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            )}
          </Field>
          <button
            className="pm-btn primary"
            type="submit"
            disabled={!draft.trim()}
          >
            Xem nhu cầu
          </button>
          {selected && (
            <button className="pm-btn" type="button" onClick={resource.refetch}>
              Tính lại
            </button>
          )}
        </form>
        {history.error && (
          <ErrorState message={history.error} retry={history.refetch} />
        )}
      </section>
      {!selected ? (
        <EmptyState
          title="Chọn một lần dự báo"
          description="Số liệu nhu cầu sẽ được tính từ kết quả dự báo đã lưu."
        />
      ) : resource.loading ? (
        <LoadingState />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.refetch} />
      ) : (
        <>
          <div className="pm-cards">
            <SummaryCard
              label="Nguyên liệu"
              value={resource.data?.chi_tiet.length ?? 0}
            />
            <SummaryCard
              label="Cần mua"
              value={
                resource.data?.chi_tiet.filter(
                  (r) => number(r.so_luong_can_mua_kg) > 0,
                ).length ?? 0
              }
            />
            <SummaryCard
              label="Tổng nhu cầu (kg)"
              value={formatNumber(
                resource.data?.chi_tiet.reduce(
                  (s, r) => s + number(r.nhu_cau_du_bao_kg),
                  0,
                ),
              )}
            />
            <SummaryCard
              label="Tổng cần mua (kg)"
              value={formatNumber(
                resource.data?.chi_tiet.reduce(
                  (s, r) => s + number(r.so_luong_can_mua_kg),
                  0,
                ),
              )}
            />
          </div>
          <section className="pm-panel">
            <div className="pm-toolbar">
              <SearchInput value={search} onChange={setSearch} />
              <FilterSelect
                label="Nhu cầu mua"
                value={status}
                onChange={setStatus}
                options={[
                  { value: "", label: "Tất cả" },
                  { value: "CAN_NHAP", label: "Cần mua" },
                  { value: "DU_TON", label: "Đủ tồn" },
                ]}
              />
            </div>
            <DataTable
              rows={rows}
              rowKey={(r) => r.ma_nguyen_lieu}
              columns={[
                {
                  key: "name",
                  label: "Nguyên liệu",
                  render: (r) => (
                    <>
                      <strong>{r.ten_nguyen_lieu}</strong>
                      <div className="pm-small">{r.ma_nguyen_lieu}</div>
                    </>
                  ),
                },
                ...(
                  [
                    "nhu_cau_du_bao_kg",
                    "ton_kho_kha_dung",
                    "ton_kho_an_toan",
                    "so_luong_dang_ve",
                    "so_luong_thieu_kg",
                    "ton_kho_toi_da",
                    "so_luong_can_mua_kg",
                  ] as const
                ).map((key, i) => ({
                  key,
                  label: [
                    "Nhu cầu (kg)",
                    "Khả dụng",
                    "An toàn",
                    "Đang về",
                    "Thiếu",
                    "Tối đa",
                    "Cần mua (kg)",
                  ][i],
                  numeric: true,
                  render: (r: Demand["chi_tiet"][number]) => (
                    <span
                      style={
                        key === "so_luong_can_mua_kg" && number(r[key]) > 0
                          ? { color: "#2563eb", fontWeight: 700 }
                          : undefined
                      }
                    >
                      {formatNumber(r[key])}
                    </span>
                  ),
                })),
                {
                  key: "status",
                  label: "Nhu cầu mua",
                  render: (r) => (
                    <StatusBadge
                      status={
                        number(r.so_luong_can_mua_kg) > 0
                          ? "CAN_NHAP"
                          : "BINH_THUONG"
                      }
                    />
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  render: (r) =>
                    can("GOI_Y_NHA_CUNG_CAP_VIEW") &&
                    number(r.so_luong_can_mua_kg) > 0 && (
                      <button
                        className="pm-link"
                        onClick={() =>
                          navigate("/goi-y", {
                            material: r.ma_nguyen_lieu,
                            qty: r.so_luong_can_mua_kg,
                            forecast: selected,
                          })
                        }
                      >
                        Xem NCC →
                      </button>
                    ),
                },
              ]}
            />
          </section>
        </>
      )}
    </>
  );
}
