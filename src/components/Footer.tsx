import { PRACTICE } from '@/lib/content'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-ink text-cream">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-2xl font-semibold text-cream">
            {PRACTICE.name}
          </p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-cream/75">
            Compassionate therapy for individuals, couples, and families.
            Practical skills, a safe relationship, and a path toward what
            matters.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-gold-soft uppercase">
            Explore
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="text-cream/80 no-underline hover:text-gold-soft" to="/services">
                Services
              </Link>
            </li>
            <li>
              <Link className="text-cream/80 no-underline hover:text-gold-soft" to="/clinicians">
                Clinicians
              </Link>
            </li>
            <li>
              <Link className="text-cream/80 no-underline hover:text-gold-soft" to="/tools">
                Tools
              </Link>
            </li>
            <li>
              <Link className="text-cream/80 no-underline hover:text-gold-soft" to="/newsletter">
                Newsletter
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold tracking-wide text-gold-soft uppercase">
            Connect
          </p>
          <ul className="mt-3 space-y-2 text-sm text-cream/80">
            <li>
              <a className="text-cream/80 no-underline hover:text-gold-soft" href={PRACTICE.phoneHref}>
                {PRACTICE.phone}
              </a>
            </li>
            <li>
              <a
                className="text-cream/80 no-underline hover:text-gold-soft"
                href={`mailto:${PRACTICE.email}`}
              >
                {PRACTICE.email}
              </a>
            </li>
            <li>
              <Link className="text-cream/80 no-underline hover:text-gold-soft" to="/contact">
                Contact & chat
              </Link>
            </li>
            <li>
              <Link
                className="text-cream/80 no-underline hover:text-gold-soft"
                to="/location"
              >
                {PRACTICE.location.city}, {PRACTICE.location.state}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {PRACTICE.name}. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link className="text-cream/60 no-underline hover:text-gold-soft" to="/privacy">
              Privacy Policy
            </Link>
            <Link className="text-cream/60 no-underline hover:text-gold-soft" to="/terms">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
