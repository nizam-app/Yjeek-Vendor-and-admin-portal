import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapVendorNotification,
  mapVendorNotificationsResponse,
  mapVendorUnreadCountResponse,
} from '../../mappers/vendor/mapVendorNotifications'

/** Fired when notifications change so Topbar unread badge stays in sync. */
export const VENDOR_NOTIFICATIONS_UPDATED_EVENT = 'yjeek:vendor-notifications-updated'

export function notifyVendorNotificationsUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(VENDOR_NOTIFICATIONS_UPDATED_EVENT))
}

/**
 * Vendor notifications service.
 * Confirmed: GET list, GET unread count, PATCH mark read, PATCH mark all read.
 */
export const notificationService = {
  /**
   * GET /vendor-panel/notifications
   */
  async getNotifications(options = {}) {
    const { params, ...requestOptions } = options
    const response = await apiClient.get(endpoints.vendor.notifications.list, {
      ...requestOptions,
      params,
      scope: 'vendor',
    })

    return {
      data: mapVendorNotificationsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /vendor-panel/notifications/unread-count
   */
  async getUnreadCount(options = {}) {
    const response = await apiClient.get(endpoints.vendor.notifications.unreadCount, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: { count: mapVendorUnreadCountResponse(response?.data) },
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/notifications/:notificationId/read
   * Confirmed response: full notification with isRead: true
   */
  async markRead(notificationId, options = {}) {
    const response = await apiClient.patch(
      endpoints.vendor.notifications.markRead(notificationId),
      null,
      {
        ...options,
        scope: 'vendor',
      },
    )

    notifyVendorNotificationsUpdated()

    return {
      data: mapVendorNotification(response?.data) ?? response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * PATCH /vendor-panel/notifications/read-all
   */
  async markAllRead(options = {}) {
    const response = await apiClient.patch(endpoints.vendor.notifications.markAllRead, null, {
      ...options,
      scope: 'vendor',
    })

    notifyVendorNotificationsUpdated()

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },
}
