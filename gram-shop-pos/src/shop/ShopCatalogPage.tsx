import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { shopApi } from './shopApi'
import { ShopEmpty, ShopGridSkeleton, ShopProductCard } from './ShopComponents'

export function ShopCatalogPage() {
  const [params, setParams] = useSearchParams()
  const categoryId = params.get('categoryId') || ''
  const q = params.get('q') || ''
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const stock = params.get('stock') || 'all'
  const sort = params.get('sort') || 'featured'
  const page = Number(params.get('page') || '1')

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }

  const query = useMemo(() => {
    const [sortColumn, sortDirection] = sort === 'price-asc' ? ['price', 'asc'] : sort === 'price-desc' ? ['price', 'desc'] : sort === 'name' ? ['name', 'asc'] : ['', '']
    return {
      pageNumber: page,
      pageSize: 12,
      search: q || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      inStock: stock === 'in' ? true : stock === 'out' ? false : undefined,
      sortColumn: sortColumn || undefined,
      sortDirection: sortDirection || undefined,
    }
  }, [categoryId, q, minPrice, maxPrice, stock, sort, page])

  const categories = useQuery({ queryKey: ['shop', 'categories'], queryFn: shopApi.categories })
  const catalog = useQuery({ queryKey: ['shop', 'catalog', query], queryFn: () => shopApi.catalog(query) })
  const items = catalog.data?.items ?? []

  return (
    <div className="shop-filters">
      <aside className="shop-side">
        <h2 className="h5 mb-3">Filter</h2>
        <label htmlFor="shop-cat">Category</label>
        <select id="shop-cat" value={categoryId} onChange={(e) => set('categoryId', e.target.value)}>
          <option value="">All collections</option>
          {categories.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label htmlFor="shop-min">Min price</label>
        <input id="shop-min" type="number" min={0} value={minPrice} onChange={(e) => set('minPrice', e.target.value)} />
        <label htmlFor="shop-max">Max price</label>
        <input id="shop-max" type="number" min={0} value={maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
        <label htmlFor="shop-stock">Availability</label>
        <select id="shop-stock" value={stock} onChange={(e) => set('stock', e.target.value)}>
          <option value="all">All</option>
          <option value="in">In stock</option>
          <option value="out">Sold out</option>
        </select>
        <label htmlFor="shop-sort">Sort</label>
        <select id="shop-sort" value={sort} onChange={(e) => set('sort', e.target.value)}>
          <option value="featured">Featured</option>
          <option value="name">Name</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </aside>
      <div>
        <div className="shop-section-head">
          <h1>{q ? `Results for “${q}”` : 'Shop jewellery'}</h1>
          <span className="text-muted small">{catalog.data?.totalCount ?? 0} pieces</span>
        </div>
        {catalog.isLoading ? (
          <ShopGridSkeleton />
        ) : catalog.isError ? (
          <div className="shop-error">Could not load the catalogue. Please try again.</div>
        ) : !items.length ? (
          <ShopEmpty title="No pieces match these filters" hint="Try another category or clear the price range." />
        ) : (
          <>
            <div className="shop-grid">
              {items.map((p) => (
                <ShopProductCard key={p.id} product={p} />
              ))}
            </div>
            {catalog.data && catalog.data.totalPages > 1 ? (
              <div className="d-flex justify-content-center gap-2 mt-4">
                <button type="button" className="shop-btn shop-btn-ghost" disabled={page <= 1} onClick={() => set('page', String(page - 1))}>
                  Previous
                </button>
                <button type="button" className="shop-btn shop-btn-ghost" disabled={page >= catalog.data.totalPages} onClick={() => set('page', String(page + 1))}>
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
