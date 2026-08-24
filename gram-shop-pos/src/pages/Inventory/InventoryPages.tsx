import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inventoryApi } from '../../api/inventoryApi'
import { productApi } from '../../api/productApi'
import { purchaseApi } from '../../api/purchaseApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, StatusBadge, CurrencyDisplay } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { formatDateTime } from '../../utils/format'
import { MOVEMENT_LABELS } from '../../constants/labels'
import { useDebounce } from '../../hooks/useDebounce'

export function StockPage() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [low, setLow] = useState(false)
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined, lowStockOnly: low || undefined }
  const q = useQuery({ queryKey: queryKeys.inventory(query), queryFn: () => inventoryApi.list(query) })
  return (
    <>
      <PageHeader title="Stock" />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
        <StoreSelector />
        <label className="form-check"><input type="checkbox" className="form-check-input" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low stock</label>
      </div>
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load stock' : null} columns={['Product', 'Store', 'Available', 'Minimum', 'Status']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((i) => (
          <tr key={i.id}>
            <td>{i.productName}<div className="small text-muted">{i.productCode}</div></td>
            <td>{i.storeCode}</td>
            <td>{i.quantity}</td>
            <td>{i.minimumStockLevel}</td>
            <td><StatusBadge active={!i.isLowStock} labels={['OK', 'Low']} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

function ProductPicker({ storeId, onPick }: { storeId?: number | null; onPick: (id: number, name: string) => void }) {
  const [q, setQ] = useState('')
  const d = useDebounce(q, 250)
  const search = useQuery({ queryKey: queryKeys.productSearch(d, storeId), queryFn: () => productApi.search(d, storeId), enabled: d.length >= 2 })
  return (
    <div>
      <input className="form-control" placeholder="Search product" value={q} onChange={(e) => setQ(e.target.value)} />
      {search.data?.slice(0, 6).map((p) => (
        <button key={p.id} type="button" className="btn btn-link d-block" onClick={() => { onPick(p.id, p.productName); setQ(p.productName) }}>{p.productName}</button>
      ))}
    </div>
  )
}

export function StockInPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [storeId, setStoreId] = useState(selectedStoreId ?? stores[0]?.storeId)
  const [productId, setProductId] = useState<number | null>(null)
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState<number | ''>('')
  const [supplier, setSupplier] = useState('')
  const [invoice, setInvoice] = useState('')
  const [reason, setReason] = useState('')
  const mut = useMutation({
    mutationFn: () => inventoryApi.stockIn({ storeId: storeId!, productId: productId!, quantity: qty, purchasePrice: price === '' ? undefined : Number(price), supplierName: supplier || undefined, invoiceNumber: invoice || undefined, reason: reason || undefined }),
    onSuccess: async () => {
      toast.success('Stock in saved')
      await qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
  return (
    <>
      <PageHeader title="Stock in" />
      <form className="card-panel form-grid" onSubmit={(e) => { e.preventDefault(); if (productId && storeId) mut.mutate() }}>
        <label>Store<select className="form-select" value={storeId ?? ''} onChange={(e) => setStoreId(Number(e.target.value))}>{stores.map((s) => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}</select></label>
        <label>Product<ProductPicker storeId={storeId} onPick={(id) => setProductId(id)} /></label>
        <label>Quantity<input className="form-control" type="number" min={0.01} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <label>Purchase price<input className="form-control" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} /></label>
        <label>Supplier<input className="form-control" value={supplier} onChange={(e) => setSupplier(e.target.value)} /></label>
        <label>Invoice no.<input className="form-control" value={invoice} onChange={(e) => setInvoice(e.target.value)} /></label>
        <label>Reason<input className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div><button className="btn btn-gold" disabled={mut.isPending || !productId}>Save stock in</button></div>
      </form>
    </>
  )
}

export function StockAdjustPage() {
  const { stores, selectedStoreId } = useStore()
  const qc = useQueryClient()
  const [storeId, setStoreId] = useState(selectedStoreId ?? stores[0]?.storeId)
  const [productId, setProductId] = useState<number | null>(null)
  const [qty, setQty] = useState(1)
  const [increase, setIncrease] = useState(true)
  const [reason, setReason] = useState('')
  const mut = useMutation({
    mutationFn: () => inventoryApi.adjust({ storeId: storeId!, productId: productId!, quantity: qty, isIncrease: increase, reason }),
    onSuccess: async () => {
      toast.success('Adjustment saved')
      await qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
  return (
    <>
      <PageHeader title="Stock adjustment" />
      <form className="card-panel form-grid" onSubmit={(e) => { e.preventDefault(); mut.mutate() }}>
        <label>Store<select className="form-select" value={storeId ?? ''} onChange={(e) => setStoreId(Number(e.target.value))}>{stores.map((s) => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}</select></label>
        <label>Product<ProductPicker storeId={storeId} onPick={(id) => setProductId(id)} /></label>
        <label>Quantity<input className="form-control" type="number" min={0.01} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <label>Direction<select className="form-select" value={increase ? 'in' : 'out'} onChange={(e) => setIncrease(e.target.value === 'in')}><option value="in">Increase</option><option value="out">Decrease</option></select></label>
        <label>Reason<input className="form-control" required value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div><button className="btn btn-gold" disabled={!productId || !reason || mut.isPending}>Save adjustment</button></div>
      </form>
    </>
  )
}

export function StockTransferPage() {
  const { stores } = useStore()
  const qc = useQueryClient()
  const [fromStoreId, setFrom] = useState(stores[0]?.storeId)
  const [toStoreId, setTo] = useState(stores[1]?.storeId ?? stores[0]?.storeId)
  const [productId, setProductId] = useState<number | null>(null)
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState('')
  const mut = useMutation({
    mutationFn: () => inventoryApi.transfer({ fromStoreId: fromStoreId!, toStoreId: toStoreId!, reason, items: [{ productId: productId!, quantity: qty }] }),
    onSuccess: async () => {
      toast.success('Transfer saved')
      await qc.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
  return (
    <>
      <PageHeader title="Stock transfer" />
      <form className="card-panel form-grid" onSubmit={(e) => { e.preventDefault(); mut.mutate() }}>
        <label>From store<select className="form-select" value={fromStoreId ?? ''} onChange={(e) => setFrom(Number(e.target.value))}>{stores.map((s) => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}</select></label>
        <label>To store<select className="form-select" value={toStoreId ?? ''} onChange={(e) => setTo(Number(e.target.value))}>{stores.map((s) => <option key={s.storeId} value={s.storeId}>{s.storeName}</option>)}</select></label>
        <label>Product<ProductPicker storeId={fromStoreId} onPick={(id) => setProductId(id)} /></label>
        <label>Quantity<input className="form-control" type="number" min={0.01} value={qty} onChange={(e) => setQty(Number(e.target.value))} /></label>
        <label>Reason<input className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
        <div><button className="btn btn-gold" disabled={!productId || mut.isPending}>Transfer</button></div>
      </form>
    </>
  )
}

export function StockLedgerPage() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.inventoryLedger(query), queryFn: () => inventoryApi.ledger(query) })
  return (
    <>
      <PageHeader title="Stock ledger" />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} />
        <StoreSelector />
      </div>
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load ledger' : null} columns={['Date', 'Product', 'Store', 'Type', 'Before', 'Qty', 'After', 'Reference', 'Reason']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((m) => (
          <tr key={m.id}>
            <td>{formatDateTime(m.createdDate)}</td>
            <td>{m.productName}<div className="small text-muted">{m.productCode}</div></td>
            <td>{m.storeId}</td>
            <td>{MOVEMENT_LABELS[m.movementType] ?? m.movementType}</td>
            <td>{m.previousQuantity}</td>
            <td>{m.quantity}</td>
            <td>{m.newQuantity}</td>
            <td>{m.referenceNumber}</td>
            <td>{m.reason}</td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function PurchasesPage() {
  const { selectedStoreId } = useStore()
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.purchases(query), queryFn: () => purchaseApi.list(query) })
  return (
    <>
      <PageHeader title="Purchases" />
      <DataTable loading={q.isLoading} error={q.isError ? 'Could not load purchases' : null} columns={['Invoice', 'Supplier', 'Store', 'Date', 'Total']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((p) => (
          <tr key={p.id}>
            <td>{p.invoiceNumber}</td>
            <td>{p.supplierName}</td>
            <td>{p.storeCode}</td>
            <td>{formatDateTime(p.purchaseDate)}</td>
            <td><CurrencyDisplay value={p.total} /></td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
