import { useAuth } from '@/context/AuthContext'
import { listNewsletters } from '@/lib/cms'
import { isFirebaseConfigured } from '@/lib/firebase'
import type { NewsletterIssue } from '@/lib/types'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

function mapSubscribeError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in links yet.'
    case 'auth/operation-not-allowed':
      return 'Email link sign-in is not enabled in Firebase Auth. Enable Email link (passwordless) in the console.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.'
    default:
      return err instanceof Error ? err.message : 'Could not send the sign-in link.'
  }
}

export function NewsletterPage() {
  const {
    user,
    profile,
    loading,
    sendEmailLink,
    optInNewsletter,
  } = useAuth()
  const [issues, setIssues] = useState<NewsletterIssue[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [privacy, setPrivacy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)

  const isLoggedInMember = Boolean(user)
  const isNewsletterSubscribed = Boolean(profile?.newsletterConsent?.agreed)

  useEffect(() => {
    if (user?.email) setEmail(user.email)
  }, [user?.email])

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

  async function onGuestSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!privacy) {
      setError('Please accept the Privacy Policy to receive the newsletter.')
      return
    }
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured.')
      return
    }
    setBusy(true)
    setError(null)
    setLinkSent(false)
    try {
      await sendEmailLink({
        email: email.trim(),
        intent: 'newsletter',
        nextPath: '/newsletter',
        privacyAccepted: true,
      })
      setLinkSent(true)
    } catch (err) {
      setError(mapSubscribeError(err))
    } finally {
      setBusy(false)
    }
  }

  async function onLoggedInSubscribe() {
    setBusy(true)
    setError(null)
    try {
      await optInNewsletter()
    } catch (err) {
      setError(mapSubscribeError(err))
    } finally {
      setBusy(false)
    }
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
          <div className="card space-y-4">
            <h2 className="font-display text-2xl">Subscribe</h2>

            {isLoggedInMember && !isNewsletterSubscribed ? (
              <>
                <p className="text-sm text-ink-muted">
                  You are signed in
                  {user?.email ? (
                    <>
                      {' '}
                      as{' '}
                      <strong className="font-medium text-ink">
                        {user.email}
                      </strong>
                    </>
                  ) : null}
                  . Opt in to receive monthly blasts and unlock the full archive
                  experience.
                </p>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() => void onLoggedInSubscribe()}
                >
                  {busy ? 'Working…' : 'Subscribe to the newsletter'}
                </button>
                <p className="text-xs text-ink-muted">
                  You can unsubscribe anytime from your{' '}
                  <Link to="/account">account</Link>.
                </p>
              </>
            ) : linkSent ? (
              <div className="space-y-3">
                <p className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-ink">
                  Check your email for a secure sign-in link
                  {email ? (
                    <>
                      {' '}
                      sent to{' '}
                      <strong className="font-medium">{email.trim()}</strong>
                    </>
                  ) : null}
                  . Click it to join as a member and confirm your subscription.
                </p>
                <p className="text-xs text-ink-muted">
                  The link expires after a short time. Check spam if you do not
                  see it. Same device is easiest; another device will ask you to
                  confirm your email.
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setLinkSent(false)
                    setError(null)
                  }}
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={onGuestSubscribe} className="space-y-4">
                <p className="text-sm text-ink-muted">
                  Enter your email and we will send a passwordless sign-in link.
                  That creates a free member account (USER) with newsletter
                  access — no password required.
                </p>
                <div>
                  <label className="label" htmlFor="newsletter-email">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-3 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    required
                    className="mt-1"
                    checked={privacy}
                    onChange={(e) => setPrivacy(e.target.checked)}
                  />
                  <span>
                    I agree to receive the monthly newsletter and understand I
                    can unsubscribe anytime. I have read the{' '}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </span>
                </label>
                {error ? <p className="text-sm text-danger">{error}</p> : null}
                {!isFirebaseConfigured ? (
                  <p className="text-sm text-gold-deep">
                    Firebase is not configured in this environment.
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={busy || !isFirebaseConfigured}
                >
                  {busy ? 'Sending link…' : 'Join the newsletter'}
                </button>
              </form>
            )}
          </div>

          <div className="card bg-gradient-to-br from-gold/10 via-surface to-sky/40">
            <h2 className="font-display text-2xl">Recent newsletters</h2>
            {isLoggedInMember ? (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Subscribe to get email blasts. Published issues for signed-in
                  members appear here once you opt in.
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
                  After you click the email link, you can read past monthly
                  issues while signed in. Prefer a password?{' '}
                  <Link to="/signup">Create an account</Link> anytime.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
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
