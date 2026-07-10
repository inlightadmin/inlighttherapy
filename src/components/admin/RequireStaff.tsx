import { useAuth } from '@/context/AuthContext'
import { hasMinRole, type Role } from '@/lib/types'
import { Link, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Minimum role required (default PUBLICIST for CMS) */
  minRole?: Role
}

export function RequireStaff({ children, minRole = 'PUBLICIST' }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="container-page py-16 text-ink-muted">Loading…</div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />
  }

  if (!hasMinRole(profile?.role, minRole)) {
    return (
      <div className="container-page py-16">
        <div className="card max-w-lg">
          <h1 className="font-display text-2xl">Staff access only</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Your role is <strong>{profile?.role ?? 'USER'}</strong>. You need{' '}
            {minRole} or higher to open Admin.
          </p>
          <Link to="/account" className="btn-primary mt-4 inline-flex no-underline">
            Back to account
          </Link>
        </div>
      </div>
    )
  }

  return children
}
