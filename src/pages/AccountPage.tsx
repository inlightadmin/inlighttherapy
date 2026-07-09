import { useAuth } from '@/context/AuthContext'
import { hasMinRole } from '@/lib/types'
import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

export function AccountPage() {
  const { user, profile, loading, logOut, optInChat, optInSms } = useAuth()
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (loading) {
    return (
      <div className="container-page py-16 text-ink-muted">Loading account…</div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account' }} />
  }

  async function onOptInChat() {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await optInChat()
      setMessage('Chat enabled. Your role is now CLIENT or higher.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not enable chat')
    } finally {
      setBusy(false)
    }
  }

  async function onOptInSms(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await optInSms(phone.trim())
      setMessage('SMS consent saved. Your role is now CLIENT or higher.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save SMS consent')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Account
      </p>
      <h1 className="mt-2 font-display text-4xl">Your profile</h1>
      <p className="section-lead">
        Manage access for newsletter, chat, and SMS. Default role is USER;
        opting into chat or SMS upgrades you to CLIENT.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card space-y-3">
          <div className="flex items-center gap-4">
            {profile?.photoURL || user.photoURL ? (
              <img
                src={profile?.photoURL || user.photoURL || ''}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-sage text-xl font-bold text-white">
                {(profile?.displayName || user.email || '?')
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display text-2xl">
                {profile?.displayName || user.displayName || 'Member'}
              </p>
              <p className="text-sm text-ink-muted">{user.email}</p>
            </div>
          </div>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-ink-muted">Role</dt>
              <dd className="font-semibold">{profile?.role ?? 'USER'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Chat</dt>
              <dd>
                {profile?.chatOptIn || hasMinRole(profile?.role, 'CLIENT')
                  ? 'Enabled'
                  : 'Not enabled'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">SMS</dt>
              <dd>{profile?.smsConsent?.agreed ? 'Consented' : 'Not consented'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Phone</dt>
              <dd>{profile?.phoneE164 || '—'}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void logOut()}
          >
            Log out
          </button>
        </div>

        <div className="space-y-5">
          <div className="card space-y-3">
            <h2 className="font-display text-2xl">Enable live chat</h2>
            <p className="text-sm text-ink-muted">
              Chat is for general questions and scheduling with clinicians — not
              crisis care and not therapy. Requires CLIENT access.
            </p>
            <button
              type="button"
              className="btn-primary"
              disabled={busy || hasMinRole(profile?.role, 'CLIENT')}
              onClick={() => void onOptInChat()}
            >
              {hasMinRole(profile?.role, 'CLIENT')
                ? 'Chat access active'
                : 'Opt in to chat (become CLIENT)'}
            </button>
            {hasMinRole(profile?.role, 'CLIENT') ? (
              <Link to="/contact" className="btn-secondary no-underline">
                Go to contact / chat
              </Link>
            ) : null}
          </div>

          <form onSubmit={onOptInSms} className="card space-y-3">
            <h2 className="font-display text-2xl">SMS consent</h2>
            <p className="text-sm text-ink-muted">
              Marketing and appointment reminders via SendGrid. Message & data
              rates may apply. Reply STOP to opt out. Opting in upgrades you to
              CLIENT.
            </p>
            <div>
              <label className="label" htmlFor="account-phone">
                Mobile phone
              </label>
              <input
                id="account-phone"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 555 5555"
                required
              />
            </div>
            <button type="submit" className="btn-primary" disabled={busy}>
              Save SMS consent
            </button>
          </form>

          {message ? (
            <p className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
