import { formatDateTime, formatMoney } from '../../utils/format'

export interface ReceiptField {
  label: string
  value: string
}

export function ReceiptView({
  shopName,
  title,
  fields,
  accent,
}: {
  shopName: string
  title: string
  fields: ReceiptField[]
  accent?: string
}) {
  return (
    <article className="invoice-paper receipt-paper">
      <header className="invoice-head">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-dark text-warning px-2 py-1 fs-6 fw-bold">1G</span>
            <h1 className="h4 fw-bold text-navy-900 mb-0">{shopName}</h1>
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
      <p className="small text-muted mt-4 mb-0">Thank you for choosing us.</p>
    </article>
  )
}

export function moneyField(label: string, value: number): ReceiptField {
  return { label, value: formatMoney(value) }
}

export function dateField(label: string, value?: string | null): ReceiptField {
  return { label, value: value ? formatDateTime(value) : '—' }
}
