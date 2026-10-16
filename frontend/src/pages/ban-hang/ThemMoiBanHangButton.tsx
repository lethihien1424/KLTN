///D:\KLTN\KLTN\frontend\src\pages\ban-hang\ThemMoiBanHangButton.tsx


import {

  useEffect,

  useId,

  useRef,

  useState,

  type FormEvent,

} from "react";

import {

  CloseOutlined,

  PlusOutlined,

} from "@ant-design/icons";



import { useDashboardPermissions } from

  "../../components/dashboard/DashboardBase";



import {

  calculateSalesAmount,

  createSalesData,

  formatSalesMoney,

  getSalesCreateCatalog,

  updateSalesData,

  type PendingOrderInput,

  type SalesCreateCatalog,

  type SalesCreateResult,

  type SalesOrderStatus,

  type SalesRow,

} from "../../services/duLieuBanHangService";



type ButtonProps = {

  disabled?: boolean;

  onCreated?: (

    result: SalesCreateResult,

  ) => void | Promise<void>;

};



export default function ThemMoiBanHangButton({

  disabled = false,

  onCreated,

}: ButtonProps) {

  const { loading, can } = useDashboardPermissions();

  const [open, setOpen] = useState(false);



  if (

    loading ||

    !can("du_lieu_ban_hang", "XEM") ||

    !can("du_lieu_ban_hang", "THEM")

  ) {

    return null;

  }



  return (

    <>

      <button

        type="button"

        className="bh-btn bh-primary"

        disabled={disabled}

        onClick={() => setOpen(true)}

      >

        <PlusOutlined />

        Thêm mới

      </button>



      {open && (

        <SalesOrderModal

          onClose={() => setOpen(false)}

          onSaved={async result => {

            setOpen(false);

            await onCreated?.(result);

          }}

        />

      )}

    </>

  );

}



type ModalProps = {

  initial?: SalesRow;

  readOnly?: boolean;

  onClose: () => void;

  onSaved?: (

    result: SalesCreateResult,

  ) => void | Promise<void>;

};



export function SalesOrderModal({

  initial,

  readOnly = false,

  onClose,

  onSaved,

}: ModalProps) {

  const dialogRef = useRef<HTMLDialogElement>(null);

  const savingRef = useRef(false);

  const mountedRef = useRef(false);

  const headingId = useId();



  const [catalog, setCatalog] =

    useState<SalesCreateCatalog | null>(null);

  const [catalogLoading, setCatalogLoading] = useState(true);

  const [catalogError, setCatalogError] = useState("");

  const [retry, setRetry] = useState(0);



  const [orderId, setOrderId] = useState(

    initial?.ma_don_hang ?? "",

  );

  const [productId, setProductId] = useState(

    initial?.ma_san_pham ?? "",

  );

  const [orderDate, setOrderDate] = useState(

    initial?.ngay_ban ?? "",

  );

  const [deliveryDate, setDeliveryDate] = useState(

    initial?.ngay_giao_hang ?? "",

  );

  const [quantity, setQuantity] = useState(

    initial ? String(initial.so_luong) : "",

  );

  const [price, setPrice] = useState(

    initial?.gia_goc === null || initial?.gia_goc === undefined

      ? ""

      : String(initial.gia_goc),

  );

  const [priceFocused, setPriceFocused] = useState(false);



  const [promotion, setPromotion] = useState(

    initial?.co_khuyen_mai ?? false,

  );

  const [campaign, setCampaign] = useState(

    initial?.chuong_trinh_km ?? "",

  );

  const [percent, setPercent] = useState(

    initial

      ? String(Number(

          (Number(initial.muc_giam_gia) * 100).toFixed(2),

        ))

      : "0",

  );



  const [channel, setChannel] = useState(

    initial?.kenh_ban_hang ?? "",

  );

  const [holidayId, setHolidayId] = useState(

    initial?.ma_ngay_le ?? "",

  );

  const [status, setStatus] = useState<SalesOrderStatus>(

    initial?.trang_thai_don_hang ?? "CHO_GIAO_HANG",

  );



  const [saving, setSaving] = useState(false);

  const [saved, setSaved] = useState(false);

  const [error, setError] = useState("");



  const calculation = calculateSalesAmount(

    price,

    quantity,

    promotion ? percent : "0",

  );



  const product = catalog?.san_pham.find(

    item => item.ma === productId,

  );



  useEffect(() => {

    mountedRef.current = true;



    const dialog = dialogRef.current;

    const previousFocus = document.activeElement;

    const previousOverflow = document.body.style.overflow;



    document.body.style.overflow = "hidden";



    if (dialog && !dialog.open) dialog.showModal();



    return () => {

      mountedRef.current = false;

      document.body.style.overflow = previousOverflow;



      if (dialog?.open) dialog.close();



      if (previousFocus instanceof HTMLElement) {

        previousFocus.focus();

      }

    };

  }, []);



  useEffect(() => {

    const controller = new AbortController();



    setCatalogLoading(true);

    setCatalogError("");



    getSalesCreateCatalog(controller.signal)

      .then(result => {

        if (controller.signal.aborted) return;



        if (

          !Array.isArray(result.san_pham) ||

          !Array.isArray(result.ngay_le)

        ) {

          throw new Error("Danh mục trả về không hợp lệ.");

        }



        setCatalog(result);

      })

      .catch(cause => {

        if (!controller.signal.aborted) {

          setCatalogError(

            cause instanceof Error

              ? cause.message

              : "Không tải được danh mục.",

          );

        }

      })

      .finally(() => {

        if (!controller.signal.aborted) {

          setCatalogLoading(false);

        }

      });



    return () => controller.abort();

  }, [retry]);



  function close(): void {

    if (!savingRef.current) onClose();

  }



  function selectProduct(value: string): void {

    setProductId(value);



    const selected = catalog?.san_pham.find(

      item => item.ma === value,

    );



    setPrice(selected ? String(selected.don_gia) : "");

  }



  async function submit(

    event: FormEvent<HTMLFormElement>,

  ): Promise<void> {

    event.preventDefault();



    if (readOnly || savingRef.current || saved) return;



    setError("");



    if (!catalog?.san_pham.some(item => item.ma === productId)) {

      setError("Vui lòng chọn sản phẩm hợp lệ.");

      return;

    }



    if (!orderId.trim() || !orderDate) {

      setError("Vui lòng nhập mã đơn và ngày bán.");

      return;

    }



    if (!calculation) {

      setError(

        "Kiểm tra số lượng, đơn giá và % giảm giá. "

        + "% giảm phải từ 0 đến 100, tối đa 2 số thập phân.",

      );

      return;

    }



    if (

      status === "DA_GIAO_HANG" &&

      !deliveryDate

    ) {

      setError("Vui lòng nhập ngày giao thực tế.");

      return;

    }



    const input: PendingOrderInput = {

      ma_don_hang: orderId.trim(),

      ma_san_pham: productId,

      ngay_ban: orderDate,

      ngay_giao_hang:

        status === "DA_GIAO_HANG" ? deliveryDate : null,

      so_luong: Number(quantity),

      trang_thai_don_hang: status,

      gia_goc: price,

      muc_giam_gia: promotion

        ? (Number(percent) / 100).toFixed(4)

        : "0",

      co_khuyen_mai: promotion,

      chuong_trinh_km: promotion

        ? campaign.trim() || null

        : null,

      kenh_ban_hang: channel.trim() || null,

      ma_ngay_le: holidayId || null,

    };



    savingRef.current = true;

    setSaving(true);



    let result: SalesCreateResult;



    try {

      result = initial

        ? await updateSalesData(initial.ma, input)

        : await createSalesData(input);

    } catch (cause) {

      if (mountedRef.current) {

        setError(

          cause instanceof Error

            ? cause.message

            : "Không thể lưu đơn.",

        );

        setSaving(false);

      }



      savingRef.current = false;

      return;

    }



    savingRef.current = false;



    if (mountedRef.current) {

      setSaving(false);

      setSaved(true);

    }



    try {

      await onSaved?.(result);

    } catch {

      if (mountedRef.current) {

        setError(

          "Đơn đã lưu. Vui lòng đóng modal và tải lại danh sách.",

        );

      }

    }

  }



  const title = readOnly

    ? "Thông tin đơn hàng"

    : initial

      ? "Chỉnh sửa đơn hàng"

      : "Thêm đơn hàng";



  const displayedSale = readOnly

    ? initial?.gia_ban_sau_giam

    : calculation?.salePrice;



  const displayedTotal = readOnly

    ? initial?.thanh_tien

    : calculation?.total;



  return (

    <dialog

      ref={dialogRef}

      className="bh-dialog"

      aria-labelledby={headingId}

      onCancel={event => {

        event.preventDefault();

        close();

      }}

    >

      <header className="bh-dialog-head">

        <div>

          <h2 id={headingId}>{title}</h2>

          <p>

            {readOnly

              ? `Mã ghi nhận: ${initial?.ma ?? ""}`

              : "Thông tin đơn và khuyến mãi áp dụng."}

          </p>

        </div>



        <button

          type="button"

          className="bh-close"

          aria-label="Đóng"

          disabled={saving}

          onClick={close}

        >

          <CloseOutlined />

        </button>

      </header>



      <form onSubmit={event => void submit(event)}>

        <div className="bh-dialog-body">

          {catalogLoading && (

            <p className="bh-muted">Đang tải danh mục...</p>

          )}



          {catalogError && (

            <div className="bh-alert error" role="alert">

              {catalogError}

              <button

                type="button"

                className="bh-btn"

                onClick={() => setRetry(value => value + 1)}

              >

                Tải lại

              </button>

            </div>

          )}



          <fieldset

            className="bh-fieldset"

            disabled={

              readOnly ||

              saving ||

              saved ||

              catalogLoading ||

              !catalog

            }

          >

            <div className="bh-form-grid">

              <label className="bh-field">

                <span>Mã đơn hàng <i aria-hidden="true">*</i></span>

                <input

                  value={orderId}

                  maxLength={50}

                  required

                  onChange={event => setOrderId(event.target.value)}

                />

              </label>



              <label className="bh-field">

                <span>Sản phẩm <i aria-hidden="true">*</i></span>

                <select

                  value={productId}

                  required

                  onChange={event =>

                    selectProduct(event.target.value)

                  }

                >

                  <option value="">Chọn mã SP - tên SP</option>



                  {!product && initial && (

                    <option value={initial.ma_san_pham}>

                      {initial.ma_san_pham} - {initial.ten_san_pham}

                    </option>

                  )}



                  {catalog?.san_pham.map(item => (

                    <option key={item.ma} value={item.ma}>

                      {item.ma} - {item.ten}

                    </option>

                  ))}

                </select>

              </label>



              <label className="bh-field">

                <span>Ngày bán <i aria-hidden="true">*</i></span>

                <input

                  type="date"

                  required

                  value={orderDate}

                  onChange={event => setOrderDate(event.target.value)}

                />

              </label>



              <label className="bh-field">

                <span>Số lượng <i aria-hidden="true">*</i></span>

                <input

                  type="number"

                  min={1}

                  max={2147483647}

                  step={1}

                  required

                  value={quantity}

                  onChange={event => setQuantity(event.target.value)}

                />

              </label>



              <label className="bh-field">

                <span>Đơn giá <i aria-hidden="true">*</i></span>

                <input

                  type="text"

                  inputMode="decimal"

                  required={!readOnly}

                  value={

                    priceFocused

                      ? price

                      : price ? formatSalesMoney(price) : ""

                  }

                  onFocus={() => setPriceFocused(true)}

                  onBlur={() => setPriceFocused(false)}

                  onChange={event => {

                    const value = event.target.value.replace(/,/g, "");



                    if (/^\d*(?:\.\d{0,2})?$/.test(value)) {

                      setPrice(value);

                    }

                  }}

                />

                <small>{product?.don_vi_tien_te || "VND"}</small>

              </label>



              <label className="bh-field">

                <span>Khuyến mãi</span>

                <select

                  value={promotion ? "yes" : "no"}

                  onChange={event => {

                    const enabled = event.target.value === "yes";

                    setPromotion(enabled);



                    if (!enabled) {

                      setCampaign("");

                      setPercent("0");

                    }

                  }}

                >

                  <option value="no">Không có khuyến mãi</option>

                  <option value="yes">Có khuyến mãi</option>

                </select>

              </label>



              {promotion && (

                <>

                  <label className="bh-field">

                    <span>Tên chương trình khuyến mãi</span>

                    <input

                      maxLength={150}

                      value={campaign}

                      placeholder="Ví dụ: Ưu đãi tháng 10"

                      onChange={event =>

                        setCampaign(event.target.value)

                      }

                    />

                  </label>



                  <label className="bh-field">

                    <span>Giảm giá (%) <i aria-hidden="true">*</i></span>

                    <input

                      type="number"

                      min={0}

                      max={100}

                      step={0.01}

                      required

                      value={percent}

                      onChange={event => setPercent(event.target.value)}

                    />

                  </label>

                </>

              )}



              <label className="bh-field">

                <span>Đơn giá sau giảm</span>

                <input

                  readOnly

                  value={formatSalesMoney(displayedSale)}

                />

              </label>



              <label className="bh-field">

                <span>Thành tiền</span>

                <input

                  readOnly

                  className="bh-total"

                  value={formatSalesMoney(displayedTotal)}

                />

              </label>



              <label className="bh-field">

                <span>Kênh bán hàng</span>

                <input

                  maxLength={50}

                  value={channel}

                  onChange={event => setChannel(event.target.value)}

                />

              </label>



              <label className="bh-field">

                <span>Ngày lễ</span>

                <select

                  value={holidayId}

                  onChange={event => setHolidayId(event.target.value)}

                >

                  <option value="">Không chọn</option>

                  {catalog?.ngay_le.map(item => (

                    <option key={item.ma} value={item.ma}>

                      {item.ten}

                    </option>

                  ))}

                </select>

              </label>



              <label className="bh-field">

                <span>Trạng thái đơn</span>

                <select

                  value={status}

                  disabled={!initial}

                  onChange={event => {

                    const next =

                      event.target.value as SalesOrderStatus;



                    setStatus(next);



                    if (next === "CHO_GIAO_HANG") {

                      setDeliveryDate("");

                    }

                  }}

                >

                  <option value="CHO_GIAO_HANG">Chờ giao hàng</option>

                  <option value="DA_GIAO_HANG">Đã giao hàng</option>

                </select>

              </label>



              {status === "DA_GIAO_HANG" && (

                <label className="bh-field">

                  <span>Ngày giao thực tế <i aria-hidden="true">*</i></span>

                  <input

                    type="date"

                    min={orderDate || undefined}

                    required={!readOnly}

                    value={deliveryDate}

                    onChange={event =>

                      setDeliveryDate(event.target.value)

                    }

                  />

                </label>

              )}

            </div>

          </fieldset>



          {error && (

            <div className="bh-alert error" role="alert">

              {error}

            </div>

          )}



          {saved && (

            <div className="bh-alert success" role="status">

              Đã lưu đơn hàng.

            </div>

          )}

        </div>



        <footer className="bh-dialog-foot">

          <button

            type="button"

            className="bh-btn"

            disabled={saving}

            onClick={close}

          >

            {readOnly ? "Đóng" : "Hủy"}

          </button>



          {!readOnly && (

            <button

              type="submit"

              className="bh-btn bh-primary"

              disabled={

                saving || saved || catalogLoading || !catalog

              }

            >

              {saving

                ? "Đang lưu..."

                : initial ? "Lưu thay đổi" : "Thêm đơn"}

            </button>

          )}

        </footer>

      </form>

    </dialog>

  );

}
