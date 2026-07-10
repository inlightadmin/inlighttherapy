import { useAuth } from '@/context/AuthContext'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
}: {
  title: string
  subtitle: string
  children: ReactNode
  wide?: boolean
}) {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_10%_0%,rgb(242_193_78/0.22),transparent_55%),radial-gradient(ellipse_50%_40%_at_100%_20%,rgb(220_238_247/0.55),transparent_50%)]"
      />
      <div className="container-page relative py-10 sm:py-14 lg:py-16">
        <div className={wide ? 'mx-auto max-w-5xl' : 'mx-auto max-w-lg'}>
          <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
            Account
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-ink-muted sm:text-lg">
            {subtitle}
          </p>
          {!isFirebaseConfigured ? (
            <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-deep">
              Firebase Auth is not configured. Add web config to{' '}
              <code className="font-mono">.env.local</code>.
            </p>
          ) : null}
          <div className={wide ? 'mt-8 sm:mt-10' : 'card mt-8 space-y-4'}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function mapAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err
      ? String((err as { code: string }).code)
      : ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try logging in.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before completing.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Auth settings.'
    case 'permission-denied':
      return 'Firestore permission denied. Deploy security rules or check role fields.'
    default:
      return err instanceof Error ? err.message : 'Something went wrong.'
  }
}

function LoginLink() {
  return (
    <p className="text-center text-sm text-ink-muted">
      Already have an account?{' '}
      <Link to="/login" className="font-semibold text-sage no-underline hover:text-gold-deep">
        Log in
      </Link>
    </p>
  )
}

export function LoginPage() {
  const { user, loading, signIn, signInGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to={from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setBusy(true)
    setError(null)
    try {
      await signInGoogle({ requireConsents: false })
      navigate(from, { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in for your profile, member newsletter archive, and chat."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            autoComplete="current-password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Working…' : 'Log in'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={busy}
          onClick={() => void onGoogle()}
        >
          Continue with Google
        </button>
      </form>
      <p className="text-center text-sm text-ink-muted">
        New here?{' '}
        <Link to="/signup" className="font-semibold">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}

export function SignupPage() {
  const { user, profile, loading, signUp, signInGoogle } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [sms, setSms] = useState(false)
  const [chat, setChat] = useState(false)
  const [newsletter, setNewsletter] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Only redirect once profile is loaded so signup can finish writing preferences
  if (!loading && user && profile) {
    return <Navigate to="/account" replace />
  }

  function validateShared(): string | null {
    if (!displayName.trim()) return 'Please enter your full name.'
    if (!terms || !privacy) {
      return 'Please accept the Terms & Conditions and Privacy Policy.'
    }
    if (sms && !phone.trim()) {
      return 'A mobile number is required when you consent to SMS.'
    }
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const sharedError = validateShared()
    if (sharedError) {
      setError(sharedError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await signUp({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        phoneE164: phone.trim(),
        smsConsent: sms,
        chatOptIn: chat,
        newsletterConsent: newsletter,
        termsAccepted: terms,
        privacyAccepted: privacy,
      })
      navigate('/account', { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    const sharedError = validateShared()
    if (sharedError) {
      setError(sharedError)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await signInGoogle({
        requireConsents: true,
        displayName: displayName.trim(),
        termsAccepted: terms,
        privacyAccepted: privacy,
        smsConsent: sms,
        chatOptIn: chat,
        newsletterConsent: newsletter,
        phoneE164: phone.trim(),
      })
      navigate('/account', { replace: true })
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      wide
      title="Join In-Light Therapy"
      subtitle="Create a free account for the member newsletter. Opt into chat or SMS to unlock CLIENT features."
    >
      <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-8">
        {/* Left: identity + consents */}
        <section className="card space-y-5 border-border/90 bg-surface/95 shadow-soft">
          <div>
            <label className="label" htmlFor="signup-name">
              Full name
            </label>
            <input
              id="signup-name"
              name="name"
              required
              autoComplete="name"
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div>
            <label className="label" htmlFor="signup-phone">
              Mobile phone (required if SMS consent)
            </label>
            <input
              id="signup-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="input"
              placeholder="+1 555 555 5555"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-cream to-cream-dark/40 p-4 sm:p-5">
            <p className="text-sm font-semibold text-ink">Consents</p>
            <div className="mt-3 space-y-3.5">
              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-border accent-gold"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className="font-medium text-sage">
                    Terms & Conditions
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-border accent-gold"
                  checked={privacy}
                  onChange={(e) => setPrivacy(e.target.checked)}
                />
                <span>
                  I agree to the{' '}
                  <Link to="/privacy" className="font-medium text-sage">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-border accent-gold"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                />
                <span>
                  I want to receive the monthly email newsletter from In-Light
                  Therapy. I can unsubscribe anytime from my account.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-border accent-gold"
                  checked={sms}
                  onChange={(e) => setSms(e.target.checked)}
                />
                <span>
                  I agree to receive SMS messages (marketing and appointment
                  reminders) from In-Light Therapy at the number provided.
                  Message frequency varies. Message and data rates may apply.
                  Reply STOP to opt out, HELP for help. Consent is not a
                  condition of purchase. Opting into SMS upgrades your account
                  to CLIENT access.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-muted">
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 rounded border-border accent-gold"
                  checked={chat}
                  onChange={(e) => setChat(e.target.checked)}
                />
                <span>
                  I want to enable live chat with clinicians (not crisis care,
                  not therapy). Opting into chat upgrades your account to CLIENT
                  access.
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* Right: auth methods */}
        <div className="flex flex-col gap-5">
          <section className="card space-y-3 border-border/90 bg-surface/95 text-center shadow-soft">
            <button
              type="button"
              className="btn-primary w-full py-3 text-base shadow-glow"
              disabled={busy}
              onClick={() => void onGoogle()}
            >
              {busy ? 'Working…' : 'Create account with Google Sign-in'}
            </button>
            <p className="text-xs leading-relaxed text-ink-muted">
              Google sign-up still requires Terms and Privacy checkboxes.
            </p>
            <LoginLink />
          </section>

          <form
            onSubmit={onSubmit}
            className="card space-y-4 border-border/90 bg-surface/95 shadow-soft"
          >
            <div>
              <label className="label" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3 text-base shadow-glow"
              disabled={busy}
            >
              {busy ? 'Creating…' : 'Create account with email and password'}
            </button>
            <LoginLink />
          </form>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </AuthShell>
  )
}
