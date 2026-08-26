import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { loginSchema } from '../../validators/schemas'
import { useAuth } from '../../context/AuthContext'
import { FormField } from '../../components/common/FormField'
import toast from 'react-hot-toast'
import type { z } from 'zod'

type Form = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<Form>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userName: '', password: '' },
    mode: 'onTouched',
  })

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values)
      toast.success('Signed in successfully')
      const to = (location.state as { from?: string } | null)?.from || '/dashboard'
      navigate(to, { replace: true })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials')
    }
  })

  return (
    <form className="stack-form" onSubmit={onSubmit} noValidate>
      <FormField
        label="Username"
        required
        error={form.formState.errors.userName?.message}
      >
        <div className="input-group">
          <span className="input-group-text bg-light text-muted border-end-0">
            <i className="bi bi-person" />
          </span>
          <input
            className={`form-control border-start-0 ${form.formState.errors.userName ? 'is-invalid' : ''}`}
            placeholder="Enter username"
            autoComplete="username"
            {...form.register('userName')}
          />
        </div>
      </FormField>

      <FormField
        label="Password"
        required
        error={form.formState.errors.password?.message}
      >
        <div className="input-group">
          <span className="input-group-text bg-light text-muted border-end-0">
            <i className="bi bi-lock" />
          </span>
          <input
            type="password"
            className={`form-control border-start-0 ${form.formState.errors.password ? 'is-invalid' : ''}`}
            placeholder="Enter password"
            autoComplete="current-password"
            {...form.register('password')}
          />
        </div>
      </FormField>

      <button
        type="submit"
        className="btn btn-gold w-100 py-2 mt-2 fw-bold"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <div className="text-center mt-2">
        <Link to="/forgot-password" className="text-decoration-none text-muted small fw-medium">
          Forgot your password?
        </Link>
      </div>
    </form>
  )
}
