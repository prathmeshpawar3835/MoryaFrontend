import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { forgotPasswordSchema } from '../../validators/schemas'
import { authApi } from '../../api/authApi'
import toast from 'react-hot-toast'
import type { z } from 'zod'

type Form = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const form = useForm<Form>({ resolver: zodResolver(forgotPasswordSchema) })
  const [token, setToken] = useState<string | null>(null)

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await authApi.forgotPassword(values.userName)
    toast.success(result.message || 'Reset requested')
    if (result.developmentResetToken) setToken(result.developmentResetToken)
  })

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        User name
        <input className="form-control" {...form.register('userName')} />
      </label>
      <button className="btn btn-gold" type="submit" disabled={form.formState.isSubmitting}>
        Send reset
      </button>
      {token ? (
        <p className="small">
          Development reset token: <code>{token}</code>
          <br />
          <Link to={`/reset-password?token=${encodeURIComponent(token)}`}>Continue to reset</Link>
        </p>
      ) : null}
      <Link to="/login">Back to sign in</Link>
    </form>
  )
}
