import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  clearVendorAuth,
  getAccessToken,
  getAuthPayload,
  setAccessToken,
  setAuthPayload,
} from '../../api/token'

/**
 * Vendor authentication service.
 *
 * Only the login path is Postman-confirmed. getMe / logout / refresh are not
 * registered until the backend collection confirms them. Login UI is not wired yet.
 */
export const authService = {
  login(credentials, options = {}) {
    return apiClient.post(endpoints.vendor.auth.login, credentials, {
      ...options,
      skipAuth: true,
      scope: 'vendor',
    })
  },

  /** Persist Vendor access token after a successful login response. */
  persistSession({ accessToken, user } = {}) {
    if (accessToken) setAccessToken(accessToken, 'vendor')
    if (user) setAuthPayload({ ...user, role: 'vendor' }, 'vendor')
  },

  clearSession() {
    clearVendorAuth()
  },

  getStoredAccessToken() {
    return getAccessToken('vendor')
  },

  getStoredUser() {
    return getAuthPayload('vendor')
  },
}
