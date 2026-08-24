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
  items: Item[]
}

const groups: Group[] = [
  {
    label: 'POS',
    icon: 'bi-cash-register',
    feature: 'pos',
    items: [
      { to: '/pos', label: 'New bill', icon: 'bi-plus-lg', feature: 'pos' },
      { to: '/pos/held', label: 'Held bills', icon: 'bi-pause-circle', feature: 'pos' },
      { to: '/bills', label: 'Bills history', icon: 'bi-receipt', feature: 'bills' },
      { to: '/returns', label: 'Returns / Exchange', icon: 'bi-arrow-repeat', feature: 'returns' },
    ],
  },
  {
    label: 'Products',
    icon: 'bi-box-seam',
    feature: 'products.view',
    items: [
      { to: '/products', label: 'Products', icon: 'bi-box', feature: 'products.view' },
      { to: '/categories', label: 'Categories', icon: 'bi-tags', feature: 'categories.view' },
      { to: '/products/import', label: 'Excel import', icon: 'bi-file-earmark-excel', feature: 'products.import' },
    ],
  },
  {
    label: 'Inventory',
    icon: 'bi-boxes',
    feature: 'inventory.view',
    items: [
      { to: '/inventory/stock', label: 'Stock', icon: 'bi-clipboard-data', feature: 'inventory.view' },
      { to: '/inventory/stock-in', label: 'Stock in', icon: 'bi-box-arrow-in-down', feature: 'inventory.stockIn' },
      { to: '/inventory/adjustment', label: 'Stock adjustment', icon: 'bi-sliders', feature: 'inventory.adjust' },
      { to: '/inventory/transfer', label: 'Stock transfer', icon: 'bi-arrow-left-right', feature: 'inventory.transfer' },
      { to: '/inventory/ledger', label: 'Stock ledger', icon: 'bi-journal-text', feature: 'inventory.view' },
      { to: '/inventory/purchases', label: 'Purchases', icon: 'bi-truck', feature: 'purchases' },
    ],
  },
  {
    label: 'Customers',
    icon: 'bi-people',
    feature: 'customers',
    items: [
      { to: '/customers', label: 'Customers', icon: 'bi-person', feature: 'customers' },
      { to: '/customers/dues', label: 'Dues', icon: 'bi-wallet2', feature: 'customers' },
      { to: '/referrals', label: 'Referrals', icon: 'bi-share', feature: 'referrals' },
    ],
  },
  {
    label: 'Reports',
    icon: 'bi-graph-up',
    feature: 'reports',
    items: [
      { to: '/reports/sales', label: 'Sales', icon: 'bi-graph-up-arrow', feature: 'reports' },
      { to: '/reports/products', label: 'Product sales', icon: 'bi-bar-chart', feature: 'reports' },
      { to: '/reports/inventory', label: 'Inventory', icon: 'bi-boxes', feature: 'reports' },
      { to: '/reports/purchases', label: 'Purchases', icon: 'bi-bag', feature: 'reports' },
      { to: '/reports/returns', label: 'Returns', icon: 'bi-arrow-counterclockwise', feature: 'reports' },
      { to: '/reports/customers', label: 'Customer dues', icon: 'bi-people', feature: 'reports' },
      { to: '/reports/referrals', label: 'Referrals', icon: 'bi-share', feature: 'reports' },
      { to: '/reports/profit', label: 'Profit', icon: 'bi-currency-rupee', feature: 'reports.profit' },
    ],
  },
  {
    label: 'Settings',
    icon: 'bi-gear',
    feature: 'settings',
    items: [
      { to: '/settings/stores', label: 'Stores', icon: 'bi-shop', feature: 'settings' },
      { to: '/settings/users', label: 'Users', icon: 'bi-person-gear', feature: 'users' },
      { to: '/settings/billing', label: 'Billing', icon: 'bi-receipt-cutoff', feature: 'settings' },
      { to: '/settings/tax', label: 'Tax / GST', icon: 'bi-percent', feature: 'settings' },
      { to: '/settings/referrals', label: 'Referral', icon: 'bi-gift', feature: 'settings' },
      { to: '/settings/business', label: 'Business profile', icon: 'bi-building', feature: 'settings' },
      { to: '/settings/audit', label: 'Audit logs', icon: 'bi-shield-check', feature: 'audit' },
    ],
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()
  const role = user?.role

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">1G</span>
        <div>
          <strong>Gram Shop</strong>
          <small>Jewellery POS</small>
        </div>
      </div>
      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-speedometer2" /> Dashboard
        </NavLink>
        {groups
          .filter((g) => canAccess(role, g.feature))
          .map((group) => {
            const visible = group.items.filter((i) => canAccess(role, i.feature))
            if (!visible.length) return null
            const open = visible.some((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`))
            return (
              <details key={group.label} open={open || group.label === 'POS'}>
                <summary>
                  <i className={`bi ${group.icon}`} /> {group.label}
                </summary>
                {visible.map((item) => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-sub ${isActive ? 'active' : ''}`}>
                    {item.label}
                  </NavLink>
                ))}
              </details>
            )
          })}
      </nav>
    </aside>
  )
}
