import type { ReactNode } from 'react'

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: {
  label?: string
  required?: boolean
  error?: string | null
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`form-group ${className}`}>
      {label ? (
        <label className="form-label">
          {label}
          {required ? <span className="required-star">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="field-error" role="alert">
          <i className="bi bi-exclamation-circle-fill" /> {error}
        </p>
      ) : hint ? (
        <p className="form-hint">{hint}</p>
      ) : null}
    </div>
  )
}
