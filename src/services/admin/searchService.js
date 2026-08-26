import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminSearchNotificationsResponse,
  mapAdminSearchNotificationsUnreadCount,
  mapAdminSearchResponse,
} from '../../mappers/admin/mapAdminSearch'

/**
 * Admin global search + header notifications.
 * Confirmed:
 * - GET /admin/search?q=&limit=
 * - GET /admin/search/notifications?filter=all|unread
 * - GET /admin/search/notifications/unread-count
 * - PATCH /admin/search/notifications/:kind/:id/read
 * - POST /admin/search/notifications/mark-all-read
 */
export const adminSearchService = {
  /**
   * @param {{ q: string, limit?: number, signal?: AbortSignal }} options
   */
  async search(options = {}) {
    const q = String(options.q || '').trim()
    const { limit = 8, signal, ...requestOptions } = options

    const response = await apiClient.get(endpoints.admin.search.global, {
      ...requestOptions,
      signal,
      params: { q, limit },
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminSearchResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * @param {{ filter?: 'all'|'unread', signal?: AbortSignal }} [options]
   */
  async listNotifications(options = {}) {
    const { filter = 'all', signal, ...requestOptions } = options
    const response = await apiClient.get(endpoints.admin.search.notifications, {
      ...requestOptions,
      signal,
      params: { filter },
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminSearchNotificationsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  async getUnreadCount(options = {}) {
    const response = await apiClient.get(endpoints.admin.search.notificationsUnreadCount, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminSearchNotificationsUnreadCount(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * @param {{ kind: 'incident'|'vendor_flag', id: string, signal?: AbortSignal }} options
   */
  async markNotificationRead(options = {}) {
    const { kind: rawKind, id: rawId, signal, ...requestOptions } = options
    const kind = rawKind === 'vendor_flag' ? 'vendor_flag' : 'incident'
    const id = String(rawId || '').trim()
    if (!id) throw new Error('Notification id is required.')

    const response = await apiClient.patch(endpoints.admin.search.notificationRead(kind, id), null, {
      ...requestOptions,
      signal,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: response?.data ?? { id, kind, isRead: true },
      meta: response?.meta ?? null,
    }
  },

  async markAllNotificationsRead(options = {}) {
    const response = await apiClient.post(endpoints.admin.search.notificationsMarkAllRead, null, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: response?.data ?? { updated: 0 },
      meta: response?.meta ?? null,
    }
  },
}
