import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { UNAUTHORIZED_EVENT } from '../api/client'
import { apiConfig, isAdminRealApiFeature } from '../api/config'
import { ApiError } from '../api/errors'
import {
  clearAdminAuth,
  clearVendorAuth,
  getAccessToken,
  setAuthPayload,
  setAccessToken,
} from '../api/token'
import { adminAuthService } from '../services/admin/authService'
import { authService } from '../services/vendor/authService'

const AuthContext = createContext(null)
/** Shared session key — stores role-aware user: { email, name, role, ... } */
const STORAGE_KEY = 'yjeek_auth'
const PENDING_ADMIN_KEY = 'yjeek_pending_admin'

export const demoAccounts = {
  vendor: {
    email: 'vendor@greenkitchen.bh',
    password: 'password123',
    name: 'Green Kitchen Admin',
    role: 'vendor',
  },
  admin: {
    email: 'admin@gmail.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'admin',
  },
}

function readStoredUser() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return null
  try {
    const parsed = JSON.parse(saved)
    if (!parsed || (parsed.role !== 'vendor' && parsed.role !== 'admin')) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function persistUser(nextUser) {
  if (!nextUser) {
    localStorage.removeItem(STORAGE_KEY)
    return
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
  if (nextUser.role === 'vendor') {
    setAuthPayload(nextUser, 'vendor')
  }
  if (nextUser.role === 'admin') {
    setAuthPayload(nextUser, 'admin')
  }
}

function clearVendorSessionState() {
  clearVendorAuth()
  const current = readStoredUser()
  if (!current || current.role === 'vendor') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Restore Vendor session via Get Me when a Vendor access token exists
 * and the active (or empty) session is not an Admin user.
 */
function shouldRestoreVendorSession(storedUser) {
  if (apiConfig.vendorUseMockApi) return false
  if (!getAccessToken('vendor')) return false
  if (storedUser?.role === 'admin') return false
  // Only prefer Admin when there is no active Vendor session to restore.
  // Otherwise Live Orders keeps a stale serviceModes (e.g. dineIn: false).
  if (
    !storedUser &&
    isAdminRealApiFeature('auth') &&
    getAccessToken('admin')
  ) {
    return false
  }
  return true
}

/**
 * Restore Admin session via Get Me when an Admin access token exists
 * and the active (or empty) session is not a Vendor user.
 */
function shouldRestoreAdminSession(storedUser) {
  if (!isAdminRealApiFeature('auth')) return false
  if (!getAccessToken('admin')) return false
  if (storedUser?.role === 'vendor') return false
  return true
}

function clearAdminSessionState() {
  clearAdminAuth()
  const current = readStoredUser()
  if (!current || current.role === 'admin') {
    localStorage.removeItem(STORAGE_KEY)
  }
  sessionStorage.removeItem(PENDING_ADMIN_KEY)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [authError, setAuthError] = useState(null)
  const [isAuthInitializing, setIsAuthInitializing] = useState(() => {
    const stored = readStoredUser()
    return shouldRestoreVendorSession(stored) || shouldRestoreAdminSession(stored)
  })
  const [pendingAdmin, setPendingAdmin] = useState(() => {
    const saved = sessionStorage.getItem(PENDING_ADMIN_KEY)
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      sessionStorage.removeItem(PENDING_ADMIN_KEY)
      return null
    }
  })

  useEffect(() => {
    function onUnauthorized(event) {
      const role = event?.detail?.role

      // Vendor API 401: clear Vendor auth only. Admin session stays intact.
      if (role === 'vendor' || role == null) {
        clearVendorAuth()
        setAuthError(null)
        setUser((current) => {
          if (current?.role !== 'vendor') return current
          localStorage.removeItem(STORAGE_KEY)
          return null
        })
        return
      }

      // Admin API 401: clear Admin auth only. Vendor session stays intact.
      if (role === 'admin') {
        clearAdminAuth()
        setUser((current) => {
          if (current?.role !== 'admin') return current
          localStorage.removeItem(STORAGE_KEY)
          return null
        })
        sessionStorage.removeItem(PENDING_ADMIN_KEY)
        setPendingAdmin(null)
      }
    }

    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  useEffect(() => {
    const storedUser = readStoredUser()
    const restoreAdmin = shouldRestoreAdminSession(storedUser)
    const restoreVendor = shouldRestoreVendorSession(storedUser)

    if (!restoreAdmin && !restoreVendor) {
      setIsAuthInitializing(false)
      return undefined
    }

    let cancelled = false

    async function restoreSession() {
      setIsAuthInitializing(true)
      setAuthError(null)

      try {
        if (restoreAdmin) {
          const nextUser = await adminAuthService.getCurrentUser()
          if (cancelled) return
          persistUser(nextUser)
          setUser(nextUser)
          setAuthError(null)
          return
        }

        const nextUser = await authService.getCurrentUser()
        if (cancelled) return
        persistUser(nextUser)
        setUser(nextUser)
        setAuthError(null)
      } catch (error) {
        if (cancelled) return

        // 401 is handled by apiClient → UNAUTHORIZED_EVENT.
        if (error?.isUnauthorized || error?.status === 401) {
          if (restoreAdmin) {
            clearAdminSessionState()
            setPendingAdmin(null)
            setUser((current) => (current?.role === 'admin' ? null : current))
          } else {
            clearVendorSessionState()
            setUser((current) => (current?.role === 'vendor' ? null : current))
          }
          setAuthError(null)
          return
        }

        // Network / server errors: keep token + stored user; expose recoverable error.
        setAuthError(error)
      } finally {
        if (!cancelled) setIsAuthInitializing(false)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const refreshAdminSession = useCallback(async () => {
    if (!isAdminRealApiFeature('auth') || !getAccessToken('admin')) {
      return null
    }
    const nextUser = await adminAuthService.getCurrentUser()
    persistUser(nextUser)
    setUser(nextUser)
    setAuthError(null)
    return nextUser
  }, [])

  const refreshVendorSession = useCallback(async () => {
    if (apiConfig.vendorUseMockApi || !getAccessToken('vendor')) {
      return null
    }
    const nextUser = await authService.getCurrentUser()
    persistUser(nextUser)
    setUser(nextUser)
    setAuthError(null)
    return nextUser
  }, [])

  const value = useMemo(
    () => ({
      user,
      pendingAdmin,
      isAuthInitializing,
      authError,
      refreshAdminSession,
      refreshVendorSession,
      async login(email, password) {
        const trimmedEmail = String(email ?? '').trim()
        const normalizedEmail = trimmedEmail.toLowerCase()

        // Vendor demo login — only while Vendor mock mode is on.
        if (apiConfig.vendorUseMockApi) {
          const vendorDemo = demoAccounts.vendor
          if (normalizedEmail === vendorDemo.email && password === vendorDemo.password) {
            const next = {
              email: vendorDemo.email,
              name: vendorDemo.name,
              role: 'vendor',
            }
            persistUser(next)
            setAccessToken(null, 'vendor')
            setAuthError(null)
            setUser(next)
            return next
          }
          return null
        }

        // Real Vendor login via confirmed API. Does not clear or modify Admin auth.
        const session = await authService.login({
          email: trimmedEmail,
          password,
        })
        authService.persistSession(session)
        persistUser(session.user)
        setAuthError(null)
        setUser(session.user)
        return session.user
      },
      async loginAdmin(email, password, options = {}) {
        const trimmedEmail = String(email ?? '').trim()
        const normalizedEmail = trimmedEmail.toLowerCase()

        // Admin real login (feature-scoped).
        if (isAdminRealApiFeature('auth')) {
          const session = await adminAuthService.login({
            email: trimmedEmail,
            password,
          })

          if (session.requires2fa) {
            const pending = {
              ...(session.user || {
                email: trimmedEmail,
                name: 'Admin',
              }),
              role: 'admin',
              tempToken: session.tempToken || null,
              trustDevice: Boolean(options.trustDevice),
            }
            sessionStorage.setItem(PENDING_ADMIN_KEY, JSON.stringify(pending))
            setPendingAdmin(pending)
            return { ...pending, requiresTwoFactor: true }
          }

          clearVendorAuth()
          adminAuthService.persistSession(session)
          persistUser(session.user)
          setAuthError(null)
          setUser(session.user)
          return session.user
        }

        // Admin demo login — only while Admin auth feature is not on real API.
        if (
          normalizedEmail === demoAccounts.admin.email
          && password === demoAccounts.admin.password
        ) {
          const next = {
            email: demoAccounts.admin.email,
            name: demoAccounts.admin.name,
            role: 'admin',
          }
          clearVendorAuth()
          persistUser(next)
          setAccessToken(null, 'admin')
          setAuthError(null)
          setUser(next)
          return next
        }

        return null
      },
      async verifyAdmin(code, options = {}) {
        if (!pendingAdmin) {
          throw new ApiError({ message: 'No pending admin verification session.' })
        }

        const trimmedCode = String(code ?? '').trim()
        if (!trimmedCode) {
          throw new ApiError({ message: 'Enter the verification code.' })
        }

        // Real Admin 2FA when auth feature is on and login returned a tempToken.
        if (isAdminRealApiFeature('auth') && pendingAdmin.tempToken) {
          const session = await adminAuthService.verify2fa({
            tempToken: pendingAdmin.tempToken,
            code: trimmedCode,
            trustDevice: options.trustDevice != null
              ? Boolean(options.trustDevice)
              : Boolean(pendingAdmin.trustDevice),
          })

          clearVendorAuth()
          adminAuthService.persistSession(session)
          persistUser(session.user)
          sessionStorage.removeItem(PENDING_ADMIN_KEY)
          setPendingAdmin(null)
          setAuthError(null)
          setUser(session.user)
          return session.user
        }

        throw new ApiError({
          message: 'Two-factor verification is not available for this session.',
        })
      },
      cancelAdminLogin() {
        sessionStorage.removeItem(PENDING_ADMIN_KEY)
        setPendingAdmin(null)
      },
      async logout() {
        const currentRole = user?.role

        // Vendor Sign out — call confirmed Logout API in real mode, then always
        // clear Vendor session locally. Does not clear Admin auth/storage.
        if (currentRole === 'vendor') {
          if (!apiConfig.vendorUseMockApi && getAccessToken('vendor')) {
            try {
              await authService.logout()
            } catch {
              // Sign out must always complete locally even if the API fails.
            }
          }

          clearVendorAuth()
          localStorage.removeItem(STORAGE_KEY)
          setAuthError(null)
          setUser(null)
          return
        }

        // Admin Sign out — call confirmed Logout API when auth feature is on,
        // then always clear Admin session locally. Does not clear Vendor auth.
        if (currentRole === 'admin') {
          if (isAdminRealApiFeature('auth') && getAccessToken('admin')) {
            try {
              await adminAuthService.logout()
            } catch {
              // Sign out must always complete locally even if the API fails.
            }
          }

          clearAdminAuth()
          localStorage.removeItem(STORAGE_KEY)
          sessionStorage.removeItem(PENDING_ADMIN_KEY)
          setPendingAdmin(null)
          setAuthError(null)
          setUser(null)
          return
        }

        // Fallback — clear shared session only.
        clearAdminAuth()
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(PENDING_ADMIN_KEY)
        setPendingAdmin(null)
        setAuthError(null)
        setUser(null)
      },
    }),
    [authError, isAuthInitializing, pendingAdmin, refreshAdminSession, refreshVendorSession, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
