import { formatDateTime, formatMoney } from '../../utils/format'
import { RETURN_KIND_LABELS, REPAIR_STATUS_LABELS, PAYMENT_LABELS } from '../../constants/labels'
import type { RepairJob, ReturnRecord } from '../../types'

export interface ReceiptField {
  label: string
  value: string
}

export function ReceiptView({
  shopName,
  title,
  fields,
  accent,
  items,
  totals,
  footer,
}: {
  shopName: string
  title: string
  fields: ReceiptField[]
  accent?: string
  items?: { name: string; qty?: string; amount?: string; meta?: string }[]
  totals?: ReceiptField[]
  footer?: string
}) {
  return (
    <article className="invoice-paper receipt-paper">
      <header className="invoice-head">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="brand-mark" style={{ width: 36, height: 36, fontSize: '0.95rem' }}>1G</span>
            <h1 className="h4 text-navy-900 mb-0" style={{ fontFamily: 'var(--font-display)', fontWeight: 650 }}>{shopName}</h1>
          </div>
        </div>
        <div className="text-end">
          <div className={`badge px-3 py-1 fs-6 fw-bold mb-2 ${accent || 'bg-warning text-dark'}`}>{title}</div>
        </div>
      </header>
      <div className="row g-2">
        {fields.map((f) => (
          <div key={f.label} className="col-sm-6">
            <div className="small text-muted">{f.label}</div>
            <div className="fw-semibold text-navy-900 text-break">{f.value || '—'}</div>
          </div>
        ))}
      </div>
      {items?.length ? (
        <div className="table-responsive mt-3">
          <table className="table app-table mb-0">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-end">Qty</th>
                <th className="text-end">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={`${item.name}-${idx}`}>
                  <td>
                    <div className="fw-semibold">{item.name}</div>
                    {item.meta ? <div className="small text-muted">{item.meta}</div> : null}
                  </td>
                  <td className="text-end">{item.qty || '—'}</td>
                  <td className="text-end">{item.amount || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {totals?.length ? (
        <div className="p-3 bg-light rounded-3 mt-3">
          {totals.map((t) => (
            <div key={t.label} className="d-flex justify-content-between small mb-1">
              <span className="text-muted">{t.label}</span>
              <strong>{t.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      <p className="small text-muted mt-4 mb-0">{footer || 'Thank you for choosing us.'}</p>
    </article>
  )
}

export function moneyField(label: string, value: number): ReceiptField {
  return { label, value: formatMoney(value) }
}

export function dateField(label: string, value?: string | null): ReceiptField {
  return { label, value: value ? formatDateTime(value) : '—' }
}

export function returnKindTitle(kind?: number) {
  if (kind === 2) return 'Exchange Receipt'
  if (kind === 3) return 'Buyback Receipt'
  return 'Return Receipt'
}

export function returnKindAccent(kind?: number) {
  if (kind === 2) return 'bg-info text-dark'
  if (kind === 3) return 'bg-success text-white'
  return 'bg-warning text-dark'
}

export function ReturnDocumentReceipt({ record }: { record: ReturnRecord }) {
  return (
    <ReceiptView
      shopName={record.storeName || 'Gram Shop'}
      title={returnKindTitle(record.returnKind)}
      accent={returnKindAccent(record.returnKind)}
      fields={[
        { label: 'Store', value: record.storeName || '—' },
        { label: 'Customer', value: record.customerName || '—' },
        { label: 'Customer code', value: record.customerCode || '—' },
        { label: 'Mobile', value: record.customerMobile || '—' },
        { label: 'Transaction number', value: record.returnNumber },
        { label: 'Date and time', value: formatDateTime(record.returnDate) },
        { label: 'Transaction type', value: RETURN_KIND_LABELS[record.returnKind] ?? String(record.returnKind) },
        { label: 'Original invoice', value: record.originalBillNumber },
        { label: 'Applied to sale', value: record.appliedToBillNumber || '—' },
        { label: 'Received by', value: record.salesPersonName || '—' },
      ]}
      items={record.items?.map((i) => ({
        name: i.productName,
        meta: i.productCode,
        qty: String(i.quantity),
        amount: formatMoney(i.total),
      }))}
      totals={[
        { label: 'Original value', value: formatMoney(record.grossAmount ?? record.returnAmount) },
        { label: 'Deduction', value: formatMoney(record.deductionAmount ?? 0) },
        { label: 'Final amount', value: formatMoney(record.returnAmount) },
      ]}
    />
  )
}

export function RepairDocumentReceipt({ job, shopName }: { job: RepairJob; shopName?: string }) {
  const charge = job.finalAmount || job.estimatedAmount
  return (
    <ReceiptView
      shopName={shopName || 'Gram Shop'}
      title={job.jobType === 2 ? 'Polish Receipt' : 'Repair Receipt'}
      accent={job.jobType === 2 ? 'bg-info text-dark' : 'bg-warning text-dark'}
      fields={[
        { label: 'Customer', value: job.customerName },
        { label: 'Customer code', value: job.customerCode || '—' },
        { label: 'Mobile', value: job.mobileNumber },
        { label: job.jobType === 2 ? 'Polish number' : 'Repair number', value: job.jobNumber },
        { label: 'Date and time', value: formatDateTime(job.receivedDate) },
        { label: 'Product', value: job.productName },
        { label: 'Description', value: job.productDetails || job.notes || '—' },
        { label: 'Status', value: REPAIR_STATUS_LABELS[job.status] ?? String(job.status) },
        { label: 'Payment mode', value: job.paymentMode ? PAYMENT_LABELS[job.paymentMode] ?? String(job.paymentMode) : '—' },
        { label: 'Reference', value: job.paymentReference || '—' },
      ]}
      totals={[
        { label: 'Estimated amount', value: formatMoney(job.estimatedAmount) },
        { label: 'Final amount', value: formatMoney(charge) },
        { label: 'Paid amount', value: formatMoney(job.paidAmount) },
        { label: 'Due amount', value: formatMoney(job.dueAmount) },
      ]}
    />
  )
}
