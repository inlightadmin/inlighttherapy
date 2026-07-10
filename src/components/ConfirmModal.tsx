import { useEffect, type ReactNode } from 'react'

type Props = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** When false, only the primary action is shown (e.g. OK alert) */
  showCancel?: boolean
  /** Hide the × control (still allow Escape / backdrop when cancelable) */
  showCloseX?: boolean
  busy?: boolean
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  showCancel = true,
  showCloseX = true,
  busy = false,
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        if (showCancel) onCancel()
        else onConfirm()
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, busy, onCancel, onConfirm, showCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => {
        if (busy) return
        if (showCancel) onCancel()
        else onConfirm()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-soft sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseX ? (
          <button
            type="button"
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-cream-dark hover:text-ink disabled:opacity-50"
            aria-label="Close"
            disabled={busy}
            onClick={() => {
              if (showCancel) onCancel()
              else onConfirm()
            }}
          >
            <span aria-hidden className="text-xl leading-none">
              ×
            </span>
          </button>
        ) : null}

        <h2
          id="confirm-modal-title"
          className="pr-10 font-display text-2xl text-ink sm:text-3xl"
        >
          {title}
        </h2>

        <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-muted">
          {children}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {showCancel ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy}
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            className={
              danger
                ? 'btn inline-flex items-center justify-center rounded-full bg-danger px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:opacity-60'
                : 'btn-primary'
            }
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
