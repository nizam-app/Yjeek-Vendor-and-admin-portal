import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resolveAdminRouteAccess } from '../config/adminNavManifest'
import { adminUserMeetsRouteRequirement } from '../lib/adminPermissions'
import AdminForbiddenPage from '../pages/admin/AdminForbiddenPage'

/**
 * Enforces manifest RBAC for nested /admin/* routes (Phase 2).
 */
export function AdminPermissionOutlet() {
  const { pathname } = useLocation()
  const { user, isAuthInitializing } = useAuth()

  if (isAuthInitializing) return null

  const access = resolveAdminRouteAccess(pathname)
  if (!access) {
    return <AdminForbiddenPage />
  }
  if (access.requirement && !adminUserMeetsRouteRequirement(user, access.requirement)) {
    return <AdminForbiddenPage />
  }

  return <Outlet />
}
