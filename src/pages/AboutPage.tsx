export function AboutPage() {
  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        About
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        A practice rooted in light and care
      </h1>
      <p className="section-lead">
        In-Light Therapy exists to help people navigate life’s hardest seasons
        with dignity, skill, and hope.
      </p>

      <div className="mt-10 grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <h2 className="font-display text-2xl">Our story</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-ink-muted sm:text-base">
            <p>
              We have the privilege of walking with individuals and families
              through depression, anxiety, trauma, addiction, and relationship
              challenges. Our goal is simple and profound: create a space where
              you feel safe, understood, and supported — without judgment and
              without pressure.
            </p>
            <p>
              We focus on the whole person: mind, body, and spirit. Through
              practical, life-changing skills and a compassionate therapeutic
              relationship, you can begin to release what no longer serves you
              and move toward what does. Together, we build a toolbox for the
              long road ahead.
            </p>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gold/15 via-surface to-sky/40 lg:col-span-2">
          <h2 className="font-display text-2xl">What we believe</h2>
          <ul className="mt-4 space-y-3 text-sm text-ink">
            {[
              'Healing can be gentle and effective',
              'Every person deserves respect and agency',
              'Skills matter as much as insight',
              'Relationships are powerful agents of change',
              'Joy and light belong in the journey',
            ].map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-gold">✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
