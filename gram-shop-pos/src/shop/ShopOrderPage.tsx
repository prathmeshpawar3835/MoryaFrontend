import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatDateTime, formatMoney } from '../utils/format'
import { shopApi } from './shopApi'
import { useShopAuth } from './ShopAuthContext'
import { ShopEmpty } from './ShopComponents'

export function ShopOrderPage() {
  const { id } = useParams()
  const location = useLocation()
  const { customer } = useShopAuth()
  const orderId = Number(id)
  const confirmation = Boolean((location.state as { confirmation?: boolean } | null)?.confirmation)
  const q = useQuery({
    queryKey: ['shop', 'order', orderId],
    queryFn: () => shopApi.order(orderId),
    enabled: Boolean(customer) && Number.isFinite(orderId),
  })

  if (!customer) {
    return (
      <div className="shop-empty">
        <h1>Sign in to view this order</h1>
        <Link to="/shop/login">Login</Link>
      </div>
    )
  }
  if (q.isLoading) return <div className="shop-skel" />
  if (q.isError || !q.data) return <ShopEmpty title="Order not found" />

  const o = q.data
  return (
    <div className="shop-side">
      {confirmation ? <p className="shop-kicker">Thank you</p> : <p className="shop-kicker">Order</p>}
      <h1>{confirmation ? 'Order confirmed' : o.orderNumber}</h1>
      <p className="text-muted">
        {o.orderNumber} · {formatDateTime(o.orderDate)} · {o.statusName || `Status ${o.status}`}
      </p>
      {o.items?.map((item) => (
        <div key={`${item.productId}-${item.productCode}`} className="d-flex justify-content-between py-2">
          <span>
            {item.productName} × {item.quantity}
          </span>
          <span>{formatMoney(item.total)}</span>
        </div>
      ))}
      <div className="d-flex justify-content-between py-2">
        <span>Discount</span>
        <span>{formatMoney(o.discount)}</span>
      </div>
      <div className="d-flex justify-content-between py-2 fw-bold">
        <span>Total</span>
        <span>{formatMoney(o.grandTotal)}</span>
      </div>
      <p className="small text-muted mt-3 mb-0">
        {o.customerName} · {o.customerMobile}
        <br />
        {o.customerAddress}
      </p>
      <Link to="/shop/products" className="shop-btn shop-btn-primary mt-4">
        Continue shopping
      </Link>
    </div>
  )
}
