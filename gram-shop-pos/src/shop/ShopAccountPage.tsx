import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatDateTime, formatMoney } from '../utils/format'
import { shopApi } from './shopApi'
import { useShopAuth } from './ShopAuthContext'
import { ShopEmpty } from './ShopComponents'

export function ShopAccountPage() {
  const { customer, loading, logout } = useShopAuth()
  const orders = useQuery({
    queryKey: ['shop', 'orders'],
    queryFn: shopApi.orders,
    enabled: Boolean(customer),
  })

  if (loading) return <div className="shop-skel" />
  if (!customer) {
    return (
      <div className="shop-empty">
        <h1>Sign in to view your account</h1>
        <Link to="/shop/login" className="shop-btn shop-btn-primary">
          Login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <p className="shop-kicker">Account</p>
          <h1>{customer.name}</h1>
          <p className="mb-0 text-muted">
            {customer.mobile}
            {customer.customerCode ? ` · ${customer.customerCode}` : ''}
          </p>
          {customer.address ? <p className="mb-0">{customer.address}</p> : null}
        </div>
        <button type="button" className="shop-btn shop-btn-ghost" onClick={logout}>
          Sign out
        </button>
      </div>
      <h2>Orders</h2>
      {orders.isLoading ? (
        <div className="shop-skel" />
      ) : !orders.data?.items.length ? (
        <ShopEmpty title="No orders yet" hint="When you place an order, it will appear here." />
      ) : (
        <div className="shop-side">
          {orders.data.items.map((o) => (
            <Link key={o.id} to={`/shop/orders/${o.id}`} className="d-flex justify-content-between py-3 text-reset text-decoration-none border-bottom">
              <div>
                <strong>{o.orderNumber}</strong>
                <div className="small text-muted">{formatDateTime(o.orderDate)}</div>
              </div>
              <div className="text-end">
                <div>{formatMoney(o.grandTotal)}</div>
                <div className="small text-muted">{o.statusName || `Status ${o.status}`}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
