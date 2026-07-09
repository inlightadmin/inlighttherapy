import type { Tool } from '@/lib/types'
import { useEffect } from 'react'

type Props = {
  tool: Tool | null
  onClose: () => void
}

export function ToolModal({ tool, onClose }: Props) {
  useEffect(() => {
    if (!tool) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [tool, onClose])

  if (!tool) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tool-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-[min(100%,56rem)] flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-soft"
        style={{ height: '80vh', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-cream to-sky/40 px-5 py-4 sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-wide text-sage uppercase">
              Wellness tool
            </p>
            <h2 id="tool-modal-title" className="font-display text-2xl sm:text-3xl">
              {tool.title}
            </h2>
          </div>
          <button type="button" className="btn-ghost shrink-0" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          <p className="text-ink-muted">{tool.summary}</p>
          <div className="prose-tool mt-6 space-y-4 text-base leading-relaxed text-ink whitespace-pre-wrap">
            {tool.body}
          </div>
          <p className="mt-8 rounded-2xl border border-border bg-cream px-4 py-3 text-xs text-ink-muted">
            Tools are educational supports, not a replacement for therapy or
            emergency care. If you are in crisis, call or text 988.
          </p>
        </div>
      </div>
    </div>
  )
}
