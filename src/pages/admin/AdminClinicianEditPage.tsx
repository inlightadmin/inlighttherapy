import { ConfirmModal } from '@/components/ConfirmModal'
import { DAY_NAMES } from '@/lib/content'
import {
  defaultWeeklyHours,
  deleteClinician,
  formatCommaList,
  getClinician,
  parseCommaList,
  saveClinician,
  uploadClinicianPhoto,
} from '@/lib/cms'
import type { ClinicianProfile, WeeklyHours } from '@/lib/types'
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

const LIST_FIELDS = [
  { key: 'modalities', label: 'Modalities (comma-separated)' },
  { key: 'populations', label: 'Populations (comma-separated)' },
  { key: 'insurance', label: 'Insurance (comma-separated)' },
  { key: 'expertise', label: 'Expertise (comma-separated)' },
  { key: 'focus', label: 'Focus (comma-separated)' },
  { key: 'services', label: 'Services (comma-separated)' },
] as const

type ListFieldKey = (typeof LIST_FIELDS)[number]['key']

export function AdminClinicianEditPage() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeBusy, setRemoveBusy] = useState(false)
  const [form, setForm] = useState<ClinicianProfile | null>(null)
  /** Free-text drafts so commas can be typed; parsed into arrays on save */
  const [listDrafts, setListDrafts] = useState<Record<ListFieldKey, string>>({
    modalities: '',
    populations: '',
    insurance: '',
    expertise: '',
    focus: '',
    services: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!uid) return
    void (async () => {
      try {
        const c = await getClinician(uid)
        if (!c) {
          setError('Clinician not found.')
          return
        }
        setForm({
          ...c,
          selfAvailability:
            c.selfAvailability?.length === 7
              ? c.selfAvailability
              : defaultWeeklyHours(),
          overrideAvailability: c.overrideAvailability,
        })
        setListDrafts({
          modalities: formatCommaList(c.modalities),
          populations: formatCommaList(c.populations),
          insurance: formatCommaList(c.insurance),
          expertise: formatCommaList(c.expertise),
          focus: formatCommaList(c.focus),
          services: formatCommaList(c.services),
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Load failed')
      } finally {
        setLoading(false)
      }
    })()
  }, [uid])

  function updateDay(
    which: 'selfAvailability' | 'overrideAvailability',
    day: number,
    patch: Partial<WeeklyHours[number]>,
  ) {
    setForm((prev) => {
      if (!prev) return prev
      const base =
        which === 'selfAvailability'
          ? prev.selfAvailability ?? defaultWeeklyHours()
          : prev.overrideAvailability ?? defaultWeeklyHours()
      const weekly = base.map((row) =>
        row.day === day ? { ...row, ...patch } : row,
      )
      return { ...prev, [which]: weekly }
    })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form || !uid) return
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const next: ClinicianProfile = {
        ...form,
        modalities: parseCommaList(listDrafts.modalities),
        populations: parseCommaList(listDrafts.populations),
        insurance: parseCommaList(listDrafts.insurance),
        expertise: parseCommaList(listDrafts.expertise),
        focus: parseCommaList(listDrafts.focus),
        services: parseCommaList(listDrafts.services),
      }
      await saveClinician(uid, next)
      setForm(next)
      setMessage('Clinician profile saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    if (!uid) return
    setRemoveBusy(true)
    setError(null)
    try {
      await deleteClinician(uid)
      setRemoveOpen(false)
      navigate('/admin/clinicians', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setRemoveOpen(false)
    } finally {
      setRemoveBusy(false)
    }
  }

  async function onPhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !uid) return
    setPhotoBusy(true)
    setError(null)
    setMessage(null)
    try {
      const photoURL = await uploadClinicianPhoto(uid, file)
      // Persist immediately so public pages update without a full form save
      setForm((f) => {
        if (!f) return f
        const next = { ...f, photoURL }
        void saveClinician(uid, next).catch((saveErr) => {
          setError(
            saveErr instanceof Error
              ? saveErr.message
              : 'Photo uploaded but profile save failed',
          )
        })
        return next
      })
      setMessage('Photo updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed')
    } finally {
      setPhotoBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading…</p>
  }
  if (!form) {
    return (
      <div>
        <p className="text-danger">{error || 'Not found'}</p>
        <Link to="/admin/clinicians" className="btn-secondary mt-4 inline-flex no-underline">
          Back
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            to="/admin/clinicians"
            className="text-sm font-medium no-underline"
          >
            ← Clinicians
          </Link>
          <h2 className="mt-1 font-display text-3xl">{form.displayName}</h2>
        </div>
        <button
          type="button"
          className="btn-ghost text-danger"
          disabled={busy || removeBusy}
          onClick={() => setRemoveOpen(true)}
        >
          Remove clinician
        </button>
      </div>

      <div className="card space-y-4">
        <div>
          <p className="label">Photo</p>
          <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="group relative block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-70"
              disabled={photoBusy || busy}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Change clinician photo"
              title="Click to upload a new photo"
            >
              {form.photoURL ? (
                <img
                  src={form.photoURL}
                  alt=""
                  className="h-28 w-28 rounded-2xl object-cover shadow-soft ring-2 ring-border transition group-hover:ring-sage"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-sage text-3xl font-bold text-white shadow-soft ring-2 ring-transparent transition group-hover:ring-sage">
                  {form.displayName
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-ink/45 text-xs font-semibold text-cream opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                {photoBusy ? 'Uploading…' : 'Change photo'}
              </span>
            </button>
            <div className="text-sm text-ink-muted">
              <p>Click the photo to upload a new image.</p>
              <p className="mt-1 text-xs">JPG, PNG, WebP, or GIF · max 8 MB</p>
              {form.photoURL ? (
                <button
                  type="button"
                  className="btn-ghost mt-2 text-danger"
                  disabled={photoBusy || busy}
                  onClick={() =>
                    setForm((f) => (f ? { ...f, photoURL: undefined } : f))
                  }
                >
                  Remove photo
                </button>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => void onPhotoChange(e)}
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="c-name">
            Display name
          </label>
          <input
            id="c-name"
            className="input"
            value={form.displayName}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, displayName: e.target.value } : f))
            }
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="c-slug">
            URL slug
          </label>
          <input
            id="c-slug"
            className="input"
            value={form.slug}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, slug: e.target.value } : f))
            }
          />
          <p className="mt-1 text-xs text-ink-muted">
            Public URL: /clinicians/{form.slug || '…'}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="c-title">
            Title / credentials
          </label>
          <input
            id="c-title"
            className="input"
            value={form.title ?? ''}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, title: e.target.value } : f))
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="c-bio">
            Bio
          </label>
          <textarea
            id="c-bio"
            className="input min-h-[8rem] resize-y"
            value={form.bio}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, bio: e.target.value } : f))
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="c-cal">
            Calendly URL
          </label>
          <input
            id="c-cal"
            className="input"
            value={form.calendlyUrl ?? ''}
            onChange={(e) =>
              setForm((f) => (f ? { ...f, calendlyUrl: e.target.value } : f))
            }
            placeholder="https://calendly.com/…"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.published !== false}
            onChange={(e) =>
              setForm((f) =>
                f ? { ...f, published: e.target.checked } : f,
              )
            }
          />
          Published on public site
        </label>
      </div>

      <div className="card space-y-3">
        <h3 className="font-display text-xl">Tags & lists</h3>
        {LIST_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="label" htmlFor={`c-${key}`}>
              {label}
            </label>
            <input
              id={`c-${key}`}
              className="input"
              value={listDrafts[key]}
              onChange={(e) =>
                setListDrafts((d) => ({ ...d, [key]: e.target.value }))
              }
              placeholder="e.g. Item one, Item two, Item three"
            />
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <h3 className="font-display text-xl">Self availability</h3>
        <p className="text-xs text-ink-muted">
          Clinician’s own hours. Publicist override below wins when set.
        </p>
        {(form.selfAvailability ?? defaultWeeklyHours()).map((row) => (
          <div
            key={row.day}
            className="flex flex-wrap items-center gap-2 border-b border-border py-2"
          >
            <span className="w-24 text-sm font-medium">
              {DAY_NAMES[row.day]}
            </span>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={Boolean(row.closed)}
                onChange={(e) =>
                  updateDay('selfAvailability', row.day, {
                    closed: e.target.checked,
                  })
                }
              />
              Closed
            </label>
            {!row.closed ? (
              <>
                <input
                  type="time"
                  className="input w-auto py-1.5"
                  value={row.open}
                  onChange={(e) =>
                    updateDay('selfAvailability', row.day, {
                      open: e.target.value,
                    })
                  }
                />
                <input
                  type="time"
                  className="input w-auto py-1.5"
                  value={row.close}
                  onChange={(e) =>
                    updateDay('selfAvailability', row.day, {
                      close: e.target.value,
                    })
                  }
                />
              </>
            ) : null}
          </div>
        ))}
      </div>

      <div className="card space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl">Publicist override hours</h3>
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() =>
              setForm((f) =>
                f
                  ? {
                      ...f,
                      overrideAvailability: f.overrideAvailability
                        ? undefined
                        : defaultWeeklyHours(),
                    }
                  : f,
              )
            }
          >
            {form.overrideAvailability ? 'Clear override' : 'Enable override'}
          </button>
        </div>
        {form.overrideAvailability ? (
          form.overrideAvailability.map((row) => (
            <div
              key={row.day}
              className="flex flex-wrap items-center gap-2 border-b border-border py-2"
            >
              <span className="w-24 text-sm font-medium">
                {DAY_NAMES[row.day]}
              </span>
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={Boolean(row.closed)}
                  onChange={(e) =>
                    updateDay('overrideAvailability', row.day, {
                      closed: e.target.checked,
                    })
                  }
                />
                Closed
              </label>
              {!row.closed ? (
                <>
                  <input
                    type="time"
                    className="input w-auto py-1.5"
                    value={row.open}
                    onChange={(e) =>
                      updateDay('overrideAvailability', row.day, {
                        open: e.target.value,
                      })
                    }
                  />
                  <input
                    type="time"
                    className="input w-auto py-1.5"
                    value={row.close}
                    onChange={(e) =>
                      updateDay('overrideAvailability', row.day, {
                        close: e.target.value,
                      })
                    }
                  />
                </>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-ink-muted">No override — using self hours.</p>
        )}
      </div>

      <button type="submit" className="btn-primary" disabled={busy}>
        Save clinician
      </button>
      {message ? <p className="text-sm text-sage">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <ConfirmModal
        open={removeOpen}
        title="Remove clinician profile?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        danger
        busy={removeBusy}
        onCancel={() => {
          if (!removeBusy) setRemoveOpen(false)
        }}
        onConfirm={() => void confirmRemove()}
      >
        <p className="font-medium text-ink">
          This action is permanent and cannot be undone.
        </p>
        <p>
          Continuing will permanently delete the clinician profile for{' '}
          <strong>{form.displayName}</strong>
          {form.slug ? ` (/clinicians/${form.slug})` : ''}, including bio, tags,
          availability, and photo URL on the public site.
        </p>
        <p>
          Their user account and login are not deleted—only the public clinician
          page document.
        </p>
      </ConfirmModal>
    </form>
  )
}
