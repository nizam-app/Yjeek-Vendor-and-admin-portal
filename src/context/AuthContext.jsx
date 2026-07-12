import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('yjeek_vendor_auth')
    return saved ? JSON.parse(saved) : null
  })

  const value = useMemo(
    () => ({
      user,
      login(email) {
        const next = { email, name: 'Green Kitchen Admin' }
        localStorage.setItem('yjeek_vendor_auth', JSON.stringify(next))
        setUser(next)
      },
      logout() {
        localStorage.removeItem('yjeek_vendor_auth')
        setUser(null)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
