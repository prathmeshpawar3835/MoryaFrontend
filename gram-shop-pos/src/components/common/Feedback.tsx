import type { ReactNode } from 'react'

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="spinner-border text-gold" />
      <span>{label}</span>
    </div>
  )
}

export function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return <div className={`spinner-border spinner-border-${size} text-gold`} role="status" aria-label="Loading" />
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <i className="bi bi-inbox" aria-hidden />
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <i className="bi bi-exclamation-triangle" aria-hidden />
      <p>{message}</p>
    </div>
  )
}

export function StatusBadge({ active, labels }: { active: boolean; labels?: [string, string] }) {
  const [on, off] = labels ?? ['Active', 'Inactive']
  return <span className={`badge-status ${active ? 'is-on' : 'is-off'}`}>{active ? on : off}</span>
}

export function CurrencyDisplay({ value }: { value?: number | null }) {
  const n = Number(value ?? 0)
  const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)
  return <span className={`money ${n < 0 ? 'is-neg' : ''}`}>{formatted}</span>
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}) {
  return (
    <div className="search-box">
      <i className="bi bi-search" aria-hidden />
      <input
        id={id}
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search'}
        aria-label={placeholder ?? 'Search'}
      />
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav className="pager" aria-label="Pagination">
      <button type="button" className="btn btn-sm btn-outline-light" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-outline-light"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </nav>
  )
}

export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  return (
    <div className="date-range">
      <label>
        From
        <input type="date" className="form-control" value={from} onChange={(e) => onChange(e.target.value, to)} />
      </label>
      <label>
        To
        <input type="date" className="form-control" value={to} onChange={(e) => onChange(from, e.target.value)} />
      </label>
    </div>
  )
}
