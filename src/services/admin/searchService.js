import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminSearchNotificationsResponse,
  mapAdminSearchResponse,
} from '../../mappers/admin/mapAdminSearch'

/**
 * Admin global search + header notifications.
 * Confirmed:
 * - GET /admin/search?q=&limit=
 * - GET /admin/search/notifications
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

  async listNotifications(options = {}) {
    const response = await apiClient.get(endpoints.admin.search.notifications, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminSearchNotificationsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },
}
