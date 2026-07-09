import { isFirebaseConfigured } from '@/lib/firebase'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

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
            Firebase Auth is not configured in this environment yet. Add your
            web config to <code className="font-mono">.env.local</code> to
            enable real sign-in.
          </p>
        ) : null}
        <div className="card mt-8 space-y-4">{children}</div>
      </div>
    </div>
  )
}

export function LoginPage() {
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(
      'Email/password and Google sign-in will connect once Firebase Auth providers are enabled.',
    )
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to access your profile, member newsletter archive, and chat (CLIENT+)."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="login-email">
            Email
          </label>
          <input id="login-email" type="email" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            className="input"
          />
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full">
          Log in
        </button>
        <button type="button" className="btn-secondary w-full" onClick={onSubmit}>
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
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(
      'Registration will create a USER profile, store consents, and enable CLIENT upgrade when you opt into chat, SMS, or booking.',
    )
  }

  return (
    <AuthShell
      title="Join In-Light Therapy"
      subtitle="Create a free account for the member newsletter archive. Opt into chat, SMS, or booking to unlock CLIENT features."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label" htmlFor="signup-name">
            Full name
          </label>
          <input id="signup-name" name="name" required className="input" />
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
            className="input"
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
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="signup-phone">
            Mobile phone (optional, for SMS)
          </label>
          <input
            id="signup-phone"
            name="phone"
            type="tel"
            className="input"
            placeholder="+1 555 555 5555"
          />
        </div>

        <fieldset className="space-y-3 rounded-2xl border border-border bg-cream/60 p-4">
          <legend className="px-1 text-sm font-semibold text-ink">
            Consents
          </legend>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input type="checkbox" required className="mt-1" name="terms" />
            <span>
              I agree to the <Link to="/terms">Terms & Conditions</Link>.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input type="checkbox" required className="mt-1" name="privacy" />
            <span>
              I agree to the <Link to="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input type="checkbox" className="mt-1" name="sms" />
            <span>
              I agree to receive SMS messages (marketing and appointment
              reminders) from In-Light Therapy at the number provided. Message
              frequency varies. Message and data rates may apply. Reply STOP to
              opt out, HELP for help. Consent is not a condition of purchase.
              Opting into SMS upgrades your account to CLIENT access.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-ink-muted">
            <input type="checkbox" className="mt-1" name="chat" />
            <span>
              I want to enable live chat with clinicians (not crisis care, not
              therapy). Opting into chat upgrades your account to CLIENT access.
            </span>
          </label>
        </fieldset>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" className="btn-primary w-full">
          Create account
        </button>
        <button type="button" className="btn-secondary w-full" onClick={onSubmit}>
          Continue with Google
        </button>
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
