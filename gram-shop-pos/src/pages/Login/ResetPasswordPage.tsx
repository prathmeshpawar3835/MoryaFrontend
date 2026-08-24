import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordSchema } from '../../validators/schemas'
import { authApi } from '../../api/authApi'
import toast from 'react-hot-toast'
import type { z } from 'zod'

type Form = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const form = useForm<Form>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: params.get('token') ?? '', userName: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await authApi.resetPassword({ userName: values.userName, token: values.token, newPassword: values.newPassword })
    toast.success('Password reset. Please sign in.')
    navigate('/login')
  })

  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <label>
        User name
        <input className="form-control" {...form.register('userName')} />
      </label>
      <label>
        Reset token
        <input className="form-control" {...form.register('token')} />
      </label>
      <label>
        New password
        <input type="password" className="form-control" {...form.register('newPassword')} />
      </label>
      <label>
        Confirm password
        <input type="password" className="form-control" {...form.register('confirmPassword')} />
      </label>
      <button className="btn btn-gold" type="submit">
        Reset password
      </button>
      <Link to="/login">Back to sign in</Link>
    </form>
  )
}
