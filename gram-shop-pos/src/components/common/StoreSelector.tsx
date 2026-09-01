import { useStore } from '../../context/StoreContext'

export function StoreSelector({
  allowAll = true,
  value,
  onChange,
  id,
  className = '',
  variant = 'default',
}: {
  allowAll?: boolean
  value?: number | null
  onChange?: (id: number | null) => void
  id?: string
  className?: string
  variant?: 'default' | 'navbar'
}) {
  const store = useStore()
  const current = value === undefined ? store.selectedStoreId : value
  const change = onChange ?? store.setSelectedStoreId
  const isNavbar = variant === 'navbar'
  const selected = store.stores.find((s) => s.storeId === current)
  const displayName = current == null
    ? (store.canSelectAll ? 'All stores' : 'Select store')
    : (selected ? selected.storeName : 'Store')

  return (
    <div className={`${isNavbar ? 'navbar-store-switch' : 'd-inline-flex align-items-center'} ${className}`.trim()}>
      {isNavbar ? (
        <>
          <span className="navbar-store-switch-icon" aria-hidden>
            <i className="bi bi-shop-window" />
          </span>
          <div className="navbar-store-switch-copy">
            <span className="navbar-store-switch-label">Store</span>
            <span className="navbar-store-switch-value">{displayName}</span>
          </div>
          <i className="bi bi-chevron-down navbar-store-switch-caret" aria-hidden />
        </>
      ) : null}
      <select
        id={id}
        className={isNavbar ? 'navbar-store-select' : 'form-select store-select'}
        value={current ?? ''}
        aria-label="Store selection"
        onChange={(e) => change(e.target.value ? Number(e.target.value) : null)}
      >
        {allowAll && store.canSelectAll ? (
          <option value="">All stores</option>
        ) : (
          !current && <option value="" disabled>Select store</option>
        )}
        {store.stores.map((s) => (
          <option key={s.storeId} value={s.storeId}>
            {s.storeCode} — {s.storeName}
          </option>
        ))}
      </select>
    </div>
  )
}
