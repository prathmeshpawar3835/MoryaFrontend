import { useStore } from '../../context/StoreContext'

export function StoreSelector({
  allowAll = true,
  value,
  onChange,
  id,
}: {
  allowAll?: boolean
  value?: number | null
  onChange?: (id: number | null) => void
  id?: string
}) {
  const store = useStore()
  const current = value === undefined ? store.selectedStoreId : value
  const change = onChange ?? store.setSelectedStoreId

  return (
    <select
      id={id}
      className="form-select store-select"
      value={current ?? ''}
      aria-label="Store"
      onChange={(e) => change(e.target.value ? Number(e.target.value) : null)}
    >
      {allowAll && store.canSelectAll ? <option value="">All stores</option> : null}
      {store.stores.map((s) => (
        <option key={s.storeId} value={s.storeId}>
          {s.storeCode} — {s.storeName}
        </option>
      ))}
    </select>
  )
}
