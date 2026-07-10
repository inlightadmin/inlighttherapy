import { useAuth } from '@/context/AuthContext'
import { listNewsletters } from '@/lib/cms'
import type { NewsletterIssue } from '@/lib/types'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

export function NewsletterPage() {
  const { user, profile, loading } = useAuth()
  const [subscribed, setSubscribed] = useState(false)
  const [issues, setIssues] = useState<NewsletterIssue[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)

  const isLoggedInMember = Boolean(user)
  const isNewsletterSubscribed = Boolean(profile?.newsletterConsent?.agreed)

  useEffect(() => {
    if (!user) {
      setIssues([])
      return
    }
    setArchiveLoading(true)
    void listNewsletters({ publishedOnly: true })
      .then(setIssues)
      .catch(() => setIssues([]))
      .finally(() => setArchiveLoading(false))
  }, [user])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubscribed(true)
  }

  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Newsletter
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Monthly light for the journey
      </h1>
      <p className="section-lead">
        Practical encouragement, wellness ideas, and practice updates — about
        once a month. Past issues are available to registered members.
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-ink-muted">Loading…</p>
      ) : isLoggedInMember && isNewsletterSubscribed ? (
        <div className="mt-10 space-y-8">
          <div className="card max-w-xl space-y-4">
            <h2 className="font-display text-2xl">You are subscribed</h2>
            <p className="text-sm text-ink-muted">
              Thanks for being on the list
              {user?.email ? (
                <>
                  {' '}
                  as{' '}
                  <strong className="font-medium text-ink">{user.email}</strong>
                </>
              ) : null}
              . New issues are emailed when we send a blast, and appear under
              Recent newsletters below.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/account" className="btn-secondary no-underline">
                Manage subscription
              </Link>
            </div>
          </div>

          <section>
            <h2 className="font-display text-3xl">Recent newsletters</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Published monthly issues for registered members.
            </p>
            {archiveLoading ? (
              <p className="mt-4 text-sm text-ink-muted">Loading archive…</p>
            ) : issues.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                No published issues yet. Check back soon.
              </p>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {issues.map((issue) => (
                  <li key={issue.id}>
                    <Link
                      to={`/newsletter/${issue.id}`}
                      className="card block h-full no-underline transition hover:-translate-y-0.5 hover:border-sage/40"
                    >
                      <h3 className="font-display text-xl text-ink">
                        {issue.title}
                      </h3>
                      {issue.publishedAt ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          {new Date(issue.publishedAt).toLocaleDateString(
                            undefined,
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            },
                          )}
                        </p>
                      ) : null}
                      <p className="mt-2 line-clamp-3 text-sm text-ink-muted">
                        {issue.summary || issue.body.slice(0, 160)}
                      </p>
                      <p className="mt-4 text-xs font-semibold tracking-wide text-sage uppercase">
                        Read issue →
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <form onSubmit={onSubmit} className="card space-y-4">
            <h2 className="font-display text-2xl">Subscribe</h2>
            {subscribed ? (
              <p className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
                Prefer a full account to manage preferences and read the archive.
                Create an account and opt in under Account → Newsletter.
              </p>
            ) : null}
            {isLoggedInMember && !isNewsletterSubscribed ? (
              <p className="text-sm text-ink-muted">
                You are signed in but not subscribed yet. Opt in from your{' '}
                <Link to="/account">account</Link> to receive blasts and unlock
                the full archive experience.
              </p>
            ) : null}
            <div>
              <label className="label" htmlFor="newsletter-email">
                Email address
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@example.com"
                defaultValue={user?.email ?? ''}
              />
            </div>
            <label className="flex items-start gap-3 text-sm text-ink-muted">
              <input type="checkbox" required className="mt-1" />
              <span>
                I agree to receive the monthly newsletter and understand I can
                unsubscribe anytime. See our{' '}
                <Link to="/privacy">Privacy Policy</Link>.
              </span>
            </label>
            <button type="submit" className="btn-primary">
              Join the newsletter
            </button>
          </form>

          <div className="card bg-gradient-to-br from-gold/10 via-surface to-sky/40">
            <h2 className="font-display text-2xl">Recent newsletters</h2>
            {isLoggedInMember ? (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Subscribe from your account to get email blasts. Published
                  issues for signed-in members:
                </p>
                {archiveLoading ? (
                  <p className="mt-4 text-sm text-ink-muted">Loading…</p>
                ) : issues.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">
                    No published issues yet.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {issues.slice(0, 5).map((issue) => (
                      <li key={issue.id}>
                        <Link
                          to={`/newsletter/${issue.id}`}
                          className="font-medium text-sage"
                        >
                          {issue.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to="/account" className="btn-primary no-underline">
                    Account & subscription
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Registered users can read past monthly issues after logging
                  in. Create a free account to unlock the archive.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to="/signup" className="btn-primary no-underline">
                    Create account
                  </Link>
                  <Link to="/login" className="btn-secondary no-underline">
                    Log in
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
