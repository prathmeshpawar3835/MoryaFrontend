import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { billApi } from '../../api/billApi'
import { returnApi } from '../../api/returnApi'
import { productApi } from '../../api/productApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { PageHeader, SearchBox, CurrencyDisplay } from '../../components/common/Feedback'
import { DataTable } from '../../components/tables/DataTable'
import { FormField } from '../../components/common/FormField'
import { formatDateTime, formatMoney } from '../../utils/format'
import { RETURN_KIND_LABELS } from '../../constants/labels'
import { PaymentMode } from '../../types'
import type { Product } from '../../types'

export function ReturnsListPage() {
  const { selectedStoreId } = useStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const query = { pageNumber: page, pageSize: 20, search, storeId: selectedStoreId ?? undefined }
  const q = useQuery({ queryKey: queryKeys.returns(query), queryFn: () => returnApi.list(query) })

  return (
    <>
      <PageHeader
        title="Returns & Item Exchange"
        subtitle="Manage customer product returns, refunds, credit notes, and product exchanges"
        actions={
          <div className="page-header-actions">
            <Link className="btn btn-gold" to="/returns/new">
              <i className="bi bi-arrow-return-left me-1" /> New Return
            </Link>
            <Link className="btn btn-outline-secondary" to="/returns/exchange">
              <i className="bi bi-arrow-left-right me-1" /> New Exchange
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
          placeholder="Search by return number or original bill number…"
        />
      </div>

      <DataTable
        loading={q.isLoading}
        error={q.isError ? 'Could not load returns list' : null}
        columns={['Return Number', 'Original Bill', 'Return Date', 'Refund Amount', 'Return Type', 'Actions']}
        page={q.data?.pageNumber}
        totalPages={q.data?.totalPages}
        onPage={setPage}
      >
        {q.data?.items.map((r) => (
          <tr key={r.id}>
            <td>
              <span className="fw-bold font-monospace text-navy-900">{r.returnNumber}</span>
            </td>
            <td>
              <span className="badge bg-light text-dark border font-monospace">{r.originalBillNumber}</span>
            </td>
            <td className="small text-muted">{formatDateTime(r.returnDate)}</td>
            <td className="fw-bold text-danger">
              <CurrencyDisplay value={r.returnAmount} />
            </td>
            <td>
              <span className="badge bg-light text-dark border">
                {RETURN_KIND_LABELS[r.returnKind] ?? r.returnKind}
              </span>
            </td>
            <td>
              <button
                className="btn btn-sm btn-outline-secondary"
                type="button"
                onClick={() => void returnApi.pdf(r.id)}
                title="Download Return Receipt PDF"
              >
                <i className="bi bi-file-earmark-pdf me-1" /> PDF
              </button>
            </td>
          </tr>
        ))}
      </DataTable>
    </>
  )
}

export function ReturnCreatePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [billId, setBillId] = useState(Number(params.get('billId') || 0) || '')
  const [reason, setReason] = useState('')
  const [qty, setQty] = useState<Record<number, number>>({})

  const bill = useQuery({
    queryKey: queryKeys.bill(Number(billId)),
    queryFn: () => billApi.get(Number(billId)),
    enabled: Boolean(Number(billId)),
  })

  const totalReturnQty = Object.values(qty).reduce((s, q) => s + (q || 0), 0)

  const mut = useMutation({
    mutationFn: () =>
      returnApi.create({
        originalBillId: Number(billId),
        reason,
        items: Object.entries(qty)
          .filter(([, q]) => q > 0)
          .map(([id, q]) => ({ originalBillItemId: Number(id), quantity: q })),
      }),
    onSuccess: (r) => {
      toast.success(`Return note ${r.returnNumber} generated successfully`)
      navigate('/returns')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to generate return')
    },
  })

  return (
    <>
      <PageHeader
        title="Initiate Customer Return"
        subtitle="Process returned jewellery items against an original sale invoice"
        actions={
          <Link to="/returns" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> Back to Returns
          </Link>
        }
      />

      <div className="card-panel">
        <div className="form-section-title">
          <i className="bi bi-receipt text-gold" /> Original Bill Lookup
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <FormField label="Original Bill ID Number" required hint="Enter numeric ID from receipt">
              <input
                className="form-control"
                type="number"
                placeholder="e.g. 102"
                value={billId}
                onChange={(e) => setBillId(e.target.value ? Number(e.target.value) : '')}
              />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Return Reason / Remarks" required>
              <input
                className="form-control"
                placeholder="e.g. Customer changed mind, sizing issue"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        {bill.isLoading ? (
          <div className="text-center py-4 text-muted">Searching bill invoice details…</div>
        ) : bill.isError ? (
          <div className="alert alert-danger py-2">Bill not found. Please check the ID number.</div>
        ) : bill.data ? (
          <div className="p-3 bg-light rounded-3 mb-3">
            <div className="row g-2 small">
              <div className="col-sm-4"><strong>Bill Number:</strong> {bill.data.billNumber}</div>
              <div className="col-sm-4"><strong>Customer:</strong> {bill.data.customerName || 'Walk-in'}</div>
              <div className="col-sm-4"><strong>Date:</strong> {formatDateTime(bill.data.billDate)}</div>
            </div>
          </div>
        ) : null}
      </div>

      {bill.data ? (
        <div className="card-panel">
          <div className="form-section-title">
            <i className="bi bi-list-check text-gold" /> Select Items to Return
          </div>
          <DataTable columns={['Purchased Product Item', 'Sold Quantity', 'Unit Rate', 'Return Quantity']}>
            {bill.data.items.map((i) => (
              <tr key={i.id}>
                <td>
                  <strong className="text-navy-900">{i.productName}</strong>
                </td>
                <td>{i.quantity}</td>
                <td>{formatMoney(i.rate)}</td>
                <td style={{ width: '180px' }}>
                  <div className="input-group input-group-sm">
                    <input
                      className="form-control"
                      type="number"
                      min={0}
                      max={i.quantity}
                      step="any"
                      value={qty[i.id] ?? 0}
                      onChange={(e) => setQty((s) => ({ ...s, [i.id]: Number(e.target.value) }))}
                    />
                    <span className="input-group-text">/ {i.quantity}</span>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>

          <div className="d-flex justify-content-end gap-2 pt-3 mt-3 border-top">
            <button
              className="btn btn-gold px-4 fw-bold"
              type="button"
              disabled={!bill.data || totalReturnQty === 0 || !reason || mut.isPending}
              onClick={() => mut.mutate()}
            >
              {mut.isPending ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Processing Return…
                </>
              ) : (
                <><i className="bi bi-check2 me-1" /> Confirm Return ({totalReturnQty} item(s))</>
              )}
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function ExchangePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { selectedStoreId } = useStore()
  const [billId, setBillId] = useState(Number(params.get('billId') || 0) || '')
  const [reason, setReason] = useState('')
  const [qty, setQty] = useState<Record<number, number>>({})
  const [newItems, setNewItems] = useState<{ product: Product; quantity: number }[]>([])
  const [search, setSearch] = useState('')
  const [cash, setCash] = useState(0)

  const bill = useQuery({
    queryKey: queryKeys.bill(Number(billId)),
    queryFn: () => billApi.get(Number(billId)),
    enabled: Boolean(Number(billId)),
  })
  const found = useQuery({
    queryKey: queryKeys.productSearch(search, selectedStoreId),
    queryFn: () => productApi.search(search, selectedStoreId),
    enabled: search.trim().length >= 2,
  })

  const returnValue = useMemo(() => {
    if (!bill.data) return 0
    return bill.data.items.reduce((s, i) => s + ((qty[i.id] || 0) / i.quantity) * i.total, 0)
  }, [bill.data, qty])

  const newValue = newItems.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0)
  const difference = newValue - returnValue

  const mut = useMutation({
    mutationFn: () =>
      returnApi.exchange({
        originalBillId: Number(billId),
        reason,
        returnItems: Object.entries(qty)
          .filter(([, q]) => q > 0)
          .map(([id, q]) => ({ originalBillItemId: Number(id), quantity: q })),
        newItems: newItems.map((i) => ({ productId: i.product.id, quantity: i.quantity, discountAmount: 0 })),
        billDiscount: 0,
        walletRedeemAmount: 0,
        payments: cash > 0 ? [{ paymentMode: PaymentMode.Cash, amount: cash }] : [],
      }),
    onSuccess: (r) => {
      toast.success(`Exchange completed successfully! Difference: ${formatMoney(r.differencePayable)}`)
      navigate(`/bills/${r.newBill.id}`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to process exchange')
    },
  })

  return (
    <>
      <PageHeader
        title="Product Exchange Counter"
        subtitle="Return sold goods and select new replacement products in a single transaction"
        actions={
          <Link to="/returns" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" /> Back to Returns
          </Link>
        }
      />

      <div className="card-panel">
        <div className="form-section-title">
          <i className="bi bi-receipt text-gold" /> Step 1: Lookup Original Bill
        </div>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <FormField label="Original Bill ID Number" required>
              <input
                className="form-control"
                type="number"
                placeholder="e.g. 102"
                value={billId}
                onChange={(e) => setBillId(e.target.value ? Number(e.target.value) : '')}
              />
            </FormField>
          </div>
          <div className="col-md-6">
            <FormField label="Exchange Reason / Remarks" required>
              <input
                className="form-control"
                placeholder="e.g. Sizing exchange / alternative design"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </FormField>
          </div>
        </div>

        {bill.data ? (
          <div className="mt-3">
            <h3 className="h6 fw-bold mb-2">Select Items Being Returned:</h3>
            <DataTable columns={['Sold Product Item', 'Sold Quantity', 'Return Quantity']}>
              {bill.data.items.map((i) => (
                <tr key={i.id}>
                  <td><strong className="text-navy-900">{i.productName}</strong></td>
                  <td>{i.quantity}</td>
                  <td style={{ width: '160px' }}>
                    <input
                      className="form-control form-control-sm"
                      type="number"
                      min={0}
                      max={i.quantity}
                      value={qty[i.id] ?? 0}
                      onChange={(e) => setQty((s) => ({ ...s, [i.id]: Number(e.target.value) }))}
                    />
                  </td>
                </tr>
              ))}
            </DataTable>
          </div>
        ) : null}
      </div>

      <div className="card-panel">
        <div className="form-section-title">
          <i className="bi bi-plus-circle text-gold" /> Step 2: Choose New Products to Issue
        </div>

        <div className="mb-3 position-relative">
          <div className="input-group">
            <span className="input-group-text bg-light text-muted border-end-0">
              <i className="bi bi-search" />
            </span>
            <input
              className="form-control border-start-0"
              placeholder="Search replacement product by name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search.trim().length >= 2 && found.data?.length ? (
            <div className="list-group shadow-md position-absolute w-100 mt-1" style={{ zIndex: 20, maxHeight: '200px', overflowY: 'auto' }}>
              {found.data.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="list-group-item list-group-item-action py-2 px-3 d-flex justify-content-between align-items-center small"
                  onClick={() => {
                    setNewItems((x) => [...x, { product: p, quantity: 1 }])
                    setSearch('')
                  }}
                >
                  <div>
                    <strong>{p.productName}</strong>
                    <div className="text-muted">{p.productCode}</div>
                  </div>
                  <strong className="text-navy-900">{formatMoney(p.sellingPrice)}</strong>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {newItems.length > 0 ? (
          <div className="table-responsive mb-3">
            <table className="table app-table mb-0 align-middle">
              <thead>
                <tr>
                  <th>New Product Item</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {newItems.map((i, idx) => (
                  <tr key={`${i.product.id}-${idx}`}>
                    <td className="fw-bold text-navy-900">{i.product.productName}</td>
                    <td style={{ width: '120px' }}>
                      <input
                        className="form-control form-control-sm"
                        type="number"
                        min={1}
                        value={i.quantity}
                        onChange={(e) =>
                          setNewItems((prev) =>
                            prev.map((item, idxx) => (idxx === idx ? { ...item, quantity: Number(e.target.value) } : item))
                          )
                        }
                      />
                    </td>
                    <td>{formatMoney(i.product.sellingPrice)}</td>
                    <td className="fw-bold">{formatMoney(i.product.sellingPrice * i.quantity)}</td>
                    <td className="text-center">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger border-0"
                        onClick={() => setNewItems((prev) => prev.filter((_, idxx) => idxx !== idx))}
                      >
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Calculation Summary Card */}
        <div className="p-3 bg-light rounded-3 mb-3">
          <div className="row g-3">
            <div className="col-md-4">
              <span className="text-muted small d-block">Est. Returned Credit</span>
              <strong className="fs-5 text-danger">{formatMoney(returnValue)}</strong>
            </div>
            <div className="col-md-4 border-start">
              <span className="text-muted small d-block">New Items Value</span>
              <strong className="fs-5 text-dark">{formatMoney(newValue)}</strong>
            </div>
            <div className="col-md-4 border-start">
              <span className="text-muted small d-block">Estimated Net Difference</span>
              <strong className={`fs-5 ${difference > 0 ? 'text-primary' : difference < 0 ? 'text-success' : 'text-dark'}`}>
                {difference > 0 ? `Payable: +${formatMoney(difference)}` : difference < 0 ? `Refundable: ${formatMoney(Math.abs(difference))}` : 'Exact Balance'}
              </strong>
            </div>
          </div>
        </div>

        {difference > 0 ? (
          <FormField label="Cash Collected for Payable Difference (₹)">
            <div className="input-group" style={{ maxWidth: '300px' }}>
              <span className="input-group-text">₹</span>
              <input
                className="form-control"
                type="number"
                min={0}
                value={cash}
                onChange={(e) => setCash(Number(e.target.value))}
              />
            </div>
          </FormField>
        ) : null}

        <div className="d-flex justify-content-end gap-2 pt-3 mt-3 border-top">
          <button
            className="btn btn-gold px-4 fw-bold"
            type="button"
            disabled={!bill.data || newItems.length === 0 || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Processing Exchange…
              </>
            ) : (
              <><i className="bi bi-check2-all me-1" /> Confirm Exchange</>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
