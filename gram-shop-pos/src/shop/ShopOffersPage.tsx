import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatDate, formatMoney } from '../utils/format'
import { DiscountKind } from '../types'
import { shopApi } from './shopApi'
import { ShopEmpty, ShopGridSkeleton } from './ShopComponents'

export function ShopOffersPage() {
  const offers = useQuery({ queryKey: ['shop', 'offers'], queryFn: shopApi.offers })
  if (offers.isLoading) return <ShopGridSkeleton count={3} />
  if (offers.isError) return <div className="shop-error">Could not load offers.</div>
  if (!offers.data?.length) return <ShopEmpty title="No live offers" hint="Expired e-commerce offers are hidden automatically." />

  return (
    <>
      <div className="shop-section-head">
        <h1>Offers</h1>
      </div>
      <div className="shop-grid">
        {offers.data.map((o) => (
          <article key={o.id} className="shop-offer">
            <span className="shop-badge">Limited time</span>
            <h3>{o.name}</h3>
            <p>{o.description}</p>
            <p className="fw-bold">
              {o.discountKind === DiscountKind.Percentage ? `${o.value}% off` : `${formatMoney(o.value)} off`}
            </p>
            {o.validTo ? <p className="small text-muted">Expires {formatDate(o.validTo)}</p> : null}
            <Link to="/shop/products" className="shop-btn shop-btn-primary">
              Shop now
            </Link>
          </article>
        ))}
      </div>
    </>
  )
}
