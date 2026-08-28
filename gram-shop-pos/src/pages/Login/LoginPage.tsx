import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { loginSchema } from '../../validators/schemas'
import { useAuth } from '../../context/AuthContext'
import { FormField } from '../../components/common/FormField'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/errors'
import type { z } from 'zod'

type Form = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
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
      toastApiError(err, 'Invalid credentials')
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
          <span className="input-group-text">
            <i className="bi bi-person" />
          </span>
          <input
            className={`form-control ${form.formState.errors.userName ? 'is-invalid' : ''}`}
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
          <span className="input-group-text">
            <i className="bi bi-lock" />
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            className={`form-control ${form.formState.errors.password ? 'is-invalid' : ''}`}
            placeholder="Enter password"
            autoComplete="current-password"
            {...form.register('password')}
          />
          <button
            type="button"
            className="input-group-text"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
          </button>
        </div>
      </FormField>

      <button
        type="submit"
        className="btn btn-gold w-100 py-2 mt-1"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            Signing in…
          </>
        ) : (
          'Sign in to Gram Shop'
        )}
      </button>

      <div className="text-center mt-1">
        <Link to="/forgot-password" className="text-decoration-none text-muted small fw-bold">
          Forgot your password?
        </Link>
      </div>
    </form>
  )
}
