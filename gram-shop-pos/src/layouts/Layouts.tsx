import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sidebar } from '../components/layout/Sidebar'
import { TopNav } from '../components/layout/TopNav'
import { PageLoader } from '../components/common/Feedback'
import { Modal } from '../components/common/Modal'
import { FormField } from '../components/common/FormField'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema } from '../validators/schemas'
import { authApi } from '../api/authApi'
import toast from 'react-hot-toast'
import { toastApiError } from '../utils/errors'
import type { z } from 'zod'

type Form = z.infer<typeof changePasswordSchema>

export function MainLayout() {
  const { user, loading, refreshUser } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])
  const form = useForm<Form>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  })

  if (loading) return <PageLoader label="Restoring session…" />
  if (!user) return <Navigate to="/login" replace />

  const onForcePassword = form.handleSubmit(async (values) => {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success('Password updated successfully')
      await refreshUser()
    } catch (err: any) {
      toastApiError(err, 'Failed to update password')
    }
  })

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <Sidebar />
      <div className="app-main">
        <TopNav onMenu={() => setMenuOpen((v) => !v)} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      {menuOpen ? (
        <button
          type="button"
          className="sidebar-scrim"
          aria-label="Close navigation menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      {/* Mandatory Change Password Modal */}
      <Modal open={Boolean(user.mustChangePassword)} title="Required Password Update" onClose={() => undefined}>
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-shield-exclamation fs-4" />
          <div>
            <strong>Security Notice:</strong> Your account requires setting a new personal password before you can proceed.
          </div>
        </div>
        <form className="stack-form" onSubmit={onForcePassword} noValidate>
          <FormField
            label="Current Password"
            required
            error={form.formState.errors.currentPassword?.message}
          >
            <input
              type="password"
              className={`form-control ${form.formState.errors.currentPassword ? 'is-invalid' : ''}`}
              placeholder="Enter temporary/current password"
              {...form.register('currentPassword')}
            />
          </FormField>

          <FormField
            label="New Password"
            required
            hint="Must be at least 8 characters long."
            error={form.formState.errors.newPassword?.message}
          >
            <input
              type="password"
              className={`form-control ${form.formState.errors.newPassword ? 'is-invalid' : ''}`}
              placeholder="Enter new strong password"
              {...form.register('newPassword')}
            />
          </FormField>

          <FormField
            label="Confirm New Password"
            required
            error={form.formState.errors.confirmPassword?.message}
          >
            <input
              type="password"
              className={`form-control ${form.formState.errors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="Re-enter new password"
              {...form.register('confirmPassword')}
            />
          </FormField>

          <button
            type="submit"
            className="btn btn-gold w-100 mt-2 py-2 fw-bold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Updating Password…
              </>
            ) : (
              'Set New Password'
            )}
          </button>
        </form>
      </Modal>
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
        <div className="auth-hero-mark">1G</div>
        <p className="auth-hero-kicker">Gram Shop Jewellery</p>
        <h1>A calmer, faster counter for 1 gram jewellery.</h1>
        <p className="auth-hero-copy">
          Sales, stock, customers, and receipts in one workspace — built for daily retail, not a generic admin panel.
        </p>
        <ul className="auth-hero-points">
          <li><i className="bi bi-lightning-charge-fill" /> Instant sales entry</li>
          <li><i className="bi bi-gem" /> Store-wise stock &amp; dues</li>
          <li><i className="bi bi-receipt" /> Ledgers, returns &amp; invoices</li>
        </ul>
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
    </div>
  )
}
