import { HoursTable } from '@/components/HoursTable'
import { getBusinessHours, getClinicianBySlug } from '@/lib/cms'
import { PLACEHOLDER_HOURS } from '@/lib/content'
import type { BusinessHours, ClinicianProfile } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function TagList({ label, items }: { label: string; items: string[] }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-sage uppercase">
        {label}
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-border bg-cream px-3 py-1 text-xs font-medium text-ink"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ClinicianDetailPage() {
  const { slug } = useParams()
  const [clinician, setClinician] = useState<ClinicianProfile | null>(null)
  const [siteHours, setSiteHours] = useState<BusinessHours>(PLACEHOLDER_HOURS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    void (async () => {
      const [c, hours] = await Promise.all([
        getClinicianBySlug(slug),
        getBusinessHours(),
      ])
      setClinician(c)
      setSiteHours(hours)
      setLoading(false)
    })()
  }, [slug])

  if (loading) {
    return (
      <div className="container-page py-16 text-ink-muted">Loading…</div>
    )
  }

  if (!clinician) {
    return (
      <div className="container-page py-16">
        <h1 className="font-display text-3xl">Clinician not found</h1>
        <Link
          to="/clinicians"
          className="btn-secondary mt-4 inline-flex no-underline"
        >
          Back to clinicians
        </Link>
      </div>
    )
  }

  const hours = {
    ...siteHours,
    weekly:
      clinician.overrideAvailability ??
      clinician.selfAvailability ??
      siteHours.weekly,
    note: 'Clinician availability for guidance. Confirm the real-time slot when you book.',
  }

  return (
    <div className="container-page py-14 sm:py-16">
      <Link to="/clinicians" className="text-sm font-medium no-underline">
        ← All clinicians
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {clinician.photoURL ? (
                <img
                  src={clinician.photoURL}
                  alt=""
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-sage text-xl font-bold text-white">
                  {clinician.displayName
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')}
                </div>
              )}
              <div>
                <h1 className="font-display text-3xl sm:text-4xl">
                  {clinician.displayName}
                </h1>
                <p className="text-ink-muted">{clinician.title}</p>
              </div>
            </div>
            <p className="mt-6 text-base leading-relaxed text-ink-muted">
              {clinician.bio}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <TagList label="Modalities" items={clinician.modalities} />
              <TagList label="Populations" items={clinician.populations} />
              <TagList label="Insurance" items={clinician.insurance} />
              <TagList label="Expertise" items={clinician.expertise} />
              <TagList label="Focus" items={clinician.focus} />
              <TagList label="Services" items={clinician.services} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card">
            <h2 className="font-display text-2xl">Schedule a session</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Booking is handled securely through Calendly for this clinician.
            </p>
            {clinician.calendlyUrl ? (
              <a
                href={clinician.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-primary mt-4 w-full no-underline"
              >
                Open Calendly
              </a>
            ) : (
              <Link
                to="/contact"
                className="btn-primary mt-4 w-full no-underline"
              >
                Contact to schedule
              </Link>
            )}
          </div>
          <HoursTable hours={hours} />
        </div>
      </div>
    </div>
  )
}
