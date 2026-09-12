import { Link, useNavigate } from 'react-router-dom'
import { productImageSrc } from '../utils/media'
import { formatMoney } from '../utils/format'
import { useShopCart } from './ShopCartContext'
import { ShopEmpty } from './ShopComponents'

export function ShopCartPage() {
  const { items, subtotal, setQuantity, remove } = useShopCart()
  const navigate = useNavigate()

  if (!items.length) {
    return (
      <ShopEmpty title="Your bag is empty" hint="Add a piece from the shop to continue." />
    )
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <h1>Shopping bag</h1>
        {items.map((item) => (
          <div key={item.productId} className="shop-bag-row">
            <img src={productImageSrc(item.imagePath, item.imageUrl)} alt={item.productName} />
            <div>
              <Link to={`/shop/products/${item.productId}`} className="text-reset text-decoration-none">
                <strong>{item.productName}</strong>
              </Link>
              <div className="small text-muted">{item.productCode}</div>
              <div className="shop-qty mt-2">
                <button type="button" aria-label="Decrease" onClick={() => setQuantity(item.productId, item.quantity - 1)}>
                  −
                </button>
                <span>{item.quantity}</span>
                <button type="button" aria-label="Increase" onClick={() => setQuantity(item.productId, item.quantity + 1)}>
                  +
                </button>
              </div>
              <button type="button" className="btn btn-link btn-sm px-0" onClick={() => remove(item.productId)}>
                Remove
              </button>
            </div>
            <strong>{formatMoney(item.sellingPrice * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <aside className="col-lg-4">
        <div className="shop-side">
          <h2 className="h5">Summary</h2>
          <div className="d-flex justify-content-between py-2">
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <p className="small text-muted">Offers and taxes are confirmed at checkout from live inventory.</p>
          <button type="button" className="shop-btn shop-btn-primary w-100" onClick={() => navigate('/shop/checkout')}>
            Proceed to checkout
          </button>
        </div>
      </aside>
    </div>
  )
}
