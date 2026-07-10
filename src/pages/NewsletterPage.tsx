import { useAuth } from '@/context/AuthContext'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

export function NewsletterPage() {
  const { user, profile, loading } = useAuth()
  const [subscribed, setSubscribed] = useState(false)

  const isLoggedInMember = Boolean(user)
  const isNewsletterSubscribed = Boolean(profile?.newsletterConsent?.agreed)

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
        <div className="card mt-10 max-w-xl space-y-4">
          <h2 className="font-display text-2xl">You are subscribed</h2>
          <p className="text-sm text-ink-muted">
            Thanks for being on the list
            {user?.email ? (
              <>
                {' '}
                as <strong className="font-medium text-ink">{user.email}</strong>
              </>
            ) : null}
            . Monthly issues will arrive in your inbox when SendGrid delivery is
            connected. Manage preferences anytime from your account.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/account" className="btn-primary no-underline">
              Manage subscription
            </Link>
            <Link to="/" className="btn-secondary no-underline">
              Back home
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <form onSubmit={onSubmit} className="card space-y-4">
            <h2 className="font-display text-2xl">Subscribe</h2>
            {subscribed ? (
              <p className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
                You are on the list (preview mode). Full SendGrid delivery and
                member archive unlock next.
              </p>
            ) : null}
            {isLoggedInMember && !isNewsletterSubscribed ? (
              <p className="text-sm text-ink-muted">
                You are signed in but not subscribed yet. Opt in from your{' '}
                <Link to="/account">account</Link>, or use the form below.
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
            <h2 className="font-display text-2xl">Member archive</h2>
            {isLoggedInMember ? (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  You are signed in. Past monthly issues will appear here when
                  the archive goes live.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link to="/account" className="btn-secondary no-underline">
                    Account
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-muted">
                  Registered users can read past monthly issues after logging
                  in. Create a free account to unlock the archive when it goes
                  live.
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
            <div className="mt-8 rounded-2xl border border-border bg-surface/80 p-4">
              <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Coming soon in archive
              </p>
              <ul className="mt-3 space-y-2 text-sm text-ink">
                <li>Finding steady ground in anxious seasons</li>
                <li>Small skills that rebuild connection</li>
                <li>Light practices for darker months</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
