import RecordHistoryButton from "../../components/common/RecordHistoryButton";
import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { navigate } from "../../routes/navigation";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  SummaryCard,
  StatusBadge,
  StatusTabs,
  SearchInput,
  Field,
  LoadingState,
  ErrorState,
  useResource,
  formatDate,
} from "../../components/common/PurchaseUI";
import { listProposals } from "../../services/deXuatService";
export default function DeXuatNhapHangPage() {
  const { can } = useAuth();
  const resource = useResource(listProposals);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const rows = useMemo(
    () =>
      (resource.data ?? []).filter(
        (r) =>
          (!status || r.trang_thai === status) &&
          (!date || r.ngay_de_xuat_nhap_hang === date) &&
          `${r.ma_de_xuat} ${r.nguoi_tao ?? ""} ${r.ghi_chu ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [resource.data, status, search, date],
  );
  return (
    <>
      <PageHeader
        title="Đề xuất nhập hàng"
        description="Tạo và theo dõi các đề xuất mua nguyên liệu."
        actions={
          can("DE_XUAT_NHAP_HANG_CREATE") && (
            <a className="pm-btn primary" href="#/de-xuat/tao">
              + Tạo đề xuất
            </a>
          )
        }
      />
      <div className="pm-cards">
        <SummaryCard
          label="Tổng đề xuất"
          value={resource.data?.length ?? "—"}
        />
        <SummaryCard
          label="Chờ duyệt"
          value={
            resource.data?.filter((r) => r.trang_thai === "CHO_DUYET").length ??
            "—"
          }
        />
        <SummaryCard
          label="Đã duyệt"
          value={
            resource.data?.filter((r) => r.trang_thai === "DA_DUYET").length ??
            "—"
          }
        />
        <SummaryCard
          label="Từ chối"
          value={
            resource.data?.filter((r) => r.trang_thai === "TU_CHOI").length ??
            "—"
          }
        />
      </div>
      <section className="pm-panel">
        <StatusTabs
          value={status}
          onChange={setStatus}
          options={[
            ["", "Tất cả"],
            ["CHO_DUYET", "Chờ duyệt"],
            ["DA_DUYET", "Đã duyệt"],
            ["TU_CHOI", "Từ chối"],
          ]}
        />
        <div className="pm-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <Field label="Ngày đề xuất">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <button className="pm-btn" onClick={resource.refetch}>
            Làm mới
          </button>
        </div>
        {resource.loading ? (
          <LoadingState />
        ) : resource.error ? (
          <ErrorState message={resource.error} retry={resource.refetch} />
        ) : (
          <DataTable
            rows={rows}
            rowKey={(r) => r.ma_de_xuat}
            onRowClick={(r) => navigate(`/de-xuat/${r.ma_de_xuat}`)}
            columns={[
              { key: "id", label: "Mã đề xuất", render: (r) => r.ma_de_xuat },
              {
                key: "date",
                label: "Ngày tạo",
                render: (r) => formatDate(r.ngay_tao_de_xuat),
              },
              {
                key: "creator",
                label: "Người tạo",
                render: (r) => r.nguoi_tao ?? "—",
              },
              {
                key: "note",
                label: "Ghi chú",
                render: (r) => r.ghi_chu ?? "—",
              },
              {
                key: "status",
                label: "Trạng thái",
                render: (r) => <StatusBadge status={r.trang_thai} />,
              },
              {
                key: "actions",
                label: "",
                render: (r) => (
                  <div className="pm-actions"><button
                    className="pm-link"
                    onClick={() => navigate(`/de-xuat/${r.ma_de_xuat}`)}
                  >
                    Chi tiết →
                  </button>
                    <RecordHistoryButton entity="de-xuat-nhap-hang" code={r.ma_de_xuat} />
                  </div>
                ),
              },
            ]}
          />
        )}
      </section>
    </>
  );
}
