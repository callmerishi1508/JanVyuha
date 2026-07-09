import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { Role } from '../data/types'
import { useAuth } from '../store/auth'
import { useTestMode } from '../store/testMode'

/** Restricts a route to a given role (or roles), redirecting otherwise. */
export function RoleGuard({
  role,
  children,
}: {
  role: Role | Role[]
  children: React.ReactNode
}) {
  const { user, ready } = useAuth()
  const backend = useTestMode((s) => s.backend)
  const location = useLocation()
  const allowed = Array.isArray(role) ? role : [role]

  // On the real backend, wait for the session to hydrate before deciding,
  // so a page refresh doesn't briefly bounce a logged-in user to login.
  if (backend === 'supabase' && !ready) {
    return (
      <div className="grid place-items-center py-32 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (!user) {
    const to = allowed.includes('public') ? '/login/public' : '/login/stakeholder'
    return <Navigate to={to} state={{ from: location.pathname }} replace />
  }
  if (!allowed.includes(user.role)) {
    const home =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'stakeholder'
          ? '/dashboard'
          : '/report'
    return <Navigate to={home} replace />
  }
  return <>{children}</>
}
