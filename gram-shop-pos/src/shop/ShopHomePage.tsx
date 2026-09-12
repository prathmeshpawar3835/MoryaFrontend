import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { formatDate, formatMoney } from '../utils/format'
import { DiscountKind } from '../types'
import { shopApi } from './shopApi'
import { ShopEmpty, ShopGridSkeleton, ShopProductCard } from './ShopComponents'

export function ShopHomePage() {
  const info = useQuery({ queryKey: ['shop', 'info'], queryFn: shopApi.info })
  const categories = useQuery({ queryKey: ['shop', 'categories'], queryFn: shopApi.categories })
  const offers = useQuery({ queryKey: ['shop', 'offers'], queryFn: shopApi.offers })
  const products = useQuery({
    queryKey: ['shop', 'featured'],
    queryFn: () => shopApi.catalog({ pageNumber: 1, pageSize: 8, inStock: true, sortColumn: 'name', sortDirection: 'asc' }),
  })

  const heroOffer = offers.data?.[0]
  const featured = products.data?.items ?? []

  return (
    <>
      <section className="shop-hero" aria-label="Featured">
        <div className="shop-hero-copy">
          <p className="shop-kicker">{heroOffer ? 'Limited offer' : 'Atelier collection'}</p>
          <h1>{heroOffer?.name || 'Jewellery made to be worn every day.'}</h1>
          <p>
            {heroOffer?.description ||
              `Discover ${info.data?.shopName || 'our'} rings, chains, earrings and bridal pieces — live from the same inventory as the boutique counter.`}
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/shop/products" className="shop-btn shop-btn-primary">
              Shop now
            </Link>
            <Link to="/shop/offers" className="shop-btn shop-btn-ghost">
              View offers
            </Link>
          </div>
        </div>
        <div className="shop-hero-visual" role="img" aria-label="Jewellery collection" />
      </section>

      <section className="mb-5">
        <div className="shop-section-head">
          <h2>Collections</h2>
          <Link to="/shop/products">All jewellery</Link>
        </div>
        {categories.isLoading ? (
          <ShopGridSkeleton count={4} />
        ) : categories.isError ? (
          <div className="shop-error">Could not load categories. Please try again.</div>
        ) : !categories.data?.length ? (
          <ShopEmpty title="Collections will appear here" hint="Add product categories in the existing catalogue." />
        ) : (
          <div className="shop-grid">
            {categories.data.map((c) => (
              <Link key={c.id} to={`/shop/products?categoryId=${c.id}`} className="shop-cat">
                <p className="shop-kicker mb-2">Category</p>
                <h3>{c.name}</h3>
                <p className="mb-0 text-muted small">{c.description || 'Browse this collection'}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mb-5">
        <div className="shop-section-head">
          <h2>Online offers</h2>
          <Link to="/shop/offers">See all</Link>
        </div>
        {offers.isLoading ? (
          <ShopGridSkeleton count={3} />
        ) : !offers.data?.length ? (
          <ShopEmpty title="No live e-commerce offers" hint="Create an e-commerce-only discount in Settings → Discounts." />
        ) : (
          <div className="shop-grid">
            {offers.data.slice(0, 4).map((o) => (
              <Link key={o.id} to="/shop/products" className="shop-offer">
                <span className="shop-badge">E-commerce only</span>
                <h3>{o.name}</h3>
                <p>
                  {o.discountKind === DiscountKind.Percentage ? `${o.value}% off` : `${formatMoney(o.value)} off`}
                </p>
                {o.validTo ? <p className="small text-muted mb-2">Ends {formatDate(o.validTo)}</p> : null}
                <span className="shop-btn shop-btn-primary">Shop now</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="shop-section-head">
          <h2>In the atelier</h2>
          <Link to="/shop/products">View all</Link>
        </div>
        {products.isLoading ? (
          <ShopGridSkeleton />
        ) : products.isError ? (
          <div className="shop-error">Could not load products. Please try again.</div>
        ) : !featured.length ? (
          <ShopEmpty title="No jewellery in stock online" hint="Products appear here from the existing inventory." />
        ) : (
          <div className="shop-grid">
            {featured.map((p) => (
              <ShopProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
