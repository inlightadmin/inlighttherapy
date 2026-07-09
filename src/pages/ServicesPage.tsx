import { Link } from 'react-router-dom'

const services = [
  {
    title: 'Individual therapy',
    body: 'One-to-one support tailored to your goals — anxiety, depression, trauma, addiction, transitions, and personal growth.',
  },
  {
    title: 'Couples therapy',
    body: 'Guided conversations that strengthen communication, repair ruptures, and rebuild connection with clarity and care.',
  },
  {
    title: 'Family therapy',
    body: 'Help for families seeking healthier patterns, better understanding, and more peaceful ways of relating.',
  },
]

export function ServicesPage() {
  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Services
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Therapy that meets you where you are
      </h1>
      <p className="section-lead">
        Expert mental health support for individuals, couples, and families —
        designed to feel human, hopeful, and practical.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {services.map((service) => (
          <article key={service.title} className="card flex flex-col">
            <div className="mb-4 h-28 rounded-2xl bg-gradient-to-br from-gold-soft/50 via-cream to-sage/20" />
            <h2 className="font-display text-2xl">{service.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
              {service.body}
            </p>
          </article>
        ))}
      </div>

      <div className="card mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">Ready to schedule?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Choose a clinician and book through Calendly, or reach out with a
            question first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/clinicians" className="btn-primary no-underline">
            Find a clinician
          </Link>
          <Link to="/contact" className="btn-secondary no-underline">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  )
}
