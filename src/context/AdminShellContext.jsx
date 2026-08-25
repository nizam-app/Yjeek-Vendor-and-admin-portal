import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'admin-live-region'
const AdminShellContext = createContext(null)

function readStoredRegion() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored || 'BH'
  } catch {
    return 'BH'
  }
}

export function AdminShellProvider({ children }) {
  const [region, setRegionState] = useState(readStoredRegion)
  const [mapFocus, setMapFocus] = useState(null)
  const navigationGuardRef = useRef(null)

  const setRegion = useCallback((next) => {
    const value = String(next || 'BH')
    setRegionState(value)
    try {
      sessionStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore storage failures
    }
  }, [])

  const clearMapFocus = useCallback(() => setMapFocus(null), [])

  const registerNavigationGuard = useCallback((guard) => {
    navigationGuardRef.current = guard
    return () => {
      if (navigationGuardRef.current === guard) {
        navigationGuardRef.current = null
      }
    }
  }, [])

  const attemptNavigation = useCallback((to, proceed) => {
    const guard = navigationGuardRef.current
    if (guard) {
      guard(to, proceed)
      return
    }
    proceed()
  }, [])

  const value = useMemo(
    () => ({
      region,
      setRegion,
      mapFocus,
      setMapFocus,
      clearMapFocus,
      registerNavigationGuard,
      attemptNavigation,
    }),
    [region, setRegion, mapFocus, clearMapFocus, registerNavigationGuard, attemptNavigation],
  )

  return <AdminShellContext.Provider value={value}>{children}</AdminShellContext.Provider>
}

export function useAdminShell() {
  const ctx = useContext(AdminShellContext)
  if (!ctx) {
    throw new Error('useAdminShell must be used within AdminShellProvider')
  }
  return ctx
}
