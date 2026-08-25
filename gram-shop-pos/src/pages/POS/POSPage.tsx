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
  { id: PaymentMode.Cash, label: '💵 Cash', icon: 'bi-cash' },
  { id: PaymentMode.Upi, label: '📱 UPI / QR', icon: 'bi-qr-code-scan' },
  { id: PaymentMode.Card, label: '💳 Card / POS', icon: 'bi-credit-card' },
  { id: PaymentMode.Credit, label: '📒 Udhaar / Credit', icon: 'bi-journal-bookmark' },
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
    else if (!found.length) toast.error('No matching product found')
  }

  const resetBill = () => {
    setCart([])
    setBillDiscount(0)
    setNotes('')
    setCustomer(null)
    setReferralCode('')
    setPayments({ [PaymentMode.Cash]: 0 })
    setRefs({})
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
      toast.success('Bill placed on hold successfully')
      await qc.invalidateQueries({ queryKey: queryKeys.heldBills(storeId) })
      resetBill()
      navigate('/pos/held')
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to hold bill')
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
      toast.success(`Bill ${bill.billNumber} completed!`)
      setCompleted(bill)
      setPayOpen(false)
      await qc.invalidateQueries({ queryKey: queryKeys.dashboard(storeId) })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to complete bill')
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
      <div className="p-4 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <div className="card-panel text-center p-5" style={{ maxWidth: '500px' }}>
          <i className="bi bi-shop text-warning fs-1 mb-3 d-block" />
          <h1 className="h4 fw-bold text-navy-900 mb-2">Select Active Counter Store</h1>
          <p className="text-muted mb-4">POS counter transactions must be assigned to a specific store branch rather than All Stores.</p>
          <div className="mb-4">
            <StoreSelector allowAll={false} />
          </div>
          <Link to="/dashboard" className="btn btn-outline-secondary">
            ← Return to Dashboard
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
      {/* Top POS Header */}
      <header className="pos-top">
        <Link to="/dashboard" className="btn btn-sm btn-outline-light d-flex align-items-center gap-1" title="Back to Dashboard">
          <i className="bi bi-arrow-left" />
          <span className="d-none d-sm-inline">Dashboard</span>
        </Link>

        <StoreSelector allowAll={false} />

        <div className="search-wrapper">
          <i className="bi bi-upc-scan" />
          <input
            ref={searchRef}
            className="form-control"
            placeholder="Scan barcode or type Name/Code (Press F2 to focus, Enter to add)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void scanOrSearch()
              }
            }}
          />
        </div>

        <button
          type="button"
          className="btn btn-outline-light btn-sm d-flex align-items-center gap-1"
          onClick={() => setHelpOpen(true)}
          title="Keyboard Shortcuts"
        >
          <i className="bi bi-keyboard" />
          <span className="d-none d-md-inline">Shortcuts</span>
        </button>
      </header>

      {/* Main POS Grid */}
      <div className="pos-grid">
        {/* Left Side: Cart Items Table */}
        <div className="pos-cart">
          {/* Live Product Search Dropdown Popover */}
          {query.trim().length >= 2 && searchQ.data?.length ? (
            <div className="card shadow-md border-0 mb-3" style={{ borderRadius: '12px', zIndex: 10 }}>
              <div className="card-header bg-navy text-white d-flex justify-content-between align-items-center py-2 px-3">
                <span className="small fw-bold">Search Results ({searchQ.data.length})</span>
                <span className="small text-warning">Click item or press Enter to add</span>
              </div>
              <div className="list-group list-group-flush" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {searchQ.data.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2 px-3"
                    onClick={() => addProduct(p)}
                  >
                    <div>
                      <div className="fw-bold text-dark">{p.productName}</div>
                      <small className="text-muted">{p.productCode} {p.barcode ? `· ${p.barcode}` : ''}</small>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-navy-900">{formatMoney(p.sellingPrice)}</div>
                      <span className={`badge ${p.stockQuantity && p.stockQuantity > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill`}>
                        Stock: {p.stockQuantity ?? 0} {p.unit}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Cart Table */}
          <div className="table-shell">
            <table className="table app-table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Product Item</th>
                  <th style={{ width: '18%' }}>Quantity</th>
                  <th style={{ width: '13%' }}>Rate</th>
                  <th style={{ width: '12%' }}>Disc (₹)</th>
                  <th style={{ width: '10%' }}>Tax</th>
                  <th style={{ width: '12%' }} className="text-end">Line Total</th>
                  <th style={{ width: '5%' }} />
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-5">
                      <i className="bi bi-cart3 fs-1 text-slate-300 d-block mb-2" />
                      <div className="fw-semibold fs-5 text-slate-600">POS Cart is Empty</div>
                      <small className="text-muted">Use the barcode scanner or type product name/code in the search bar above.</small>
                    </td>
                  </tr>
                ) : (
                  cart.map((line, idx) => {
                    const calc = totals.lines[idx]
                    return (
                      <tr key={line.product.id}>
                        <td>
                          <div className="fw-bold text-navy-900">{line.product.productName}</div>
                          <div className="small text-muted">{line.product.productCode} · {line.product.unit}</div>
                        </td>
                        <td>
                          <div className="qty-cell">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                setCart((c) =>
                                  c.map((l) =>
                                    l.product.id === line.product.id
                                      ? { ...l, quantity: Math.max(0.01, l.quantity - 1) }
                                      : l
                                  )
                                )
                              }
                            >
                              −
                            </button>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min={0.01}
                              step="any"
                              value={line.quantity}
                              onChange={(e) =>
                                setCart((c) =>
                                  c.map((l) =>
                                    l.product.id === line.product.id
                                      ? { ...l, quantity: Number(e.target.value) }
                                      : l
                                  )
                                )
                              }
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() =>
                                setCart((c) =>
                                  c.map((l) =>
                                    l.product.id === line.product.id ? { ...l, quantity: l.quantity + 1 } : l
                                  )
                                )
                              }
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{formatMoney(line.product.sellingPrice)}</td>
                        <td>
                          <input
                            className="form-control form-control-sm"
                            type="number"
                            min={0}
                            value={line.discountAmount}
                            onChange={(e) =>
                              setCart((c) =>
                                c.map((l) =>
                                  l.product.id === line.product.id
                                    ? { ...l, discountAmount: Number(e.target.value) }
                                    : l
                                )
                              )
                            }
                          />
                        </td>
                        <td className="small text-muted">{calc ? formatMoney(calc.taxAmount) : '—'}</td>
                        <td className="text-end fw-bold text-navy-900">{calc ? formatMoney(calc.total) : '—'}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger border-0 p-1"
                            onClick={() => setCart((c) => c.filter((l) => l.product.id !== line.product.id))}
                            title="Remove item"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Customer & Bill Summary Panel */}
        <aside className="pos-side">
          {/* Customer Selection */}
          <div>
            <label className="form-label d-flex justify-content-between align-items-center">
              <span>Customer Details</span>
              <span className="shortcut-pill text-dark bg-light border">F4</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-person" />
              </span>
              <input
                ref={customerRef}
                className="form-control border-start-0"
                placeholder="Search mobile number or name"
                value={customer ? `${customer.name} (${customer.mobileNumber})` : customerQuery}
                onChange={(e) => {
                  setCustomer(null)
                  setCustomerQuery(e.target.value)
                }}
              />
              {customer ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0"
                  onClick={() => {
                    setCustomer(null)
                    setCustomerQuery('')
                  }}
                  title="Clear Customer"
                >
                  <i className="bi bi-x-lg" />
                </button>
              ) : null}
            </div>

            {/* Customer Search Dropdown */}
            {!customer && customerQ.data?.length ? (
              <div className="list-group shadow-sm mt-1" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                {customerQ.data.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="list-group-item list-group-item-action py-2 px-3 d-flex justify-content-between align-items-center small"
                    onClick={() => {
                      setCustomer(c)
                      setCustomerQuery('')
                    }}
                  >
                    <div>
                      <strong>{c.name}</strong> · {c.mobileNumber}
                    </div>
                    <span className={`badge ${c.outstandingBalance > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                      Due: {formatMoney(c.outstandingBalance)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Customer Wallet & Outstanding Status Pill */}
            {customer ? (
              <div className="d-flex gap-2 mt-2">
                <span className="badge bg-primary-subtle text-primary border border-primary-subtle py-1 px-2">
                  <i className="bi bi-wallet2 me-1" /> Wallet: {formatMoney(walletQ.data?.balance ?? customer.walletBalance)}
                </span>
                <span className={`badge ${customer.outstandingBalance > 0 ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-success-subtle text-success border border-success-subtle'} py-1 px-2`}>
                  <i className="bi bi-journal-text me-1" /> Due: {formatMoney(customer.outstandingBalance)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Referral Code */}
          <div>
            <label className="form-label">Referral Code (Optional)</label>
            <input
              className="form-control form-control-sm"
              placeholder="e.g. REF123"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
            />
          </div>

          {/* Bill Overall Discount */}
          <div>
            <label className="form-label">Overall Bill Discount (₹)</label>
            <input
              className="form-control form-control-sm"
              type="number"
              min={0}
              value={billDiscount}
              onChange={(e) => setBillDiscount(Number(e.target.value))}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">Bill Remarks / Notes</label>
            <input
              className="form-control form-control-sm"
              placeholder="Optional invoice notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Bill Totals Summary */}
          <div className="pos-totals">
            <div>
              <span>Items Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            <div>
              <span>Total Discount</span>
              <span className="text-danger">- {formatMoney(totals.itemDiscountTotal + totals.billDiscount)}</span>
            </div>
            <div>
              <span>GST / Tax Amount</span>
              <span>+ {formatMoney(totals.taxAmount)}</span>
            </div>
            <div className="grand">
              <span>Grand Total</span>
              <span className="text-navy-900">{formatMoney(totals.grandTotal)}</span>
            </div>
          </div>

          {/* POS Action Buttons */}
          <div className="pos-actions">
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-1"
              disabled={!cart.length || holdMut.isPending}
              onClick={() => holdMut.mutate()}
            >
              <i className="bi bi-pause-circle" />
              <span>Hold (F9)</span>
            </button>
            <button
              type="button"
              className="btn btn-pos-shortcut d-flex align-items-center justify-content-center gap-1"
              disabled={!cart.length}
              onClick={() => {
                setPayments({ [PaymentMode.Cash]: totals.grandTotal })
                setPayOpen(true)
              }}
            >
              <i className="bi bi-check2-circle fs-5" />
              <span>Pay & Bill (F10)</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Multi-Payment Modal Dialog */}
      <Modal open={payOpen} title="Complete POS Billing & Payment Split" onClose={() => setPayOpen(false)} wide>
        <div className="row g-4">
          <div className="col-md-7 border-end">
            <div className="d-flex justify-content-between p-3 bg-light rounded-3 mb-3">
              <div>
                <span className="text-muted small d-block">Grand Total</span>
                <strong className="fs-5 text-navy-900">{formatMoney(totals.grandTotal)}</strong>
              </div>
              <div>
                <span className="text-muted small d-block">Total Paid</span>
                <strong className="fs-5 text-success">{formatMoney(paidTotal)}</strong>
              </div>
              <div>
                <span className="text-muted small d-block">Balance Left</span>
                <strong className={`fs-5 ${remaining === 0 ? 'text-success' : 'text-danger'}`}>{formatMoney(remaining)}</strong>
              </div>
            </div>

            <div className="stack-form">
              {PAY_MODES.map((m) => (
                <div key={m.id} className="p-2 border rounded-2 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label mb-0 fw-bold">
                      <i className={`bi ${m.icon} me-1 text-gold`} /> {m.label}
                    </label>
                    {Number(payments[m.id]) > 0 ? (
                      <span className="badge bg-success-subtle text-success">Applied</span>
                    ) : null}
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">₹</span>
                    <input
                      className="form-control"
                      type="number"
                      min={0}
                      value={payments[m.id] ?? 0}
                      onChange={(e) => setPayments((p) => ({ ...p, [m.id]: Number(e.target.value) }))}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setPayments((p) => ({ ...p, [m.id]: Math.max(0, totals.grandTotal - paidNonCredit + Number(p[m.id] || 0)) }))}
                      title="Set full remaining amount"
                    >
                      Fill
                    </button>
                  </div>
                  {m.id !== PaymentMode.Cash && m.id !== PaymentMode.Credit ? (
                    <input
                      className="form-control form-control-sm mt-1"
                      placeholder="Transaction / Reference number"
                      value={refs[m.id] ?? ''}
                      onChange={(e) => setRefs((r) => ({ ...r, [m.id]: e.target.value }))}
                    />
                  ) : null}
                </div>
              ))}

              {customer ? (
                <div className="p-2 border rounded-2 bg-primary-subtle">
                  <label className="form-label mb-1 fw-bold text-primary">
                    <i className="bi bi-wallet2 me-1" /> Redeem from Customer Wallet (Available: {formatMoney(walletQ.data?.balance ?? 0)})
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">₹</span>
                    <input
                      className="form-control"
                      type="number"
                      min={0}
                      max={walletQ.data?.balance ?? 0}
                      value={walletRedeem}
                      onChange={(e) => setWalletRedeem(Number(e.target.value))}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-md-5 d-flex flex-direction-column justify-content-between">
            <div>
              <h3 className="h6 fw-bold text-navy-900 mb-2">Billing Confirmation Summary</h3>
              <ul className="list-group list-group-flush small mb-3">
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span>Customer</span>
                  <strong>{customer ? customer.name : 'Walk-in Customer'}</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span>Cart Items</span>
                  <strong>{cart.length} line(s)</strong>
                </li>
                <li className="list-group-item d-flex justify-content-between px-0">
                  <span>Total Quantity</span>
                  <strong>{cart.reduce((s, l) => s + l.quantity, 0)}</strong>
                </li>
              </ul>
              {payments[PaymentMode.Credit] > 0 && !customer ? (
                <div className="alert alert-danger py-2 small">
                  <i className="bi bi-exclamation-triangle-fill me-1" /> Credit / Udhaar billing requires selecting a customer.
                </div>
              ) : null}
            </div>

            <div>
              <button
                type="button"
                className="btn btn-gold w-100 py-2 fs-6 fw-bold"
                disabled={completeMut.isPending || !cart.length || (payments[PaymentMode.Credit] > 0 && !customer)}
                onClick={() => completeMut.mutate()}
              >
                {completeMut.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Generating Tax Invoice…
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1" /> Confirm & Generate Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      <Modal open={helpOpen} title="POS Counter Keyboard Shortcuts" onClose={() => setHelpOpen(false)}>
        <div className="table-responsive">
          <table className="table app-table mb-0">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge bg-dark">F2</span></td>
                <td>Focus Barcode / Product Search input</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">F4</span></td>
                <td>Focus Customer Mobile / Name search input</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">F8 / F10</span></td>
                <td>Open Payment Split & Complete Bill</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">F9</span></td>
                <td>Hold / Park Current Cart for later</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">Esc</span></td>
                <td>Close Open Dialogs / Popovers</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}

function CompletedBill({ bill, onNew }: { bill: Bill; onNew: () => void }) {
  const inv = useQuery({ queryKey: queryKeys.invoice(bill.id), queryFn: () => billApi.invoice(bill.id) })

  return (
    <div className="p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2 text-success">
          <i className="bi bi-check-circle-fill fs-3" />
          <div>
            <h2 className="h4 fw-bold mb-0">Invoice #{bill.billNumber} Saved Successfully</h2>
            <small className="text-muted">Transaction recorded in store inventory and financial accounts.</small>
          </div>
        </div>
        <div className="print-toolbar mb-0">
          <button type="button" className="btn btn-gold" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" /> Print Invoice
          </button>
          <button type="button" className="btn btn-outline-secondary" onClick={() => void billApi.invoicePdf(bill.id)}>
            <i className="bi bi-file-earmark-pdf me-1" /> Download PDF
          </button>
          <button type="button" className="btn btn-primary" onClick={onNew}>
            <i className="bi bi-plus-lg me-1" /> Start New Bill
          </button>
        </div>
      </div>

      {inv.data ? <InvoiceView invoice={inv.data} /> : <div className="text-center py-5">Loading tax invoice…</div>}
    </div>
  )
}
