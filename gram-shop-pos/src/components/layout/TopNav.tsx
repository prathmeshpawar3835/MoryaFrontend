import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authApi } from '../../api/authApi'
import { StoreSelector } from '../common/StoreSelector'
import { Modal } from '../common/Modal'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema } from '../../validators/schemas'

type ChangePasswordForm = z.infer<typeof changePasswordSchema>

export function TopNav({ onMenu }: { onMenu: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pwdOpen, setPwdOpen] = useState(false)
  const form = useForm<ChangePasswordForm>({ resolver: zodResolver(changePasswordSchema) })

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const onChangePassword = form.handleSubmit(async (values) => {
    await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
    toast.success('Password changed')
    setPwdOpen(false)
    form.reset()
  })

  return (
    <header className="topnav">
      <button type="button" className="btn btn-link menu-btn" onClick={onMenu} aria-label="Open menu">
        <i className="bi bi-list" />
      </button>
      <StoreSelector />
      <div className="topnav-spacer" />
      <div className="dropdown">
        <button className="btn btn-profile dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          <i className="bi bi-person-circle" /> {user?.fullName || user?.userName}
          <small>{user?.role}</small>
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li>
            <button className="dropdown-item" type="button" onClick={() => setPwdOpen(true)}>
              Change password
            </button>
          </li>
          <li>
            <button className="dropdown-item" type="button" onClick={() => void onLogout()}>
              Logout
            </button>
          </li>
        </ul>
      </div>
      <Modal open={pwdOpen} title="Change password" onClose={() => setPwdOpen(false)}>
        <form className="stack-form" onSubmit={onChangePassword}>
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
          <button type="submit" className="btn btn-gold" disabled={form.formState.isSubmitting}>
            Save password
          </button>
        </form>
      </Modal>
    </header>
  )
}
