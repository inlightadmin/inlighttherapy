import { PLACEHOLDER_CLINICIANS } from '@/lib/content'
import { Link } from 'react-router-dom'

export function CliniciansPage() {
  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Clinicians
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Meet the people who will walk with you
      </h1>
      <p className="section-lead">
        Each clinician page includes modalities, populations served, insurance
        notes, expertise, and a direct scheduling link.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {PLACEHOLDER_CLINICIANS.map((clinician) => (
          <article key={clinician.slug} className="card flex flex-col">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-sage text-lg font-bold text-white">
                {clinician.displayName
                  .split(' ')
                  .slice(0, 2)
                  .map((p) => p[0])
                  .join('')}
              </div>
              <div>
                <h2 className="font-display text-2xl leading-tight">
                  {clinician.displayName}
                </h2>
                <p className="text-sm text-ink-muted">{clinician.title}</p>
              </div>
            </div>
            <p className="line-clamp-3 flex-1 text-sm text-ink-muted">
              {clinician.bio}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {clinician.expertise.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-cream-dark px-3 py-1 text-xs font-medium text-ink"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                to={`/clinicians/${clinician.slug}`}
                className="btn-primary no-underline"
              >
                View profile
              </Link>
              {clinician.calendlyUrl ? (
                <a
                  href={clinician.calendlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary no-underline"
                >
                  Schedule
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
