import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { forgotPasswordSchema } from '../../validators/schemas'
import { authApi } from '../../api/authApi'
import { FormField } from '../../components/common/FormField'
import toast from 'react-hot-toast'
import { toastApiError } from '../../utils/errors'
import type { z } from 'zod'

type Form = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const form = useForm<Form>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
  })
  const [token, setToken] = useState<string | null>(null)

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await authApi.forgotPassword(values.userName)
      toast.success(result.message || 'Reset instructions generated')
      if (result.developmentResetToken) setToken(result.developmentResetToken)
    } catch (err: any) {
      toastApiError(err, 'Failed to request password reset')
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
            placeholder="Enter your username"
            {...form.register('userName')}
          />
        </div>
      </FormField>

      <button
        className="btn btn-gold w-100 py-2 fw-bold"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            Generating Token…
          </>
        ) : (
          'Send Password Reset'
        )}
      </button>

      {token ? (
        <div className="alert alert-info py-2 px-3 mt-3 border-0 small">
          <div className="fw-bold mb-1"><i className="bi bi-info-circle me-1" /> Dev Reset Token:</div>
          <code className="user-select-all d-block bg-white p-1 rounded border mb-2">{token}</code>
          <Link
            to={`/reset-password?token=${encodeURIComponent(token)}&user=${encodeURIComponent(form.getValues('userName'))}`}
            className="btn btn-sm btn-primary w-100 fw-semibold"
          >
            Continue to Reset Form →
          </Link>
        </div>
      ) : null}

      <div className="text-center mt-3">
        <Link to="/login" className="text-decoration-none text-muted small fw-medium">
          <i className="bi bi-arrow-left me-1" /> Back to Sign In
        </Link>
      </div>
    </form>
  )
}
