import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { loginSchema } from '../../validators/schemas'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import type { z } from 'zod'

type Form = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<Form>({ resolver: zodResolver(loginSchema), defaultValues: { userName: '', password: '' } })

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const onSubmit = form.handleSubmit(async (values) => {
    await login(values)
    toast.success('Signed in')
    const to = (location.state as { from?: string } | null)?.from || '/dashboard'
    navigate(to, { replace: true })
  })

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        User name
        <input className="form-control" autoComplete="username" {...form.register('userName')} />
        {form.formState.errors.userName ? <small className="text-danger">{form.formState.errors.userName.message}</small> : null}
      </label>
      <label>
        Password
        <input type="password" className="form-control" autoComplete="current-password" {...form.register('password')} />
        {form.formState.errors.password ? <small className="text-danger">{form.formState.errors.password.message}</small> : null}
      </label>
      <button type="submit" className="btn btn-gold w-100" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
      <Link to="/forgot-password">Forgot password?</Link>
    </form>
  )
}
