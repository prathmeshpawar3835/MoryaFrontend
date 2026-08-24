import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productApi } from '../../api/productApi'
import { customerApi } from '../../api/customerApi'
import { posApi } from '../../api/posApi'
import { billApi } from '../../api/billApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { useDebounce } from '../../hooks/useDebounce'
import { useHotkeys } from '../../hooks/useHotkeys'
import { calculateBill } from '../../utils/billCalc'
import { formatMoney } from '../../utils/format'
import { PaymentMode } from '../../types'
import type { Bill, Customer, Product } from '../../types'
import { Modal } from '../../components/common/Modal'
import { InvoiceView } from '../../components/print/InvoiceView'
import { StoreSelector } from '../../components/common/StoreSelector'

interface CartLine {
  product: Product
  quantity: number
  discountAmount: number
}

const PAY_MODES = [
  { id: PaymentMode.Cash, label: 'Cash' },
  { id: PaymentMode.Upi, label: 'UPI' },
  { id: PaymentMode.Card, label: 'Card' },
  { id: PaymentMode.Credit, label: 'Credit' },
]

export function POSPage() {
  const { selectedStoreId, setSelectedStoreId } = useStore()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const qc = useQueryClient()
  const searchRef = useRef<HTMLInputElement>(null)
  const customerRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 250)
  const [cart, setCart] = useState<CartLine[]>([])
  const [billDiscount, setBillDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const customerDebounced = useDebounce(customerQuery, 250)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [payments, setPayments] = useState<Record<number, number>>({ [PaymentMode.Cash]: 0 })
  const [refs, setRefs] = useState<Record<number, string>>({})
  const [walletRedeem, setWalletRedeem] = useState(0)
  const [payOpen, setPayOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [completed, setCompleted] = useState<Bill | null>(null)
  const heldFromUrl = params.get('held')
  const [heldBillId, setHeldBillId] = useState<number | null>(heldFromUrl ? Number(heldFromUrl) : null)
  const storeId = selectedStoreId

  const searchQ = useQuery({
    queryKey: queryKeys.productSearch(debounced, storeId),
    queryFn: () => productApi.search(debounced, storeId),
    enabled: debounced.trim().length >= 2,
  })

  const customerQ = useQuery({
    queryKey: queryKeys.customerSearch(customerDebounced, storeId),
    queryFn: () => customerApi.search(customerDebounced, storeId),
    enabled: customerDebounced.trim().length >= 3,
  })

  const walletQ = useQuery({
    queryKey: queryKeys.customerWallet(customer?.id ?? 0),
    queryFn: () => customerApi.wallet(customer!.id),
    enabled: Boolean(customer),
  })

  useQuery({
    queryKey: ['pos', 'resume', heldBillId],
    enabled: Boolean(heldBillId),
    queryFn: async () => {
      const held = await posApi.resume(heldBillId!)
      setHeldBillId(held.id)
      setBillDiscount(held.billDiscount)
      setNotes(held.notes ?? '')
      if (held.storeId) setSelectedStoreId(held.storeId)
      if (held.customerId) setCustomer(await customerApi.get(held.customerId))
      const lines: CartLine[] = []
      for (const item of held.items) {
        const product = await productApi.get(item.productId, held.storeId)
        lines.push({ product, quantity: item.quantity, discountAmount: item.discountAmount })
      }
      setCart(lines)
      return held
    },
  })

  const totals = useMemo(
    () =>
      calculateBill(
        cart.map((l) => ({
          quantity: l.quantity,
          rate: l.product.sellingPrice,
          discountAmount: l.discountAmount,
          taxPercent: l.product.taxPercent,
        })),
        billDiscount,
      ),
    [cart, billDiscount],
  )

  const paidNonCredit = Object.entries(payments)
    .filter(([mode]) => Number(mode) !== PaymentMode.Credit)
    .reduce((s, [, amt]) => s + Number(amt || 0), 0)
  const creditAmt = Number(payments[PaymentMode.Credit] || 0)
  const paidTotal = paidNonCredit + walletRedeem
  const remaining = Math.round((totals.grandTotal - creditAmt - paidTotal) * 100) / 100

  const addProduct = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id)
      if (existing) return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l))
      return [...prev, { product, quantity: 1, discountAmount: 0 }]
    })
    setQuery('')
    searchRef.current?.focus()
  }

  const scanOrSearch = async () => {
    const value = query.trim()
    if (!value || !storeId) return
    try {
      addProduct(await productApi.barcode(value, storeId))
      return
    } catch {
      /* not barcode */
    }
    const found = await productApi.search(value, storeId)
    if (found.length === 1) addProduct(found[0])
    else if (!found.length) toast.error('No product found')
  }

  const resetBill = () => {
    setCart([])
    setBillDiscount(0)
    setNotes('')
    setCustomer(null)
    setReferralCode('')
    setPayments({ [PaymentMode.Cash]: 0 })
    setWalletRedeem(0)
    setHeldBillId(null)
    setCompleted(null)
  }

  const holdMut = useMutation({
    mutationFn: () =>
      posApi.hold({
        storeId: storeId!,
        customerId: customer?.id,
        billDiscount,
        notes,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity, discountAmount: l.discountAmount })),
      }),
    onSuccess: async () => {
      toast.success('Bill held')
      await qc.invalidateQueries({ queryKey: queryKeys.heldBills(storeId) })
      resetBill()
      navigate('/pos/held')
    },
  })

  const completeMut = useMutation({
    mutationFn: () =>
      posApi.createBill({
        storeId: storeId!,
        customerId: customer?.id,
        billDiscount,
        notes,
        heldBillId,
        referralCode: referralCode || undefined,
        walletRedeemAmount: walletRedeem,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity, discountAmount: l.discountAmount })),
        payments: Object.entries(payments)
          .filter(([, amt]) => Number(amt) > 0)
          .map(([mode, amt]) => ({
            paymentMode: Number(mode),
            amount: Number(amt),
            referenceNumber: refs[Number(mode)] || undefined,
          })),
      }),
    onSuccess: async (bill) => {
      toast.success(`Bill ${bill.billNumber} completed`)
      setCompleted(bill)
      setPayOpen(false)
      await qc.invalidateQueries({ queryKey: queryKeys.dashboard(storeId) })
    },
  })

  useHotkeys({
    F2: () => searchRef.current?.focus(),
    F4: () => customerRef.current?.focus(),
    F8: () => setPayOpen(true),
    F9: () => {
      if (cart.length && storeId) holdMut.mutate()
    },
    F10: () => setPayOpen(true),
    Escape: () => {
      setPayOpen(false)
      setHelpOpen(false)
    },
  })

  if (!storeId) {
    return (
      <div className="p-4">
        <div className="card-panel">
          <h1>Select a store</h1>
          <p>POS billing requires a specific store. Choose one store rather than All stores.</p>
          <StoreSelector allowAll={false} />
          <Link to="/dashboard" className="btn btn-outline-secondary mt-3">
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (completed) {
    return <CompletedBill bill={completed} onNew={resetBill} />
  }

  return (
    <div className="pos-app">
      <div className="pos-top">
        <Link to="/dashboard" className="btn btn-sm btn-outline-light">
          Dashboard
        </Link>
        <StoreSelector allowAll={false} />
        <input
          ref={searchRef}
          className="form-control"
          placeholder="Search name / code / barcode (F2) — scanner Enter to add"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void scanOrSearch()
            }
          }}
        />
        <button type="button" className="btn btn-outline-light btn-sm" onClick={() => setHelpOpen(true)}>
          Shortcuts
        </button>
      </div>
      <div className="pos-grid">
        <div className="pos-cart">
          {query.trim().length >= 2 && searchQ.data?.length ? (
            <div className="card-panel mb-2">
              {searchQ.data.slice(0, 8).map((p) => (
                <button key={p.id} type="button" className="btn btn-link d-block text-start" onClick={() => addProduct(p)}>
                  {p.productName} · {p.productCode} · {formatMoney(p.sellingPrice)}
                  {p.stockQuantity != null ? ` · stock ${p.stockQuantity}` : ''}
                </button>
              ))}
            </div>
          ) : null}
          <div className="table-shell">
            <table className="table app-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      Scan or search a product to start the bill.
                    </td>
                  </tr>
                ) : (
                  cart.map((line, idx) => {
                    const calc = totals.lines[idx]
                    return (
                      <tr key={line.product.id}>
                        <td>
                          <strong>{line.product.productName}</strong>
                          <div className="small text-muted">{line.product.productCode}</div>
                        </td>
                        <td>
                          <div className="qty-cell">
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCart((c) => c.map((l) => (l.product.id === line.product.id ? { ...l, quantity: Math.max(0.01, l.quantity - 1) } : l)))}>−</button>
                            <input className="form-control form-control-sm" type="number" min={0.01} step="any" value={line.quantity} onChange={(e) => setCart((c) => c.map((l) => (l.product.id === line.product.id ? { ...l, quantity: Number(e.target.value) } : l)))} />
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setCart((c) => c.map((l) => (l.product.id === line.product.id ? { ...l, quantity: l.quantity + 1 } : l)))}>+</button>
                          </div>
                        </td>
                        <td>{formatMoney(line.product.sellingPrice)}</td>
                        <td>
                          <input className="form-control form-control-sm" type="number" min={0} value={line.discountAmount} onChange={(e) => setCart((c) => c.map((l) => (l.product.id === line.product.id ? { ...l, discountAmount: Number(e.target.value) } : l)))} />
                        </td>
                        <td>{calc ? formatMoney(calc.taxAmount) : '—'}</td>
                        <td>{calc ? formatMoney(calc.total) : '—'}</td>
                        <td>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setCart((c) => c.filter((l) => l.product.id !== line.product.id))}>×</button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <aside className="pos-side">
          <label>
            Customer (F4)
            <input
              ref={customerRef}
              className="form-control"
              placeholder="Search mobile or name"
              value={customer ? `${customer.name} · ${customer.mobileNumber}` : customerQuery}
              onChange={(e) => {
                setCustomer(null)
                setCustomerQuery(e.target.value)
              }}
            />
          </label>
          {!customer && customerQ.data?.length ? (
            <div>
              {customerQ.data.map((c) => (
                <button key={c.id} type="button" className="btn btn-sm btn-outline-secondary w-100 mb-1 text-start" onClick={() => { setCustomer(c); setCustomerQuery('') }}>
                  {c.name} · {c.mobileNumber} · due {formatMoney(c.outstandingBalance)}
                </button>
              ))}
            </div>
          ) : null}
          {customer ? (
            <div className="small">
              Wallet {formatMoney(walletQ.data?.balance ?? customer.walletBalance)} · Due {formatMoney(customer.outstandingBalance)}
              <button type="button" className="btn btn-link btn-sm" onClick={() => setCustomer(null)}>Clear</button>
            </div>
          ) : null}
          <label>
            Referral code
            <input className="form-control" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} />
          </label>
          <label>
            Bill discount
            <input className="form-control" type="number" min={0} value={billDiscount} onChange={(e) => setBillDiscount(Number(e.target.value))} />
          </label>
          <label>
            Notes
            <input className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="pos-totals">
            <div><span>Subtotal</span><span>{formatMoney(totals.subtotal)}</span></div>
            <div><span>Discount</span><span>{formatMoney(totals.itemDiscountTotal + totals.billDiscount)}</span></div>
            <div><span>Tax</span><span>{formatMoney(totals.taxAmount)}</span></div>
            <div className="grand"><span>Grand total</span><span>{formatMoney(totals.grandTotal)}</span></div>
          </div>
          <div className="pos-actions">
            <button type="button" className="btn btn-outline-secondary" disabled={!cart.length || holdMut.isPending} onClick={() => holdMut.mutate()}>Hold (F9)</button>
            <button type="button" className="btn btn-gold" disabled={!cart.length} onClick={() => setPayOpen(true)}>Complete bill (F10)</button>
          </div>
        </aside>
      </div>

      <Modal open={payOpen} title="Payment" onClose={() => setPayOpen(false)} wide>
        <div className="row g-3">
          <div className="col-md-6">
            <p className="mb-1">Total {formatMoney(totals.grandTotal)}</p>
            <p className="mb-1">Paid {formatMoney(paidTotal)}</p>
            <p>Remaining {formatMoney(remaining)}</p>
            {PAY_MODES.map((m) => (
              <label key={m.id} className="mb-2">
                {m.label}
                <input className="form-control" type="number" min={0} value={payments[m.id] ?? 0} onChange={(e) => setPayments((p) => ({ ...p, [m.id]: Number(e.target.value) }))} />
                {m.id !== PaymentMode.Cash && m.id !== PaymentMode.Credit ? (
                  <input className="form-control mt-1" placeholder="Reference" value={refs[m.id] ?? ''} onChange={(e) => setRefs((r) => ({ ...r, [m.id]: e.target.value }))} />
                ) : null}
              </label>
            ))}
            {customer ? (
              <label>
                Wallet redeem (available {formatMoney(walletQ.data?.balance ?? 0)})
                <input className="form-control" type="number" min={0} value={walletRedeem} onChange={(e) => setWalletRedeem(Number(e.target.value))} />
              </label>
            ) : null}
          </div>
          <div className="col-md-6">
            <p className="text-muted">The API validates the final split. Credit / udhaar requires a customer.</p>
            <button type="button" className="btn btn-gold w-100" disabled={completeMut.isPending || !cart.length} onClick={() => completeMut.mutate()}>
              {completeMut.isPending ? 'Saving…' : 'Confirm & complete'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={helpOpen} title="Keyboard shortcuts" onClose={() => setHelpOpen(false)}>
        <ul>
          <li>F2 Product search</li>
          <li>F4 Customer</li>
          <li>F8 / F10 Payment / complete</li>
          <li>F9 Hold bill</li>
          <li>Esc Close dialog</li>
        </ul>
      </Modal>
    </div>
  )
}

function CompletedBill({ bill, onNew }: { bill: Bill; onNew: () => void }) {
  const inv = useQuery({ queryKey: queryKeys.invoice(bill.id), queryFn: () => billApi.invoice(bill.id) })
  return (
    <div className="p-3">
      <div className="print-toolbar">
        <button type="button" className="btn btn-gold" onClick={() => window.print()}>Print</button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => void billApi.invoicePdf(bill.id)}>Download PDF</button>
        <button type="button" className="btn btn-outline-secondary" onClick={onNew}>New bill</button>
      </div>
      <div className="alert alert-success">Bill {bill.billNumber} saved.</div>
      {inv.data ? <InvoiceView invoice={inv.data} /> : <p>Loading invoice…</p>}
    </div>
  )
}
