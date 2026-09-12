import { FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { formatMoney } from '../utils/format'
import { toastApiError } from '../utils/errors'
import { DiscountKind } from '../types'
import { shopApi } from './shopApi'
import { useShopAuth } from './ShopAuthContext'
import { useShopCart } from './ShopCartContext'
import { ShopPaymentMode } from './shopTypes'

export function ShopCheckoutPage() {
  const { customer, loading } = useShopAuth()
  const { items, subtotal, clear } = useShopCart()
  const offers = useQuery({ queryKey: ['shop', 'offers'], queryFn: shopApi.offers })
  const navigate = useNavigate()
  const [address, setAddress] = useState(customer?.address ?? '')
  const [offerId, setOfferId] = useState<number | ''>('')
  const [paymentMode, setPaymentMode] = useState<number>(ShopPaymentMode.Upi)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (customer?.address) setAddress((current) => current || customer.address || '')
  }, [customer])

  if (loading) return <div className="shop-skel" />
  if (!customer) return <Navigate to="/shop/login?from=/shop/checkout" replace />
  if (!items.length) {
    return (
      <div className="shop-empty">
        <h1>Your bag is empty</h1>
        <Link to="/shop/products">Continue shopping</Link>
      </div>
    )
  }

  const selectedOffer = offers.data?.find((o) => o.id === offerId)
  const estimatedDiscount =
    selectedOffer == null
      ? 0
      : selectedOffer.discountKind === DiscountKind.Percentage
        ? Math.round((subtotal * selectedOffer.value) / 100)
        : selectedOffer.value
  const estimatedTotal = Math.max(0, subtotal - estimatedDiscount)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      toast.error('Please enter a delivery address.')
      return
    }
    setSubmitting(true)
    try {
      const result = await shopApi.checkout({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        offerId: offerId || null,
        paymentMode,
        paymentReference: reference || undefined,
        address: address.trim(),
        notes: notes || undefined,
      })
      clear()
      if (result.notificationMessage) toast(result.notificationMessage)
      toast.success('Order placed')
      navigate(`/shop/orders/${result.order.id}`, { state: { confirmation: true, notificationSent: result.notificationSent } })
    } catch (err) {
      toastApiError(err, 'Order could not be placed. Stock may have changed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="row g-4 shop-checkout" onSubmit={onSubmit}>
      <div className="col-lg-7">
        <h1>Checkout</h1>
        <label htmlFor="addr">Delivery address</label>
        <textarea id="addr" rows={3} required value={address} onChange={(e) => setAddress(e.target.value)} />
        <label htmlFor="offer">E-commerce offer</label>
        <select id="offer" value={offerId} onChange={(e) => setOfferId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">None</option>
          {offers.data?.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
        <label htmlFor="pay">Payment</label>
        <select id="pay" value={paymentMode} onChange={(e) => setPaymentMode(Number(e.target.value))}>
          <option value={ShopPaymentMode.Upi}>UPI</option>
          <option value={ShopPaymentMode.Card}>Card</option>
          <option value={ShopPaymentMode.Cash}>Cash</option>
          <option value={ShopPaymentMode.Cod}>Cash on delivery</option>
        </select>
        {paymentMode !== ShopPaymentMode.Cod ? (
          <>
            <label htmlFor="ref">Payment reference (optional)</label>
            <input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          </>
        ) : null}
        <label htmlFor="notes">Order note</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <aside className="col-lg-5">
        <div className="shop-side">
          <h2 className="h5">Order summary</h2>
          {items.map((i) => (
            <div key={i.productId} className="d-flex justify-content-between py-2 small">
              <span>
                {i.productName} × {i.quantity}
              </span>
              <span>{formatMoney(i.sellingPrice * i.quantity)}</span>
            </div>
          ))}
          <div className="d-flex justify-content-between py-2">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="d-flex justify-content-between py-2">
            <span>Estimated offer</span>
            <span>− {formatMoney(estimatedDiscount)}</span>
          </div>
          <div className="d-flex justify-content-between py-2 fw-bold">
            <span>Estimated total</span>
            <span>{formatMoney(estimatedTotal)}</span>
          </div>
          <p className="small text-muted">Final price, tax and stock are confirmed by the server. Sold-out pieces cannot be ordered.</p>
          <button type="submit" className="shop-btn shop-btn-primary w-100" disabled={submitting}>
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
        </div>
      </aside>
    </form>
  )
}
