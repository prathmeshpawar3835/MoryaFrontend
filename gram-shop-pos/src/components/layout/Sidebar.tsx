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
    label: 'POS Billing',
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
    label: 'Stock & Inventory',
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
    label: 'Customers & CRM',
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
    label: 'Reports & BI',
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
      { to: '/reports/profit', label: 'Profit & Loss', icon: 'bi-currency-rupee', feature: 'reports.profit' },
    ],
  },
  {
    label: 'Administration',
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
      { to: '/settings/business', label: 'Business Profile', icon: 'bi-building', feature: 'settings' },
      { to: '/settings/audit', label: 'System Audit Logs', icon: 'bi-shield-check', feature: 'audit' },
    ],
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role

  let lastSection = ''

  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand">
        <span className="brand-mark">1G</span>
        <div className="brand-text">
          <strong>Gram Shop</strong>
          <small>Jewellery POS & ERP</small>
        </div>
      </NavLink>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <i className="bi bi-speedometer2" />
          <span>Dashboard</span>
        </NavLink>

        {groups
          .filter((g) => canAccess(role, g.feature))
          .map((group) => {
            const visible = group.items.filter((i) => canAccess(role, i.feature))
            if (!visible.length) return null

            const isCurrentSection = group.section && group.section !== lastSection
            if (group.section) lastSection = group.section

            const isGroupActive = visible.some(
              (i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`)
            )

            return (
              <div key={group.label}>
                {isCurrentSection ? (
                  <div className="nav-section-title">{group.section}</div>
                ) : null}
                <details open={isGroupActive || group.label.includes('POS')}>
                  <summary className={isGroupActive ? 'fw-bold text-white' : ''}>
                    <i className={`bi ${group.icon}`} />
                    <span>{group.label}</span>
                    <i className="bi bi-chevron-right chevron" />
                  </summary>
                  <div className="sidebar-sub-items">
                    {visible.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-sub ${isActive ? 'active' : ''}`}
                      >
                        <i className={`bi ${item.icon}`} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </details>
              </div>
            )
          })}
      </nav>

      <div className="sidebar-footer">
        <div className="d-flex align-items-center justify-content-between text-muted small">
          <span>v2.0 Production</span>
          <span className="badge bg-dark border border-secondary text-warning">Gold ERP</span>
        </div>
      </div>
    </aside>
  )
}
