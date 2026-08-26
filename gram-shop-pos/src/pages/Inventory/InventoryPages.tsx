import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { inventoryApi } from '../../api/inventoryApi'
import { productApi } from '../../api/productApi'
import { purchaseApi } from '../../api/purchaseApi'
import { supplierApi } from '../../api/opsApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, StatusBadge, CurrencyDisplay } from '../../components/common/Feedback'
import { StoreSelector } from '../../components/common/StoreSelector'
import { DataTable } from '../../components/tables/DataTable'
import { FormField } from '../../components/common/FormField'
import { formatDateTime } from '../../utils/format'
import { toastApiError } from '../../utils/errors'
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
      <PageHeader
        title="Stock & Inventory Balances"
        subtitle="Live on-hand physical stock across store branches"
        actions={
          <div className="page-header-actions">
            <Link to="/inventory/stock-in" className="btn btn-gold">
              <i className="bi bi-box-arrow-in-down me-1" /> Inward Stock
            </Link>
            <Link to="/inventory/adjustment" className="btn btn-outline-secondary">
              <i className="bi bi-sliders me-1" /> Adjust Stock
            </Link>
            <Link to="/inventory/transfer" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left-right me-1" /> Store Transfer
            </Link>
          </div>
        }
      />

      <div className="filter-bar">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Filter by product name or SKU code…"
        />
        <StoreSelector />
        <div className="form-check form-switch ms-2">
          <input
            type="checkbox"
            className="form-check-input"
            id="lowCheck"
            checked={low}
            onChange={(e) => setLow(e.target.checked)}
          />
          <label className="form-check-label fw-semibold small text-muted" htmlFor="lowCheck">
            Low Stock Alerts
          </label>
        </div>
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load inventory stock' : null}
        columns={['Product SKU / Name', 'Store Branch', 'Available Stock', 'Min Alert Level', 'Stock Health']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((i) => (
          <tr key={i.id}>
            <td>
              <span className="fw-bold text-navy-900">{i.productName}</span>
              <div className="small text-muted font-monospace">{i.productCode}</div>
            </td>
            <td>
              <span className="badge bg-light text-dark border">{i.storeCode}</span>
            </td>
            <td>
              <strong className="fs-6 text-dark">{i.quantity}</strong>
            </td>
            <td className="text-muted">{i.minimumStockLevel}</td>
            <td>
              <StatusBadge active={!i.isLowStock} labels={['Healthy', 'Low Stock']} />
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

function ProductPicker({
  storeId,
  onPick,
  selectedName,
}: {
  storeId?: number | null
  onPick: (id: number, name: string) => void
  selectedName?: string
}) {
  const [q, setQ] = useState(selectedName || '')
  const d = useDebounce(q, 250)
  const search = useQuery({
    queryKey: queryKeys.productSearch(d, storeId),
    queryFn: () => productApi.search(d, storeId),
    enabled: d.trim().length >= 2,
  })

  return (
    <div className="position-relative">
      <div className="input-group">
        <span className="input-group-text bg-light text-muted border-end-0">
          <i className="bi bi-search" />
        </span>
        <input
          className="form-control border-start-0"
          placeholder="Search by product name, SKU or barcode…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {d.trim().length >= 2 && search.data?.length ? (
        <div className="list-group shadow-md position-absolute w-100 mt-1" style={{ zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
          {search.data.slice(0, 6).map((p) => (
            <button
              key={p.id}
              type="button"
              className="list-group-item list-group-item-action py-2 px-3 d-flex justify-content-between align-items-center small"
              onClick={() => {
                onPick(p.id, p.productName)
                setQ(`${p.productName} (${p.productCode})`)
              }}
            >
              <div>
                <strong>{p.productName}</strong>
                <div className="text-muted small">{p.productCode}</div>
              </div>
              <span className="badge bg-light text-dark border">
                Stock: {p.stockQuantity ?? 0} {p.unit}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function StockInPage() {
  const { selectedStoreId, stores } = useStore()
  const qc = useQueryClient()
  const [storeId, setStoreId] = useState(selectedStoreId ?? stores[0]?.storeId)
  const [productId, setProductId] = useState<number | null>(null)
  const [productName, setProductName] = useState('')
  const [qty, setQty] = useState(1)
  const [price, setPrice] = useState<number | ''>('')
  const [supplier, setSupplier] = useState('')
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [invoice, setInvoice] = useState('')
  const [reason, setReason] = useState('')
  const suppliersQ = useQuery({
    queryKey: queryKeys.suppliers({ storeId, pageSize: 100 }),
    queryFn: () => supplierApi.list({ storeId, pageSize: 100 }),
    enabled: Boolean(storeId),
  })

  const mut = useMutation({
    mutationFn: async () => {
      if (supplierId || supplier.trim()) {
        return purchaseApi.create({
          storeId: storeId!,
          supplierId: supplierId || undefined,
          supplierName: supplier.trim() || 'Supplier',
          invoiceNumber: invoice.trim() || `STK-${Date.now()}`,
          notes: reason || undefined,
          items: [{ productId: productId!, quantity: qty, purchasePrice: price === '' ? 0 : Number(price) }],
        })
      }
      return inventoryApi.stockIn({
        storeId: storeId!,
        productId: productId!,
        quantity: qty,
        purchasePrice: price === '' ? undefined : Number(price),
        supplierName: supplier || undefined,
        invoiceNumber: invoice || undefined,
        reason: reason || undefined,
      })
    },
    onSuccess: async () => {
      toast.success('Stock inward recorded successfully')
      setProductId(null)
      setProductName('')
      setQty(1)
      setPrice('')
      setSupplier('')
      setSupplierId('')
      setInvoice('')
      setReason('')
      await qc.invalidateQueries({ queryKey: ['inventory'] })
      await qc.invalidateQueries({ queryKey: ['purchases'] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to record stock inward')
    },
  })

  return (
    <>
      <PageHeader
        title="Stock Inward (Stock In)"
        subtitle="Receive new items from suppliers or central warehouse into store inventory"
        actions={
          <Link to="/inventory/stock" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> View Stock
          </Link>
        }
      />

      <form
        className="card-panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (!productId) {
            toast.error('Please select a product item first')
            return
          }
          if (productId && storeId) mut.mutate()
        }}
      >
        <div className="form-section-title">
          <i className="bi bi-box-arrow-in-down text-gold" /> Inward Batch Details
        </div>
        <div className="form-grid">
          <FormField label="Receiving Store Branch" required>
            <select
              className="form-select"
              value={storeId ?? ''}
              onChange={(e) => setStoreId(Number(e.target.value))}
            >
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Select Product Item" required hint={productName ? `Selected: ${productName}` : 'Search above to choose'}>
            <ProductPicker
              storeId={storeId}
              selectedName={productName}
              onPick={(id, name) => {
                setProductId(id)
                setProductName(name)
              }}
            />
          </FormField>

          <FormField label="Inward Quantity" required>
            <input
              className="form-control"
              type="number"
              min={0.01}
              step="any"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Unit Purchase Price (₹, Optional)">
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                className="form-control"
                type="number"
                step="any"
                min={0}
                placeholder="Cost per unit"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </FormField>

          <FormField label="Supplier">
            <select
              className="form-select"
              value={supplierId}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : ''
                setSupplierId(id)
                const found = suppliersQ.data?.items.find((s) => s.id === id)
                if (found) setSupplier(found.name)
                if (!id) setSupplier('')
              }}
            >
              <option value="">No supplier / warehouse inward</option>
              {suppliersQ.data?.items.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Supplier / Vendor Name">
            <input
              className="form-control"
              placeholder="e.g. Surat Bullion Traders"
              value={supplier}
              onChange={(e) => {
                setSupplier(e.target.value)
                setSupplierId('')
              }}
            />
          </FormField>

          <FormField label="Supplier Invoice / DC No.">
            <input
              className="form-control"
              placeholder="e.g. INV-2026-991"
              value={invoice}
              onChange={(e) => setInvoice(e.target.value)}
            />
          </FormField>

          <FormField label="Inward Reason / Notes">
            <input
              className="form-control"
              placeholder="e.g. Fresh stock arrival, PO-102"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
        </div>

        <div className="d-flex justify-content-end gap-2 pt-3 mt-4 border-top">
          <Link to="/inventory/stock" className="btn btn-light border px-4">
            Cancel
          </Link>
          <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={mut.isPending || !productId}>
            {mut.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Saving Inward…
              </>
            ) : (
              <><i className="bi bi-check2 me-1" /> Save Inward Stock</>
            )}
          </button>
        </div>
      </form>
    </>
  )
}

export function StockAdjustPage() {
  const { stores, selectedStoreId } = useStore()
  const qc = useQueryClient()
  const [storeId, setStoreId] = useState(selectedStoreId ?? stores[0]?.storeId)
  const [productId, setProductId] = useState<number | null>(null)
  const [productName, setProductName] = useState('')
  const [qty, setQty] = useState(1)
  const [increase, setIncrease] = useState(true)
  const [reason, setReason] = useState('')

  const mut = useMutation({
    mutationFn: () =>
      inventoryApi.adjust({
        storeId: storeId!,
        productId: productId!,
        quantity: qty,
        isIncrease: increase,
        reason,
      }),
    onSuccess: async () => {
      toast.success('Stock adjustment saved successfully')
      setProductId(null)
      setProductName('')
      setQty(1)
      setReason('')
      await qc.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to record adjustment')
    },
  })

  return (
    <>
      <PageHeader
        title="Stock Physical Adjustment"
        subtitle="Reconcile inventory discrepancies (damaged goods, audit shrinkage, or corrections)"
        actions={
          <Link to="/inventory/stock" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> View Stock
          </Link>
        }
      />

      <form
        className="card-panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (!productId) {
            toast.error('Please pick a product item')
            return
          }
          mut.mutate()
        }}
      >
        <div className="form-section-title">
          <i className="bi bi-sliders text-gold" /> Adjustment Details
        </div>
        <div className="form-grid">
          <FormField label="Store Branch" required>
            <select
              className="form-select"
              value={storeId ?? ''}
              onChange={(e) => setStoreId(Number(e.target.value))}
            >
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Select Product Item" required hint={productName ? `Selected: ${productName}` : 'Search above to choose'}>
            <ProductPicker
              storeId={storeId}
              selectedName={productName}
              onPick={(id, name) => {
                setProductId(id)
                setProductName(name)
              }}
            />
          </FormField>

          <FormField label="Adjustment Direction" required>
            <select
              className="form-select"
              value={increase ? 'in' : 'out'}
              onChange={(e) => setIncrease(e.target.value === 'in')}
            >
              <option value="in">➕ Increase Stock (+)</option>
              <option value="out">➖ Decrease Stock (-)</option>
            </select>
          </FormField>

          <FormField label="Quantity to Adjust" required>
            <input
              className="form-control"
              type="number"
              min={0.01}
              step="any"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Reason for Adjustment" required hint="e.g. Broken clasp, audit count variance">
            <input
              className="form-control"
              required
              placeholder="Mandatory reason for audit trail"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
        </div>

        <div className="d-flex justify-content-end gap-2 pt-3 mt-4 border-top">
          <Link to="/inventory/stock" className="btn btn-light border px-4">
            Cancel
          </Link>
          <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={!productId || !reason || mut.isPending}>
            {mut.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Applying Adjustment…
              </>
            ) : (
              <><i className="bi bi-check2 me-1" /> Apply Stock Adjustment</>
            )}
          </button>
        </div>
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
  const [productName, setProductName] = useState('')
  const [qty, setQty] = useState(1)
  const [reason, setReason] = useState('')

  const mut = useMutation({
    mutationFn: () =>
      inventoryApi.transfer({
        fromStoreId: fromStoreId!,
        toStoreId: toStoreId!,
        reason,
        items: [{ productId: productId!, quantity: qty }],
      }),
    onSuccess: async () => {
      toast.success('Stock transfer recorded successfully')
      setProductId(null)
      setProductName('')
      setQty(1)
      setReason('')
      await qc.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (err: any) => {
      toastApiError(err, 'Failed to complete store transfer')
    },
  })

  return (
    <>
      <PageHeader
        title="Inter-Store Stock Transfer"
        subtitle="Move product stock between retail branch locations"
        actions={
          <Link to="/inventory/stock" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> View Stock
          </Link>
        }
      />

      <form
        className="card-panel"
        onSubmit={(e) => {
          e.preventDefault()
          if (!productId) {
            toast.error('Please pick a product item')
            return
          }
          if (fromStoreId === toStoreId) {
            toast.error('Origin and destination stores cannot be the same')
            return
          }
          mut.mutate()
        }}
      >
        <div className="form-section-title">
          <i className="bi bi-arrow-left-right text-gold" /> Transfer Manifest
        </div>
        <div className="form-grid">
          <FormField label="Origin Branch (From)" required>
            <select
              className="form-select"
              value={fromStoreId ?? ''}
              onChange={(e) => setFrom(Number(e.target.value))}
            >
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Destination Branch (To)" required>
            <select
              className="form-select"
              value={toStoreId ?? ''}
              onChange={(e) => setTo(Number(e.target.value))}
            >
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Select Product Item" required hint={productName ? `Selected: ${productName}` : 'Search above to choose'}>
            <ProductPicker
              storeId={fromStoreId}
              selectedName={productName}
              onPick={(id, name) => {
                setProductId(id)
                setProductName(name)
              }}
            />
          </FormField>

          <FormField label="Transfer Quantity" required>
            <input
              className="form-control"
              type="number"
              min={0.01}
              step="any"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Transfer Reason / Dispatch Ref">
            <input
              className="form-control"
              placeholder="e.g. Branch stock balancing, DC-04"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </FormField>
        </div>

        <div className="d-flex justify-content-end gap-2 pt-3 mt-4 border-top">
          <Link to="/inventory/stock" className="btn btn-light border px-4">
            Cancel
          </Link>
          <button className="btn btn-gold px-4 fw-bold" type="submit" disabled={!productId || mut.isPending}>
            {mut.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Dispatching Transfer…
              </>
            ) : (
              <><i className="bi bi-send me-1" /> Dispatch Transfer</>
            )}
          </button>
        </div>
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
      <PageHeader
        title="Stock Audit Ledger"
        subtitle="Complete historical ledger of every stock inward, sale deduction, return, and transfer"
      />

      <div className="filter-bar">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Filter by product name, code or reference…"
        />
        <StoreSelector />
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load stock ledger' : null}
        columns={['Date & Time', 'Product Details', 'Store ID', 'Movement Type', 'Qty Before', 'Moved Qty', 'Qty After', 'Reference No.', 'Reason']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((m) => (
          <tr key={m.id}>
            <td className="small text-muted">{formatDateTime(m.createdDate)}</td>
            <td>
              <div className="fw-semibold text-navy-900">{m.productName}</div>
              <div className="small text-muted font-monospace">{m.productCode}</div>
            </td>
            <td>
              <span className="badge bg-light text-dark border">Store #{m.storeId}</span>
            </td>
            <td>
              <span className="badge bg-light text-dark border">
                {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
              </span>
            </td>
            <td>{m.previousQuantity}</td>
            <td>
              <strong className={m.quantity > 0 ? 'text-success' : 'text-danger'}>
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </strong>
            </td>
            <td className="fw-bold text-dark">{m.newQuantity}</td>
            <td className="small font-monospace">{m.referenceNumber || '—'}</td>
            <td className="small text-muted">{m.reason || '—'}</td>
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
      <PageHeader
        title="Purchase Invoices & Inwards"
        subtitle="Vendor purchasing records and total costs"
      />

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load purchases' : null}
        columns={['Invoice Number', 'Supplier / Vendor', 'Store Branch', 'Purchase Date', 'Total Value']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((p) => (
          <tr key={p.id}>
            <td className="fw-bold font-monospace">{p.invoiceNumber}</td>
            <td>{p.supplierName}</td>
            <td>
              <span className="badge bg-light text-dark border">{p.storeCode}</span>
            </td>
            <td className="small text-muted">{formatDateTime(p.purchaseDate)}</td>
            <td className="fw-bold text-navy-900">
              <CurrencyDisplay value={p.total} />
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}
