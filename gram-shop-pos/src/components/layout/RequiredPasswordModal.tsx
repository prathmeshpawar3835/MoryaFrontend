import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { changePasswordSchema } from '../../validators/schemas'
import { authApi } from '../../api/authApi'
import { toastApiError } from '../../utils/errors'
import { useAuth } from '../../context/AuthContext'
import { Modal } from '../common/Modal'
import { FormField } from '../common/FormField'
import type { z } from 'zod'

type Form = z.infer<typeof changePasswordSchema>

export function RequiredPasswordModal() {
  const { user, refreshUser } = useAuth()
  const form = useForm<Form>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onTouched',
  })

  if (!user?.mustChangePassword) return null

  const onForcePassword = form.handleSubmit(async (values) => {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success('Password updated successfully')
      await refreshUser()
    } catch (err: unknown) {
      toastApiError(err, 'Failed to update password')
    }
  })

  return (
    <Modal open title="Required Password Update" onClose={() => undefined} dismissible={false}>
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
            autoComplete="current-password"
            {...form.register('currentPassword')}
          />
        </FormField>

        <FormField
          label="New Password"
          required
          hint="Must be at least 8 characters and different from the current password."
          error={form.formState.errors.newPassword?.message}
        >
          <input
            type="password"
            className={`form-control ${form.formState.errors.newPassword ? 'is-invalid' : ''}`}
            placeholder="Enter new strong password"
            autoComplete="new-password"
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
            autoComplete="new-password"
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
  )
}
