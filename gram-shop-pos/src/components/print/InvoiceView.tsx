import type { Invoice } from '../../types'
import { formatDateTime, formatMoney } from '../../utils/format'
import { PAYMENT_LABELS, RETURN_KIND_LABELS } from '../../constants/labels'

function Line({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  if (!value) return null
  return (
    <div className="d-flex justify-content-between mb-1 small text-muted">
      <span>{label}</span>
      <span className={danger ? 'text-danger' : undefined}>
        {danger ? '- ' : ''}
        {formatMoney(value)}
      </span>
    </div>
  )
}

export function InvoiceView({ invoice, thermal }: { invoice: Invoice; thermal?: boolean }) {
  const payable = invoice.payableAmount ?? invoice.total
  return (
    <article className={`invoice-paper ${thermal ? 'thermal' : ''}`}>
      <header className="invoice-head">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-dark text-warning px-2 py-1 fs-6 fw-bold">1G</span>
            <h1 className="h4 fw-bold text-navy-900 mb-0">{invoice.shopName}</h1>
          </div>
          <p className="mb-1 text-muted small">{invoice.businessAddress}</p>
          <p className="mb-1 text-muted small">
            <i className="bi bi-telephone me-1" /> {invoice.businessMobile} &nbsp;·&nbsp;
            <i className="bi bi-envelope me-1" /> {invoice.businessEmail}
          </p>
          {invoice.gstNumber ? (
            <p className="mb-0 small fw-semibold">
              GSTIN: <span className="font-monospace">{invoice.gstNumber}</span>
            </p>
          ) : null}
        </div>
        <div className="text-end">
          <div className="badge bg-warning text-dark px-3 py-1 fs-6 fw-bold mb-2">TAX INVOICE</div>
          <div className="fw-bold fs-5 text-navy-900 font-monospace">{invoice.invoiceNumber}</div>
          <div className="text-muted small mb-1">{formatDateTime(invoice.invoiceDate)}</div>
          <div className="fw-semibold text-dark">{invoice.storeName}</div>
          <div className="text-muted small">{invoice.storeAddress}</div>
          {invoice.salesPersonName ? <div className="text-muted small">Sales Person: {invoice.salesPersonName}</div> : null}
        </div>
      </header>

      <div className="p-3 bg-light rounded-3 mb-3 d-flex justify-content-between align-items-center">
        <div>
          <span className="text-muted small d-block">Billed To Customer</span>
          <strong className="text-navy-900 fs-6">{invoice.customerName || 'Walk-in Customer'}</strong>
          {invoice.customerCode ? <div className="small font-monospace">Customer Code: {invoice.customerCode}</div> : null}
          {invoice.customerAddress ? <div className="small text-muted">{invoice.customerAddress}</div> : null}
        </div>
        {invoice.customerMobile ? (
          <div className="text-end">
            <span className="text-muted small d-block">Customer Contact</span>
            <strong className="font-monospace">{invoice.customerMobile}</strong>
          </div>
        ) : null}
      </div>

      <div className="table-responsive mb-3">
        <table className="table app-table mb-0 align-middle">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description of Goods</th>
              <th className="text-center" style={{ width: '10%' }}>Qty</th>
              <th className="text-end" style={{ width: '12%' }}>Rate</th>
              <th className="text-end" style={{ width: '12%' }}>Disc</th>
              <th className="text-end" style={{ width: '10%' }}>GST</th>
              <th className="text-end" style={{ width: '16%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.products.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="fw-bold text-dark">{p.productName}</div>
                  <div className="small text-muted">{p.productCode}</div>
                </td>
                <td className="text-center fw-semibold">{p.quantity}</td>
                <td className="text-end">{formatMoney(p.rate)}</td>
                <td className="text-end text-muted">{p.discountAmount ? formatMoney(p.discountAmount) : '—'}</td>
                <td className="text-end text-muted">{formatMoney(p.taxAmount)}</td>
                <td className="text-end fw-bold text-navy-900">{formatMoney(p.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoice.adjustments?.length ? (
        <div className="p-3 bg-light rounded-3 mb-3">
          <div className="small fw-bold text-muted mb-2 text-uppercase">Exchange / Return / Buyback</div>
          {invoice.adjustments.map((a) => (
            <div key={a.id} className="d-flex justify-content-between small mb-1">
              <span>
                {RETURN_KIND_LABELS[a.returnKind] ?? a.returnKind} {a.returnNumber}
                {a.items[0] ? ` · ${a.items.map((i) => i.productName).join(', ')}` : ''}
                {a.originalBillNumber ? ` (orig. ${a.originalBillNumber})` : ''}
              </span>
              <strong className="text-danger">- {formatMoney(a.returnAmount)}</strong>
            </div>
          ))}
        </div>
      ) : null}

      <div className="row g-3">
        <div className="col-sm-6">
          <div className="p-3 bg-light rounded-3 h-100">
            <div className="small fw-bold text-muted mb-2 text-uppercase">Payment Method Breakdown</div>
            {invoice.payments.map((p) => (
              <div key={p.id} className="d-flex justify-content-between align-items-center mb-1">
                <span>{PAYMENT_LABELS[p.paymentMode] ?? p.paymentMode}</span>
                <strong className="text-dark">{formatMoney(p.amount)}</strong>
              </div>
            ))}
            {invoice.walletRedeemed ? (
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span>Customer Credit Used</span>
                <strong className="text-dark">{formatMoney(invoice.walletRedeemed)}</strong>
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-sm-6">
          <div className="p-3 border rounded-3 bg-white">
            <div className="d-flex justify-content-between mb-1 small text-muted">
              <span>Items Subtotal</span>
              <span>{formatMoney(invoice.subtotal)}</span>
            </div>
            <Line label="Item / Bill Discount" value={invoice.discount} danger />
            <Line label="Referral Discount" value={invoice.referralDiscount ?? 0} danger />
            <Line label="Birthday Offer" value={invoice.birthdayDiscount ?? 0} danger />
            <Line label="Store Discount" value={invoice.storeDiscount ?? 0} danger />
            <div className="d-flex justify-content-between mb-2 small text-muted">
              <span>Applicable GST Tax</span>
              <span>+ {formatMoney(invoice.tax)}</span>
            </div>
            <div className="d-flex justify-content-between pt-2 border-top mb-2">
              <strong>Total Invoice Value</strong>
              <strong>{formatMoney(invoice.total)}</strong>
            </div>
            <Line label="Return Adjustment" value={invoice.returnAdjustment ?? 0} danger />
            <Line label="Exchange Adjustment" value={invoice.exchangeAdjustment ?? 0} danger />
            <Line label="Buyback Adjustment" value={invoice.buybackAdjustment ?? 0} danger />
            <Line label="Customer Credit Used" value={invoice.walletRedeemed ?? 0} danger />
            {invoice.creditGenerated ? (
              <div className="d-flex justify-content-between mb-1 small text-success">
                <span>Credit Generated</span>
                <span>{formatMoney(invoice.creditGenerated)}</span>
              </div>
            ) : null}
            <div className="d-flex justify-content-between pt-2 border-top mb-2">
              <strong className="fs-5 text-navy-900">Final Payable</strong>
              <strong className="fs-5 text-navy-900">{formatMoney(payable)}</strong>
            </div>
            <div className="d-flex justify-content-between small text-success">
              <span>Total Paid</span>
              <span className="fw-bold">{formatMoney(invoice.amountPaid)}</span>
            </div>
            {invoice.amountDue > 0 ? (
              <div className="d-flex justify-content-between small text-danger fw-bold">
                <span>Pending Balance Due</span>
                <span>{formatMoney(invoice.amountDue)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="mt-4 pt-3 border-top text-center text-muted small">
        <p className="mb-1">{invoice.footer || 'Thank you for your valued patronage!'}</p>
        <p className="mb-0 fst-italic">{invoice.returnPolicy}</p>
      </footer>
    </article>
  )
}
