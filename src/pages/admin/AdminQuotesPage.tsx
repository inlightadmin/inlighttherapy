import {
  createQuote,
  deleteQuote,
  listQuotes,
  updateQuote,
} from '@/lib/cms'
import type { SiteQuote } from '@/lib/types'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

export function AdminQuotesPage() {
  const [items, setItems] = useState<SiteQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [text, setText] = useState('')
  const [attribution, setAttribution] = useState('')
  const [active, setActive] = useState(true)
  const [order, setOrder] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listQuotes())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quotes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function resetForm() {
    setText('')
    setAttribution('')
    setActive(true)
    setOrder(0)
    setEditingId(null)
  }

  function startEdit(q: SiteQuote) {
    setEditingId(q.id)
    setText(q.text)
    setAttribution(q.attribution ?? '')
    setActive(q.active)
    setOrder(q.order ?? 0)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) {
      setError('Quote text is required.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (editingId) {
        await updateQuote(editingId, {
          text,
          attribution,
          active,
          order,
        })
        setMessage('Quote updated.')
      } else {
        await createQuote({ text, attribution, active, order })
        setMessage('Quote created.')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this quote?')) return
    setBusy(true)
    setError(null)
    try {
      await deleteQuote(id)
      if (editingId === id) resetForm()
      await load()
      setMessage('Quote deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={onSubmit} className="card space-y-3 lg:col-span-2">
        <h2 className="font-display text-2xl">
          {editingId ? 'Edit quote' : 'New quote'}
        </h2>
        <div>
          <label className="label" htmlFor="quote-text">
            Quote text
          </label>
          <textarea
            id="quote-text"
            className="input min-h-[6rem] resize-y"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="quote-attr">
            Attribution
          </label>
          <input
            id="quote-attr"
            className="input"
            value={attribution}
            onChange={(e) => setAttribution(e.target.value)}
            placeholder="In-Light Therapy"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active
          </label>
          <div>
            <label className="label" htmlFor="quote-order">
              Order
            </label>
            <input
              id="quote-order"
              type="number"
              className="input w-24"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {editingId ? 'Save changes' : 'Create quote'}
          </button>
          {editingId ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={resetForm}
              disabled={busy}
            >
              Cancel
            </button>
          ) : null}
        </div>
        {message ? (
          <p className="text-sm text-sage">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>

      <div className="lg:col-span-3">
        <h2 className="font-display text-2xl">All quotes</h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            No quotes yet. Create one to replace placeholder banners.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((q) => (
              <li key={q.id} className="card">
                <p className="font-display text-lg italic text-ink">
                  “{q.text}”
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {q.attribution || '—'} · order {q.order ?? 0} ·{' '}
                  {q.active ? (
                    <span className="text-sage">active</span>
                  ) : (
                    'inactive'
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => startEdit(q)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-danger"
                    onClick={() => void onDelete(q.id)}
                    disabled={busy}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
