import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
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

        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        localStorage.removeItem('yjeek_vendor_auth')
        setUser(next)
        return next
      },
      verifyAdmin(code) {
        if (!pendingAdmin || code !== ADMIN_DEMO_CODE) return false
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingAdmin))
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
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem('yjeek_vendor_auth')
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
