import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { ApiError, getFirstFieldErrorMessage } from '../../api/errors'
import {
  clearAdminAuth,
  getAccessToken,
  getAuthPayload,
  getRefreshToken,
  setAccessToken,
  setAuthPayload,
  setRefreshToken,
} from '../../api/token'
import {
  mapAdminLoginResponse,
  mapAdminMeResponse,
} from '../../mappers/admin/authMapper'

/**
 * Admin authentication service.
 *
 * Confirmed: login, get me, logout (Postman success screenshots).
 * 2FA Verify — not wired until response screenshots exist.
 */
export const adminAuthService = {
  /**
   * POST /admin/auth/login (public).
   * Uses feature flag `auth` so other Admin screens can stay on mocks.
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials = {}, options = {}) {
    const email = String(credentials.email ?? '').trim()
    const password = credentials.password

    const response = await apiClient.post(
      endpoints.admin.auth.login,
      { email, password },
      {
        ...options,
        skipAuth: true,
        scope: 'admin',
        feature: 'auth',
      },
    )

    return mapAdminLoginResponse(response?.data)
  },

  /**
   * GET /admin/auth/me (Bearer via shared apiClient).
   * @returns {Promise<object>} normalized Admin user
   */
  async getCurrentUser(options = {}) {
    const response = await apiClient.get(endpoints.admin.auth.me, {
      ...options,
      scope: 'admin',
      feature: 'auth',
    })

    return mapAdminMeResponse(response?.data)
  },

  /**
   * POST /admin/auth/logout (Bearer via shared apiClient).
   * No request body. Local session clearing is handled by AuthContext.
   * Confirmed success: `{ message: "Logged out successfully" }`
   */
  async logout(options = {}) {
    const response = await apiClient.post(endpoints.admin.auth.logout, null, {
      ...options,
      scope: 'admin',
      feature: 'auth',
    })

    return response?.data ?? null
  },

  /** Persist Admin tokens + user after a successful non-2FA login. */
  persistSession({ accessToken, refreshToken, user } = {}) {
    if (accessToken) setAccessToken(accessToken, 'admin')
    if (refreshToken !== undefined) setRefreshToken(refreshToken, 'admin')
    if (user) setAuthPayload({ ...user, role: 'admin' }, 'admin')
  },

  clearSession() {
    clearAdminAuth()
  },

  getStoredAccessToken() {
    return getAccessToken('admin')
  },

  getStoredRefreshToken() {
    return getRefreshToken('admin')
  },

  getStoredUser() {
    return getAuthPayload('admin')
  },

  /**
   * Login form error message (same order as Vendor):
   * 1) first field validation message
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
