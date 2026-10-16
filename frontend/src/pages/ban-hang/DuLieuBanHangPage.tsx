/// D:\KLTN\KLTN\frontend\src\pages\ban-hang\DuLieuBanHangPage.tsx


import {

  useEffect,

  useRef,

  useState,

  type ChangeEvent,

} from "react";

import {

  DownloadOutlined,

  EditOutlined,

  EyeOutlined,

  FileTextOutlined,

  LockOutlined,

  ReloadOutlined,

  UploadOutlined,

} from "@ant-design/icons";



import { useDashboardPermissions } from

  "../../components/dashboard/DashboardBase";



import {

  exportSalesData,

  exportSalesTemplate,

  formatSalesMoney,

  getSalesData,

  importSalesFile,

  type SalesList,

  type SalesOrderStatus,

  type SalesRow,

} from "../../services/duLieuBanHangService";



import ThemMoiBanHangButton, {

  SalesOrderModal,

} from "./ThemMoiBanHangButton";



const PAGE_SIZE = 20;



function formatDate(value: string | null): string {

  if (!value) return "—";



  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);



  return match

    ? `${match[3]}/${match[2]}/${match[1]}`

    : value;

}



function editBlockReason(row: SalesRow): string {

  if (row.trang_thai_don_hang !== "CHO_GIAO_HANG") {

    return "Đơn đã giao hàng nên không thể chỉnh sửa";

  }



  if (row.trang_thai_san_xuat !== "CHO_SAN_XUAT") {

    return "Đơn đã đưa vào sản xuất nên không thể chỉnh sửa";

  }



  return "";

}



function message(cause: unknown): string {

  return cause instanceof Error

    ? cause.message

    : "Không thể thực hiện thao tác.";

}



export default function DuLieuBanHangPage() {

  const { loading: permissionsLoading, can } =

    useDashboardPermissions();



  const canView = can("du_lieu_ban_hang", "XEM");

  const canEdit = can("du_lieu_ban_hang", "SUA");

  const canImport = can("du_lieu_ban_hang", "NHAP_FILE");

  const canExport = can("du_lieu_ban_hang", "XUAT_EXCEL");



  const fileRef = useRef<HTMLInputElement>(null);

  const busyRef = useRef(false);



  const [search, setSearch] = useState("");

  const [query, setQuery] = useState("");

  const [status, setStatus] =

    useState<SalesOrderStatus | "">("");

  const [page, setPage] = useState(1);

  const [version, setVersion] = useState(0);



  const [data, setData] = useState<SalesList>({

    items: [],

    total: 0,

    page: 1,

    page_size: PAGE_SIZE,

  });



  const [loading, setLoading] = useState(false);

  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [notice, setNotice] = useState("");



  const [modal, setModal] = useState<{

    row: SalesRow;

    readOnly: boolean;

  } | null>(null);



  useEffect(() => {

    const timer = window.setTimeout(() => {

      setQuery(search.trim());

      setPage(1);

    }, 300);



    return () => window.clearTimeout(timer);

  }, [search]);



  useEffect(() => {

    if (permissionsLoading || !canView) return;



    const controller = new AbortController();



    setLoading(true);

    setError("");



    getSalesData(

      { search: query, trangThai: status },

      page,

      PAGE_SIZE,

      controller.signal,

    )

      .then(result => {

        if (controller.signal.aborted) return;



        if (

          !Array.isArray(result.items) ||

          !Number.isInteger(result.total)

        ) {

          throw new Error("Danh sách trả về không hợp lệ.");

        }



        const lastPage = Math.max(

          1,

          Math.ceil(result.total / PAGE_SIZE),

        );



        if (page > lastPage) {

          setPage(lastPage);

          return;

        }



        setData(result);

      })

      .catch(cause => {

        if (!controller.signal.aborted) {

          setError(message(cause));

        }

      })

      .finally(() => {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      });



    return () => controller.abort();

  }, [

    permissionsLoading,

    canView,

    query,

    status,

    page,

    version,

  ]);



  useEffect(() => {

    if (!notice) return;



    const timer = window.setTimeout(

      () => setNotice(""),

      6000,

    );



    return () => window.clearTimeout(timer);

  }, [notice]);



  useEffect(() => {

    if (modal && (

      !canView ||

      (!modal.readOnly && !canEdit)

    )) {

      setModal(null);

    }

  }, [canView, canEdit, modal]);



  async function run(

    action: () => Promise<void>,

  ): Promise<void> {

    if (busyRef.current) return;



    busyRef.current = true;

    setBusy(true);

    setError("");

    setNotice("");



    try {

      await action();

    } catch (cause) {

      setError(message(cause));

    } finally {

      busyRef.current = false;

      setBusy(false);

    }

  }



  function upload(

    event: ChangeEvent<HTMLInputElement>,

  ): void {

    const file = event.target.files?.[0];

    event.target.value = "";



    if (!file) return;



    if (!/\.(xlsx|csv)$/i.test(file.name)) {

      setError("Chỉ nhận file .xlsx hoặc .csv.");

      return;

    }



    if (

      file.size === 0 ||

      file.size > 10 * 1024 * 1024

    ) {

      setError("File phải có dữ liệu và không vượt quá 10 MB.");

      return;

    }



    void run(async () => {

      const result = await importSalesFile(file);



      if (!result.success) {

        throw new Error(result.message);

      }



      setPage(1);

      setVersion(value => value + 1);

      setNotice(`Đã nhập ${result.imported_rows} dòng dữ liệu.`);

    });

  }



  if (permissionsLoading) {

    return (

      <section className="dashboard-panel bh-page">

        Đang kiểm tra quyền...

      </section>

    );

  }



  if (!canView) {

    return (

      <section className="dashboard-panel bh-page">

        Bạn chưa có quyền xem dữ liệu bán hàng.

      </section>

    );

  }



  const lastPage = Math.max(

    1,

    Math.ceil(data.total / PAGE_SIZE),

  );



  return (

    <section className="bh-page bh-card">

      <div className="bh-page-header">

        <div className="bh-header-main">

          <span className="bh-header-icon" aria-hidden="true">

            <FileTextOutlined />

          </span>



          <div className="bh-header-text">

            <h2>Dữ liệu bán hàng</h2>

            <p>

              Quản lý đơn hàng, giá bán và chương trình khuyến mãi.

            </p>

          </div>

        </div>

      </div>



      <div className="bh-section-head">

        <div className="bh-section-title">

          <h3>Danh sách đơn hàng</h3>

          <p>Nhấn vào biểu tượng ở cột thao tác để xem hoặc chỉnh sửa.</p>

        </div>



        <div className="bh-toolbar">

          {canImport && (

            <>

              <button

                type="button"

                className="bh-btn"

                disabled={busy}

                onClick={() => fileRef.current?.click()}

              >

                <UploadOutlined />

                Upload file

              </button>



              <input

                ref={fileRef}

                type="file"

                accept=".xlsx,.csv"

                hidden

                onChange={upload}

              />

            </>

          )}



          {canExport && (

            <button

              type="button"

              className="bh-btn"

              disabled={busy || loading}

              onClick={() => void run(async () => {

                await exportSalesData({

                  search: query,

                  trangThai: status,

                });

                setNotice("Đã xuất Excel.");

              })}

            >

              <DownloadOutlined />

              Xuất Excel

            </button>

          )}



          <ThemMoiBanHangButton

            disabled={busy}

            onCreated={result => {

              setPage(1);

              setVersion(value => value + 1);

              setNotice(`Đã thêm đơn ${result.ma_don_hang}.`);

            }}

          />



          {canImport && (

            <button

              type="button"

              className="bh-btn"

              disabled={busy}

              onClick={() => void run(async () => {

                await exportSalesTemplate();

                setNotice("Đã xuất template.");

              })}

            >

              <DownloadOutlined />

              Xuất template

            </button>

          )}

        </div>

      </div>



      <div className="bh-filters">

        <input

          aria-label="Tìm kiếm đơn hàng"

          placeholder="Tìm mã đơn, mã SP, tên sản phẩm..."

          value={search}

          onChange={event => setSearch(event.target.value)}

        />



        <select

          aria-label="Lọc trạng thái"

          value={status}

          onChange={event => {

            setStatus(

              event.target.value as SalesOrderStatus | "",

            );

            setPage(1);

          }}

        >

          <option value="">Tất cả trạng thái</option>

          <option value="CHO_GIAO_HANG">Chờ giao hàng</option>

          <option value="DA_GIAO_HANG">Đã giao hàng</option>

        </select>



        <button

          type="button"

          className="bh-btn"

          disabled={loading || busy}

          onClick={() => setVersion(value => value + 1)}

        >

          <ReloadOutlined />

          Tải lại

        </button>

      </div>



      {notice && (

        <div className="bh-alert success" role="status">

          {notice}

        </div>

      )}



      {error && (

        <div className="bh-alert error" role="alert">

          {error}

        </div>

      )}



      <div className="bh-table-wrap" aria-busy={loading}>

        <table className="bh-table">

          <thead>

            <tr>

              <th>Mã đơn hàng</th>

              <th>Sản phẩm</th>

              <th>Ngày bán</th>

              <th>Ngày giao</th>

              <th>Số lượng</th>

              <th>Đơn giá</th>

              <th>CTKM</th>

              <th>Giảm (%)</th>

              <th>Giá sau giảm</th>

              <th>Thành tiền</th>

              <th>Trạng thái</th>

              <th className="bh-action-cell">Thao tác</th>

            </tr>

          </thead>



          <tbody>

            {loading && (

              <tr>

                <td colSpan={12} className="bh-empty">

                  Đang tải dữ liệu...

                </td>

              </tr>

            )}



            {!loading && error && (

              <tr>

                <td colSpan={12} className="bh-empty">

                  Không tải được danh sách. Vui lòng thử lại.

                </td>

              </tr>

            )}



            {!loading && !error && data.items.length === 0 && (

              <tr>

                <td colSpan={12} className="bh-empty">

                  Không có dữ liệu phù hợp.

                </td>

              </tr>

            )}



            {!loading && !error && data.items.map(row => (

              <tr key={row.ma}>

                <td>{row.ma_don_hang}</td>



                <td>

                  <strong>{row.ten_san_pham}</strong>

                  <div className="bh-muted">{row.ma_san_pham}</div>

                </td>



                <td>{formatDate(row.ngay_ban)}</td>

                <td>{formatDate(row.ngay_giao_hang)}</td>



                <td className="bh-number">

                  {formatSalesMoney(row.so_luong)}

                </td>

                <td className="bh-number">

                  {formatSalesMoney(row.gia_goc)}

                </td>



                <td>

                  {row.co_khuyen_mai

                    ? row.chuong_trinh_km || "Có khuyến mãi"

                    : "Không"}

                </td>



                <td className="bh-number">

                  {Number(

                    (Number(row.muc_giam_gia) * 100).toFixed(2),

                  )}

                  %

                </td>



                <td className="bh-number">

                  {formatSalesMoney(row.gia_ban_sau_giam)}

                </td>



                <td className="bh-number bh-amount">

                  {formatSalesMoney(row.thanh_tien)}

                </td>



                <td>

                  <span

                    className={

                      row.trang_thai_don_hang === "CHO_GIAO_HANG"

                        ? "bh-status pending"

                        : "bh-status delivered"

                    }

                  >

                    {row.trang_thai_don_hang === "CHO_GIAO_HANG"

                      ? "Chờ giao hàng"

                      : "Đã giao hàng"}

                  </span>

                </td>



                <td className="bh-action-cell">

                  <div className="bh-actions">

                    <button

                      type="button"

                      className="bh-icon-btn"

                      title="Xem đơn"

                      aria-label={`Xem đơn ${row.ma_don_hang}`}

                      onClick={() => setModal({

                        row,

                        readOnly: true,

                      })}

                    >

                      <EyeOutlined />

                    </button>



                    {canEdit && (

                      editBlockReason(row) ? (

                        <button

                          type="button"

                          className="bh-icon-btn locked"

                          title={editBlockReason(row)}

                          aria-label={editBlockReason(row)}

                          disabled

                        >

                          <LockOutlined />

                        </button>

                      ) : (

                        <button

                          type="button"

                          className="bh-icon-btn edit"

                          title="Chỉnh sửa đơn"

                          aria-label={

                            `Chỉnh sửa đơn ${row.ma_don_hang}`

                          }

                          onClick={() => setModal({

                            row,

                            readOnly: false,

                          })}

                        >

                          <EditOutlined />

                        </button>

                      )

                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>



      <div className="bh-pagination">

        <span>Tổng {data.total} dòng</span>



        <div>

          <button

            type="button"

            className="bh-btn"

            disabled={page <= 1 || loading || busy}

            onClick={() => setPage(value => value - 1)}

          >

            Trước

          </button>



          <span>Trang {page}/{lastPage}</span>



          <button

            type="button"

            className="bh-btn"

            disabled={page >= lastPage || loading || busy}

            onClick={() => setPage(value => value + 1)}

          >

            Sau

          </button>

        </div>

      </div>



      {modal && (

        <SalesOrderModal

          key={`${modal.row.ma}-${modal.readOnly}`}

          initial={modal.row}

          readOnly={modal.readOnly}

          onClose={() => setModal(null)}

          onSaved={result => {

            setModal(null);

            setVersion(value => value + 1);

            setNotice(`Đã cập nhật đơn ${result.ma_don_hang}.`);

          }}

        />

      )}

    </section>

  );

}
