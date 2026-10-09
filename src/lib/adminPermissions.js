import { isAdminRealApiFeature } from '../api/config'
import { isSuperAdminUser } from '../mappers/admin/authMapper'
import { ADMIN_ACTIONS, ADMIN_MODULES } from '../config/adminModules'

function adminHasPermissionMap(user) {
  const perms = user?.permissions
  return perms && typeof perms === 'object' && Object.keys(perms).length > 0
}

/** Demo / legacy admin sessions without a permissions payload (mocks only). */
function adminLegacyFullAccess(user) {
  return user?.role === 'admin' && !isAdminRealApiFeature('auth') && !adminHasPermissionMap(user)
}

/**
 * @param {Record<string, string[]>|null|undefined} permissions
 * @param {string} module
 * @param {string} action
 */
export function hasAdminPermission(permissions, module, action) {
  if (!permissions || typeof permissions !== 'object') return false
  const mod = String(module || '').trim()
  const act = String(action || '').trim().toUpperCase()
  if (!mod || !act) return false
  const actions = permissions[mod]
  if (!Array.isArray(actions)) return false
  return actions.some((item) => String(item).toUpperCase() === act)
}

/**
 * @param {import('../mappers/admin/authMapper').mapAdminAuthUser|null|undefined} user
 * @param {string} module
 * @param {string} [action='VIEW']
 */
export function adminUserCan(user, module, action = 'VIEW') {
  if (!user) return false
  if (isSuperAdminUser(user)) return true
  if (adminLegacyFullAccess(user)) return true
  return hasAdminPermission(user.permissions, module, action)
}

/** True if user has VIEW on the module. */
export function canViewAdminModule(user, module) {
  return adminUserCan(user, module, 'VIEW')
}

/**
 * User may access route requirement: single module or anyOf modules (all need VIEW unless action specified).
 * @param {object|null|undefined} user
 * @param {{ module?: string, action?: string, anyOf?: string[] }} requirement
 */
export function adminUserMeetsRouteRequirement(user, requirement) {
  if (!requirement) return true
  const action = requirement.action || 'VIEW'
  if (Array.isArray(requirement.anyOf) && requirement.anyOf.length) {
    return requirement.anyOf.some((module) => adminUserCan(user, module, action))
  }
  if (requirement.module) {
    return adminUserCan(user, requirement.module, action)
  }
  return true
}

export { ADMIN_MODULES, ADMIN_ACTIONS }
