import { useAuth } from '@/context/AuthContext'
import { isFirebaseConfigured } from '@/lib/firebase'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="container-page py-14 sm:py-16">
      <div className="mx-auto max-w-lg">
        <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
          Account
        </p>
        <h1 className="mt-2 font-display text-4xl">{title}</h1>
        <p className="mt-2 text-ink-muted">{subtitle}</p>
        {!isFirebaseConfigured ? (
          <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-deep">
            Firebase Auth is not configured. Add web config to{' '}
            <code className="font-mono">.env.local</code>.
          </p>
        ) : null}
        <div className="card mt-8 space-y-4">{children}</div>
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

export function LoginPage() {
  const { user, loading, signIn, signInGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from || '/account'

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
      subtitle="Log in for your profile, member newsletter archive, and chat (CLIENT+)."
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
  const { user, loading, signUp, signInGoogle } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [privacy, setPrivacy] = useState(false)
  const [sms, setSms] = useState(false)
  const [chat, setChat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && user) {
    return <Navigate to="/account" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signUp({
        displayName,
        email,
        password,
        phoneE164: phone,
        smsConsent: sms,
        chatOptIn: chat,
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
    setBusy(true)
    setError(null)
    try {
      await signInGoogle({
        requireConsents: true,
        termsAccepted: terms,
        privacyAccepted: privacy,
        smsConsent: sms,
        chatOptIn: chat,
        phoneE164: phone,
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
      title="Join In-Light Therapy"
      subtitle="Create a free account for the member newsletter. Opt into chat or SMS to unlock CLIENT features."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="signup-name">
            Full name
          </label>
          <input
            id="signup-name"
            name="name"
            required
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="signup-email">
            Email (username)
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
        <div>
          <label className="label" htmlFor="signup-phone">
            Mobile phone (required if SMS consent)
          </label>
          <input
            id="signup-phone"
            name="phone"
            type="tel"
            className="input"
            placeholder="+1 555 555 5555"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <fieldset className="space-y-3 rounded-2xl border border-border bg-cream/60 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            Consents
          </legend>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              required
              className="mt-1"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
            />
            <span>
              I agree to the <Link to="/terms">Terms & Conditions</Link>.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              required
              className="mt-1"
              checked={privacy}
              onChange={(e) => setPrivacy(e.target.checked)}
            />
            <span>
              I agree to the <Link to="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={sms}
              onChange={(e) => setSms(e.target.checked)}
            />
            <span>
              I agree to receive SMS messages (marketing and appointment
              reminders) from In-Light Therapy at the number provided. Message
              frequency varies. Message and data rates may apply. Reply STOP to
              opt out, HELP for help. Consent is not a condition of purchase.
              Opting into SMS upgrades your account to CLIENT access.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="mt-1"
              checked={chat}
              onChange={(e) => setChat(e.target.checked)}
            />
            <span>
              I want to enable live chat with clinicians (not crisis care, not
              therapy). Opting into chat upgrades your account to CLIENT access.
            </span>
          </label>
        </fieldset>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <button
          type="button"
          className="btn-secondary w-full"
          disabled={busy}
          onClick={() => void onGoogle()}
        >
          Continue with Google
        </button>
        <p className="text-xs text-ink-muted">
          Google sign-up still requires Terms and Privacy checkboxes above.
        </p>
      </form>
      <p className="text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
