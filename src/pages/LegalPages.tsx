import { CRISIS_DISCLAIMER_FULL, PRACTICE } from '@/lib/content'
import type { ReactNode } from 'react'

function LegalLayout({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Legal
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Last updated: July 9, 2026 · Template for review by counsel before
        production SMS campaigns.
      </p>
      <article className="card prose-legal mt-8 max-w-3xl space-y-4 text-sm leading-relaxed text-ink-muted sm:text-base">
        {children}
      </article>
    </div>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions">
      <p>
        Welcome to {PRACTICE.name} (“we,” “us,” or “our”). By accessing our
        website and services, you agree to these Terms & Conditions.
      </p>
      <h2 className="font-display text-2xl text-ink">Not medical advice or crisis care</h2>
      <p className="whitespace-pre-wrap">{CRISIS_DISCLAIMER_FULL}</p>
      <h2 className="font-display text-2xl text-ink">Accounts & roles</h2>
      <p>
        You are responsible for maintaining the confidentiality of your login
        credentials. Default accounts are created with USER access. Certain
        features (live chat, SMS, appointment-related messaging) require CLIENT
        access or higher and may be granted when you opt into those features or
        book via Calendly.
      </p>
      <h2 className="font-display text-2xl text-ink">Live chat</h2>
      <p>
        Live chat is available only to authenticated users with CLIENT access or
        higher and only with clinician or staff members. Chat is for general
        questions and scheduling. It is not therapy, diagnosis, or clinical
        documentation. Do not send private health information through chat.
      </p>
      <h2 className="font-display text-2xl text-ink">SMS messaging</h2>
      <p>
        If you provide a mobile number and consent to SMS, you agree to receive
        marketing messages and/or appointment reminders from {PRACTICE.name}.
        Message frequency varies. Message and data rates may apply. Reply STOP
        to cancel, HELP for help. Consent is not a condition of purchasing goods
        or services. Carriers are not liable for delayed or undelivered
        messages.
      </p>
      <h2 className="font-display text-2xl text-ink">Booking</h2>
      <p>
        Session scheduling may be facilitated through third-party tools such as
        Calendly. Their terms apply to the booking experience.
      </p>
      <h2 className="font-display text-2xl text-ink">Acceptable use</h2>
      <p>
        You agree not to misuse the site, attempt unauthorized access, harass
        staff or other users, or upload unlawful content.
      </p>
      <h2 className="font-display text-2xl text-ink">Contact</h2>
      <p>
        Questions about these terms: {PRACTICE.email} · {PRACTICE.phone}
      </p>
    </LegalLayout>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This Privacy Policy describes how {PRACTICE.name} collects, uses, and
        shares information when you use our website and related services.
      </p>
      <h2 className="font-display text-2xl text-ink">Information we collect</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Account details: name, email, password (hashed by Firebase Auth), profile photo</li>
        <li>Optional phone number for SMS</li>
        <li>Consent records (terms, privacy, SMS, chat opt-in timestamps)</li>
        <li>Contact form messages and chat messages (non-clinical)</li>
        <li>Technical data such as device/browser information and basic analytics</li>
      </ul>
      <h2 className="font-display text-2xl text-ink">How we use information</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Provide accounts, member newsletter archive, and site features</li>
        <li>Respond to contact requests and member chat</li>
        <li>Send monthly newsletter emails (SendGrid)</li>
        <li>Send SMS marketing and appointment reminders if you consent (SendGrid)</li>
        <li>Operate security, fraud prevention, and service improvement</li>
      </ul>
      <h2 className="font-display text-2xl text-ink">SMS privacy</h2>
      <p>
        Mobile information will not be shared with third parties or affiliates
        for their marketing or promotional purposes. Text messaging originator
        opt-in data and consent will not be shared with any third parties except
        to provide the messaging service (for example, SendGrid as our SMS
        platform) or as required by law.
      </p>
      <h2 className="font-display text-2xl text-ink">Chat & health information</h2>
      <p>
        We do not intend to use chat for protected health information (PHI) or
        clinical records. Please do not share sensitive medical details in chat
        or contact forms. For clinical care, work directly with your clinician in
        appropriate channels.
      </p>
      <h2 className="font-display text-2xl text-ink">Service providers</h2>
      <p>
        We use trusted processors such as Google Firebase (hosting, auth,
        database, storage), SendGrid (email/SMS), and Calendly (scheduling).
        They process data under their terms and only as needed to provide
        services.
      </p>
      <h2 className="font-display text-2xl text-ink">Your choices</h2>
      <p>
        You may update profile information, withdraw SMS consent (STOP),
        unsubscribe from email newsletters, and request account deletion through
        your account tools or by contacting us.
      </p>
      <h2 className="font-display text-2xl text-ink">Contact</h2>
      <p>
        Privacy questions: {PRACTICE.email}
      </p>
    </LegalLayout>
  )
}
