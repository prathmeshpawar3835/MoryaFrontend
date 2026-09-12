import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { productImageSrc } from '../utils/media'
import { formatMoney } from '../utils/format'
import { shopApi } from './shopApi'
import { useShopCart } from './ShopCartContext'
import { ShopEmpty, ShopProductCard } from './ShopComponents'

export function ShopProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const cart = useShopCart()
  const productId = Number(id)
  const q = useQuery({
    queryKey: ['shop', 'product', productId],
    queryFn: () => shopApi.product(productId),
    enabled: Number.isFinite(productId) && productId > 0,
  })

  if (q.isLoading) return <div className="shop-skel" style={{ minHeight: 360 }} />
  if (q.isError || !q.data) return <ShopEmpty title="This piece is no longer available" hint="It may have been removed from the catalogue." />

  const p = q.data
  const img = productImageSrc(p.imagePath, p.imageUrl)

  return (
    <>
      <div className="shop-product">
        <div className="shop-product-gallery">
          <img src={img} alt={p.productName} />
        </div>
        <div>
          <p className="shop-kicker">{p.categoryName}</p>
          <h1>{p.productName}</h1>
          <div className="shop-price my-3">
            <strong className="fs-3">{formatMoney(p.sellingPrice)}</strong>
            {p.mrp > p.sellingPrice ? <s>{formatMoney(p.mrp)}</s> : null}
            {p.discountPercent ? <span>{Math.round(p.discountPercent)}% off</span> : null}
          </div>
          <span className={`shop-badge ${p.inStock ? '' : 'sold'}`}>{p.inStock ? `In stock · ${p.stockQuantity}` : 'Sold out'}</span>
          <p className="mt-3">{p.description}</p>
          <ul className="shop-specs">
            <li>
              <span>SKU</span>
              <strong>{p.productCode}</strong>
            </li>
            <li>
              <span>Category</span>
              <strong>{p.categoryName}</strong>
            </li>
            {p.metal ? (
              <li>
                <span>Metal</span>
                <strong>{p.metal}</strong>
              </li>
            ) : null}
            {p.weightGrams ? (
              <li>
                <span>Weight</span>
                <strong>{p.weightGrams} g</strong>
              </li>
            ) : null}
            <li>
              <span>Unit</span>
              <strong>{p.unit}</strong>
            </li>
          </ul>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="shop-btn shop-btn-primary" disabled={!p.inStock} onClick={() => cart.add(p)}>
              Add to cart
            </button>
            <button
              type="button"
              className="shop-btn shop-btn-ghost"
              disabled={!p.inStock}
              onClick={() => {
                cart.add(p)
                navigate('/shop/checkout')
              }}
            >
              Buy now
            </button>
          </div>
        </div>
      </div>
      {p.related.length ? (
        <section className="mt-5">
          <div className="shop-section-head">
            <h2>Related pieces</h2>
            <Link to={`/shop/products?categoryId=${p.categoryId}`}>More in {p.categoryName}</Link>
          </div>
          <div className="shop-grid">
            {p.related.map((r) => (
              <ShopProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  )
}
