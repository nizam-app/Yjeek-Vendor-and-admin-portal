/**
 * Role-aware token helpers for the shared API client.
 *
 * Vendor and Admin tokens are stored under separate keys so either portal can
 * authenticate independently when Admin API integration is added later.
 */

export const TOKEN_KEYS = {
  vendorAccessToken: 'yjeek_vendor_access_token',
  adminAccessToken: 'yjeek_admin_access_token',
  /** Stored only — automatic refresh is not implemented until the refresh API is confirmed. */
  vendorRefreshToken: 'yjeek_vendor_refresh_token',
  /** Reserved for future Admin refresh token. */
  adminRefreshToken: 'yjeek_admin_refresh_token',
  /** Role-scoped vendor session payload (optional companion to yjeek_auth). */
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

export function getAccessToken(role = 'vendor') {
  const key = ACCESS_TOKEN_BY_ROLE[assertRole(role)]
  return localStorage.getItem(key)
}

export function setAccessToken(token, role = 'vendor') {
  const key = ACCESS_TOKEN_BY_ROLE[assertRole(role)]
  if (!token) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, token)
}

export function clearAccessToken(role = 'vendor') {
  localStorage.removeItem(ACCESS_TOKEN_BY_ROLE[assertRole(role)])
}

export function getRefreshToken(role = 'vendor') {
  const key = REFRESH_TOKEN_BY_ROLE[assertRole(role)]
  return localStorage.getItem(key)
}

export function setRefreshToken(token, role = 'vendor') {
  const key = REFRESH_TOKEN_BY_ROLE[assertRole(role)]
  if (!token) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, token)
}

export function clearRefreshToken(role = 'vendor') {
  localStorage.removeItem(REFRESH_TOKEN_BY_ROLE[assertRole(role)])
}

export function getAuthPayload(role = 'vendor') {
  const raw = localStorage.getItem(AUTH_PAYLOAD_BY_ROLE[assertRole(role)])
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    localStorage.removeItem(AUTH_PAYLOAD_BY_ROLE[assertRole(role)])
    return null
  }
}

export function setAuthPayload(payload, role = 'vendor') {
  const key = AUTH_PAYLOAD_BY_ROLE[assertRole(role)]
  if (!payload) {
    localStorage.removeItem(key)
    return
  }
  localStorage.setItem(key, JSON.stringify(payload))
}

export function clearAuthPayload(role = 'vendor') {
  localStorage.removeItem(AUTH_PAYLOAD_BY_ROLE[assertRole(role)])
}

/** Clear Vendor access token, refresh token, and auth payload (used on 401). */
export function clearVendorAuth() {
  clearAccessToken('vendor')
  clearRefreshToken('vendor')
  clearAuthPayload('vendor')
}

/** Reserved for future Admin 401 handling. */
export function clearAdminAuth() {
  clearAccessToken('admin')
  clearRefreshToken('admin')
  clearAuthPayload('admin')
}

/**
 * Pick the Bearer token for a request scope.
 * Shared endpoints use the Vendor token until a dedicated shared auth exists.
 */
export function getAccessTokenForScope(scope = 'vendor') {
  if (scope === 'admin') return getAccessToken('admin')
  return getAccessToken('vendor')
}
