import {
  createTool,
  deleteTool,
  listTools,
  updateTool,
} from '@/lib/cms'
import type { Tool } from '@/lib/types'
import { useCallback, useEffect, useState, type FormEvent } from 'react'

export function AdminToolsPage() {
  const [items, setItems] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [order, setOrder] = useState(0)
  const [published, setPublished] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listTools({ includeUnpublished: true }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tools')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function resetForm() {
    setTitle('')
    setSummary('')
    setBody('')
    setOrder(0)
    setPublished(true)
    setEditingId(null)
  }

  function startEdit(t: Tool) {
    setEditingId(t.id)
    setTitle(t.title)
    setSummary(t.summary)
    setBody(t.body)
    setOrder(t.order ?? 0)
    setPublished(t.published)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const payload = { title, summary, body, order, published }
      if (editingId) {
        await updateTool(editingId, payload)
        setMessage('Tool updated.')
      } else {
        await createTool(payload)
        setMessage('Tool created.')
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
    if (!confirm('Delete this tool?')) return
    setBusy(true)
    try {
      await deleteTool(id)
      if (editingId === id) resetForm()
      await load()
      setMessage('Tool deleted.')
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
          {editingId ? 'Edit tool' : 'New tool'}
        </h2>
        <div>
          <label className="label" htmlFor="tool-title">
            Title
          </label>
          <input
            id="tool-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tool-summary">
            Summary
          </label>
          <input
            id="tool-summary"
            className="input"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tool-body">
            Full guide (modal body)
          </label>
          <textarea
            id="tool-body"
            className="input min-h-[10rem] resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Published
          </label>
          <div>
            <label className="label" htmlFor="tool-order">
              Order
            </label>
            <input
              id="tool-order"
              type="number"
              className="input w-24"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {editingId ? 'Save changes' : 'Create tool'}
          </button>
          {editingId ? (
            <button type="button" className="btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-sage">{message}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>

      <div className="lg:col-span-3">
        <h2 className="font-display text-2xl">All tools</h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-muted">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            No tools yet. Placeholders show on the public Tools page until you
            publish here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((t) => (
              <li key={t.id} className="card">
                <h3 className="font-display text-xl">{t.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{t.summary}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  order {t.order ?? 0} ·{' '}
                  {t.published ? (
                    <span className="text-sage">published</span>
                  ) : (
                    'draft'
                  )}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => startEdit(t)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-danger"
                    onClick={() => void onDelete(t.id)}
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
