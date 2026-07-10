import { DAY_NAMES } from '@/lib/content'
import {
  defaultWeeklyHours,
  getBusinessHours,
  saveBusinessHours,
} from '@/lib/cms'
import type { BusinessHours, WeeklyHours } from '@/lib/types'
import { useEffect, useState, type FormEvent } from 'react'

export function AdminHoursPage() {
  const [hours, setHours] = useState<BusinessHours>({
    timezone: 'America/Denver',
    weekly: defaultWeeklyHours(),
    note: '',
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const data = await getBusinessHours()
        setHours({
          ...data,
          weekly:
            data.weekly?.length === 7 ? data.weekly : defaultWeeklyHours(),
          note: data.note ?? '',
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load hours')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function updateDay(
    day: number,
    patch: Partial<WeeklyHours[number]>,
  ) {
    setHours((prev) => ({
      ...prev,
      weekly: prev.weekly.map((row) =>
        row.day === day ? { ...row, ...patch } : row,
      ),
    }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      await saveBusinessHours(hours)
      setMessage('Practice hours saved. They appear on the home page.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Loading hours…</p>
  }

  return (
    <form onSubmit={onSubmit} className="card max-w-2xl space-y-4">
      <h2 className="font-display text-2xl">Practice business hours</h2>
      <p className="text-sm text-ink-muted">
        Shown on the home page. Clinician-specific hours are managed under
        Clinicians.
      </p>

      <div>
        <label className="label" htmlFor="tz">
          Timezone
        </label>
        <input
          id="tz"
          className="input"
          value={hours.timezone}
          onChange={(e) =>
            setHours((h) => ({ ...h, timezone: e.target.value }))
          }
        />
      </div>

      <div>
        <label className="label" htmlFor="note">
          Note
        </label>
        <input
          id="note"
          className="input"
          value={hours.note ?? ''}
          onChange={(e) => setHours((h) => ({ ...h, note: e.target.value }))}
          placeholder="Hours shown for general guidance…"
        />
      </div>

      <ul className="divide-y divide-border rounded-2xl border border-border">
        {hours.weekly.map((row) => (
          <li
            key={row.day}
            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="w-28 font-medium text-ink">
              {DAY_NAMES[row.day]}
            </span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(row.closed)}
                onChange={(e) =>
                  updateDay(row.day, {
                    closed: e.target.checked,
                    open: e.target.checked ? '' : row.open || '09:00',
                    close: e.target.checked ? '' : row.close || '17:00',
                  })
                }
              />
              Closed
            </label>
            {!row.closed ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  className="input w-auto py-2"
                  value={row.open}
                  onChange={(e) => updateDay(row.day, { open: e.target.value })}
                />
                <span className="text-ink-muted">to</span>
                <input
                  type="time"
                  className="input w-auto py-2"
                  value={row.close}
                  onChange={(e) =>
                    updateDay(row.day, { close: e.target.value })
                  }
                />
              </div>
            ) : (
              <span className="text-sm text-ink-muted">—</span>
            )}
          </li>
        ))}
      </ul>

      <button type="submit" className="btn-primary" disabled={busy}>
        Save hours
      </button>
      {message ? <p className="text-sm text-sage">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </form>
  )
}
