import { DAY_NAMES } from '@/lib/content'
import type { BusinessHours } from '@/lib/types'

function formatTime(value: string) {
  if (!value) return '—'
  const [h, m] = value.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = ((h + 11) % 12) + 1
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function HoursTable({ hours }: { hours: BusinessHours }) {
  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-border bg-cream-dark/50 px-5 py-3">
        <p className="text-sm font-semibold text-ink">Practice hours</p>
        <p className="text-xs text-ink-muted">{hours.timezone.replace('_', ' ')}</p>
      </div>
      <ul className="divide-y divide-border">
        {hours.weekly.map((row) => (
          <li
            key={row.day}
            className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
          >
            <span className="font-medium text-ink">{DAY_NAMES[row.day]}</span>
            <span className="text-ink-muted">
              {row.closed
                ? 'Closed'
                : `${formatTime(row.open)} – ${formatTime(row.close)}`}
            </span>
          </li>
        ))}
      </ul>
      {hours.note ? (
        <p className="border-t border-border px-5 py-3 text-xs text-ink-muted">
          {hours.note}
        </p>
      ) : null}
    </div>
  )
}
