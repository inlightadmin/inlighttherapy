import { ALL_ROLES, listUsers, updateUserRole } from '@/lib/cms'
import type { Role, UserProfile } from '@/lib/types'
import { useCallback, useEffect, useState } from 'react'

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setUsers(await listUsers())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function onRoleChange(uid: string, role: Role) {
    setBusyId(uid)
    setError(null)
    setMessage(null)
    try {
      await updateUserRole(uid, role)
      setMessage('Role updated. User may need to refresh / re-login for claims.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role update failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">Users & roles</h2>
        <p className="mt-1 text-sm text-ink-muted">
          ADMIN only. Changing role updates Firestore; the{' '}
          <code className="text-xs">syncUserRoleClaims</code> function mirrors
          custom claims.
        </p>
      </div>

      {message ? <p className="text-sm text-sage">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-border bg-cream-dark/50 text-xs tracking-wide text-ink-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {u.displayName}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="input w-auto py-2"
                      value={u.role}
                      disabled={busyId === u.uid}
                      onChange={(e) =>
                        void onRoleChange(u.uid, e.target.value as Role)
                      }
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
