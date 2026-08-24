import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sidebar } from '../components/layout/Sidebar'
import { TopNav } from '../components/layout/TopNav'
import { PageLoader } from '../components/common/Feedback'
import { Modal } from '../components/common/Modal'
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
  const form = useForm<Form>({ resolver: zodResolver(changePasswordSchema) })

  if (loading) return <PageLoader label="Restoring session…" />
  if (!user) return <Navigate to="/login" replace />

  const onForcePassword = form.handleSubmit(async (values) => {
    await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
    toast.success('Password updated')
    await refreshUser()
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
      {menuOpen ? <button type="button" className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenuOpen(false)} /> : null}
      <Modal open={user.mustChangePassword} title="Change required password" onClose={() => undefined}>
        <p>Your account requires a new password before you continue.</p>
        <form className="stack-form" onSubmit={onForcePassword}>
          <label>
            Current password
            <input type="password" className="form-control" {...form.register('currentPassword')} />
          </label>
          <label>
            New password
            <input type="password" className="form-control" {...form.register('newPassword')} />
          </label>
          <label>
            Confirm password
            <input type="password" className="form-control" {...form.register('confirmPassword')} />
          </label>
          <button type="submit" className="btn btn-gold">
            Update password
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
          <h1>Gram Shop POS</h1>
          <p>1 Gram Jewellery billing</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}

export function POSLayout() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return (
    <div className="pos-shell">
      <Outlet />
    </div>
  )
}
