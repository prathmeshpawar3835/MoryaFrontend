import { useState } from 'react'
import { useHotkeys } from '../../hooks/useHotkeys'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/errors'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { StoreSelector } from '../common/StoreSelector'
import { Modal } from '../common/Modal'
import { FormField } from '../common/FormField'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema } from '../../validators/schemas'

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

const PAGE_TITLES: { match: RegExp; title: string }[] = [
  { match: /^\/dashboard/, title: 'Dashboard' },
  { match: /^\/pos\/held/, title: 'Held bills' },
  { match: /^\/pos/, title: 'Sales entry' },
  { match: /^\/bills/, title: 'Bills' },
  { match: /^\/products/, title: 'Products' },
  { match: /^\/categories/, title: 'Categories' },
  { match: /^\/inventory/, title: 'Inventory' },
  { match: /^\/customers/, title: 'Customers' },
  { match: /^\/referrals/, title: 'Referrals' },
  { match: /^\/returns/, title: 'Returns' },
  { match: /^\/repairs/, title: 'Repairs' },
  { match: /^\/reports\/sales/, title: 'Sales report' },
  { match: /^\/reports\/product-analytics/, title: 'Product analytics' },
  { match: /^\/reports\/products/, title: 'Product sales' },
  { match: /^\/reports\/inventory/, title: 'Inventory report' },
  { match: /^\/reports\/purchases/, title: 'Purchases report' },
  { match: /^\/reports\/returns/, title: 'Returns report' },
  { match: /^\/reports\/customers/, title: 'Customer dues' },
  { match: /^\/reports\/referrals/, title: 'Referral report' },
  { match: /^\/reports\/birthdays/, title: 'Birthday report' },
  { match: /^\/reports\/profit/, title: 'Profit & loss' },
  { match: /^\/reports/, title: 'Reports' },
  { match: /^\/settings\/birthday-offers/, title: 'Birthday offers' },
  { match: /^\/settings\/discounts/, title: 'Store discounts' },
  { match: /^\/settings\/stores/, title: 'Stores' },
  { match: /^\/settings\/users/, title: 'Users' },
  { match: /^\/settings\/billing/, title: 'Billing settings' },
  { match: /^\/settings\/tax/, title: 'Tax settings' },
  { match: /^\/settings\/referrals/, title: 'Referral scheme' },
  { match: /^\/settings\/business/, title: 'Business profile' },
  { match: /^\/settings\/audit/, title: 'Audit logs' },
  { match: /^\/settings/, title: 'Settings' },
]

function pageTitle(pathname: string) {
  return PAGE_TITLES.find((p) => p.match.test(pathname))?.title ?? 'Gram Shop'
}

function crumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (!parts.length) return ['Dashboard']
  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'POS',
    held: 'Held bills',
    bills: 'Bills',
    products: 'Products',
    create: 'New',
    edit: 'Edit',
    import: 'Import',
    categories: 'Categories',
    inventory: 'Inventory',
    stock: 'Stock',
    'stock-in': 'Stock in',
    adjustment: 'Adjustment',
    transfer: 'Transfer',
    ledger: 'Ledger',
    purchases: 'Purchases',
    suppliers: 'Suppliers',
    customers: 'Customers',
    dues: 'Dues',
    referrals: 'Referrals',
    returns: 'Returns',
    new: 'New',
    exchange: 'Exchange',
    buyback: 'Buyback',
    repairs: 'Repairs',
    reports: 'Reports',
    sales: 'Sales',
    'product-analytics': 'Analytics',
    profit: 'Profit',
    birthdays: 'Birthdays',
    settings: 'Settings',
    stores: 'Stores',
    users: 'Users',
    billing: 'Billing',
    tax: 'Tax',
    discounts: 'Discounts',
    'birthday-offers': 'Birthday offers',
    business: 'Business',
    audit: 'Audit',
  }
  return parts.map((p) => labels[p] ?? (Number.isFinite(Number(p)) ? `#${p}` : p))
}

export function TopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [pwdOpen, setPwdOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  })

  useHotkeys({
    F10: () => navigate('/pos'),
  }, !user?.mustChangePassword)

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const onChangePassword = form.handleSubmit(async (values) => {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success('Password changed successfully')
      setPwdOpen(false)
      form.reset()
    } catch (err: any) {
      toastApiError(err, 'Failed to change password')
    }
  })

  const initials = (user?.fullName || user?.userName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="topnav">
      <div className="topnav-page">
        {crumbs(location.pathname).length > 1 ? (
          <span className="topnav-crumbs">
            {crumbs(location.pathname).map((c, i, arr) => (
              <span key={`${c}-${i}`}>
                {i > 0 ? <i className="bi bi-chevron-right mx-1" /> : null}
                {i === arr.length - 1 ? <span className="fw-semibold">{c}</span> : c}
              </span>
            ))}
          </span>
        ) : (
          <span className="topnav-kicker">Gram Shop</span>
        )}
        <strong>{pageTitle(location.pathname)}</strong>
      </div>

      <div className="topnav-store-badge">
        <i className="bi bi-geo-alt-fill topnav-store-icon" />
        <StoreSelector />
      </div>

      <div className="topnav-spacer" />

      <div className="topnav-actions">
        <Link to="/pos" className="btn-pos-shortcut" title="Open POS Terminal (F10)">
          <i className="bi bi-lightning-charge-fill" />
          <span>New Sale</span>
          <span className="shortcut-pill">F10</span>
        </Link>

        <button
          type="button"
          className="topnav-icon-btn d-none d-md-inline-flex"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard Shortcuts"
        >
          <i className="bi bi-keyboard" />
        </button>

        <div className="dropdown">
          <button
            className="btn-profile dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div className="avatar-circle">{initials}</div>
            <div className="btn-profile-info d-none d-sm-flex">
              <span className="btn-profile-name">{user?.fullName || user?.userName}</span>
              <span className="btn-profile-role">{user?.role || 'Staff'}</span>
            </div>
          </button>
          <ul className="dropdown-menu dropdown-menu-end app-dropdown mt-2 p-2">
            <li className="px-3 py-2 border-bottom mb-1">
              <div className="fw-bold text-dark">{user?.fullName || user?.userName}</div>
              <small className="text-muted">{user?.email || `@${user?.userName}`}</small>
              <div className="mt-1">
                <span className="badge bg-warning text-dark">{user?.role}</span>
              </div>
            </li>
            <li>
              <button
                className="dropdown-item rounded-2 py-2 d-flex align-items-center gap-2"
                type="button"
                onClick={() => setPwdOpen(true)}
              >
                <i className="bi bi-key text-muted" />
                Change Password
              </button>
            </li>
            <li>
              <hr className="dropdown-divider my-1" />
            </li>
            <li>
              <button
                className="dropdown-item rounded-2 py-2 text-danger d-flex align-items-center gap-2"
                type="button"
                onClick={() => void onLogout()}
              >
                <i className="bi bi-box-arrow-right" />
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal open={pwdOpen} title="Change Password" onClose={() => { setPwdOpen(false); form.reset() }}>
        <form className="stack-form" onSubmit={onChangePassword} noValidate>
          <FormField
            label="Current Password"
            required
            error={form.formState.errors.currentPassword?.message}
          >
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-lock" />
              </span>
              <input
                type="password"
                className={`form-control border-start-0 ${form.formState.errors.currentPassword ? 'is-invalid' : ''}`}
                placeholder="Enter current password"
                {...form.register('currentPassword')}
              />
            </div>
          </FormField>

          <FormField
            label="New Password"
            required
            hint="Must be at least 8 characters long."
            error={form.formState.errors.newPassword?.message}
          >
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-shield-lock" />
              </span>
              <input
                type="password"
                className={`form-control border-start-0 ${form.formState.errors.newPassword ? 'is-invalid' : ''}`}
                placeholder="Enter new password"
                {...form.register('newPassword')}
              />
            </div>
          </FormField>

          <FormField
            label="Confirm New Password"
            required
            error={form.formState.errors.confirmPassword?.message}
          >
            <div className="input-group">
              <span className="input-group-text bg-light text-muted border-end-0">
                <i className="bi bi-check-circle" />
              </span>
              <input
                type="password"
                className={`form-control border-start-0 ${form.formState.errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Re-enter new password"
                {...form.register('confirmPassword')}
              />
            </div>
          </FormField>

          <div className="app-modal-actions">
            <button
              type="button"
              className="btn btn-light border px-3"
              onClick={() => { setPwdOpen(false); form.reset() }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-gold px-4"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                'Save Password'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Keyboard Shortcuts Modal */}
      <Modal open={shortcutsOpen} title="Keyboard Shortcuts Cheat Sheet" onClose={() => setShortcutsOpen(false)}>
        <div className="table-responsive">
          <table className="table app-table mb-0">
            <thead>
              <tr>
                <th>Key</th>
                <th>Action</th>
                <th>Screen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge bg-dark">F2</span></td>
                <td>Focus Product Barcode / Name Search</td>
                <td>POS Counter</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">F4</span></td>
                <td>Focus Customer Mobile / Search</td>
                <td>POS Counter</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">F8 / F10</span></td>
                <td>Open Payment & Complete Bill</td>
                <td>POS Counter / Global</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">F9</span></td>
                <td>Hold / Park Current Cart</td>
                <td>POS Counter</td>
              </tr>
              <tr>
                <td><span className="badge bg-dark">Esc</span></td>
                <td>Close Open Dialog / Popups</td>
                <td>Any Screen</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  )
}
