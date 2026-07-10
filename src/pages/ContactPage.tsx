import { useAuth } from '@/context/AuthContext'
import { PRACTICE } from '@/lib/content'
import { hasMinRole } from '@/lib/types'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'

export function ContactPage() {
  const { user, profile } = useAuth()
  const { hash } = useLocation()
  const [sent, setSent] = useState(false)
  const canChat = Boolean(user && hasMinRole(profile?.role, 'CLIENT'))
  const { location } = PRACTICE

  // Support /contact#location and /location → #location deep links
  useEffect(() => {
    if (hash !== '#location') return
    const el = document.getElementById('location')
    if (!el) return
    // Defer until layout paints (important after client-side redirect)
    const id = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    return () => window.cancelAnimationFrame(id)
  }, [hash])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Cloud Function + SendGrid will wire here in a later phase.
    setSent(true)
  }

  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Contact
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        We would love to hear from you
      </h1>
      <p className="section-lead">
        Send a message, find us in Provo, or chat when a clinician is available.
        Live chat requires login.
      </p>

      {/* 2/3 email · 1/3 Direct + Live chat · full-width crisis below */}
      <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
        <form
          onSubmit={onSubmit}
          className="card flex h-full flex-col gap-3 p-5 sm:p-6 lg:col-span-2"
        >
          <h2 className="font-display text-2xl">Email us</h2>
          {sent ? (
            <p className="rounded-xl border border-sage/30 bg-sage/10 px-3 py-2 text-xs text-sage">
              Thanks — message ready. You can also email{' '}
              <a href={`mailto:${PRACTICE.email}`}>{PRACTICE.email}</a>.
            </p>
          ) : null}
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input id="name" name="name" required className="input py-2.5" />
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input py-2.5"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">
            <label className="label" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={3}
              className="input min-h-[5.5rem] flex-1 resize-y py-2.5 lg:min-h-[7rem]"
            />
          </div>
          <div className="pt-1">
            <button type="submit" className="btn-primary">
              Send message
            </button>
          </div>
        </form>

        <div className="flex h-full flex-col gap-5">
          <div className="card p-5 sm:p-6">
            <h2 className="font-display text-2xl">Direct</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-muted">
              <li>
                Phone:{' '}
                <a href={PRACTICE.phoneHref} className="font-medium">
                  {PRACTICE.phone}
                </a>
              </li>
              <li>
                Email:{' '}
                <a href={`mailto:${PRACTICE.email}`} className="font-medium">
                  {PRACTICE.email}
                </a>
              </li>
              <li className="pt-1">
                <a
                  href="#location"
                  className="inline-flex text-base font-semibold sm:text-lg"
                >
                  Find us in Provo →
                </a>
              </li>
            </ul>
          </div>

          <div className="card flex-1 border-sage/30 bg-gradient-to-br from-sage/10 to-sky/30 p-5 sm:p-6">
            <h2 className="font-display text-2xl">Live chat</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Chat requires login. Clinicians join a queue when available. This
              is not therapy and not crisis care.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {canChat ? (
                <Link to="/account" className="btn-primary no-underline">
                  Chat UI coming soon — manage access
                </Link>
              ) : user ? (
                <Link to="/account" className="btn-primary no-underline">
                  Enable chat on your account
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-primary no-underline">
                    Log in to chat
                  </Link>
                  <Link to="/signup" className="btn-secondary no-underline">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        role="note"
        className="mt-5 w-full rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-crisis sm:px-6 sm:py-5 sm:text-[0.95rem]"
      >
        <p>
          This website is not crisis support and is not a substitute for
          emergency care or professional treatment.
        </p>
        <p className="mt-3">
          If you are in immediate danger or thinking about harming yourself or
          others, call 911 (US) or go to the nearest emergency room.
        </p>
        <p className="mt-3">
          For 24/7 emotional support in the US, call or text{' '}
          <strong className="font-semibold">988</strong> (Suicide &amp; Crisis
          Lifeline). Online chat on this site is for general questions and
          scheduling only—not therapy, diagnosis, or clinical care.
        </p>
      </div>

      {/* Find us */}
      <section
        id="location"
        className="mt-16 scroll-mt-24 border-t border-border/70 pt-14"
      >
        <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
          Location
        </p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Find us</h2>
        <p className="section-lead">
          Visit us in Provo — or open the listing in Google Maps for directions.
        </p>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-5">
          <div className="card w-full overflow-hidden p-0 lg:col-span-3">
            {/* Fixed heights avoid empty stretch below the iframe when the right column is taller */}
            <div className="relative h-[240px] w-full bg-cream-dark sm:h-[280px] lg:h-[300px] xl:h-[320px]">
              <iframe
                title="In-Light Therapy on Google Maps"
                src={location.mapsEmbedSrc}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-5 lg:col-span-2">
            <div className="card space-y-4">
              <div>
                <h3 className="font-display text-2xl">{location.name}</h3>
                <address className="mt-2 text-sm leading-relaxed text-ink-muted not-italic">
                  {location.street}
                  <br />
                  {location.suite}
                  <br />
                  {location.city}, {location.state} {location.zip}
                </address>
              </div>

              <ul className="space-y-2 text-sm text-ink">
                {location.notes.map((note) => (
                  <li key={note} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {note}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary no-underline"
                >
                  Get directions
                </a>
                <a
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary no-underline"
                >
                  View on Google
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
