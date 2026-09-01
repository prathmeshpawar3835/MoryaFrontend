import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccess, type FeatureKey } from '../../constants/permissions'

interface Item {
  to: string
  label: string
  icon: string
  feature: FeatureKey
}

interface Group {
  label: string
  icon: string
  feature: FeatureKey
  section?: string
  items: Item[]
}

const groups: Group[] = [
  {
    label: 'Billing',
    icon: 'bi-cash-register',
    feature: 'pos',
    section: 'OPERATIONS',
    items: [
      { to: '/pos', label: 'New POS Bill', icon: 'bi-plus-circle', feature: 'pos' },
      { to: '/pos/held', label: 'Held / Parked Bills', icon: 'bi-pause-circle', feature: 'pos' },
      { to: '/bills', label: 'Bills History', icon: 'bi-receipt-cutoff', feature: 'bills' },
      { to: '/returns', label: 'Returns & Exchange', icon: 'bi-arrow-repeat', feature: 'returns' },
      { to: '/returns/buyback', label: 'Buyback', icon: 'bi-bag-check', feature: 'returns' },
      { to: '/repairs', label: 'Repair / Polish', icon: 'bi-tools', feature: 'repairs' },
    ],
  },
  {
    label: 'Catalog',
    icon: 'bi-box-seam',
    feature: 'products.view',
    section: 'INVENTORY & PRODUCTS',
    items: [
      { to: '/products', label: 'Product Catalog', icon: 'bi-box', feature: 'products.view' },
      { to: '/categories', label: 'Categories', icon: 'bi-tags', feature: 'categories.view' },
      { to: '/products/import', label: 'Excel Import', icon: 'bi-file-earmark-excel', feature: 'products.import' },
    ],
  },
  {
    label: 'Stock',
    icon: 'bi-boxes',
    feature: 'inventory.view',
    items: [
      { to: '/inventory/stock', label: 'Stock Summary', icon: 'bi-clipboard-data', feature: 'inventory.view' },
      { to: '/inventory/stock-in', label: 'Stock In (Inward)', icon: 'bi-box-arrow-in-down', feature: 'inventory.stockIn' },
      { to: '/inventory/adjustment', label: 'Stock Adjustment', icon: 'bi-sliders', feature: 'inventory.adjust' },
      { to: '/inventory/transfer', label: 'Store Transfer', icon: 'bi-arrow-left-right', feature: 'inventory.transfer' },
      { to: '/inventory/ledger', label: 'Stock Ledger', icon: 'bi-journal-text', feature: 'inventory.view' },
      { to: '/inventory/purchases', label: 'Purchase Orders', icon: 'bi-truck', feature: 'purchases' },
      { to: '/inventory/suppliers', label: 'Suppliers', icon: 'bi-building', feature: 'suppliers' },
    ],
  },
  {
    label: 'Clients',
    icon: 'bi-people',
    feature: 'customers',
    section: 'CRM & CLIENTS',
    items: [
      { to: '/customers', label: 'All Customers', icon: 'bi-person', feature: 'customers' },
      { to: '/customers/dues', label: 'Pending Dues (Udhaar)', icon: 'bi-wallet2', feature: 'customers' },
      { to: '/customers/ledger', label: 'Customer Ledger', icon: 'bi-journal-text', feature: 'customers' },
      { to: '/referrals', label: 'Referral Rewards', icon: 'bi-share', feature: 'referrals' },
    ],
  },
  {
    label: 'Reports',
    icon: 'bi-graph-up-arrow',
    feature: 'reports',
    section: 'ANALYTICS',
    items: [
      { to: '/reports/sales', label: 'Sales Summary', icon: 'bi-graph-up', feature: 'reports' },
      { to: '/reports/products', label: 'Product Sales', icon: 'bi-bar-chart-line', feature: 'reports' },
      { to: '/reports/product-analytics', label: 'Product Analytics', icon: 'bi-speedometer', feature: 'reports' },
      { to: '/reports/inventory', label: 'Inventory Valuation', icon: 'bi-boxes', feature: 'reports' },
      { to: '/reports/purchases', label: 'Purchases Report', icon: 'bi-bag-check', feature: 'reports' },
      { to: '/reports/returns', label: 'Returns Analysis', icon: 'bi-arrow-counterclockwise', feature: 'reports' },
      { to: '/reports/customers', label: 'Customer Aging Dues', icon: 'bi-people', feature: 'reports' },
      { to: '/reports/referrals', label: 'Referral Reports', icon: 'bi-gift', feature: 'reports' },
      { to: '/reports/birthdays', label: 'Birthday Report', icon: 'bi-cake2', feature: 'reports' },
      { to: '/reports/profit', label: 'Profit & Loss', icon: 'bi-currency-rupee', feature: 'reports.profit' },
    ],
  },
  {
    label: 'Admin',
    icon: 'bi-gear',
    feature: 'settings',
    section: 'SETTINGS',
    items: [
      { to: '/settings/stores', label: 'Store Branches', icon: 'bi-shop', feature: 'settings' },
      { to: '/settings/users', label: 'User Accounts', icon: 'bi-person-gear', feature: 'users' },
      { to: '/settings/billing', label: 'Billing Configuration', icon: 'bi-receipt', feature: 'settings' },
      { to: '/settings/tax', label: 'Tax & GST Settings', icon: 'bi-percent', feature: 'settings' },
      { to: '/settings/referrals', label: 'Referral Scheme', icon: 'bi-stars', feature: 'settings' },
      { to: '/settings/discounts', label: 'Store Discounts', icon: 'bi-percent', feature: 'discounts' },
      { to: '/settings/birthday-offers', label: 'Birthday Offers', icon: 'bi-cake2', feature: 'discounts' },
      { to: '/settings/business', label: 'Business Profile', icon: 'bi-building', feature: 'settings' },
      { to: '/settings/audit', label: 'System Audit Logs', icon: 'bi-shield-check', feature: 'audit' },
    ],
  },
]

export function Sidebar({
  mobileOpen,
  onClose,
  onMenu,
}: {
  mobileOpen: boolean
  onClose: () => void
  onMenu: () => void
}) {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role
  const [navQuery, setNavQuery] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setOpenMenu(null)
  }, [location.pathname])

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const filteredGroups = useMemo(() => {
    const q = navQuery.trim().toLowerCase()
    return groups
      .filter((g) => canAccess(role, g.feature))
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (i) =>
            canAccess(role, i.feature) &&
            (!q || i.label.toLowerCase().includes(q) || group.label.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.items.length)
  }, [role, navQuery])

  return (
    <header className={`masthead ${mobileOpen ? 'is-open' : ''}`}>
      <NavLink to="/dashboard" className="mast-brand" onClick={onClose}>
        <span className="brand-mark">1G</span>
        <span className="brand-text">
          <strong>GRAM SHOP</strong>
          <small>Jewellery POS</small>
        </span>
      </NavLink>

      <div className="mast-drawer">
        <div className="mast-search">
          <i className="bi bi-search" />
          <input
            type="search"
            placeholder="Jump to…"
            value={navQuery}
            onChange={(e) => setNavQuery(e.target.value)}
            aria-label="Search navigation"
          />
        </div>

        <nav className="mast-nav" aria-label="Primary" ref={navRef}>
          <NavLink to="/dashboard" className={({ isActive }) => `mast-link ${isActive ? 'active' : ''}`} onClick={onClose}>
            <i className="bi bi-speedometer2" />
            Dashboard
          </NavLink>
          <NavLink to="/pos" className={({ isActive }) => `mast-link mast-link-pos ${isActive ? 'active' : ''}`} onClick={onClose}>
            <i className="bi bi-lightning-charge-fill" />
            POS
          </NavLink>
          {filteredGroups.map((group) => {
            const isGroupActive = group.items.some(
              (i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`),
            )
            const isOpen = openMenu === group.label
            return (
              <div
                key={group.label}
                className={`mast-drop ${isGroupActive ? 'is-active' : ''} ${isOpen ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="mast-link"
                  aria-haspopup="true"
                  aria-expanded={isOpen || isGroupActive}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpenMenu(isOpen ? null : group.label)
                  }}
                >
                  <i className={`bi ${group.icon}`} />
                  <span>{group.label}</span>
                  <i className="bi bi-chevron-down mast-caret" />
                </button>
                <div className="mast-menu" role="menu">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={group.items.some((other) => other.to !== item.to && other.to.startsWith(`${item.to}/`))}
                      className={({ isActive }) => `mast-item ${isActive ? 'active' : ''}`}
                      onClick={onClose}
                    >
                      <i className={`bi ${item.icon}`} />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </div>

      <button type="button" className="menu-btn" onClick={onMenu} aria-label="Toggle navigation menu">
        <i className={`bi ${mobileOpen ? 'bi-x-lg' : 'bi-list'}`} />
      </button>
    </header>
  )
}
