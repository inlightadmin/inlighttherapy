import { useAuth } from '@/context/AuthContext'
import { hasMinRole } from '@/lib/types'
import { Link } from 'react-router-dom'

const cards = [
  {
    to: '/admin/chat',
    title: 'Chat desk',
    body: 'Go available, claim the queue, and reply to live member chats.',
  },
  {
    to: '/admin/newsletters',
    title: 'Newsletters',
    body: 'Write issues, publish recent newsletters, and send SendGrid blasts.',
  },
  {
    to: '/admin/quotes',
    title: 'Quotes',
    body: 'Manage rotating quote banners shown across the site.',
  },
  {
    to: '/admin/tools',
    title: 'Tools',
    body: 'Create and publish wellness tool cards and modal guides.',
  },
  {
    to: '/admin/hours',
    title: 'Practice hours',
    body: 'Set standard business hours displayed on the home page.',
  },
  {
    to: '/admin/clinicians',
    title: 'Clinicians',
    body: 'Edit clinician profiles, Calendly links, and availability.',
  },
  {
    to: '/admin/users',
    title: 'Users & roles',
    body: 'View members and assign USER → ADMIN roles.',
    adminOnly: true,
  },
]

export function AdminDashboard() {
  const { profile } = useAuth()
  const isAdmin = hasMinRole(profile?.role, 'ADMIN')

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards
        .filter((c) => !c.adminOnly || isAdmin)
        .map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="card block no-underline transition hover:-translate-y-0.5 hover:border-sage/40"
          >
            <h2 className="font-display text-2xl text-ink">{card.title}</h2>
            <p className="mt-2 text-sm text-ink-muted">{card.body}</p>
            <p className="mt-4 text-xs font-semibold tracking-wide text-sage uppercase">
              Open →
            </p>
          </Link>
        ))}
    </div>
  )
}
