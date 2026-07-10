import { ConfirmModal } from '@/components/ConfirmModal'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'

export function AccountPage() {
  const {
    user,
    profile,
    loading,
    logOut,
    optInChat,
    optInSms,
    optOutChat,
    optOutSms,
    optInNewsletter,
    optOutNewsletter,
    updateDisplayName,
    updatePhoto,
    updatePhone,
    removePhone,
    deleteAccount,
  } = useAuth()
  const navigate = useNavigate()

  const [phone, setPhone] = useState(profile?.phoneE164 ?? '')
  const [phoneDraft, setPhoneDraft] = useState(profile?.phoneE164 ?? '')
  const [nameDraft, setNameDraft] = useState(
    profile?.displayName || user?.displayName || '',
  )
  const [editingName, setEditingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNameDraft(profile?.displayName || user?.displayName || '')
    setPhone(profile?.phoneE164 ?? '')
    setPhoneDraft(profile?.phoneE164 ?? '')
  }, [profile?.displayName, profile?.phoneE164, user?.displayName])

  const chatEnabled = Boolean(profile?.chatOptIn)
  const smsConsented = Boolean(profile?.smsConsent?.agreed)
  const newsletterOn = Boolean(profile?.newsletterConsent?.agreed)

  const photoSrc = profile?.photoURL || user?.photoURL || ''
  const displayName =
    profile?.displayName || user?.displayName || 'Member'

  if (loading) {
    return (
      <div className="container-page py-16 text-ink-muted">Loading account…</div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/account' }} />
  }

  async function runAction(
    action: () => Promise<void>,
    success: string,
  ) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await action()
      setMessage(success)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function onOptInSms(e: FormEvent) {
    e.preventDefault()
    await runAction(
      () => optInSms(phone.trim()),
      'SMS consent saved. Your role is now CLIENT or higher.',
    )
  }

  async function onSaveName(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await updateDisplayName(nameDraft)
      setEditingName(false)
      setMessage('Name updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update name')
    } finally {
      setBusy(false)
    }
  }

  async function onPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    setError(null)
    setMessage(null)
    try {
      await updatePhoto(file)
      setMessage('Profile photo updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update photo')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function onConfirmDelete() {
    setDeleteBusy(true)
    setError(null)
    setMessage(null)
    try {
      await deleteAccount()
      setDeleteOpen(false)
      navigate('/', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not remove your account.',
      )
      setDeleteOpen(false)
    } finally {
      setDeleteBusy(false)
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
        opting into chat or SMS upgrades you to CLIENT. You can opt out anytime.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card space-y-5">
          {/* Photo + name editor */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="mx-auto shrink-0 sm:mx-0">
              <button
                type="button"
                className="group relative block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-70"
                disabled={photoBusy}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
                title="Click to upload a new photo"
              >
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt=""
                    className="h-24 w-24 rounded-2xl object-cover shadow-soft ring-2 ring-border transition group-hover:ring-sage"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-sage text-3xl font-bold text-white shadow-soft ring-2 ring-transparent transition group-hover:ring-sage">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/45 text-xs font-semibold text-cream opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {photoBusy ? 'Uploading…' : 'Change photo'}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => void onPhotoChange(e)}
              />
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              {editingName ? (
                <form onSubmit={onSaveName} className="space-y-2">
                  <label className="label text-left" htmlFor="profile-name">
                    Display name
                  </label>
                  <input
                    id="profile-name"
                    className="input"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    maxLength={80}
                    required
                    autoFocus
                  />
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={busy}
                    >
                      Save name
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => {
                        setEditingName(false)
                        setNameDraft(displayName)
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <p className="font-display text-2xl leading-tight">
                      {displayName}
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold text-ink-muted hover:border-sage hover:text-sage"
                      onClick={() => setEditingName(true)}
                    >
                      Edit name
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    Click your photo to upload a new picture (max 5 MB).
                  </p>
                </>
              )}
            </div>
          </div>

          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4 border-t border-border pt-3">
              <dt className="text-ink-muted">Role</dt>
              <dd className="font-semibold">{profile?.role ?? 'USER'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Chat</dt>
              <dd className={chatEnabled ? 'font-medium text-sage' : undefined}>
                {chatEnabled ? 'Enabled' : 'Not enabled'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">SMS</dt>
              <dd className={smsConsented ? 'font-medium text-sage' : undefined}>
                {smsConsented ? 'Consented' : 'Not consented'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Newsletter</dt>
              <dd className={newsletterOn ? 'font-medium text-sage' : undefined}>
                {newsletterOn ? 'Subscribed' : 'Unsubscribed'}
              </dd>
            </div>
          </dl>

          {/* Phone edit / remove */}
          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-ink">Mobile phone</p>

            {editingPhone || !profile?.phoneE164 ? (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  void runAction(async () => {
                    await updatePhone(phoneDraft)
                    setEditingPhone(false)
                    setPhone(phoneDraft.trim())
                  }, 'Phone number saved.')
                }}
              >
                <input
                  id="profile-phone"
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="+1 555 555 5555"
                  required
                  autoFocus={editingPhone}
                />
                <div className="flex flex-wrap gap-2">
                  <button type="submit" className="btn-primary" disabled={busy}>
                    Save phone
                  </button>
                  {editingPhone && profile?.phoneE164 ? (
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => {
                        setEditingPhone(false)
                        setPhoneDraft(profile.phoneE164 ?? '')
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                  {profile?.phoneE164 ? (
                    <button
                      type="button"
                      className="btn-ghost text-danger"
                      disabled={busy}
                      onClick={() =>
                        void runAction(async () => {
                          await removePhone()
                          setEditingPhone(false)
                          setPhoneDraft('')
                        }, 'Phone removed. SMS consent was withdrawn if it was active.')
                      }
                    >
                      Remove phone
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-ink-muted">
                  Saving a number does not enable SMS. Use the SMS card to
                  consent. Removing a number also withdraws SMS consent.
                </p>
              </form>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg text-left text-sm font-medium text-ink underline decoration-border underline-offset-4 transition hover:text-sage hover:decoration-sage"
                  onClick={() => {
                    setPhoneDraft(profile.phoneE164 ?? '')
                    setEditingPhone(true)
                  }}
                  title="Click to edit phone number"
                >
                  {profile.phoneE164}
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-danger hover:opacity-80"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      await removePhone()
                      setEditingPhone(false)
                      setPhoneDraft('')
                    }, 'Phone removed. SMS consent was withdrawn if it was active.')
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {chatEnabled ? (
              <Link to="/chat" className="btn-primary no-underline">
                Open live chat
              </Link>
            ) : null}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void logOut()}
            >
              Log out
            </button>
          </div>

          <div className="border-t border-border pt-4">
            <p className="text-sm font-semibold text-ink">Danger zone</p>
            <p className="mt-1 text-xs text-ink-muted">
              Permanently delete your account and associated profile data.
            </p>
            <button
              type="button"
              className="btn-ghost mt-3 text-danger"
              disabled={busy || deleteBusy}
              onClick={() => {
                setError(null)
                setDeleteOpen(true)
              }}
            >
              Remove account
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Chat preferences */}
          <div className="card space-y-3">
            <h2 className="font-display text-2xl">Live chat</h2>
            {chatEnabled ? (
              <>
                <p className="text-sm text-ink-muted">
                  Chat is enabled for general questions and scheduling — not
                  crisis care and not therapy.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/chat" className="btn-primary no-underline">
                    Open live chat
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost text-danger"
                    disabled={busy}
                    onClick={() =>
                      void runAction(
                        () => optOutChat(),
                        'Chat disabled. You can opt in again anytime.',
                      )
                    }
                  >
                    Opt out of chat
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-muted">
                  Chat is for general questions and scheduling with clinicians —
                  not crisis care and not therapy. Opting in upgrades you to
                  CLIENT.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () => optInChat(),
                      'Chat enabled. Your role is now CLIENT or higher.',
                    )
                  }
                >
                  Opt in to chat (become CLIENT)
                </button>
              </>
            )}
          </div>

          {/* Newsletter preferences */}
          <div className="card space-y-3">
            <h2 className="font-display text-2xl">Monthly newsletter</h2>
            {newsletterOn ? (
              <>
                <p className="text-sm text-ink-muted">
                  You are subscribed to the monthly email newsletter at{' '}
                  {user.email}. Past issues stay available in the member archive
                  while your account is active.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link to="/newsletter" className="btn-secondary no-underline">
                    View newsletter page
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost text-danger"
                    disabled={busy}
                    onClick={() =>
                      void runAction(
                        () => optOutNewsletter(),
                        'Unsubscribed from the newsletter. You can rejoin anytime.',
                      )
                    }
                  >
                    Unsubscribe
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-muted">
                  Get practical encouragement and practice updates about once a
                  month. You can unsubscribe anytime from this page.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () => optInNewsletter(),
                      'Subscribed to the monthly newsletter.',
                    )
                  }
                >
                  Subscribe to newsletter
                </button>
              </>
            )}
          </div>

          {/* SMS preferences */}
          <div className="card space-y-3">
            <h2 className="font-display text-2xl">SMS messages</h2>
            {smsConsented ? (
              <>
                <p className="text-sm text-ink-muted">
                  You have consented to marketing and appointment reminder SMS
                  at {profile?.phoneE164 || 'your number on file'}. Reply STOP
                  to any message also opts you out with the carrier.
                </p>
                <button
                  type="button"
                  className="btn-ghost text-danger"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () => optOutSms(),
                      'SMS consent withdrawn. You can opt in again anytime.',
                    )
                  }
                >
                  Withdraw SMS consent
                </button>
              </>
            ) : (
              <form onSubmit={onOptInSms} className="space-y-3">
                <p className="text-sm text-ink-muted">
                  Marketing and appointment reminders via SendGrid. Message &
                  data rates may apply. Reply STOP to opt out. Opting in
                  upgrades you to CLIENT.
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
            )}
          </div>

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

      <ConfirmModal
        open={deleteOpen}
        title="Remove your account?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        danger
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) setDeleteOpen(false)
        }}
        onConfirm={() => void onConfirmDelete()}
      >
        <p className="font-medium text-ink">
          This action is permanent and cannot be undone.
        </p>
        <p>
          Continuing will permanently delete your In-Light Therapy account,
          including your profile, photo, phone number, consent preferences, and
          access to the member newsletter archive and chat.
        </p>
        <p>
          You will need to create a new account if you want to return later.
          Message history used only for general questions may be retained on our
          systems as required for security or legal purposes.
        </p>
      </ConfirmModal>
    </div>
  )
}
