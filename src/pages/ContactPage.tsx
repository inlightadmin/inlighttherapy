import { CRISIS_DISCLAIMER_FULL, PRACTICE } from '@/lib/content'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

export function ContactPage() {
  const [sent, setSent] = useState(false)

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
        Send a message anytime. Live chat is available for members with CLIENT
        access or higher when a clinician is online.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <form onSubmit={onSubmit} className="card space-y-4 lg:col-span-3">
          <h2 className="font-display text-2xl">Email us</h2>
          {sent ? (
            <p className="rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
              Thanks — your message is ready for delivery. SendGrid email wiring
              arrives in the next phase. For now, you can also email{' '}
              <a href={`mailto:${PRACTICE.email}`}>{PRACTICE.email}</a>.
            </p>
          ) : null}
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <input id="name" name="name" required className="input" />
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
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="message">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              className="input resize-y"
            />
          </div>
          <button type="submit" className="btn-primary">
            Send message
          </button>
        </form>

        <div className="space-y-5 lg:col-span-2">
          <div className="card">
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
            </ul>
          </div>

          <div className="card border-sage/30 bg-gradient-to-br from-sage/10 to-sky/30">
            <h2 className="font-display text-2xl">Live chat</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Chat requires login and CLIENT access or higher. Clinicians join a
              queue when available. This is not therapy and not crisis care.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/login" className="btn-primary no-underline">
                Log in to chat
              </Link>
              <Link to="/signup" className="btn-secondary no-underline">
                Create account
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-xs leading-relaxed text-crisis whitespace-pre-wrap">
            {CRISIS_DISCLAIMER_FULL}
          </div>
        </div>
      </div>
    </div>
  )
}
