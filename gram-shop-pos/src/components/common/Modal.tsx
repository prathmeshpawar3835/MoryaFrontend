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
            <h2 id="confirm-title">{title}</h2>
            <p>{body}</p>
            <div className="app-modal-actions">
              <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-gold'}`} disabled={busy} onClick={() => void submit()}>
                {busy ? 'Please wait…' : confirmLabel}
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
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="modal-backdrop-app" onClick={onClose} role="presentation">
      <div className={`app-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-head">
          <h2>{title}</h2>
          <button type="button" className="btn-close-modal" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
