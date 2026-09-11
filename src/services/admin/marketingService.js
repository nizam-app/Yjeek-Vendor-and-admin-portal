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
  mapAdminMarketingNotifyMetaResponse,
  mapAdminEstimateVendorNotificationRequest,
  mapAdminEstimateNotificationResponse,
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
 *   POST /admin/marketing/notifications/:notificationId/resend
 *   DELETE /admin/marketing/notifications/:notificationId
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
   * Resend an existing notification (same audience / channels / message).
   * Confirmed: POST /admin/marketing/notifications/:notificationId/resend
   * Creates a new campaign row and returns it.
   *
   * @param {string} notificationId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async resendNotification(notificationId, options = {}) {
    const id = String(notificationId || '').trim()
    if (!id) {
      throw new Error('Notification id is required.')
    }

    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to resend a notification.')
    }

    const response = await apiClient.post(
      endpoints.admin.marketing.notifications.resend(id),
      {},
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )

    return {
      data: response?.data ?? null,
      meta: response?.meta ?? null,
    }
  },

  /**
   * Delete or cancel a notification.
   * Confirmed: DELETE /admin/marketing/notifications/:notificationId
   *
   * @param {string} notificationId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async deleteNotification(notificationId, options = {}) {
    const id = String(notificationId || '').trim()
    if (!id) {
      throw new Error('Notification id is required.')
    }

    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to delete a notification.')
    }

    const response = await apiClient.delete(
      endpoints.admin.marketing.notifications.remove(id),
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )

    return {
      data: response?.data ?? null,
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
   * GET /admin/marketing/promo-codes/:id
   */
  async getPromoCode(promoCodeId, options = {}) {
    const id = String(promoCodeId || '').trim()
    if (!id) return { data: null, meta: null }
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to load a promo code.')
    }
    const response = await apiClient.get(endpoints.admin.marketing.promoCodes.detail(id), {
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
   * PATCH /admin/marketing/promo-codes/:id
   */
  async updatePromoCode(promoCodeId, form = {}, options = {}) {
    const id = String(promoCodeId || '').trim()
    if (!id) throw new Error('Promo code id is required.')
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to update a promo code.')
    }
    const body = mapAdminCreatePromoCodeRequest(form)
    const response = await apiClient.patch(endpoints.admin.marketing.promoCodes.update(id), body, {
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
   * Body: { target, audience, vendorIds?, categoryId?, vendorStatus?, type, title, body, push, email, sms, schedule }
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
   * Marketing notify form meta (vendor categories / statuses, customer segments).
   * Confirmed: GET /admin/marketing/notifications/meta
   *
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getNotifyMeta(options = {}) {
    if (!useRealMarketingApi()) {
      return {
        data: {
          categories: [],
          statuses: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' },
          ],
        },
        meta: null,
      }
    }

    const response = await apiClient.get(endpoints.admin.marketing.notifications.meta, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })

    return {
      data: mapAdminMarketingNotifyMetaResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Estimate vendor notification audience size.
   * Confirmed: POST /admin/marketing/notifications/estimate
   *
   * @param {object} form
   * @param {{ signal?: AbortSignal }} [options]
   */
  async estimateVendorNotification(form = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { estimatedRecipients: 0 }, meta: null }
    }

    const body = mapAdminEstimateVendorNotificationRequest(form)
    const response = await apiClient.post(endpoints.admin.marketing.notifications.estimate, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })

    return {
      data: mapAdminEstimateNotificationResponse(response?.data),
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

  async listPromoCategories(options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.promoCategories.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: !apiConfig.adminUseMockApi,
    })
    return {
      data: response?.data ?? { count: 0, items: [] },
      meta: response?.meta ?? null,
    }
  },

  async createPromoCategory(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.promoCategories.create, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updatePromoCategory(id, body, options = {}) {
    const response = await apiClient.patch(
      endpoints.admin.marketing.promoCategories.update(id),
      body,
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async retirePromoCategory(id, options = {}) {
    const response = await apiClient.post(
      endpoints.admin.marketing.promoCategories.retire(id),
      {},
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async restorePromoCategory(id, options = {}) {
    const response = await apiClient.post(
      endpoints.admin.marketing.promoCategories.restore(id),
      {},
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async listGeofenceCampaigns(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }
    const { status = 'all', limit = 20, page, search, vendorId, params, ...requestOptions } =
      options
    const response = await apiClient.get(endpoints.admin.marketing.geofenceCampaigns.list, {
      ...requestOptions,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params: {
        status,
        limit,
        ...(page != null ? { page } : {}),
        ...(search ? { search } : {}),
        ...(vendorId ? { vendorId } : {}),
        ...(params || {}),
      },
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getGeofenceCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    if (!useRealMarketingApi()) return { data: null, meta: null }
    const response = await apiClient.get(endpoints.admin.marketing.geofenceCampaigns.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createGeofenceCampaign(form, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to create a geofence campaign.')
    }
    const response = await apiClient.post(
      endpoints.admin.marketing.geofenceCampaigns.create,
      form,
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateGeofenceCampaign(campaignId, form, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to update a geofence campaign.')
    }
    const response = await apiClient.patch(
      endpoints.admin.marketing.geofenceCampaigns.update(id),
      form,
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async deleteGeofenceCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to delete a geofence campaign.')
    }
    const response = await apiClient.delete(
      endpoints.admin.marketing.geofenceCampaigns.remove(id),
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },
}
