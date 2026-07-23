import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { UNAUTHORIZED_EVENT } from '../api/client'
import { apiConfig } from '../api/config'
import {
  clearAdminAuth,
  clearVendorAuth,
  getAccessToken,
  setAuthPayload,
  setAccessToken,
} from '../api/token'
import { authService } from '../services/vendor/authService'

const AuthContext = createContext(null)
/** Shared session key — stores role-aware user: { email, name, role, ... } */
const STORAGE_KEY = 'yjeek_auth'
const PENDING_ADMIN_KEY = 'yjeek_pending_admin'
export const ADMIN_DEMO_CODE = '396827'

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
  return true
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
  const [authError, setAuthError] = useState(null)
  const [isAuthInitializing, setIsAuthInitializing] = useState(() =>
    shouldRestoreVendorSession(readStoredUser()),
  )
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

      // Future Admin API 401 path — keep Admin demo login behavior for now.
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
    if (!shouldRestoreVendorSession(storedUser)) {
      setIsAuthInitializing(false)
      return undefined
    }

    let cancelled = false

    async function restoreVendorSession() {
      setIsAuthInitializing(true)
      setAuthError(null)

      try {
        const nextUser = await authService.getCurrentUser()
        if (cancelled) return
        persistUser(nextUser)
        setUser(nextUser)
        setAuthError(null)
      } catch (error) {
        if (cancelled) return

        // 401 is handled by apiClient → UNAUTHORIZED_EVENT (clears Vendor only).
        // Ensure local session matches that outcome without touching Admin.
        if (error?.isUnauthorized || error?.status === 401) {
          clearVendorSessionState()
          setUser((current) => (current?.role === 'vendor' ? null : current))
          setAuthError(null)
          return
        }

        // Network / server errors: keep token + stored user; expose recoverable error.
        setAuthError(error)
      } finally {
        if (!cancelled) setIsAuthInitializing(false)
      }
    }

    restoreVendorSession()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      pendingAdmin,
      isAuthInitializing,
      authError,
      async login(email, password) {
        const trimmedEmail = String(email ?? '').trim()
        const normalizedEmail = trimmedEmail.toLowerCase()

        // Admin demo login — unchanged mock flow (Admin API not integrated).
        if (
          normalizedEmail === demoAccounts.admin.email &&
          password === demoAccounts.admin.password
        ) {
          const next = {
            email: demoAccounts.admin.email,
            name: demoAccounts.admin.name,
            role: 'admin',
          }
          sessionStorage.setItem(PENDING_ADMIN_KEY, JSON.stringify(next))
          setPendingAdmin(next)
          return { ...next, requiresTwoFactor: true }
        }

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
      verifyAdmin(code) {
        if (!pendingAdmin || code !== ADMIN_DEMO_CODE) return false
        clearVendorAuth()
        persistUser(pendingAdmin)
        sessionStorage.removeItem(PENDING_ADMIN_KEY)
        setUser(pendingAdmin)
        setPendingAdmin(null)
        return true
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

        // Admin (mock) Sign out — preserve existing clear-all local behavior.
        clearVendorAuth()
        clearAdminAuth()
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(PENDING_ADMIN_KEY)
        setPendingAdmin(null)
        setAuthError(null)
        setUser(null)
      },
    }),
    [authError, isAuthInitializing, pendingAdmin, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
