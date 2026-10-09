import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  adminUserCan,
  adminUserMeetsRouteRequirement,
  canViewAdminModule,
  hasAdminPermission,
} from '../lib/adminPermissions'

/**
 * RBAC helpers for Admin portal pages (nav + route guards in Phase 2).
 */
export function useAdminCan() {
  const { user } = useAuth()

  return useMemo(
    () => ({
      user,
      can: (module, action = 'VIEW') => adminUserCan(user, module, action),
      canView: (module) => canViewAdminModule(user, module),
      hasPermission: (module, action) => hasAdminPermission(user?.permissions, module, action),
      meetsRouteRequirement: (requirement) => adminUserMeetsRouteRequirement(user, requirement),
    }),
    [user],
  )
}
