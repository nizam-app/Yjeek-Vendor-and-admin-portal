import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminShell } from '../context/AdminShellContext'

/**
 * Sidebar / in-app navigation guard (same pattern as Add vendor wizard).
 * Registers with AdminShellContext so AdminLayout intercepts nav clicks.
 */
export function useAdminFormNavigationGuard({
  isDirty,
  allowNavigationTo,
  enabled = true,
}) {
  const { registerNavigationGuard } = useAdminShell()
  const allowLeaveRef = useRef(false)
  const pendingLeaveActionRef = useRef(null)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)

  const shouldBlockNavigation = useCallback(
    (to) => {
      if (!enabled || allowLeaveRef.current || !isDirty) return false
      if (allowNavigationTo?.(to)) return false
      return true
    },
    [allowNavigationTo, enabled, isDirty],
  )

  useEffect(() => {
    if (!enabled) return undefined
    return registerNavigationGuard((to, proceed) => {
      if (shouldBlockNavigation(to)) {
        pendingLeaveActionRef.current = proceed
        setLeaveModalOpen(true)
        return
      }
      proceed()
    })
  }, [enabled, registerNavigationGuard, shouldBlockNavigation])

  useEffect(() => {
    if (!enabled || !isDirty) return undefined
    const onBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [enabled, isDirty])

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true
  }, [])

  const finishLeave = useCallback(() => {
    allowLeaveRef.current = true
    setLeaveModalOpen(false)
    const action = pendingLeaveActionRef.current
    pendingLeaveActionRef.current = null
    action?.()
  }, [])

  const requestLeave = useCallback(
    (action) => {
      if (!enabled || !isDirty) {
        action()
        return
      }
      pendingLeaveActionRef.current = action
      setLeaveModalOpen(true)
    },
    [enabled, isDirty],
  )

  const handleStayEditing = useCallback(() => {
    setLeaveModalOpen(false)
    pendingLeaveActionRef.current = null
  }, [])

  return {
    allowLeave,
    requestLeave,
    leaveModalOpen,
    handleStayEditing,
    handleLeaveWithoutSaving: finishLeave,
  }
}
