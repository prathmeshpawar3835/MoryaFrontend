import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { productApi } from '../../api/productApi'
import { customerApi } from '../../api/customerApi'
import { posApi } from '../../api/posApi'
import { billApi } from '../../api/billApi'
import { referralApi } from '../../api/referralApi'
import { discountApi, birthdayApi } from '../../api/opsApi'
import { queryKeys } from '../../api/queryKeys'
import { useStore } from '../../context/StoreContext'
import { useDebounce } from '../../hooks/useDebounce'
import { useHotkeys } from '../../hooks/useHotkeys'
import { calculateBill } from '../../utils/billCalc'
import { formatMoney } from '../../utils/format'
import { DiscountKind, PaymentMode, ReturnKind, RewardType } from '../../types'
import type { Bill, Customer, Product, StoreDiscount } from '../../types'
import { ITEM_STATUS_LABELS, RETURN_KIND_LABELS } from '../../constants/labels'
import { Modal } from '../../components/common/Modal'
import { InvoiceView } from '../../components/print/InvoiceView'
import { StoreSelector } from '../../components/common/StoreSelector'

interface CartLine {
  product: Product
  quantity: number
  discountAmount: number
}

interface PendingAdjustment {
  key: string
  kind: number
  originalBillId: number
  originalBillNumber: string
  reason: string
  amount?: number
  items: { originalBillItemId: number; productName: string; quantity: number; lineValue: number }[]
  estimatedValue: number
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
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerAddress, setNewCustomerAddress] = useState('')
  const [newCustomerDob, setNewCustomerDob] = useState('')
  const [adjustments, setAdjustments] = useState<PendingAdjustment[]>([])
  const [adjSearch, setAdjSearch] = useState('')
  const [adjBillId, setAdjBillId] = useState(0)
  const [adjKind, setAdjKind] = useState<number>(ReturnKind.Return)
  const [adjQty, setAdjQty] = useState<Record<number, number>>({})
  const [adjReason, setAdjReason] = useState('')
  const [adjAmount, setAdjAmount] = useState<number | ''>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [salesPersonId, setSalesPersonId] = useState<number | ''>('')
  const [storeDiscountId, setStoreDiscountId] = useState<number | ''>('')
  const [birthdayOfferId, setBirthdayOfferId] = useState<number | ''>('')
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

  const mobileExact = customerDebounced.trim()
  const isMobileQuery = /^\d{10}$/.test(mobileExact)
  const byMobileQ = useQuery({
    queryKey: ['customers', 'by-mobile', mobileExact, storeId],
    enabled: isMobileQuery && !customer,
    queryFn: async () => {
      try {
        return await customerApi.byMobile(mobileExact, storeId)
      } catch {
        return null
      }
    },
  })

  const salesPersonsQ = useQuery({
    queryKey: queryKeys.salesPersons(storeId),
    queryFn: () => posApi.salesPersons(storeId!),
    enabled: Boolean(storeId),
  })

  const discountsQ = useQuery({
    queryKey: queryKeys.discounts(storeId, true, 1),
    queryFn: () => discountApi.list(storeId, true, 1),
    enabled: Boolean(storeId),
  })

  const eligibilityQ = useQuery({
    queryKey: queryKeys.birthdayEligibility(customer?.id ?? 0, storeId),
    queryFn: () => birthdayApi.eligibility(customer!.id, storeId),
    enabled: Boolean(customer?.id && storeId),
  })

  const referralQ = useQuery({
    queryKey: queryKeys.referralValidate(referralCode.trim(), storeId),
    queryFn: () => referralApi.validate(referralCode.trim(), customer?.id, storeId),
    enabled: referralCode.trim().length >= 4,
  })

  useEffect(() => {
    setBirthdayOfferId('')
  }, [customer?.id])

  const adjSearchQ = useQuery({
    queryKey: ['bills', 'pos-adj', adjSearch, storeId],
    queryFn: () => billApi.search({ search: adjSearch, storeId, pageSize: 8, pageNumber: 1 }),
    enabled: adjSearch.trim().length >= 3 && Boolean(customer),
  })
  const adjBillQ = useQuery({
    queryKey: queryKeys.bill(adjBillId),
    queryFn: () => billApi.get(adjBillId),
    enabled: adjBillId > 0,
  })

  useEffect(() => {
    if (byMobileQ.data) {
      setCustomer(byMobileQ.data)
      setCustomerQuery('')
    }
  }, [byMobileQ.data])

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

  const selectedDiscount: StoreDiscount | undefined = discountsQ.data?.find((d) => d.id === storeDiscountId)
  const eligible = useMemo(
    () => cart.reduce((s, l) => s + l.quantity * l.product.sellingPrice - l.discountAmount, 0),
    [cart],
  )
  const storeDiscountAmount = selectedDiscount
    ? selectedDiscount.discountKind === DiscountKind.Percentage
      ? Math.round((eligible * selectedDiscount.value) / 100 * 100) / 100
      : selectedDiscount.value
    : 0
  const referralApplies = Boolean(customer && !customer.hasCompletedSale && referralQ.data?.valid)
  const referralRate = referralApplies ? referralQ.data!.newCustomerDiscountRate : 0
  const referralDiscountPreview = referralApplies
    ? referralQ.data!.rewardType === RewardType.Percentage
      ? Math.round((eligible * referralRate) / 100 * 100) / 100
      : referralRate
    : 0
  const selectedBirthdayOffer = eligibilityQ.data?.offers.find((o) => o.id === birthdayOfferId)
  const birthdayDiscountPreview = selectedBirthdayOffer
    ? selectedBirthdayOffer.discountKind === DiscountKind.Percentage
      ? Math.round((eligible * selectedBirthdayOffer.value) / 100 * 100) / 100
      : selectedBirthdayOffer.value
    : 0

  const totals = useMemo(
    () =>
      calculateBill(
        cart.map((l) => ({
          quantity: l.quantity,
          rate: l.product.sellingPrice,
          discountAmount: l.discountAmount,
          taxPercent: l.product.taxPercent,
        })),
        billDiscount + storeDiscountAmount + referralDiscountPreview + birthdayDiscountPreview,
      ),
    [cart, billDiscount, storeDiscountAmount, referralDiscountPreview, birthdayDiscountPreview],
  )

  const adjustmentTotal = adjustments.reduce((s, a) => s + a.estimatedValue, 0)
  const payableBeforeWallet = Math.max(0, Math.round((totals.grandTotal - adjustmentTotal) * 100) / 100)
  const creditGeneratedPreview = Math.max(0, Math.round((adjustmentTotal - totals.grandTotal) * 100) / 100)
  const availableCredit = walletQ.data?.balance ?? customer?.walletBalance ?? 0
  const creditUsedPreview = Math.min(walletRedeem, payableBeforeWallet, availableCredit)
  const payable = Math.max(0, Math.round((payableBeforeWallet - creditUsedPreview) * 100) / 100)
  const remainingCreditPreview = Math.round((availableCredit - creditUsedPreview + creditGeneratedPreview) * 100) / 100

  const paidNonCredit = Object.entries(payments)
    .filter(([mode]) => Number(mode) !== PaymentMode.Credit)
    .reduce((s, [, amt]) => s + Number(amt || 0), 0)
  const creditAmt = Number(payments[PaymentMode.Credit] || 0)
  const paidTotal = paidNonCredit + creditUsedPreview
  const remaining = Math.round((payable - creditAmt - paidNonCredit) * 100) / 100

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
    setNewCustomerName('')
    setNewCustomerAddress('')
    setNewCustomerDob('')
    setSalesPersonId('')
    setStoreDiscountId('')
    setBirthdayOfferId('')
    setPayments({ [PaymentMode.Cash]: 0 })
    setRefs({})
    setWalletRedeem(0)
    setAdjustments([])
    setAdjSearch('')
    setAdjBillId(0)
    setAdjQty({})
    setAdjReason('')
    setAdjAmount('')
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
        salesPersonId: salesPersonId || undefined,
        storeDiscountId: storeDiscountId || undefined,
        birthdayOfferId: birthdayOfferId || undefined,
        items: cart.map((l) => ({ productId: l.product.id, quantity: l.quantity, discountAmount: l.discountAmount })),
        adjustments: adjustments.map((a) => ({
          kind: a.kind,
          originalBillId: a.originalBillId,
          reason: a.reason || undefined,
          amount: a.kind === ReturnKind.Buyback ? a.amount : undefined,
          items: a.items.map((i) => ({ originalBillItemId: i.originalBillItemId, quantity: i.quantity })),
        })),
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
      if (bill.customerId) await qc.invalidateQueries({ queryKey: queryKeys.customerWallet(bill.customerId) })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to complete bill')
    },
  })

  const createCustomerMut = useMutation({
    mutationFn: () =>
      customerApi.create({
        storeId: storeId!,
        name: newCustomerName.trim(),
        mobileNumber: mobileExact || customerQuery.trim(),
        address: newCustomerAddress || undefined,
        dateOfBirth: newCustomerDob || undefined,
        referralCode: referralCode || undefined,
      }),
    onSuccess: (created) => {
      setCustomer(created)
      setCustomerQuery('')
      setCreateOpen(false)
      toast.success(`Customer ${created.name} created and selected`)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Could not create customer')
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
        <Link to="/dashboard" className="pos-brand" title="Back to Dashboard">
          <span className="brand-mark">1G</span>
          <span className="d-none d-sm-flex flex-column lh-1">
            <strong>Sales entry</strong>
            <small>Counter billing</small>
          </span>
        </Link>

        <div className="topnav-store-badge pos-store">
          <StoreSelector allowAll={false} />
        </div>

        <div className="search-wrapper">
          <i className="bi bi-upc-scan" />
          <input
            ref={searchRef}
            className="form-control"
            placeholder="Scan barcode or search product (F2)"
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
            <div className="pos-search-results">
              <div className="pos-search-head">
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
                      <i className="bi bi-cart3 fs-1 d-block mb-2" />
                      <div className="fw-semibold fs-5 text-navy-900">Cart is empty</div>
                      <small className="text-muted">Scan a barcode or search a product name above.</small>
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

          <div className="card border-0 shadow-sm mt-3" style={{ borderRadius: '12px' }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-2">
              <strong>Exchange / Return / Buyback</strong>
              <span className="small text-muted">Optional — same sale transaction</span>
            </div>
            <div className="card-body py-3">
              {!customer ? (
                <div className="text-muted small">Select a customer first to look up an original invoice.</div>
              ) : (
                <>
                  <div className="row g-2 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label small mb-1">Original invoice number</label>
                      <input
                        className="form-control form-control-sm"
                        placeholder="Search invoice number"
                        value={adjSearch}
                        onChange={(e) => setAdjSearch(e.target.value)}
                      />
                      {adjSearchQ.data?.items.length ? (
                        <div className="list-group shadow-sm mt-1">
                          {adjSearchQ.data.items.map((b) => (
                            <button
                              key={b.id}
                              type="button"
                              className="list-group-item list-group-item-action py-1 small"
                              onClick={() => {
                                setAdjBillId(b.id)
                                setAdjSearch(b.billNumber)
                                setAdjQty({})
                              }}
                            >
                              <strong>{b.billNumber}</strong> · {b.customerName || 'Walk-in'} · {formatMoney(b.grandTotal)}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small mb-1">Transaction type</label>
                      <select className="form-select form-select-sm" value={adjKind} onChange={(e) => setAdjKind(Number(e.target.value))}>
                        <option value={ReturnKind.Return}>Return</option>
                        <option value={ReturnKind.Exchange}>Exchange</option>
                        <option value={ReturnKind.Buyback}>Buyback</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small mb-1">Reason</label>
                      <input className="form-control form-control-sm" value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                    </div>
                  </div>
                  {adjKind === ReturnKind.Exchange ? (
                    <div className="alert alert-info py-2 px-3 mt-2 mb-0 small">
                      Add replacement products to the current cart. The original item value will reduce this bill, and a separate Exchange Receipt will still be generated.
                    </div>
                  ) : null}
                  {adjBillQ.data ? (
                    adjBillQ.data.customerId && adjBillQ.data.customerId !== customer.id ? (
                      <div className="alert alert-danger py-2 mt-2 mb-0 small">This invoice belongs to a different customer.</div>
                    ) : (
                      <div className="table-responsive mt-2">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Product</th>
                              <th>Status</th>
                              <th>Qty remaining</th>
                              <th>Process qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adjBillQ.data.items.map((i) => {
                              const remainingQty = i.remainingQuantity ?? i.quantity
                              const locked = remainingQty <= 0
                              return (
                                <tr key={i.id} className={locked ? 'table-secondary' : undefined}>
                                  <td>
                                    <div className="fw-semibold">{i.productName}</div>
                                    <div className="small text-muted">{i.productCode}</div>
                                  </td>
                                  <td>
                                    <span className="badge bg-light text-dark border">{ITEM_STATUS_LABELS[i.fulfillmentStatus ?? 1]}</span>
                                  </td>
                                  <td>{remainingQty}</td>
                                  <td style={{ width: '110px' }}>
                                    {locked ? (
                                      <span className="text-muted small">Not available</span>
                                    ) : (
                                      <input
                                        className="form-control form-control-sm"
                                        type="number"
                                        min={0}
                                        max={remainingQty}
                                        value={adjQty[i.id] ?? 0}
                                        onChange={(e) => setAdjQty((s) => ({ ...s, [i.id]: Number(e.target.value) }))}
                                      />
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                        {adjKind === ReturnKind.Buyback ? (
                          <div className="mt-2" style={{ maxWidth: '220px' }}>
                            <label className="form-label small mb-1">Buyback value (optional)</label>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min={0}
                              value={adjAmount}
                              onChange={(e) => setAdjAmount(e.target.value === '' ? '' : Number(e.target.value))}
                            />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary mt-2"
                          onClick={() => {
                            const bill = adjBillQ.data
                            if (!bill) return
                            const selected = bill.items
                              .filter((i) => (adjQty[i.id] || 0) > 0)
                              .map((i) => {
                                const qty = adjQty[i.id]
                                return {
                                  originalBillItemId: i.id,
                                  productName: i.productName,
                                  quantity: qty,
                                  lineValue: Math.round((i.total * qty) / i.quantity * 100) / 100,
                                }
                              })
                            if (!selected.length) {
                              toast.error('Select at least one available product')
                              return
                            }
                            const estimated =
                              adjKind === ReturnKind.Buyback && adjAmount !== ''
                                ? Number(adjAmount)
                                : selected.reduce((s, i) => s + i.lineValue, 0)
                            setAdjustments((prev) => [
                              ...prev,
                              {
                                key: `${bill.id}-${adjKind}-${Date.now()}`,
                                kind: adjKind,
                                originalBillId: bill.id,
                                originalBillNumber: bill.billNumber,
                                reason: adjReason,
                                amount: adjKind === ReturnKind.Buyback && adjAmount !== '' ? Number(adjAmount) : undefined,
                                items: selected,
                                estimatedValue: estimated,
                              },
                            ])
                            setAdjQty({})
                            setAdjAmount('')
                            toast.success(`${RETURN_KIND_LABELS[adjKind]} added to this sale`)
                          }}
                        >
                          Add to current sale
                        </button>
                      </div>
                    )
                  ) : null}
                  {adjustments.length ? (
                    <ul className="list-group mt-2">
                      {adjustments.map((a) => (
                        <li key={a.key} className="list-group-item d-flex justify-content-between align-items-center py-2 small">
                          <span>
                            {RETURN_KIND_LABELS[a.kind]} {a.originalBillNumber} · {a.items.map((i) => `${i.productName} × ${i.quantity}`).join(', ')}
                          </span>
                          <span className="d-flex align-items-center gap-2">
                            <strong className="text-danger">- {formatMoney(a.estimatedValue)}</strong>
                            <button type="button" className="btn btn-sm btn-outline-danger border-0" onClick={() => setAdjustments((p) => p.filter((x) => x.key !== a.key))}>
                              <i className="bi bi-x" />
                            </button>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Customer & Bill Summary Panel */}
        <aside className="pos-side">
          {/* Customer Selection */}
          <div>
            <label className="form-label d-flex justify-content-between align-items-center">
              <span>Customer mobile</span>
              <span className="shortcut-pill text-dark bg-light border">F4</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-phone" />
              </span>
              <input
                ref={customerRef}
                className="form-control border-start-0"
                placeholder="Enter 10-digit mobile number"
                value={customer ? `${customer.mobileNumber}` : customerQuery}
                onChange={(e) => {
                  setCustomer(null)
                  setCustomerQuery(e.target.value.replace(/\D/g, '').slice(0, 10))
                }}
              />
              {customer ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
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

            {!customer && customerQuery.trim().length >= 3 && !isMobileQuery && customerQ.data?.length ? (
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
                    <span className="badge bg-light text-dark border">{c.customerCode || c.referralCode}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {!customer && isMobileQuery && byMobileQ.isFetched && !byMobileQ.data ? (
              <div className="alert alert-warning py-2 px-3 mt-2 mb-0 small">
                Customer not found for {mobileExact}.
                <button type="button" className="btn btn-sm btn-gold ms-2" onClick={() => setCreateOpen(true)}>
                  Create customer
                </button>
              </div>
            ) : null}

            {customer ? (
              <div className="pos-customer-card">
                <div className="fw-bold text-navy-900">{customer.name}</div>
                <div className="small text-muted">
                  {customer.mobileNumber} · Code {customer.customerCode || customer.referralCode}
                </div>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  <span className="badge bg-primary-subtle text-primary border">
                    Available Credit: {formatMoney(availableCredit)}
                  </span>
                  {creditGeneratedPreview > 0 ? (
                    <span className="badge bg-success-subtle text-success border">
                      Credit Generated From This Transaction: {formatMoney(creditGeneratedPreview)}
                    </span>
                  ) : null}
                  {creditUsedPreview > 0 ? (
                    <span className="badge bg-warning-subtle text-dark border">
                      Credit Used: {formatMoney(creditUsedPreview)}
                    </span>
                  ) : null}
                  <span className="badge bg-light text-dark border">
                    Remaining Credit: {formatMoney(remainingCreditPreview)}
                  </span>
                  <span className={`badge ${customer.outstandingBalance > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'} border`}>
                    Due: {formatMoney(customer.outstandingBalance)}
                  </span>
                  {eligibilityQ.data?.isBirthdayToday ? <span className="badge bg-warning text-dark">Birthday today</span> : null}
                </div>
                {eligibilityQ.data?.isBirthdayToday ? (
                  <div className="alert alert-warning py-2 px-3 mt-2 mb-0">
                    <div className="fw-bold">🎂 Birthday Today</div>
                    <div>Happy Birthday, {eligibilityQ.data.customerName}!</div>
                    {eligibilityQ.data.alreadyRedeemed ? (
                      <div className="fw-semibold mt-1">Birthday Offer Already Redeemed Today{eligibilityQ.data.redeemedInvoiceNumber ? ` (${eligibilityQ.data.redeemedInvoiceNumber})` : ''}</div>
                    ) : eligibilityQ.data.offers.length ? (
                      eligibilityQ.data.offers.map((offer) => (
                        <div key={offer.id} className="mt-2">
                          <div>
                            Available Offer:{' '}
                            <strong>
                              {offer.name} — {offer.discountKind === DiscountKind.Percentage ? `${offer.value}% OFF` : `${formatMoney(offer.value)} OFF`}
                            </strong>
                          </div>
                          <div className="small">Valid Today Only</div>
                          {birthdayOfferId === offer.id ? (
                            <button className="btn btn-sm btn-outline-secondary mt-1" type="button" onClick={() => setBirthdayOfferId('')}>
                              Remove birthday offer
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-gold mt-1" type="button" onClick={() => setBirthdayOfferId(offer.id)}>
                              Apply Birthday Offer
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="small mt-1">{eligibilityQ.data.message}</div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <label className="form-label">Referral / customer code</label>
            <input
              className="form-control form-control-sm"
              placeholder="Existing customer code"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            />
            {referralCode.trim().length >= 4 && referralQ.data ? (
              referralQ.data.valid ? (
                customer?.hasCompletedSale ? (
                  <div className="alert alert-warning py-2 px-3 mt-1 mb-0 small">
                    Referral is valid for {referralQ.data.referrerName} ({referralQ.data.referrerCode}), but the new-customer discount applies only on this customer's first invoice.
                  </div>
                ) : (
                  <div className="alert alert-success py-2 px-3 mt-1 mb-0 small">
                    Valid referral: {referralQ.data.referrerName} ({referralQ.data.referrerCode}).
                    {referralQ.data.rewardType === RewardType.Percentage
                      ? ` ${referralQ.data.newCustomerDiscountRate}% off this invoice only.`
                      : ` ${formatMoney(referralQ.data.newCustomerDiscountRate)} off this invoice only.`}
                  </div>
                )
              ) : (
                <div className="alert alert-danger py-2 px-3 mt-1 mb-0 small">{referralQ.data.message}</div>
              )
            ) : null}
          </div>

          <div>
            <label className="form-label">Sales person</label>
            <select
              className="form-select form-select-sm"
              value={salesPersonId}
              onChange={(e) => setSalesPersonId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Current user</option>
              {salesPersonsQ.data?.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.fullName}
                </option>
              ))}
            </select>
          </div>

          {discountsQ.data?.length ? (
            <div>
              <label className="form-label">Store discount</label>
              <select
                className="form-select form-select-sm"
                value={storeDiscountId}
                onChange={(e) => setStoreDiscountId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">None</option>
                {discountsQ.data.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.discountKind === DiscountKind.Percentage ? `${d.value}%` : formatMoney(d.value)})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

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
            {totals.itemDiscountTotal > 0 ? (
              <div>
                <span>Item Discount</span>
                <span className="text-danger">- {formatMoney(totals.itemDiscountTotal)}</span>
              </div>
            ) : null}
            {referralDiscountPreview > 0 ? (
              <div>
                <span>
                  Referral discount
                  {referralQ.data?.rewardType === RewardType.Percentage ? ` (${referralRate}%)` : ''}
                </span>
                <span className="text-success">- {formatMoney(referralDiscountPreview)}</span>
              </div>
            ) : null}
            {birthdayDiscountPreview > 0 ? (
              <div>
                <span>
                  {selectedBirthdayOffer?.name || 'Birthday offer'}
                  {selectedBirthdayOffer?.discountKind === DiscountKind.Percentage ? ` (${selectedBirthdayOffer.value}%)` : ''}
                </span>
                <span className="text-success">- {formatMoney(birthdayDiscountPreview)}</span>
              </div>
            ) : null}
            {storeDiscountAmount > 0 ? (
              <div>
                <span>
                  {selectedDiscount?.name || 'Store discount'}
                  {selectedDiscount?.discountKind === DiscountKind.Percentage ? ` (${selectedDiscount.value}%)` : ''}
                </span>
                <span className="text-success">- {formatMoney(storeDiscountAmount)}</span>
              </div>
            ) : null}
            {billDiscount > 0 ? (
              <div>
                <span>Other Discount</span>
                <span className="text-danger">- {formatMoney(billDiscount)}</span>
              </div>
            ) : null}
            <div>
              <span>Total Discount</span>
              <span className="text-danger">
                - {formatMoney(totals.itemDiscountTotal + billDiscount + storeDiscountAmount + referralDiscountPreview + birthdayDiscountPreview)}
              </span>
            </div>
            <div>
              <span>GST / Tax Amount</span>
              <span>+ {formatMoney(totals.taxAmount)}</span>
            </div>
            <div>
              <span>Grand Total</span>
              <span>{formatMoney(totals.grandTotal)}</span>
            </div>
            {adjustmentTotal > 0 ? (
              <div>
                <span>Exchange/Return/Buyback Adjustment</span>
                <span className="text-danger">- {formatMoney(adjustmentTotal)}</span>
              </div>
            ) : null}
            {creditUsedPreview > 0 ? (
              <div>
                <span>Customer Credit Used</span>
                <span className="text-danger">- {formatMoney(creditUsedPreview)}</span>
              </div>
            ) : null}
            {creditGeneratedPreview > 0 ? (
              <div>
                <span>Credit Generated</span>
                <span className="text-success">{formatMoney(creditGeneratedPreview)}</span>
              </div>
            ) : null}
            <div className="grand">
              <span>Final Payable</span>
              <span className="text-navy-900">{formatMoney(payable)}</span>
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
                setPayments({ [PaymentMode.Cash]: payable })
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
                <span className="text-muted small d-block">Final Payable</span>
                <strong className="fs-5 text-navy-900">{formatMoney(payable)}</strong>
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
                      onClick={() => setPayments((p) => ({ ...p, [m.id]: Math.max(0, payable - paidNonCredit + Number(p[m.id] || 0)) }))}
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
                    <i className="bi bi-wallet2 me-1" /> Use Customer Credit (Available: {formatMoney(availableCredit)})
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text">₹</span>
                    <input
                      className="form-control"
                      type="number"
                      min={0}
                      max={Math.min(availableCredit, payableBeforeWallet)}
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

      <Modal open={createOpen} title="Create customer" onClose={() => setCreateOpen(false)}>
        <div className="stack-form">
          <label className="form-label">Mobile number</label>
          <input className="form-control" value={mobileExact || customerQuery} disabled />
          <label className="form-label">Customer name *</label>
          <input className="form-control" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
          <label className="form-label">Address</label>
          <input className="form-control" value={newCustomerAddress} onChange={(e) => setNewCustomerAddress(e.target.value)} />
          <label className="form-label">Date of birth (birthday offer)</label>
          <input className="form-control" type="date" max={new Date().toISOString().slice(0, 10)} value={newCustomerDob} onChange={(e) => setNewCustomerDob(e.target.value)} />
          <label className="form-label">Referral code (optional)</label>
          <input className="form-control" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} />
          <button
            type="button"
            className="btn btn-gold"
            disabled={!newCustomerName.trim() || createCustomerMut.isPending}
            onClick={() => createCustomerMut.mutate()}
          >
            {createCustomerMut.isPending ? 'Saving…' : 'Save and select'}
          </button>
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
  const [waError, setWaError] = useState<string | null>(null)
  const waMut = useMutation({
    mutationFn: () => billApi.sendWhatsApp(bill.id),
    onSuccess: (share) => {
      if (!share.shareUrl) {
        setWaError(share.error || 'Invoice generated successfully, but WhatsApp sending failed.')
        toast.error(share.error || 'Invoice generated successfully, but WhatsApp sending failed.')
        return
      }
      setWaError(null)
      window.open(share.shareUrl, '_blank', 'noopener,noreferrer')
      toast.success('WhatsApp message opened for sending')
    },
    onError: () => {
      setWaError('Invoice generated successfully, but WhatsApp sending failed.')
      toast.error('Invoice generated successfully, but WhatsApp sending failed.')
    },
  })

  return (
    <div className="p-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="card-panel mb-3">
        <div className="d-flex align-items-center gap-2 text-success mb-2">
          <i className="bi bi-check-circle-fill fs-3" />
          <h2 className="h4 fw-bold mb-0">Invoice Generated Successfully</h2>
        </div>
        <div className="small">
          <div>
            Invoice Number: <strong className="font-monospace">{bill.billNumber}</strong>
          </div>
          <div>Customer: {bill.customerName || 'Walk-in'}</div>
          {bill.customerMobile ? <div>Mobile: {bill.customerMobile}</div> : null}
          {bill.adjustments?.map((a) => (
            <div key={a.id} className="text-muted">
              {RETURN_KIND_LABELS[a.returnKind]} receipt: {a.returnNumber}
            </div>
          ))}
        </div>
        {waError ? <div className="alert alert-warning py-2 px-3 mt-2 mb-0 small">{waError}</div> : null}
        <div className="print-toolbar mb-0 mt-3">
          <button type="button" className="btn btn-outline-secondary" onClick={() => document.getElementById('invoice-preview')?.scrollIntoView({ behavior: 'smooth' })}>
            <i className="bi bi-receipt me-1" /> View Invoice
          </button>
          <button type="button" className="btn btn-success" onClick={() => waMut.mutate()} disabled={waMut.isPending || !bill.customerMobile}>
            {waMut.isPending ? 'Opening WhatsApp…' : 'Send Invoice on WhatsApp'}
          </button>
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

      <div id="invoice-preview">{inv.data ? <InvoiceView invoice={inv.data} /> : <div className="text-center py-5">Loading tax invoice…</div>}</div>
    </div>
  )
}
