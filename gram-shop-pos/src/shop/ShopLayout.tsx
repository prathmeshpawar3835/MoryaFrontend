import { FormEvent, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShopAuthProvider, useShopAuth } from './ShopAuthContext'
import { ShopCartProvider, useShopCart } from './ShopCartContext'
import { shopApi } from './shopApi'

export function ShopProviders() {
  return (
    <ShopAuthProvider>
      <ShopCartProvider>
        <ShopLayout />
      </ShopCartProvider>
    </ShopAuthProvider>
  )
}

export function ShopLayout() {
  const { customer, logout } = useShopAuth()
  const { count } = useShopCart()
  const info = useQuery({ queryKey: ['shop', 'info'], queryFn: shopApi.info })
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const brand = info.data?.shopName || 'Gram Shop'

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const next = q.trim()
    navigate(next ? `/shop/products?q=${encodeURIComponent(next)}` : '/shop/products')
    setMenuOpen(false)
  }

  return (
    <div className="shop-root">
      <header className="shop-header">
        <div className="shop-header-bar">
          <Link to="/shop" className="shop-logo" onClick={() => setMenuOpen(false)}>
            {brand}
            <span>Fine jewellery</span>
          </Link>
          <nav className="shop-nav" aria-label="Shop">
            <NavLink to="/shop" end>
              Home
            </NavLink>
            <NavLink to="/shop/products">Shop</NavLink>
            <NavLink to="/shop/products?sort=name">Categories</NavLink>
            <NavLink to="/shop/offers">Offers</NavLink>
          </nav>
          <form className="shop-search" onSubmit={onSearch} role="search">
            <i className="bi bi-search" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jewellery"
              aria-label="Search products"
            />
          </form>
          <div className="shop-actions">
            <Link to={customer ? '/shop/account' : '/shop/login'} className="shop-icon-btn" aria-label={customer ? 'Account' : 'Login'}>
              <i className="bi bi-person" />
            </Link>
            <Link to="/shop/cart" className="shop-icon-btn" aria-label="Cart">
              <i className="bi bi-bag" />
              {count > 0 ? <span className="shop-bag-count">{count}</span> : null}
            </Link>
            <button type="button" className="shop-menu-btn" aria-label="Menu" onClick={() => setMenuOpen((v) => !v)}>
              <i className={`bi ${menuOpen ? 'bi-x' : 'bi-list'}`} />
            </button>
          </div>
        </div>
        <div className={`shop-mobile-nav ${menuOpen ? 'open' : ''}`}>
          <form onSubmit={onSearch} className="mb-2">
            <input className="form-control" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jewellery" />
          </form>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/shop/products" onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
          <Link to="/shop/offers" onClick={() => setMenuOpen(false)}>
            Offers
          </Link>
          <Link to={customer ? '/shop/account' : '/shop/login'} onClick={() => setMenuOpen(false)}>
            {customer ? customer.name : 'Login'}
          </Link>
          {customer ? (
            <button type="button" className="shop-btn shop-btn-ghost mt-2" onClick={() => { logout(); setMenuOpen(false) }}>
              Sign out
            </button>
          ) : null}
        </div>
      </header>
      <div className="shop-main">
        <Outlet />
      </div>
      <footer className="shop-footer">
        {brand} · {info.data?.address || 'Jewellery boutique'} · Staff counter: <Link to="/login">POS login</Link>
      </footer>
    </div>
  )
}
