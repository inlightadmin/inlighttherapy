import { useAuth } from '@/context/AuthContext'
import {
  isEmailSignInLink,
  readEmailLinkPending,
} from '@/lib/auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

function mapEmailLinkError(err: unknown): string {
  if (err instanceof Error && err.message === 'EMAIL_REQUIRED') {
    return 'Please confirm the email address that received the link.'
  }
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : ''
  switch (code) {
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This sign-in link is invalid or has expired. Request a new one.'
    case 'auth/invalid-email':
      return 'That email does not match the link. Try the address you used to subscribe or log in.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Auth settings.'
    default:
      return err instanceof Error ? err.message : 'Could not complete sign-in.'
  }
}

/**
 * Completes Firebase email-link (passwordless) sign-in.
 * Continue URL: /auth/email-link?next=/newsletter&intent=newsletter
 */
export function EmailLinkPage() {
  const { completeEmailLink } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'working' | 'need-email' | 'error' | 'done'>(
    'working',
  )
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState(() => readEmailLinkPending()?.email ?? '')
  const [busy, setBusy] = useState(false)

  async function finish(withEmail?: string) {
    setBusy(true)
    setError(null)
    try {
      const result = await completeEmailLink(
        withEmail ? { email: withEmail } : undefined,
      )
      setStatus('done')
      navigate(result.nextPath || '/account', { replace: true })
    } catch (err) {
      if (err instanceof Error && err.message === 'EMAIL_REQUIRED') {
        setStatus('need-email')
        setError(null)
      } else {
        setStatus('error')
        setError(mapEmailLinkError(err))
      }
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setStatus('error')
      setError('Firebase Auth is not configured.')
      return
    }
    if (!isEmailSignInLink()) {
      setStatus('error')
      setError(
        'This page completes a sign-in link from your email. Request a new link from Newsletter or Log in.',
      )
      return
    }

    const pending = readEmailLinkPending()
    if (pending?.email) {
      void finish(pending.email)
      return
    }
    setStatus('need-email')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for link completion
  }, [])

  function onConfirmEmail(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Enter the email address that received the link.')
      return
    }
    void finish(email.trim())
  }

  const nextHint = searchParams.get('next') || '/account'

  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Account
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Completing sign-in
      </h1>
      <p className="section-lead">
        Secure passwordless access for the In-Light community.
      </p>

      <div className="card mt-10 max-w-lg space-y-4">
        {status === 'working' || busy ? (
          <p className="text-sm text-ink-muted">
            Verifying your email link… This only takes a moment.
          </p>
        ) : null}

        {status === 'need-email' ? (
          <form onSubmit={onConfirmEmail} className="space-y-4">
            <p className="text-sm text-ink-muted">
              You opened this link on a different device or browser. Confirm the
              email address that received the message so we can finish signing
              you in.
            </p>
            <div>
              <label className="label" htmlFor="email-link-confirm">
                Email address
              </label>
              <input
                id="email-link-confirm"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Working…' : 'Continue'}
            </button>
          </form>
        ) : null}

        {status === 'error' ? (
          <>
            <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/newsletter" className="btn-primary no-underline">
                Newsletter
              </Link>
              <Link to="/login" className="btn-secondary no-underline">
                Log in
              </Link>
              <Link
                to={nextHint.startsWith('/') ? nextHint : '/account'}
                className="btn-ghost no-underline"
              >
                Go back
              </Link>
            </div>
          </>
        ) : null}

        {status === 'done' ? (
          <p className="text-sm text-ink-muted">Signed in — redirecting…</p>
        ) : null}
      </div>
    </div>
  )
}
