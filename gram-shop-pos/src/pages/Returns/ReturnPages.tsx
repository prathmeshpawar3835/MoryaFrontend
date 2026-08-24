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
import { formatDateTime, formatMoney } from '../../utils/format'
import { RETURN_KIND_LABELS, PAYMENT_LABELS } from '../../constants/labels'
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
      <PageHeader title="Returns / Exchange" actions={<Link className="btn btn-gold" to="/returns/new">New return</Link>} />
      <div className="filter-bar">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Return or bill number" />
      </div>
      <DataTable loading={q.isLoading} columns={['Return', 'Original bill', 'Date', 'Amount', 'Kind', 'Actions']} page={q.data?.pageNumber} totalPages={q.data?.totalPages} onPage={setPage}>
        {q.data?.items.map((r) => (
          <tr key={r.id}>
            <td>{r.returnNumber}</td>
            <td>{r.originalBillNumber}</td>
            <td>{formatDateTime(r.returnDate)}</td>
            <td><CurrencyDisplay value={r.returnAmount} /></td>
            <td>{RETURN_KIND_LABELS[r.returnKind] ?? r.returnKind}</td>
            <td>
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => void returnApi.pdf(r.id)}>PDF</button>
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
  const bill = useQuery({ queryKey: queryKeys.bill(Number(billId)), queryFn: () => billApi.get(Number(billId)), enabled: Boolean(Number(billId)) })
  const mut = useMutation({
    mutationFn: () =>
      returnApi.create({
        originalBillId: Number(billId),
        reason,
        items: Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ originalBillItemId: Number(id), quantity: q })),
      }),
    onSuccess: (r) => {
      toast.success(`Return ${r.returnNumber} created`)
      navigate('/returns')
    },
  })
  return (
    <>
      <PageHeader title="Create return" />
      <div className="card-panel form-grid">
        <label>Original bill ID<input className="form-control" value={billId} onChange={(e) => setBillId(e.target.value ? Number(e.target.value) : '')} /></label>
        <label>Reason<input className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      </div>
      {bill.data ? (
        <DataTable columns={['Product', 'Sold qty', 'Rate', 'Return qty']}>
          {bill.data.items.map((i) => (
            <tr key={i.id}>
              <td>{i.productName}</td>
              <td>{i.quantity}</td>
              <td>{formatMoney(i.rate)}</td>
              <td>
                <input className="form-control" type="number" min={0} max={i.quantity} value={qty[i.id] ?? 0} onChange={(e) => setQty((s) => ({ ...s, [i.id]: Number(e.target.value) }))} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}
      <button className="btn btn-gold mt-3" type="button" disabled={!bill.data || mut.isPending} onClick={() => mut.mutate()}>Confirm return</button>
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
  const bill = useQuery({ queryKey: queryKeys.bill(Number(billId)), queryFn: () => billApi.get(Number(billId)), enabled: Boolean(Number(billId)) })
  const found = useQuery({ queryKey: queryKeys.productSearch(search, selectedStoreId), queryFn: () => productApi.search(search, selectedStoreId), enabled: search.length >= 2 })
  const returnValue = useMemo(() => {
    if (!bill.data) return 0
    return bill.data.items.reduce((s, i) => s + ((qty[i.id] || 0) / i.quantity) * i.total, 0)
  }, [bill.data, qty])
  const newValue = newItems.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0)
  const mut = useMutation({
    mutationFn: () =>
      returnApi.exchange({
        originalBillId: Number(billId),
        reason,
        returnItems: Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ originalBillItemId: Number(id), quantity: q })),
        newItems: newItems.map((i) => ({ productId: i.product.id, quantity: i.quantity, discountAmount: 0 })),
        billDiscount: 0,
        walletRedeemAmount: 0,
        payments: cash > 0 ? [{ paymentMode: PaymentMode.Cash, amount: cash }] : [],
      }),
    onSuccess: (r) => {
      toast.success(`Exchange completed. Difference ${formatMoney(r.differencePayable)}`)
      navigate(`/bills/${r.newBill.id}`)
    },
  })
  return (
    <>
      <PageHeader title="Exchange" />
      <div className="card-panel form-grid">
        <label>Original bill ID<input className="form-control" value={billId} onChange={(e) => setBillId(e.target.value ? Number(e.target.value) : '')} /></label>
        <label>Reason<input className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
      </div>
      {bill.data ? (
        <DataTable columns={['Old item', 'Qty sold', 'Return qty']}>
          {bill.data.items.map((i) => (
            <tr key={i.id}>
              <td>{i.productName}</td>
              <td>{i.quantity}</td>
              <td><input className="form-control" type="number" min={0} max={i.quantity} value={qty[i.id] ?? 0} onChange={(e) => setQty((s) => ({ ...s, [i.id]: Number(e.target.value) }))} /></td>
            </tr>
          ))}
        </DataTable>
      ) : null}
      <div className="card-panel mt-3">
        <h2>New products</h2>
        <input className="form-control mb-2" placeholder="Search product" value={search} onChange={(e) => setSearch(e.target.value)} />
        {found.data?.slice(0, 5).map((p) => (
          <button key={p.id} type="button" className="btn btn-link" onClick={() => setNewItems((x) => [...x, { product: p, quantity: 1 }])}>{p.productName}</button>
        ))}
        <ul>
          {newItems.map((i, idx) => (
            <li key={`${i.product.id}-${idx}`}>{i.product.productName} × {i.quantity}</li>
          ))}
        </ul>
        <p>Estimated return {formatMoney(returnValue)} · New items {formatMoney(newValue)} · Difference preview {formatMoney(newValue - returnValue)} (API is final)</p>
        <label>Cash towards difference<input className="form-control" type="number" value={cash} onChange={(e) => setCash(Number(e.target.value))} /></label>
        <button className="btn btn-gold mt-2" type="button" disabled={mut.isPending} onClick={() => mut.mutate()}>Confirm exchange</button>
      </div>
    </>
  )
}
