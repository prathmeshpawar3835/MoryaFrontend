import { useStore } from '../../context/StoreContext'

export function StoreSelector({
  allowAll = true,
  value,
  onChange,
  id,
  className = '',
}: {
  allowAll?: boolean
  value?: number | null
  onChange?: (id: number | null) => void
  id?: string
  className?: string
}) {
  const store = useStore()
  const current = value === undefined ? store.selectedStoreId : value
  const change = onChange ?? store.setSelectedStoreId

  return (
    <div className={`d-inline-flex align-items-center ${className}`}>
      <select
        id={id}
        className="form-select store-select"
        value={current ?? ''}
        aria-label="Store selection"
        onChange={(e) => change(e.target.value ? Number(e.target.value) : null)}
      >
        {allowAll && store.canSelectAll ? (
          <option value="">🏢 All Stores</option>
        ) : (
          !current && <option value="" disabled>📍 Select Store Branch</option>
        )}
        {store.stores.map((s) => (
          <option key={s.storeId} value={s.storeId}>
            📍 {s.storeCode} — {s.storeName}
          </option>
        ))}
      </select>
    </div>
  )
}
