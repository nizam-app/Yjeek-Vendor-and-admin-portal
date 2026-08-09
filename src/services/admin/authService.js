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

const DEVICE_ID_KEY = 'yjeek_admin_device_id'

function createDeviceId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `admin-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

/**
 * Stable browser device id for Admin "Trust this device" (30 days).
 */
export function getAdminDeviceId() {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing && existing.length >= 8) return existing
    const next = createDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, next)
    return next
  } catch {
    return createDeviceId()
  }
}

export function getAdminDeviceName() {
  if (typeof navigator === 'undefined') return 'Admin portal'
  const ua = navigator.userAgent || ''
  if (/Edg\//i.test(ua)) return 'Edge on Windows'
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome on Windows'
  if (/Firefox\//i.test(ua)) return 'Firefox'
  if (/Safari\//i.test(ua)) return 'Safari'
  return 'Admin portal'
}

/**
 * Admin authentication service.
 *
 * Confirmed: login, 2FA verify/setup/confirm/disable/backup-codes, get me, logout.
 */
export const adminAuthService = {
  /**
   * POST /admin/auth/login (public).
   * Uses feature flag `auth` so other Admin screens can stay on mocks.
   * @param {{ email: string, password: string, deviceId?: string, deviceName?: string }} credentials
   */
  async login(credentials = {}, options = {}) {
    const email = String(credentials.email ?? '').trim()
    const password = credentials.password
    const deviceId = credentials.deviceId || getAdminDeviceId()
    const deviceName = credentials.deviceName || getAdminDeviceName()

    const response = await apiClient.post(
      endpoints.admin.auth.login,
      { email, password, deviceId, deviceName },
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
   * POST /admin/auth/2fa/verify (public — tempToken).
   * @param {{ tempToken: string, code: string, trustDevice?: boolean, deviceId?: string, deviceName?: string }} payload
   */
  async verify2fa(payload = {}, options = {}) {
    const tempToken = String(payload.tempToken ?? '').trim()
    const code = String(payload.code ?? '').trim()
    if (!tempToken || !code) {
      throw new ApiError({ message: 'Verification code is required.' })
    }

    const deviceId = payload.deviceId || getAdminDeviceId()
    const deviceName = payload.deviceName || getAdminDeviceName()

    const response = await apiClient.post(
      endpoints.admin.auth.verify2fa,
      {
        tempToken,
        code,
        trustDevice: Boolean(payload.trustDevice),
        deviceId,
        deviceName,
      },
      {
        ...options,
        skipAuth: true,
        scope: 'admin',
        feature: 'auth',
      },
    )

    // Verify returns the successful-login shape (user + tokens), usually without requires2fa.
    return mapAdminLoginResponse({
      requires2fa: false,
      ...(response?.data && typeof response.data === 'object' ? response.data : {}),
    })
  },

  /**
   * POST /admin/auth/2fa/setup (Bearer).
   * @returns {Promise<{ secret: string, otpauthUrl: string, currentCode?: string, hint?: string }>}
   */
  async setup2fa(options = {}) {
    const response = await apiClient.post(endpoints.admin.auth.setup2fa, null, {
      ...options,
      scope: 'admin',
      feature: 'auth',
    })
    const data = response?.data && typeof response.data === 'object' ? response.data : {}
    return {
      secret: String(data.secret || ''),
      otpauthUrl: String(data.otpauthUrl || ''),
      currentCode: data.currentCode ? String(data.currentCode) : null,
      hint: data.hint ? String(data.hint) : null,
    }
  },

  /**
   * POST /admin/auth/2fa/confirm (Bearer).
   * @param {{ code: string }} payload
   */
  async confirm2fa(payload = {}, options = {}) {
    const code = String(payload.code ?? '').trim()
    if (!code) throw new ApiError({ message: 'Verification code is required.' })

    const response = await apiClient.post(
      endpoints.admin.auth.confirm2fa,
      { code },
      {
        ...options,
        scope: 'admin',
        feature: 'auth',
      },
    )
    const data = response?.data && typeof response.data === 'object' ? response.data : {}
    return {
      totpEnabled: Boolean(data.totpEnabled),
      backupCodes: Array.isArray(data.backupCodes) ? data.backupCodes.map(String) : [],
    }
  },

  /**
   * POST /admin/auth/2fa/disable (Bearer).
   * @param {{ code: string, password: string }} payload
   */
  async disable2fa(payload = {}, options = {}) {
    const code = String(payload.code ?? '').trim()
    const password = String(payload.password ?? '')
    if (!code || !password) {
      throw new ApiError({ message: 'Authenticator code and password are required.' })
    }

    const response = await apiClient.post(
      endpoints.admin.auth.disable2fa,
      { code, password },
      {
        ...options,
        scope: 'admin',
        feature: 'auth',
      },
    )
    const data = response?.data && typeof response.data === 'object' ? response.data : {}
    return {
      totpEnabled: Boolean(data.totpEnabled),
    }
  },

  /**
   * POST /admin/auth/2fa/backup-codes (Bearer).
   * @param {{ code: string }} payload
   */
  async regenerateBackupCodes(payload = {}, options = {}) {
    const code = String(payload.code ?? '').trim()
    if (!code) throw new ApiError({ message: 'Verification code is required.' })

    const response = await apiClient.post(
      endpoints.admin.auth.backupCodes2fa,
      { code },
      {
        ...options,
        scope: 'admin',
        feature: 'auth',
      },
    )
    const data = response?.data && typeof response.data === 'object' ? response.data : {}
    return {
      backupCodes: Array.isArray(data.backupCodes) ? data.backupCodes.map(String) : [],
      remaining: data.remaining != null ? Number(data.remaining) : null,
    }
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
   * Login / 2FA form error message (same order as Vendor):
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

  getVerifyErrorMessage(error, fallback = 'Incorrect verification code. Please try again.') {
    return this.getLoginErrorMessage(error, fallback)
  },
}
