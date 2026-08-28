import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sidebar } from '../components/layout/Sidebar'
import { TopNav } from '../components/layout/TopNav'
import { RequiredPasswordModal } from '../components/layout/RequiredPasswordModal'
import { PageLoader } from '../components/common/Feedback'

export function MainLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  if (loading) return <PageLoader label="Restoring session…" />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className={`atelier-shell ${menuOpen ? 'menu-open' : ''}`}>
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} onMenu={() => setMenuOpen((v) => !v)} />
      <TopNav />
      <main className="app-content">
        <Outlet />
      </main>
      {menuOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <RequiredPasswordModal />
    </div>
  )
}

export function AuthLayout() {
  const { pathname } = useLocation()
  const copy = pathname.includes('forgot')
    ? { title: 'Reset access', subtitle: 'Enter your username to generate a reset token' }
    : pathname.includes('reset')
      ? { title: 'Set a new password', subtitle: 'Use your token and choose a strong password' }
      : { title: 'Welcome back', subtitle: 'Sign in to your jewellery counter' }

  return (
    <div className="auth-shell">
      <aside className="auth-hero">
        <div className="auth-hero-photo" aria-hidden />
        <div className="auth-hero-copy-wrap">
          <div className="auth-hero-mark">1G</div>
          <p className="auth-hero-kicker">Gram Shop Jewellery</p>
          <h1>Gold, measured. Sales, effortless.</h1>
          <p className="auth-hero-copy">
            A boutique counter for 1 gram jewellery — stock, customers, and receipts in one atelier workspace.
          </p>
          <ul className="auth-hero-points">
            <li><i className="bi bi-lightning-charge-fill" /> Instant sales entry</li>
            <li><i className="bi bi-gem" /> Store-wise stock &amp; dues</li>
            <li><i className="bi bi-receipt" /> Ledgers, returns &amp; invoices</li>
          </ul>
        </div>
      </aside>
      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-brand">
            <span>1G</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export function POSLayout() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader label="Opening POS terminal…" />
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="pos-shell">
      <Outlet />
      <RequiredPasswordModal />
    </div>
  )
}
