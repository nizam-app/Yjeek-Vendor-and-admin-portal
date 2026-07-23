import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { ApiError, getFirstFieldErrorMessage } from '../../api/errors'
import {
  clearVendorAuth,
  getAccessToken,
  getAuthPayload,
  getRefreshToken,
  setAccessToken,
  setAuthPayload,
  setRefreshToken,
} from '../../api/token'
import {
  mapVendorLoginResponse,
  mapVendorMeResponse,
} from '../../mappers/vendor/authMapper'

/**
 * Vendor authentication service.
 *
 * Confirmed: login, get me, logout. Refresh remains unconfirmed.
 */
export const authService = {
  /**
   * POST /vendor-panel/auth/login (public).
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials = {}, options = {}) {
    const email = String(credentials.email ?? '').trim()
    const password = credentials.password

    const response = await apiClient.post(
      endpoints.vendor.auth.login,
      { email, password },
      {
        ...options,
        skipAuth: true,
        scope: 'vendor',
      },
    )

    return mapVendorLoginResponse(response?.data)
  },

  /**
   * GET /vendor-panel/auth/me (Bearer via shared apiClient).
   * @returns {Promise<object>} normalized Vendor user
   */
  async getCurrentUser(options = {}) {
    const response = await apiClient.get(endpoints.vendor.auth.me, {
      ...options,
      scope: 'vendor',
    })

    return mapVendorMeResponse(response?.data)
  },

  /**
   * POST /vendor-panel/auth/logout (Bearer via shared apiClient).
   * No request body. Local session clearing is handled by AuthContext.
   */
  async logout(options = {}) {
    const response = await apiClient.post(endpoints.vendor.auth.logout, null, {
      ...options,
      scope: 'vendor',
    })

    return response?.data ?? null
  },

  /** Persist Vendor tokens + user after a successful login response. */
  persistSession({ accessToken, refreshToken, user } = {}) {
    if (accessToken) setAccessToken(accessToken, 'vendor')
    if (refreshToken !== undefined) setRefreshToken(refreshToken, 'vendor')
    if (user) setAuthPayload({ ...user, role: 'vendor' }, 'vendor')
  },

  clearSession() {
    clearVendorAuth()
  },

  getStoredAccessToken() {
    return getAccessToken('vendor')
  },

  getStoredRefreshToken() {
    return getRefreshToken('vendor')
  },

  getStoredUser() {
    return getAuthPayload('vendor')
  },

  /**
   * Login form error message:
   * 1) first field validation message (email / password preferred)
   * 2) error.message
   * 3) generic fallback
   */
  getLoginErrorMessage(error, fallback = 'Incorrect email or password. Please recheck and try again.') {
    if (!error) return fallback
    if (error instanceof ApiError) {
      const fieldMessage = getFirstFieldErrorMessage(error.fieldErrors)
      if (fieldMessage) return fieldMessage
      if (error.message) return error.message
      return fallback
    }
    if (typeof error?.message === 'string' && error.message) return error.message
    return fallback
  },
}
