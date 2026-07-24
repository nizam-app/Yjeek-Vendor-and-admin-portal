import { useEffect } from 'react'
import { useApiResource } from '../useApiResource'
import {
  notificationService,
  VENDOR_NOTIFICATIONS_UPDATED_EVENT,
} from '../../services/vendor/notificationService'

/**
 * Vendor notifications list hook.
 * Page → useVendorNotifications → notificationService → mapper → apiClient
 */
export function useVendorNotifications() {
  const resource = useApiResource(() => notificationService.getNotifications(), [])

  useEffect(() => {
    function onUpdated() {
      resource.refetch()
    }
    window.addEventListener(VENDOR_NOTIFICATIONS_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(VENDOR_NOTIFICATIONS_UPDATED_EVENT, onUpdated)
  }, [resource.refetch])

  return resource
}

/**
 * Vendor unread notification count for Topbar badge.
 */
export function useVendorUnreadNotificationCount({ pollMs = 30000 } = {}) {
  const resource = useApiResource(() => notificationService.getUnreadCount(), [])

  useEffect(() => {
    function onUpdated() {
      resource.refetch()
    }
    window.addEventListener(VENDOR_NOTIFICATIONS_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(VENDOR_NOTIFICATIONS_UPDATED_EVENT, onUpdated)
  }, [resource.refetch])

  useEffect(() => {
    if (!pollMs || pollMs < 5000) return undefined
    const id = window.setInterval(() => {
      resource.refetch()
    }, pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, resource.refetch])

  return resource
}
