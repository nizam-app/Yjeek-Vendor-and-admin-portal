/**
 * Role-aware token helpers for the shared API client.
 *
 * Admin tokens are stored under dedicated keys. Legacy vendor keys are still
 * cleared on admin login so leftover Vendor Portal sessions do not linger.
 */

export const TOKEN_KEYS = {
  /** Legacy — cleared only; Vendor Portal removed from this app. */
  vendorAccessToken: 'yjeek_vendor_access_token',
  adminAccessToken: 'yjeek_admin_access_token',
  vendorRefreshToken: 'yjeek_vendor_refresh_token',
  /** Reserved for future Admin refresh token. */
  adminRefreshToken: 'yjeek_admin_refresh_token',
  vendorAuth: 'yjeek_vendor_auth',
  /** Reserved for future Admin session payload. */
  adminAuth: 'yjeek_admin_auth',
}

const ACCESS_TOKEN_BY_ROLE = {
  vendor: TOKEN_KEYS.vendorAccessToken,
  admin: TOKEN_KEYS.adminAccessToken,
}

const REFRESH_TOKEN_BY_ROLE = {
  vendor: TOKEN_KEYS.vendorRefreshToken,
  admin: TOKEN_KEYS.adminRefreshToken,
}

const AUTH_PAYLOAD_BY_ROLE = {
  vendor: TOKEN_KEYS.vendorAuth,
  admin: TOKEN_KEYS.adminAuth,
}

function assertRole(role) {
  if (role !== 'vendor' && role !== 'admin') {
    throw new Error(`Unsupported auth role: ${role}`)
  }
  return role
}

export function getAccessToken(role = 'admin') {
  const key = ACCESS_TOKEN_BY_ROLE[assertRole(role)]
  return localStorage.getItem(key)
}

export function setAccessToken(token, role = 'admin') {
  const key = ACCESS_TOKEN_BY_ROLE[assertRole(role)]
  if (!token) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, token)
}

export function clearAccessToken(role = 'admin') {
  localStorage.removeItem(ACCESS_TOKEN_BY_ROLE[assertRole(role)])
}

export function getRefreshToken(role = 'admin') {
  const key = REFRESH_TOKEN_BY_ROLE[assertRole(role)]
  return localStorage.getItem(key)
}

export function setRefreshToken(token, role = 'admin') {
  const key = REFRESH_TOKEN_BY_ROLE[assertRole(role)]
  if (!token) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, token)
}

export function clearRefreshToken(role = 'admin') {
  localStorage.removeItem(REFRESH_TOKEN_BY_ROLE[assertRole(role)])
}

export function getAuthPayload(role = 'admin') {
  const raw = localStorage.getItem(AUTH_PAYLOAD_BY_ROLE[assertRole(role)])
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_PAYLOAD_BY_ROLE[assertRole(role)])
    return null
  }
}

export function setAuthPayload(payload, role = 'admin') {
  const key = AUTH_PAYLOAD_BY_ROLE[assertRole(role)]
  if (!payload) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, JSON.stringify(payload))
}

export function clearAuthPayload(role = 'admin') {
  localStorage.removeItem(AUTH_PAYLOAD_BY_ROLE[assertRole(role)])
}

/** Clear leftover Vendor tokens (legacy keys from the removed Vendor Portal). */
export function clearVendorAuth() {
  clearAccessToken('vendor')
  clearRefreshToken('vendor')
  clearAuthPayload('vendor')
}

export function clearAdminAuth() {
  clearAccessToken('admin')
  clearRefreshToken('admin')
  clearAuthPayload('admin')
}

/**
 * Pick the Bearer token for a request scope.
 */
export function getAccessTokenForScope(scope = 'admin') {
  if (scope === 'admin') return getAccessToken('admin')
  return getAccessToken('admin')
}
