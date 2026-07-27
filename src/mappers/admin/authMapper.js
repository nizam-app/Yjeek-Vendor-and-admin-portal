import { ApiError } from '../../api/errors'

/**
 * Stable Admin auth user shape from confirmed Login `data.user`
 * and Get Me `data` (user at root).
 * Only maps fields present in confirmed Postman samples.
 *
 * @param {Record<string, unknown>|null|undefined} backendUser
 */
export function mapAdminAuthUser(backendUser) {
  if (!backendUser || typeof backendUser !== 'object') {
    throw new ApiError({
      message: 'Invalid user payload from the server.',
    })
  }

  const displayName = backendUser.displayName || backendUser.fullName || null

  return {
    id: backendUser.id ?? null,
    userCode: backendUser.userCode ?? backendUser.userId ?? null,
    userId: backendUser.userId ?? backendUser.userCode ?? null,
    email: backendUser.email ?? null,
    phone: backendUser.phone ?? null,
    name: displayName,
    firstName: backendUser.firstName ?? null,
    lastName: backendUser.lastName ?? null,
    fullName: backendUser.fullName ?? displayName,
    jobTitle: backendUser.jobTitle ?? null,
    role: 'admin',
    backendRole: backendUser.role ?? null,
    roleBadge: backendUser.roleBadge ?? backendUser.role ?? null,
    scopeLevel: backendUser.scopeLevel ?? null,
    scopeLabel: backendUser.scopeLabel ?? null,
    accessLevel: backendUser.accessLevel ?? null,
    countries: Array.isArray(backendUser.countries) ? backendUser.countries : [],
    zones: Array.isArray(backendUser.zones) ? backendUser.zones : [],
    status: backendUser.status ?? null,
    statusLabel: backendUser.statusLabel ?? null,
    totpEnabled: Boolean(backendUser.totpEnabled),
    permissions:
      backendUser.permissions && typeof backendUser.permissions === 'object'
        ? backendUser.permissions
        : {},
    passwordResetRequired: Boolean(backendUser.passwordResetRequired),
    lastActiveAt: backendUser.lastActiveAt ?? null,
    memberSince: backendUser.memberSince ?? null,
    createdBy: backendUser.createdBy ?? null,
    createdById: backendUser.createdById ?? null,
    initials: backendUser.initials ?? null,
  }
}

/**
 * Map confirmed Admin login `data` payload.
 *
 * Success without 2FA (confirmed):
 *   { requires2fa, user, accessToken, refreshToken }
 *
 * When requires2fa is true, accessToken may be absent and tempToken may be
 * present — store pending session until 2FA Verify is confirmed with screenshots.
 *
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminLoginResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new ApiError({
      message: 'Invalid login response from the server.',
    })
  }

  const requires2fa = Boolean(data.requires2fa)
  const user = data.user ? mapAdminAuthUser(data.user) : null

  if (requires2fa) {
    return {
      requires2fa: true,
      accessToken: data.accessToken ?? null,
      refreshToken: data.refreshToken ?? null,
      tempToken: data.tempToken ?? null,
      user,
    }
  }

  if (!data.accessToken || !user) {
    throw new ApiError({
      message: 'Invalid login response from the server.',
    })
  }

  return {
    requires2fa: false,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken ?? null,
    tempToken: null,
    user,
  }
}

/**
 * Map confirmed Admin Get Me `data` payload (user object at data root).
 * @param {Record<string, unknown>|null|undefined} data
 */
export function mapAdminMeResponse(data) {
  return mapAdminAuthUser(data)
}
