import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminMarketingNotificationDetail,
  mapAdminMarketingNotificationsPage,
  mapAdminSendCustomerNotificationRequest,
  mapAdminCustomerNotificationHistoryRow,
  mapAdminSendVendorNotificationRequest,
  mapAdminVendorNotificationHistoryRow,
} from '../../mappers/admin/mapAdminMarketingNotifications'
import { mapAdminMarketingPromoCodesPage, mapAdminCreatePromoCodeRequest } from '../../mappers/admin/mapAdminMarketingPromoCodes'

function useRealMarketingApi() {
  return isAdminRealApiFeature('marketing') || !apiConfig.adminUseMockApi
}

/**
 * Admin Marketing — Notifications & Promo codes.
 *
 * Confirmed:
 *   GET /admin/marketing/notifications?target=all&status=all&limit=20
 *   GET /admin/marketing/notifications/:notificationId
 *   GET /admin/marketing/promo-codes?status=all&limit=20
 *
 * Feature flag: `marketing` (also on when VITE_ADMIN_USE_MOCK_API=false)
 */
export const adminMarketingService = {
  /**
   * Notifications tab list.
   *
   * @param {{ target?: string, status?: string, limit?: number, page?: number, signal?: AbortSignal }} [options]
   */
  async listNotifications(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }

    const {
      target = 'all',
      status = 'all',
      limit = 20,
      page,
      params,
      ...requestOptions
    } = options

    const response = await apiClient.get(endpoints.admin.marketing.notifications.list, {
      ...requestOptions,
      scope: 'admin',
      feature: 'marketing',
      forceReal: !apiConfig.adminUseMockApi,
      params: {
        target,
        status,
        limit,
        ...(page != null ? { page } : {}),
        ...(params || {}),
      },
    })

    return {
      data: mapAdminMarketingNotificationsPage(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Notification detail.
   *
   * @param {string} notificationId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getNotification(notificationId, options = {}) {
    const id = String(notificationId || '').trim()
    if (!id) {
      throw new Error('Notification id is required.')
    }

    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.marketing.notifications.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })

    return {
      data: mapAdminMarketingNotificationDetail(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Promo codes tab list (+ embedded summary KPIs).
   *
   * @param {{ status?: string, limit?: number, page?: number, signal?: AbortSignal }} [options]
   */
  async listPromoCodes(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }

    const {
      status = 'all',
      limit = 20,
      page,
      params,
      ...requestOptions
    } = options

    const response = await apiClient.get(endpoints.admin.marketing.promoCodes.list, {
      ...requestOptions,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params: {
        status,
        limit,
        ...(page != null ? { page } : {}),
        ...(params || {}),
      },
    })

    const mapped = mapAdminMarketingPromoCodesPage(response?.data)
    if (!mapped?.promoCodes) {
      throw new Error('Promo codes response could not be mapped.')
    }

    return {
      data: mapped,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Create promo code.
   * Confirmed: POST /admin/marketing/promo-codes
   * Body: { code, description, discountType, discountValue, maxDiscountAmount?, maxUses?, isActive }
   *
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async createPromoCode(form = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to create a promo code.')
    }

    const body = mapAdminCreatePromoCodeRequest(form)

    const response = await apiClient.post(endpoints.admin.marketing.promoCodes.create, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Send customer notification.
   * Confirmed: POST /admin/marketing/notifications
   *
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async sendCustomerNotification(form = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to send a customer notification.')
    }

    const body = mapAdminSendCustomerNotificationRequest(form)

    const response = await apiClient.post(endpoints.admin.marketing.notifications.send, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Customer notification history (list filtered to customer target).
   *
   * @param {{ limit?: number, signal?: AbortSignal }} [options]
   */
  async listCustomerNotificationHistory(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { rows: [] }, meta: null }
    }

    const { limit = 20, params, ...requestOptions } = options

    const response = await apiClient.get(endpoints.admin.marketing.notifications.list, {
      ...requestOptions,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params: {
        target: 'customer',
        status: 'all',
        limit,
        ...(params || {}),
      },
    })

    const raw = Array.isArray(response?.data?.notifications)
      ? response.data.notifications
      : []

    return {
      data: {
        rows: raw.map(mapAdminCustomerNotificationHistoryRow).filter(Boolean),
      },
      meta: response?.meta ?? null,
    }
  },

  /**
   * Send vendor notification.
   * Confirmed: POST /admin/marketing/notifications
   * Body: { target, audience, vendorIds?, type, title, body, push, email, schedule }
   *
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async sendVendorNotification(form = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to send a vendor notification.')
    }

    const body = mapAdminSendVendorNotificationRequest(form)

    const response = await apiClient.post(endpoints.admin.marketing.notifications.send, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Vendor notification history (list filtered to vendor target).
   *
   * @param {{ limit?: number, signal?: AbortSignal }} [options]
   */
  async listVendorNotificationHistory(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { rows: [] }, meta: null }
    }

    const { limit = 20, params, ...requestOptions } = options

    const response = await apiClient.get(endpoints.admin.marketing.notifications.list, {
      ...requestOptions,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params: {
        target: 'vendor',
        status: 'all',
        limit,
        ...(params || {}),
      },
    })

    const raw = Array.isArray(response?.data?.notifications)
      ? response.data.notifications
      : []

    return {
      data: {
        rows: raw.map(mapAdminVendorNotificationHistoryRow).filter(Boolean),
      },
      meta: response?.meta ?? null,
    }
  },
}
