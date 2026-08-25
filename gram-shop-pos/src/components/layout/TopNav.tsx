import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'
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

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pwdOpen, setPwdOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  })

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
      toast.error(err?.response?.data?.message || 'Failed to change password')
    }
  })

  const initials = (user?.fullName || user?.userName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="topnav">
      <button type="button" className="menu-btn" onClick={onMenu} aria-label="Toggle navigation menu">
        <i className="bi bi-list" />
      </button>

      <div className="topnav-store-badge">
        <i className="bi bi-shop topnav-store-icon" />
        <StoreSelector />
      </div>

      <div className="topnav-spacer" />

      <div className="topnav-actions">
        <Link to="/pos" className="btn-pos-shortcut" title="Open POS Terminal (F10)">
          <i className="bi bi-cash-stack" />
          <span>POS Terminal</span>
          <span className="shortcut-pill">F10</span>
        </Link>

        <button
          type="button"
          className="btn btn-sm btn-light border d-none d-md-inline-flex align-items-center gap-1 text-muted"
          onClick={() => setShortcutsOpen(true)}
          title="Keyboard Shortcuts"
        >
          <i className="bi bi-keyboard" />
          <span className="small">Shortcuts</span>
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
          <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2 p-2" style={{ minWidth: '220px', borderRadius: '12px' }}>
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
    </header>
  )
}
