import type { Invoice } from '../../types'
import { formatDateTime, formatMoney } from '../../utils/format'
import { PAYMENT_LABELS } from '../../constants/labels'

export function InvoiceView({ invoice, thermal }: { invoice: Invoice; thermal?: boolean }) {
  return (
    <article className={`invoice-paper ${thermal ? 'thermal' : ''}`}>
      <header className="invoice-head">
        <div>
          <h1>{invoice.shopName}</h1>
          <p className="mb-0">{invoice.businessAddress}</p>
          <p className="mb-0">
            {invoice.businessMobile} {invoice.businessEmail}
          </p>
          {invoice.gstNumber ? <p>GSTIN {invoice.gstNumber}</p> : null}
        </div>
        <div className="text-end">
          <strong>{invoice.invoiceNumber}</strong>
          <div>{formatDateTime(invoice.invoiceDate)}</div>
          <div>{invoice.storeName}</div>
          <div>{invoice.storeAddress}</div>
        </div>
      </header>
      <p>
        <strong>Customer:</strong> {invoice.customerName || 'Walk-in'} {invoice.customerMobile} {invoice.customerAddress}
      </p>
      <table className="table app-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Disc</th>
            <th>Tax</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.productName}
                <div className="small text-muted">{p.productCode}</div>
              </td>
              <td>{p.quantity}</td>
              <td>{formatMoney(p.rate)}</td>
              <td>{formatMoney(p.discountAmount)}</td>
              <td>{formatMoney(p.taxAmount)}</td>
              <td>{formatMoney(p.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-end">
        <div>Subtotal {formatMoney(invoice.subtotal)}</div>
        <div>Discount {formatMoney(invoice.discount)}</div>
        <div>Tax {formatMoney(invoice.tax)}</div>
        <h3>Total {formatMoney(invoice.total)}</h3>
        <div>Paid {formatMoney(invoice.amountPaid)}</div>
        <div>Due {formatMoney(invoice.amountDue)}</div>
      </div>
      <p className="mt-2">
        {invoice.payments.map((p) => (
          <span key={p.id} className="me-2">
            {PAYMENT_LABELS[p.paymentMode] ?? p.paymentMode}: {formatMoney(p.amount)}
          </span>
        ))}
      </p>
      <footer className="mt-3 small">
        <p>{invoice.footer}</p>
        <p>{invoice.returnPolicy}</p>
      </footer>
    </article>
  )
}
