import { PLACEHOLDER_QUOTES } from '@/lib/content'
import { listActiveQuotes } from '@/lib/cms'
import type { SiteQuote } from '@/lib/types'
import { useEffect, useMemo, useState } from 'react'

export function QuoteBanner() {
  const [quotes, setQuotes] = useState<SiteQuote[]>(PLACEHOLDER_QUOTES)

  useEffect(() => {
    void listActiveQuotes().then(setQuotes)
  }, [])

  const quote = useMemo(() => {
    const active = quotes.filter((q) => q.active && q.text.trim())
    if (!active.length) return PLACEHOLDER_QUOTES[0]
    const index = Math.floor(Date.now() / 86_400_000) % active.length
    return active[index]
  }, [quotes])

  return (
    <section className="relative overflow-hidden border-y border-border/70 bg-gradient-to-br from-sage/10 via-cream to-gold/10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-gold/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-sky/60 blur-3xl"
      />
      <div className="container-page relative py-12 text-center sm:py-16">
        <p className="font-display text-2xl leading-snug text-ink italic sm:text-3xl md:text-4xl">
          “{quote.text}”
        </p>
        {quote.attribution ? (
          <p className="mt-4 text-sm font-medium tracking-wide text-ink-muted uppercase">
            — {quote.attribution}
          </p>
        ) : null}
      </div>
    </section>
  )
}
