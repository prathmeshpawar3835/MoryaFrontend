import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordSchema } from '../../validators/schemas'
import { authApi } from '../../api/authApi'
import { FormField } from '../../components/common/FormField'
import toast from 'react-hot-toast'
import type { z } from 'zod'

type Form = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const form = useForm<Form>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: params.get('token') ?? '',
      userName: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await authApi.resetPassword({
        userName: values.userName,
        token: values.token,
        newPassword: values.newPassword,
      })
      toast.success('Password reset successfully. Please sign in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reset password')
    }
  })

  return (
    <form className="stack-form" onSubmit={onSubmit} noValidate>
      <div className="text-muted small mb-2">
        Enter your username, the security token, and choose a new password.
      </div>

      <FormField
        label="Username"
        required
        error={form.formState.errors.userName?.message}
      >
        <input
          className={`form-control ${form.formState.errors.userName ? 'is-invalid' : ''}`}
          placeholder="Enter username"
          {...form.register('userName')}
        />
      </FormField>

      <FormField
        label="Reset Token"
        required
        error={form.formState.errors.token?.message}
      >
        <input
          className={`form-control ${form.formState.errors.token ? 'is-invalid' : ''}`}
          placeholder="Enter token provided by admin/email"
          {...form.register('token')}
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
        className="btn btn-gold w-100 py-2 mt-2 fw-bold"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            Resetting Password…
          </>
        ) : (
          'Reset Password & Continue'
        )}
      </button>

      <div className="text-center mt-3">
        <Link to="/login" className="text-decoration-none text-muted small fw-medium">
          <i className="bi bi-arrow-left me-1" /> Back to Sign In
        </Link>
      </div>
    </form>
  )
}
