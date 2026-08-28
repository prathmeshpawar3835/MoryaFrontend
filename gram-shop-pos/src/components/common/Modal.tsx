import { useState, type ReactNode } from 'react'

export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  children,
}: {
  title: string
  body: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => Promise<void> | void
  children: (open: () => void) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await onConfirm()
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {children(() => setOpen(true))}
      {open ? (
        <div className="modal-backdrop-app" role="presentation" onClick={() => !busy && setOpen(false)}>
          <div className="app-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-head mb-2">
              <h2 id="confirm-title" className="d-flex align-items-center gap-2">
                {danger ? <i className="bi bi-exclamation-triangle-fill text-danger" /> : <i className="bi bi-info-circle-fill text-primary" />}
                {title}
              </h2>
              <button type="button" className="btn-close-modal" disabled={busy} onClick={() => setOpen(false)} aria-label="Close">
                <i className="bi bi-x" />
              </button>
            </div>
            <p className="text-muted mb-4">{body}</p>
            <div className="app-modal-actions">
              <button type="button" className="btn btn-light border px-3" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-gold'} px-4`} disabled={busy} onClick={() => void submit()}>
                {busy ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Please wait…
                  </>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
  dismissible = true,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
  dismissible?: boolean
}) {
  if (!open) return null
  return (
    <div
      className="modal-backdrop-app"
      onClick={dismissible ? onClose : undefined}
      role="presentation"
    >
      <div className={`app-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-head">
          <h2>{title}</h2>
          {dismissible ? (
            <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close">
              <i className="bi bi-x" />
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
}
