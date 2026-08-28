import type { ReactNode } from 'react'

export function PageLoader({ label = 'Loading data…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="w-100" style={{ maxWidth: 720 }}>
        <div className="skel skel-block mb-3" />
        <div className="skel skel-line mb-2" />
        <div className="skel skel-line mb-2" style={{ width: '62%' }} />
        <div className="skel skel-line" style={{ width: '48%' }} />
      </div>
      <span className="fw-semibold text-muted mt-3">{label}</span>
    </div>
  )
}

export function LoadingSpinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  return (
    <div
      className={`spinner-border spinner-border-${size} text-warning`}
      role="status"
      aria-label="Loading"
      style={{ verticalAlign: 'middle', color: 'var(--gold-600)' }}
    />
  )
}

export function EmptyState({
  title,
  hint,
  icon = 'bi-inbox',
}: {
  title: string
  hint?: string
  icon?: string
}) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} aria-hidden />
      <h3>{title}</h3>
      {hint ? <p className="mb-0">{hint}</p> : null}
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <i className="bi bi-exclamation-triangle-fill" aria-hidden />
      <p className="mb-0 fw-semibold">{message}</p>
    </div>
  )
}

export function StatusBadge({ active, labels }: { active: boolean; labels?: [string, string] }) {
  const [on, off] = labels ?? ['Active', 'Inactive']
  return (
    <span className={`badge-status ${active ? 'is-on' : 'is-off'}`}>
      {active ? on : off}
    </span>
  )
}

export function CurrencyDisplay({ value }: { value?: number | null }) {
  const n = Number(value ?? 0)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n)
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
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
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
        placeholder={placeholder ?? 'Search...'}
        aria-label={placeholder ?? 'Search'}
      />
      {value ? (
        <button
          type="button"
          className="btn btn-sm btn-link position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none pe-3"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <i className="bi bi-x-circle-fill" />
        </button>
      ) : null}
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
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <i className="bi bi-chevron-left me-1" /> Previous
      </button>
      <span className="fw-semibold">
        Page <span className="text-dark">{page}</span> of {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next <i className="bi bi-chevron-right ms-1" />
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
        <input
          type="date"
          className="form-control form-control-sm"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
        />
      </label>
      <label>
        To
        <input
          type="date"
          className="form-control form-control-sm"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
        />
      </label>
    </div>
  )
}
