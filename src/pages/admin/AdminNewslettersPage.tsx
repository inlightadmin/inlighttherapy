import { ConfirmModal } from '@/components/ConfirmModal'
import { useAuth } from '@/context/AuthContext'
import {
  archiveNewsletter,
  createNewsletter,
  deleteNewsletter,
  listNewsletters,
  sendNewsletterBlast,
  unarchiveNewsletter,
  updateNewsletter,
} from '@/lib/cms'
import type { NewsletterIssue } from '@/lib/types'
import { hasMinRole } from '@/lib/types'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

function sortNewslettersByDate(
  list: NewsletterIssue[],
  prefer: 'draft' | 'published' | 'blasted' | 'archived',
) {
  return [...list].sort((a, b) => {
    const dateOf = (n: NewsletterIssue) => {
      if (prefer === 'published') {
        return n.publishedAt || n.updatedAt || n.createdAt || ''
      }
      if (prefer === 'blasted') {
        return n.sentAt || n.publishedAt || n.createdAt || ''
      }
      if (prefer === 'archived') {
        return n.archivedAt || n.publishedAt || n.createdAt || ''
      }
      return n.updatedAt || n.createdAt || ''
    }
    return dateOf(b).localeCompare(dateOf(a))
  })
}

export function AdminNewslettersPage() {
  const { profile } = useAuth()
  const isAdmin = hasMinRole(profile?.role, 'ADMIN')

  const [items, setItems] = useState<NewsletterIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sendTarget, setSendTarget] = useState<NewsletterIssue | null>(null)

  const draftItems = useMemo(
    () =>
      sortNewslettersByDate(
        items.filter((n) => n.status === 'draft'),
        'draft',
      ),
    [items],
  )
  const publishedItems = useMemo(
    () =>
      sortNewslettersByDate(
        items.filter((n) => n.status === 'published' && !n.sentAt),
        'published',
      ),
    [items],
  )
  const blastedItems = useMemo(
    () =>
      sortNewslettersByDate(
        items.filter((n) => n.status === 'published' && Boolean(n.sentAt)),
        'blasted',
      ),
    [items],
  )
  const archivedItems = useMemo(
    () =>
      sortNewslettersByDate(
        items.filter((n) => n.status === 'archived'),
        'archived',
      ),
    [items],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listNewsletters())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load newsletters')
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
    setStatus('draft')
    setEditingId(null)
  }

  function startEdit(n: NewsletterIssue) {
    setEditingId(n.id)
    setTitle(n.title)
    setSummary(n.summary ?? '')
    setBody(n.body)
    // Archived issues edit as published content when restored via Unarchive
    setStatus(n.status === 'archived' ? 'published' : n.status)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      if (editingId) {
        await updateNewsletter(editingId, { title, summary, body, status })
        setMessage('Issue updated.')
      } else {
        await createNewsletter({ title, summary, body, status })
        setMessage('Issue created.')
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
    if (!confirm('Delete this newsletter issue permanently?')) return
    setBusy(true)
    try {
      await deleteNewsletter(id)
      if (editingId === id) resetForm()
      await load()
      setMessage('Issue deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function onArchive(n: NewsletterIssue) {
    if (!n.sentAt) {
      setError('Only issues that have been blasted can be archived.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await archiveNewsletter(n.id)
      if (editingId === n.id) resetForm()
      setMessage(`Archived “${n.title}”. It no longer appears in Recent newsletters.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed')
    } finally {
      setBusy(false)
    }
  }

  async function onUnarchive(n: NewsletterIssue) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await unarchiveNewsletter(n.id)
      setMessage(`Restored “${n.title}” to Recent newsletters.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unarchive failed')
    } finally {
      setBusy(false)
    }
  }

  async function onPublish(n: NewsletterIssue) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await updateNewsletter(n.id, {
        title: n.title,
        body: n.body,
        summary: n.summary,
        status: 'published',
      })
      setMessage(`Published “${n.title}”. It appears in Recent newsletters.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  async function confirmSend() {
    if (!sendTarget) return
    if (sendTarget.status !== 'published' || sendTarget.sentAt) {
      setError(
        sendTarget.sentAt
          ? 'This issue was already blasted. Archive it or create a new issue.'
          : 'Publish the issue before sending a blast.',
      )
      setSendTarget(null)
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const result = await sendNewsletterBlast(sendTarget.id)
      setMessage(
        `Blast sent to ${result.sent} subscriber${result.sent === 1 ? '' : 's'}.`,
      )
      setSendTarget(null)
      await load()
    } catch (err) {
      const msg =
        typeof err === 'object' && err && 'message' in err
          ? String((err as { message: string }).message)
          : 'Send failed'
      setError(msg.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)$/, ''))
      setSendTarget(null)
    } finally {
      setBusy(false)
    }
  }

  function formatDate(iso?: string) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString()
  }

  function renderIssueCard(n: NewsletterIssue, archived: boolean) {
    const isDraft = n.status === 'draft'
    const isPublished = n.status === 'published'
    const hasBeenBlasted = Boolean(n.sentAt)
    // Draft or published-but-not-blasted may be deleted. Blasted active issues may not.
    // Archived: delete only for ADMIN.
    const canDelete = archived
      ? isAdmin
      : isDraft || (isPublished && !hasBeenBlasted)

    const dateLabel = isDraft
      ? formatDate(n.updatedAt || n.createdAt)
      : isPublished && hasBeenBlasted
        ? formatDate(n.sentAt || n.publishedAt)
        : isPublished
          ? formatDate(n.publishedAt || n.createdAt)
          : formatDate(n.archivedAt || n.publishedAt || n.createdAt)

    return (
      <li key={n.id} className="card space-y-2">
        <div>
          <h3 className="font-display text-xl">{n.title}</h3>
          <p className="text-xs text-ink-muted">
            {isPublished && hasBeenBlasted ? (
              <span className="text-sage">blasted</span>
            ) : isPublished ? (
              <span className="text-sage">published</span>
            ) : n.status === 'archived' ? (
              <span className="text-ink-muted">archived</span>
            ) : (
              'draft'
            )}
            {dateLabel ? ` · ${dateLabel}` : null}
            {hasBeenBlasted
              ? ` · sent ${new Date(n.sentAt!).toLocaleString()} (${n.sentCount ?? 0})`
              : null}
          </p>
          {/* Next-step guidance (replaces the old status-only line) */}
          {isDraft ? (
            <p className="mt-1 text-xs text-ink-muted">
              <strong className="font-medium text-ink">Next step:</strong>{' '}
              <strong>Publish</strong> so this issue appears on the Newsletter
              page for members.
            </p>
          ) : null}
          {isPublished && !hasBeenBlasted ? (
            <p className="mt-1 text-xs text-ink-muted">
              <strong className="font-medium text-ink">Next step:</strong>{' '}
              <strong>Send blast</strong> to email this issue to subscribers
              who opted in.
            </p>
          ) : null}
          {isPublished && hasBeenBlasted ? (
            <p className="mt-1 text-xs text-ink-muted">
              <strong className="font-medium text-ink">Next step:</strong>{' '}
              <strong>Archive</strong> when you want to hide it from Recent
              newsletters.
            </p>
          ) : null}
          {n.summary ? (
            <p className="mt-1 text-sm text-ink-muted">{n.summary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Published + blasted: View + Archive only */}
          {!archived && isPublished && hasBeenBlasted ? (
            <>
              <Link
                to={`/newsletter/${n.id}`}
                className="btn-ghost no-underline"
              >
                View
              </Link>
              <button
                type="button"
                className="btn-secondary"
                disabled={busy}
                onClick={() => void onArchive(n)}
              >
                Archive
              </button>
            </>
          ) : null}

          {/* Draft / published (not blasted): Edit + actions */}
          {!archived && !(isPublished && hasBeenBlasted) ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => startEdit(n)}
                disabled={busy}
              >
                Edit
              </button>
              {isPublished ? (
                <Link
                  to={`/newsletter/${n.id}`}
                  className="btn-ghost no-underline"
                >
                  View
                </Link>
              ) : null}
              {isDraft ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => void onPublish(n)}
                >
                  Publish
                </button>
              ) : null}
              {isPublished && !hasBeenBlasted ? (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => setSendTarget(n)}
                >
                  Send blast
                </button>
              ) : null}
            </>
          ) : null}

          {/* Archived list */}
          {archived ? (
            <>
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => void onUnarchive(n)}
              >
                Unarchive
              </button>
            </>
          ) : null}

          {canDelete ? (
            <button
              type="button"
              className="btn-ghost text-danger"
              disabled={busy}
              onClick={() => void onDelete(n.id)}
            >
              Delete
            </button>
          ) : null}
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="card space-y-4">
        <h2 className="font-display text-2xl">
          {editingId ? 'Edit issue' : 'New issue'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="nl-title">
                Title
              </label>
              <input
                id="nl-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="nl-summary">
                Summary (list teaser)
              </label>
              <input
                id="nl-summary"
                className="input"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="One-line preview for recent newsletters"
              />
            </div>
            <div>
              <label className="label" htmlFor="nl-status">
                Status
              </label>
              <select
                id="nl-status"
                className="input"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as 'draft' | 'published')
                }
              >
                <option value="draft">Draft (admin only)</option>
                <option value="published">Published (recent newsletters)</option>
              </select>
              <p className="mt-1 text-xs text-ink-muted">
                Flow: Draft → <strong>Publish</strong> →{' '}
                <strong>Send blast</strong> → <strong>Archive</strong> (hides
                from Recent newsletters).
              </p>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="nl-body">
              Body
            </label>
            <textarea
              id="nl-body"
              className="input min-h-[14rem] resize-y md:min-h-[16.5rem]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Write the full monthly issue…"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn-primary" disabled={busy}>
            {editingId ? 'Save changes' : 'Create issue'}
          </button>
          {editingId ? (
            <button type="button" className="btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
          {message ? <p className="text-sm text-sage">{message}</p> : null}
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card space-y-3">
            <div>
              <h2 className="font-display text-2xl">Draft newsletters</h2>
              <p className="text-xs text-ink-muted">
                {draftItems.length} draft
                {draftItems.length === 1 ? '' : 's'} · not visible on the
                Newsletter page until published
              </p>
            </div>
            {draftItems.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No drafts. Create an issue above to get started.
              </p>
            ) : (
              <ul className="space-y-3">
                {draftItems.map((n) => renderIssueCard(n, false))}
              </ul>
            )}
          </section>

          <section className="card space-y-3">
            <div>
              <h2 className="font-display text-2xl">Published newsletters</h2>
              <p className="text-xs text-ink-muted">
                {publishedItems.length} ready to blast · visible on the
                Newsletter page · not emailed yet
              </p>
            </div>
            {publishedItems.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No unsent published issues. Publish a draft, then send a blast
                to email subscribers.
              </p>
            ) : (
              <ul className="space-y-3">
                {publishedItems.map((n) => renderIssueCard(n, false))}
              </ul>
            )}
          </section>

          <section className="card space-y-3">
            <div>
              <h2 className="font-display text-2xl">Blasted newsletters</h2>
              <p className="text-xs text-ink-muted">
                {blastedItems.length} blasted · emailed to subscribers · still
                on the Newsletter page until archived
              </p>
            </div>
            {blastedItems.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No blasted issues yet. After you send a blast, it will appear
                here.
              </p>
            ) : (
              <ul className="space-y-3">
                {blastedItems.map((n) => renderIssueCard(n, false))}
              </ul>
            )}
          </section>

          <section className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl">Archived newsletters</h2>
                <p className="text-xs text-ink-muted">
                  {archivedItems.length} archived · hidden from Recent
                  newsletters
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowArchived((v) => !v)}
              >
                {showArchived ? 'Hide' : 'Show'}
              </button>
            </div>
            {showArchived ? (
              archivedItems.length === 0 ? (
                <p className="text-sm text-ink-muted">
                  No archived issues yet. After a blast, use Archive on the
                  issue card.
                </p>
              ) : (
                <ul className="space-y-3">
                  {archivedItems.map((n) => renderIssueCard(n, true))}
                </ul>
              )
            ) : null}
          </section>
        </div>
      )}

      <ConfirmModal
        open={Boolean(sendTarget)}
        title="Send newsletter blast?"
        confirmLabel="Send emails"
        cancelLabel="Cancel"
        busy={busy}
        onCancel={() => {
          if (!busy) setSendTarget(null)
        }}
        onConfirm={() => void confirmSend()}
      >
        <p className="font-medium text-ink">
          This emails all members with newsletter consent turned on.
        </p>
        <p>
          Issue: <strong>{sendTarget?.title}</strong>
        </p>
        <p>
          From: inlightadmin@gmail.com via SendGrid. Members can unsubscribe
          from their account anytime.
        </p>
      </ConfirmModal>
    </div>
  )
}
