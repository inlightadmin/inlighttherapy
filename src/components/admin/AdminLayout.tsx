import { useAuth } from '@/context/AuthContext'
import { hasMinRole } from '@/lib/types'
import { Link, NavLink, Outlet } from 'react-router-dom'

const nav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/chat', label: 'Chat desk' },
  { to: '/admin/newsletters', label: 'Newsletters' },
  { to: '/admin/quotes', label: 'Quotes' },
  { to: '/admin/tools', label: 'Tools' },
  { to: '/admin/hours', label: 'Hours' },
  { to: '/admin/clinicians', label: 'Clinicians' },
  { to: '/admin/users', label: 'Users', adminOnly: true },
]

export function AdminLayout() {
  const { profile } = useAuth()
  const isAdmin = hasMinRole(profile?.role, 'ADMIN')

  return (
    <div className="border-b border-border/60 bg-cream-dark/40">
      <div className="container-page py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
              Admin
            </p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl">
              Site administration
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Signed in as {profile?.displayName} · role{' '}
              <span className="font-semibold text-ink">{profile?.role}</span>
            </p>
          </div>
          <Link to="/" className="btn-secondary no-underline">
            View site
          </Link>
        </div>

        <nav
          className="mt-6 flex gap-1 overflow-x-auto pb-1"
          aria-label="Admin sections"
        >
          {nav
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-4 py-2 text-sm font-semibold no-underline transition ${
                    isActive
                      ? 'bg-gold text-ink shadow-soft'
                      : 'bg-surface text-ink-muted hover:bg-cream-dark hover:text-ink'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
