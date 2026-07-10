import { ConfirmModal } from '@/components/ConfirmModal'
import {
  deleteClinician,
  listClinicians,
  listUsers,
  saveClinician,
} from '@/lib/cms'
import type { ClinicianProfile, UserProfile } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function AdminCliniciansPage() {
  const [clinicians, setClinicians] = useState<ClinicianProfile[]>([])
  const [staff, setStaff] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<ClinicianProfile | null>(
    null,
  )
  const [removeBusy, setRemoveBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [c, users] = await Promise.all([
        listClinicians({ includeUnpublished: true }),
        listUsers(),
      ])
      setClinicians(c)
      setStaff(
        users.filter((u) =>
          ['CLINICIAN', 'PUBLICIST', 'ADMIN'].includes(u.role),
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load clinicians')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function createFromUser(user: UserProfile) {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await saveClinician(user.uid, {
        slug: user.displayName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
        displayName: user.displayName,
        title: '',
        bio: '',
        photoURL: user.photoURL,
        modalities: [],
        populations: [],
        insurance: [],
        expertise: [],
        focus: [],
        services: [],
        calendlyUrl: '',
        published: false,
      })
      setMessage(`Clinician profile created for ${user.displayName}.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create profile')
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    if (!pendingRemove) return
    setRemoveBusy(true)
    setError(null)
    setMessage(null)
    try {
      await deleteClinician(pendingRemove.uid)
      setMessage(
        `Removed clinician profile for ${pendingRemove.displayName}.`,
      )
      setPendingRemove(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove clinician')
      setPendingRemove(null)
    } finally {
      setRemoveBusy(false)
    }
  }

  const existingUids = new Set(clinicians.map((c) => c.uid))
  const canAdd = staff.filter((u) => !existingUids.has(u.uid))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl">Clinician profiles</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Publicist+ can edit or permanently remove any clinician page. Create a
          profile from a staff user (CLINICIAN+), then edit details.
        </p>
      </div>

      {message ? <p className="text-sm text-sage">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2">
            {clinicians.map((c) => (
              <li key={c.uid} className="card">
                <h3 className="font-display text-xl">{c.displayName}</h3>
                <p className="text-sm text-ink-muted">{c.title || 'No title'}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  /clinicians/{c.slug} ·{' '}
                  {c.published !== false ? (
                    <span className="text-sage">published</span>
                  ) : (
                    'draft'
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/admin/clinicians/${c.uid}`}
                    className="btn-primary no-underline"
                  >
                    Edit profile
                  </Link>
                  <button
                    type="button"
                    className="btn-ghost text-danger"
                    disabled={busy || removeBusy}
                    onClick={() => {
                      setError(null)
                      setPendingRemove(c)
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {clinicians.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No clinician documents yet. Placeholders show on the public site
              until you create one.
            </p>
          ) : null}

          {canAdd.length > 0 ? (
            <div className="card">
              <h3 className="font-display text-xl">Create from staff user</h3>
              <ul className="mt-3 space-y-2">
                {canAdd.map((u) => (
                  <li
                    key={u.uid}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-ink">{u.displayName}</p>
                      <p className="text-xs text-ink-muted">
                        {u.email} · {u.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={busy}
                      onClick={() => void createFromUser(u)}
                    >
                      Create profile
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      <ConfirmModal
        open={Boolean(pendingRemove)}
        title="Remove clinician profile?"
        confirmLabel="Continue"
        cancelLabel="Cancel"
        danger
        busy={removeBusy}
        onCancel={() => {
          if (!removeBusy) setPendingRemove(null)
        }}
        onConfirm={() => void confirmRemove()}
      >
        <p className="font-medium text-ink">
          This action is permanent and cannot be undone.
        </p>
        <p>
          Continuing will permanently delete the clinician profile for{' '}
          <strong>
            {pendingRemove?.displayName ?? 'this clinician'}
          </strong>
          {pendingRemove?.slug
            ? ` (/clinicians/${pendingRemove.slug})`
            : ''}
          , including bio, tags, availability, and photo URL on the public site.
        </p>
        <p>
          Their user account and login are not deleted—only the public clinician
          page document. You can create a new profile for them later.
        </p>
      </ConfirmModal>
    </div>
  )
}
