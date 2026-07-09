import { CRISIS_DISCLAIMER_SHORT } from '@/lib/content'

export function CrisisBanner() {
  return (
    <div
      role="note"
      className="border-b border-amber-200/80 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 text-crisis"
    >
      <div className="container-page flex flex-col gap-1 py-2 text-center text-xs sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:text-left sm:text-sm">
        <span className="font-semibold tracking-wide">Not crisis support.</span>
        <span className="text-crisis/90">{CRISIS_DISCLAIMER_SHORT}</span>
        <a
          href="https://988lifeline.org/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-crisis underline decoration-crisis/40 underline-offset-2 hover:text-gold-deep"
        >
          988 Lifeline
        </a>
      </div>
    </div>
  )
}
