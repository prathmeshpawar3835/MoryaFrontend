import { Link } from 'react-router-dom'
import { productImageSrc } from '../utils/media'
import { formatMoney } from '../utils/format'
import type { ShopProduct } from './shopTypes'
import { useShopCart } from './ShopCartContext'

export function ShopProductCard({ product }: { product: ShopProduct }) {
  const cart = useShopCart()
  const img = productImageSrc(product.imagePath, product.imageUrl)
  return (
    <article className="shop-card">
      <Link to={`/shop/products/${product.id}`}>
        <img src={img} alt={product.productName} loading="lazy" />
      </Link>
      <div className="shop-card-body">
        <span className={`shop-badge ${product.inStock ? '' : 'sold'}`}>{product.inStock ? product.categoryName : 'Sold out'}</span>
        <h3>
          <Link to={`/shop/products/${product.id}`} className="text-decoration-none text-reset">
            {product.productName}
          </Link>
        </h3>
        <div className="shop-price">
          <strong>{formatMoney(product.sellingPrice)}</strong>
          {product.mrp > product.sellingPrice ? <s>{formatMoney(product.mrp)}</s> : null}
          {product.discountPercent ? <span className="small text-muted">{Math.round(product.discountPercent)}% off</span> : null}
        </div>
        <div className="d-flex gap-2 mt-3">
          <button
            type="button"
            className="shop-btn shop-btn-primary flex-grow-1"
            disabled={!product.inStock}
            onClick={() => cart.add(product)}
          >
            {product.inStock ? 'Add to cart' : 'Sold out'}
          </button>
          <Link to={`/shop/products/${product.id}`} className="shop-btn shop-btn-ghost">
            View
          </Link>
        </div>
      </div>
    </article>
  )
}

export function ShopGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="shop-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shop-skel" />
      ))}
    </div>
  )
}

export function ShopEmpty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="shop-empty">
      <img src="/images/ui/empty.svg" alt="" width={72} height={72} />
      <h3 className="mt-3">{title}</h3>
      {hint ? <p>{hint}</p> : null}
    </div>
  )
}
