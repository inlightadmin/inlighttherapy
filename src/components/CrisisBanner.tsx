import { CRISIS_DISCLAIMER_SHORT } from '@/lib/content'

export function CrisisBanner() {
  return (
    <div
      role="note"
      className="border-b border-ink/80 bg-ink text-cream"
    >
      <div className="container-page flex flex-col gap-1 py-2 text-center text-xs sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:text-left sm:text-sm">
        <span className="font-semibold tracking-wide text-gold-soft">
          Not crisis support.
        </span>
        <span className="text-cream/90">{CRISIS_DISCLAIMER_SHORT}</span>
        <a
          href="https://988lifeline.org/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-gold-soft underline decoration-gold-soft/40 underline-offset-2 hover:text-gold"
        >
          988 Lifeline
        </a>
      </div>
    </div>
  )
}
