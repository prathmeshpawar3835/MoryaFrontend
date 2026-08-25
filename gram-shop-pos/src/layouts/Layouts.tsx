import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
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
import type { z } from 'zod'

type Form = z.infer<typeof changePasswordSchema>

export function MainLayout() {
  const { user, loading, refreshUser } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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
      toast.error(err?.response?.data?.message || 'Failed to update password')
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
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span>1G</span>
          <h1>Gram Shop Jewellery</h1>
          <p>POS & Retail Inventory Suite</p>
        </div>
        <Outlet />
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
