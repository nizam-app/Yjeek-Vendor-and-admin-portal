import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { UNAUTHORIZED_EVENT } from '../api/client'
import {
  clearAdminAuth,
  clearVendorAuth,
  setAuthPayload,
  setAccessToken,
} from '../api/token'

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser())
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

  const value = useMemo(
    () => ({
      user,
      pendingAdmin,
      login(email, password) {
        const normalizedEmail = email.trim().toLowerCase()
        const account = Object.values(demoAccounts).find(
          (item) => item.email === normalizedEmail && item.password === password,
        )
        if (!account) return null

        const next = { email: account.email, name: account.name, role: account.role }
        if (next.role === 'admin') {
          sessionStorage.setItem(PENDING_ADMIN_KEY, JSON.stringify(next))
          setPendingAdmin(next)
          return { ...next, requiresTwoFactor: true }
        }

        // Vendor demo login — clear any prior Admin tokens; real Bearer tokens
        // are stored via authService.persistSession when Vendor API auth is wired.
        clearAdminAuth()
        persistUser(next)
        setAccessToken(null, 'vendor')
        setUser(next)
        return next
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
      logout() {
        clearVendorAuth()
        clearAdminAuth()
        localStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(PENDING_ADMIN_KEY)
        setPendingAdmin(null)
        setUser(null)
      },
    }),
    [pendingAdmin, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
