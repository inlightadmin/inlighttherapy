import { useAuth } from '@/context/AuthContext'
import { canUseClientChat, isStaffRole } from '@/lib/chat'
import { PRACTICE } from '@/lib/content'
import { hasMinRole } from '@/lib/types'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/clinicians', label: 'Clinicians' },
  { to: '/tools', label: 'Tools' },
  { to: '/newsletter', label: 'Newsletter' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const { user, profile, loading, logOut } = useAuth()
  const isAdminCms = hasMinRole(profile?.role, 'PUBLICIST')
  const isChatStaff = isStaffRole(profile?.role)
  const showMemberChat = canUseClientChat(profile)

  const authButtons = user ? (
    <>
      {isAdminCms ? (
        <Link to="/admin" className="btn-ghost no-underline">
          Admin
        </Link>
      ) : null}
      {isChatStaff ? (
        <Link to="/chat/staff" className="btn-ghost no-underline">
          Chat desk
        </Link>
      ) : showMemberChat ? (
        <Link to="/chat" className="btn-ghost no-underline">
          Chat
        </Link>
      ) : null}
      <Link to="/account" className="btn-ghost no-underline">
        {profile?.displayName?.split(' ')[0] || 'Account'}
      </Link>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => void logOut()}
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <Link to="/login" className="btn-ghost no-underline">
        Log in
      </Link>
      <Link to="/signup" className="btn-primary no-underline">
        Join
      </Link>
    </>
  )

  const mobileAuth = user ? (
    <>
      {isAdminCms ? (
        <Link
          to="/admin"
          onClick={() => setOpen(false)}
          className="btn-secondary flex-1 no-underline"
        >
          Admin
        </Link>
      ) : null}
      {isChatStaff ? (
        <Link
          to="/chat/staff"
          onClick={() => setOpen(false)}
          className="btn-secondary flex-1 no-underline"
        >
          Chat desk
        </Link>
      ) : showMemberChat ? (
        <Link
          to="/chat"
          onClick={() => setOpen(false)}
          className="btn-secondary flex-1 no-underline"
        >
          Chat
        </Link>
      ) : null}
      <Link
        to="/account"
        onClick={() => setOpen(false)}
        className="btn-secondary flex-1 no-underline"
      >
        Account
      </Link>
      <button
        type="button"
        className="btn-primary flex-1"
        onClick={() => {
          setOpen(false)
          void logOut()
        }}
      >
        Log out
      </button>
    </>
  ) : (
    <>
      <Link
        to="/login"
        onClick={() => setOpen(false)}
        className="btn-secondary flex-1 no-underline"
      >
        Log in
      </Link>
      <Link
        to="/signup"
        onClick={() => setOpen(false)}
        className="btn-primary flex-1 no-underline"
      >
        Join
      </Link>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-cream/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <Link to="/" className="group flex items-center gap-2 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-soft to-gold-deep text-sm font-bold text-white shadow-glow">
            IL
          </span>
          <span className="font-display text-xl font-semibold text-ink group-hover:text-gold-deep">
            {PRACTICE.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive
                  ? 'link-nav-active no-underline'
                  : 'link-nav no-underline'
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {loading ? (
            <span className="text-sm text-ink-muted">…</span>
          ) : (
            authButtons
          )}
        </div>

        <button
          type="button"
          className="btn-secondary px-3 py-2 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-surface lg:hidden"
        >
          <nav
            className="container-page flex flex-col gap-1 py-3"
            aria-label="Mobile"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? 'link-nav-active no-underline'
                    : 'link-nav no-underline'
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border pt-3">
              {mobileAuth}
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
