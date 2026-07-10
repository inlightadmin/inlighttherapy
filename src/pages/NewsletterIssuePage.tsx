import { useAuth } from '@/context/AuthContext'
import { getNewsletter } from '@/lib/cms'
import type { NewsletterIssue } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'

export function NewsletterIssuePage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()
  const [issue, setIssue] = useState<NewsletterIssue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !user) {
      setLoading(false)
      return
    }
    void (async () => {
      try {
        const n = await getNewsletter(id)
        if (!n || n.status !== 'published') {
          setError(
            n?.status === 'archived'
              ? 'This newsletter has been archived and is no longer available.'
              : 'Issue not found or not published.',
          )
        } else {
          setIssue(n)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load issue')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, user])

  if (authLoading || loading) {
    return (
      <div className="container-page py-16 text-ink-muted">Loading…</div>
    )
  }

  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: `/newsletter/${id}` }} />
    )
  }

  if (error || !issue) {
    return (
      <div className="container-page py-16">
        <p className="text-danger">{error || 'Not found'}</p>
        <Link to="/newsletter" className="btn-secondary mt-4 inline-flex no-underline">
          Back to newsletter
        </Link>
      </div>
    )
  }

  return (
    <article className="container-page py-14 sm:py-16">
      <Link to="/newsletter" className="text-sm font-medium no-underline">
        ← Recent newsletters
      </Link>
      <p className="mt-6 text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Newsletter
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">{issue.title}</h1>
      {issue.publishedAt ? (
        <p className="mt-2 text-sm text-ink-muted">
          {new Date(issue.publishedAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      ) : null}
      <div className="card prose-legal mt-8 max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-ink">
        {issue.body}
      </div>
    </article>
  )
}
