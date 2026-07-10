import { HoursTable } from '@/components/HoursTable'
import { QuoteBanner } from '@/components/QuoteBanner'
import { getBusinessHours, listPublishedClinicians } from '@/lib/cms'
import {
  PLACEHOLDER_CLINICIANS,
  PLACEHOLDER_HOURS,
  PRACTICE,
} from '@/lib/content'
import type { BusinessHours, ClinicianProfile } from '@/lib/types'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const [hours, setHours] = useState<BusinessHours>(PLACEHOLDER_HOURS)
  const [featured, setFeatured] = useState<ClinicianProfile | undefined>(
    PLACEHOLDER_CLINICIANS[0],
  )

  useEffect(() => {
    void getBusinessHours().then(setHours)
    void listPublishedClinicians().then((list) => {
      if (list[0]) setFeatured(list[0])
    })
  }, [])

  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgb(242_193_78/0.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgb(220_238_247/0.7),transparent_40%)]"
        />
        <div className="container-page relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-sage uppercase">
              Mental wellness · Whole-person care
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              Find the light within
            </h1>
            <p className="section-lead">
              Through practical skills and a compassionate therapeutic
              relationship, you can release what no longer serves you and move
              toward what does. We walk with individuals, couples, and families
              — mind, body, and spirit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={featured?.calendlyUrl || '/contact'}
                target={featured?.calendlyUrl ? '_blank' : undefined}
                rel={featured?.calendlyUrl ? 'noreferrer' : undefined}
                className="btn-primary no-underline"
              >
                Schedule a session
              </a>
              <Link to="/newsletter" className="btn-secondary no-underline">
                Join the monthly newsletter
              </Link>
              <Link to="/clinicians" className="btn-ghost no-underline">
                Meet our clinicians
              </Link>
            </div>
            <p className="mt-6 text-sm text-ink-muted">
              Prefer a call?{' '}
              <a href={PRACTICE.phoneHref} className="font-semibold">
                {PRACTICE.phone}
              </a>
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-gold/30 via-sky/40 to-sage/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-soft">
              <div className="aspect-[4/3] bg-gradient-to-br from-gold-soft/40 via-cream to-sage/20 p-8">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-white/50 bg-white/40 p-6 backdrop-blur-sm">
                  <div>
                    <p className="font-display text-3xl text-ink">Light · Joy · Healing</p>
                    <p className="mt-2 max-w-sm text-sm text-ink-muted">
                      A serene digital home for your practice journey — warm
                      guidance, clear next steps, and support that feels human.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-ink">
                    <div className="rounded-xl bg-surface/80 px-2 py-3 shadow-sm">
                      Individual
                    </div>
                    <div className="rounded-xl bg-surface/80 px-2 py-3 shadow-sm">
                      Couples
                    </div>
                    <div className="rounded-xl bg-surface/80 px-2 py-3 shadow-sm">
                      Family
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <QuoteBanner />

      <section className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="section-title">A safer path toward change</h2>
            <p className="section-lead">
              Life can feel heavy — depression, anxiety, trauma, addiction, or
              relationship strain. Here, you are met without judgment and without
              pressure. Together we build a toolbox you can use every day.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {[
                'Warm, evidence-informed care',
                'Skills you can practice between sessions',
                'Clear booking with your clinician via Calendly',
                'Member newsletter and wellness tools',
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  {item}
                </li>
              ))}
            </ul>
            <Link to="/about" className="btn-secondary mt-8 no-underline">
              Our approach
            </Link>
          </div>
          <HoursTable hours={hours} />
        </div>
      </section>

      <section className="border-y border-border/70 bg-surface/60 py-16">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="section-title">How we can help</h2>
            <p className="section-lead">
              Expert support tailored for the people and relationships that
              matter most.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Individual therapy',
                body: 'Personalized sessions focused on your mental health needs, growth, and daily skills.',
              },
              {
                title: 'Couples therapy',
                body: 'Strengthen communication, rebuild trust, and create healthier patterns together.',
              },
              {
                title: 'Family therapy',
                body: 'Improve understanding and connection across the family system with guided support.',
              },
            ].map((card) => (
              <article key={card.title} className="card">
                <div className="mb-4 h-1.5 w-12 rounded-full bg-gradient-to-r from-gold to-sage" />
                <h3 className="font-display text-2xl">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {card.body}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/services" className="btn-primary no-underline">
              View services
            </Link>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="card overflow-hidden p-0 md:grid md:grid-cols-2">
          <div className="bg-gradient-to-br from-sage to-sage-soft p-8 text-cream sm:p-10">
            <h2 className="font-display text-3xl text-cream sm:text-4xl">
              Ready to take the next step?
            </h2>
            <p className="mt-3 text-cream/85">
              Schedule with a clinician, explore free tools, or join our monthly
              newsletter for steady encouragement.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 p-8 sm:p-10">
            <a
              href={featured?.calendlyUrl || '/contact'}
              target={featured?.calendlyUrl ? '_blank' : undefined}
              rel={featured?.calendlyUrl ? 'noreferrer' : undefined}
              className="btn-primary no-underline"
            >
              Book with a clinician
            </a>
            <Link to="/contact" className="btn-secondary no-underline">
              Contact or chat (members)
            </Link>
            <Link to="/tools" className="btn-ghost no-underline">
              Browse wellness tools
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
