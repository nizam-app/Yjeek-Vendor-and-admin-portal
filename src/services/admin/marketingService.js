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
   * Push delivery report: sent, delivered, opened, ordered within 24h, opt-outs.
   *
   * @param {string} notificationId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getNotificationReport(notificationId, options = {}) {
    const id = String(notificationId || '').trim()
    if (!id) {
      throw new Error('Notification id is required.')
    }

    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }

    const response = await apiClient.get(endpoints.admin.marketing.notifications.report(id), {
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
   * Automated trigger on/off and weekly cap.
   * @param {{ signal?: AbortSignal }} [options]
   */
  async listPushTriggers(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.pushTriggers.list, {
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
   * @param {string} trigger
   * @param {{ enabled?: boolean, maxPerWeek?: number | null }} body
   * @param {{ signal?: AbortSignal }} [options]
   */
  async updatePushTrigger(trigger, body, options = {}) {
    const id = String(trigger || '').trim()
    if (!id) throw new Error('Trigger is required.')
    const response = await apiClient.patch(
      endpoints.admin.marketing.pushTriggers.update(id),
      body,
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

  async getCashback(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.cashback.root, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateCashbackSettings(body, options = {}) {
    const response = await apiClient.patch(endpoints.admin.marketing.cashback.settings, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateCashbackBaseRate(body, options = {}) {
    const response = await apiClient.patch(endpoints.admin.marketing.cashback.baseRate, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createCashbackRule(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.cashback.rules, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateCashbackRule(ruleId, body, options = {}) {
    const id = String(ruleId || '').trim()
    if (!id) throw new Error('Rule id is required.')
    const response = await apiClient.patch(endpoints.admin.marketing.cashback.rule(id), body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async deleteCashbackRule(ruleId, options = {}) {
    const id = String(ruleId || '').trim()
    if (!id) throw new Error('Rule id is required.')
    const response = await apiClient.delete(endpoints.admin.marketing.cashback.rule(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getCashbackReport(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.cashback.report, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async exportCashbackReport(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to export.')
    }
    const response = await apiClient.get(endpoints.admin.marketing.cashback.reportExport, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    const csv =
      typeof response?.data === 'string'
        ? response.data
        : response?.data == null
          ? ''
          : String(response.data)
    return { data: csv, meta: response?.meta ?? null }
  },

  async getReferral(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.referral.root, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateReferralSettings(body, options = {}) {
    const response = await apiClient.patch(endpoints.admin.marketing.referral.settings, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateReferralValues(body, options = {}) {
    const response = await apiClient.patch(endpoints.admin.marketing.referral.values, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async listReferralInvites(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { invites: [], total: 0, page: 1, limit: 50 }, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.referral.invites, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async exportReferralInvites(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to export.')
    }
    const response = await apiClient.get(endpoints.admin.marketing.referral.invitesExport, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    const csv =
      typeof response?.data === 'string'
        ? response.data
        : response?.data == null
          ? ''
          : String(response.data)
    return { data: csv, meta: response?.meta ?? null }
  },

  async blockReferralInviter(customerId, body = {}, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) throw new Error('Customer id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.referral.blockInviter(id),
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

  async unblockReferralInviter(customerId, options = {}) {
    const id = String(customerId || '').trim()
    if (!id) throw new Error('Customer id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.referral.unblockInviter(id),
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

  async getZood(options = {}) {
    if (!useRealMarketingApi()) {
      return { data: null, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.zood.root, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateZoodSettings(body, options = {}) {
    const response = await apiClient.patch(endpoints.admin.marketing.zood.settings, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async listZoodWaitlist(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return {
        data: { items: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 1 } },
        meta: null,
      }
    }
    const response = await apiClient.get(endpoints.admin.marketing.zood.waitlist, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async exportZoodWaitlist(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to export.')
    }
    const response = await apiClient.get(endpoints.admin.marketing.zood.waitlistExport, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    const csv =
      typeof response?.data === 'string'
        ? response.data
        : response?.data == null
          ? ''
          : String(response.data)
    return { data: csv, meta: response?.meta ?? null }
  },

  async listVoucherTemplates(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { templates: [], total: 0, page: 1, limit: 50 }, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.voucherTemplates.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getVoucherTemplate(templateId, options = {}) {
    const id = String(templateId || '').trim()
    if (!id) throw new Error('Template id is required.')
    const response = await apiClient.get(endpoints.admin.marketing.voucherTemplates.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createVoucherTemplate(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.voucherTemplates.create, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateVoucherTemplate(templateId, body, options = {}) {
    const id = String(templateId || '').trim()
    if (!id) throw new Error('Template id is required.')
    const response = await apiClient.patch(
      endpoints.admin.marketing.voucherTemplates.update(id),
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

  async sendVoucherForAcceptance(templateId, body, options = {}) {
    const id = String(templateId || '').trim()
    if (!id) throw new Error('Template id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.voucherTemplates.sendForAcceptance(id),
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

  async listVoucherVendorRequests(templateId, params = {}, options = {}) {
    const id = String(templateId || '').trim()
    if (!id) throw new Error('Template id is required.')
    const response = await apiClient.get(
      endpoints.admin.marketing.voucherTemplates.vendorRequests(id),
      {
        ...options,
        scope: 'admin',
        feature: 'marketing',
        forceReal: true,
        params,
      },
    )
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async confirmVoucherVendorRequest(requestId, body = {}, options = {}) {
    const id = String(requestId || '').trim()
    if (!id) throw new Error('Request id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.voucherVendorRequests.confirm(id),
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

  async updateVoucherVendorExclusions(requestId, body, options = {}) {
    const id = String(requestId || '').trim()
    if (!id) throw new Error('Request id is required.')
    const response = await apiClient.patch(
      endpoints.admin.marketing.voucherVendorRequests.exclusions(id),
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

  async removeVoucherVendorRequest(requestId, options = {}) {
    const id = String(requestId || '').trim()
    if (!id) throw new Error('Request id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.voucherVendorRequests.remove(id),
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

  async resendVoucherVendorRequest(requestId, body, options = {}) {
    const id = String(requestId || '').trim()
    if (!id) throw new Error('Request id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.voucherVendorRequests.resend(id),
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

  async previewVoucherVendorApplicability(templateId, body, options = {}) {
    const id = String(templateId || '').trim()
    if (!id) throw new Error('Template id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.voucherTemplates.previewApplicability(id),
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

  /** M03 B6 — grant by phone or segment (Grant UI + CX limits = B10) */
  async grantVoucher(templateId, body, options = {}) {
    const id = String(templateId || '').trim()
    if (!id) throw new Error('Template id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.voucherTemplates.grant(id),
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

  /** M03 B10 — issued vouchers list */
  async listIssuedVouchers(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { vouchers: [], total: 0, page: 1, limit: 50 }, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.vouchers.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async revokeVoucher(voucherId, options = {}) {
    const id = String(voucherId || '').trim()
    if (!id) throw new Error('Voucher id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.vouchers.revoke(id),
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

  async getVoucherSettlement(params = {}, options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.vouchers.settlement, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async exportVoucherSettlement(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      throw new Error('Real marketing API is required to export.')
    }
    const response = await apiClient.get(endpoints.admin.marketing.vouchers.settlementExport, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    const csv =
      typeof response?.data === 'string'
        ? response.data
        : response?.data == null
          ? ''
          : String(response.data)
    return { data: csv, meta: response?.meta ?? null }
  },

  /** M03 B7 — Distribution rules CRUD + MANUAL run */
  async listDistributionRules(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return {
        data: {
          rules: [],
          total: 0,
          page: 1,
          limit: 50,
          deferredTriggers: [],
          wiredTriggers: [],
        },
        meta: null,
      }
    }
    const response = await apiClient.get(endpoints.admin.marketing.distributionRules.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createDistributionRule(body, options = {}) {
    const response = await apiClient.post(
      endpoints.admin.marketing.distributionRules.create,
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

  async updateDistributionRule(ruleId, body, options = {}) {
    const id = String(ruleId || '').trim()
    if (!id) throw new Error('Rule id is required.')
    const response = await apiClient.patch(
      endpoints.admin.marketing.distributionRules.update(id),
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

  async listVendorPromotions(params = {}, options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.vendorPromotions.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getVendorPromotionReport(options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.vendorPromotions.report, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getVendorPromotionSettings(options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.vendorPromotions.settings, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateVendorPromotionSettings(body, options = {}) {
    const response = await apiClient.patch(
      endpoints.admin.marketing.vendorPromotions.settings,
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

  async approveVendorPromotion(promotionId, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) throw new Error('Promotion id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.vendorPromotions.approve(id),
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

  async rejectVendorPromotion(promotionId, body, options = {}) {
    const id = String(promotionId || '').trim()
    if (!id) throw new Error('Promotion id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.vendorPromotions.reject(id),
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

  async runDistributionRule(ruleId, body = {}, options = {}) {
    const id = String(ruleId || '').trim()
    if (!id) throw new Error('Rule id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.distributionRules.run(id),
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

  async listCampaigns(params = {}, options = {}) {
    if (!useRealMarketingApi()) {
      return { data: { campaigns: [], total: 0, page: 1, limit: 50 }, meta: null }
    }
    const response = await apiClient.get(endpoints.admin.marketing.campaigns.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getCampaignOptions(options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.campaigns.options, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.get(endpoints.admin.marketing.campaigns.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async previewCampaignCost(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.campaigns.previewCost, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createCampaign(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.campaigns.create, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateCampaign(campaignId, body, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.patch(endpoints.admin.marketing.campaigns.update(id), body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async deleteCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.delete(endpoints.admin.marketing.campaigns.remove(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async activateCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.post(endpoints.admin.marketing.campaigns.activate(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async endCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.post(endpoints.admin.marketing.campaigns.end(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async submitCampaignApproval(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.post(
      endpoints.admin.marketing.campaigns.submitApproval(id),
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

  async revertCampaignDraft(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.post(endpoints.admin.marketing.campaigns.revertDraft(id), {}, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createCampaignFromSeason(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.campaigns.fromSeason, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async listSpinWheels(options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.spinWheels.list, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getSpinWheel(wheelId, options = {}) {
    const id = String(wheelId || '').trim()
    if (!id) throw new Error('Spin wheel id is required.')
    const response = await apiClient.get(endpoints.admin.marketing.spinWheels.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createSpinWheel(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.spinWheels.create, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateSpinWheel(wheelId, body, options = {}) {
    const id = String(wheelId || '').trim()
    if (!id) throw new Error('Spin wheel id is required.')
    const response = await apiClient.patch(endpoints.admin.marketing.spinWheels.update(id), body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateSpinWheelAllowance(wheelId, body, options = {}) {
    const id = String(wheelId || '').trim()
    if (!id) throw new Error('Spin wheel id is required.')
    const response = await apiClient.patch(endpoints.admin.marketing.spinWheels.allowance(id), body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async replaceSpinWheelSegments(wheelId, body, options = {}) {
    const id = String(wheelId || '').trim()
    if (!id) throw new Error('Spin wheel id is required.')
    const response = await apiClient.put(endpoints.admin.marketing.spinWheels.segments(id), body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async deleteSpinWheel(wheelId, options = {}) {
    const id = String(wheelId || '').trim()
    if (!id) throw new Error('Spin wheel id is required.')
    const response = await apiClient.delete(endpoints.admin.marketing.spinWheels.remove(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  /** OG §09 Admin › Marketing › Segments */
  async getSegments(params = {}, options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.segments.list, {
      ...options,
      params,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getSegment(id, options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.segments.detail(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async previewSegment(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.segments.preview, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async createSegment(body, options = {}) {
    const response = await apiClient.post(endpoints.admin.marketing.segments.create, body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateSegment(id, body, options = {}) {
    const response = await apiClient.patch(endpoints.admin.marketing.segments.update(id), body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async deleteSegment(id, options = {}) {
    const response = await apiClient.delete(endpoints.admin.marketing.segments.remove(id), {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async recalculateSegment(id, options = {}) {
    const response = await apiClient.post(
      endpoints.admin.marketing.segments.recalculate(id),
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

  async getSegmentCustomers(id, params = {}, options = {}) {
    const response = await apiClient.get(endpoints.admin.marketing.segments.customers(id), {
      ...options,
      params,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async getBudgetSettings(options = {}) {
    const response = await apiClient.get('/admin/marketing/budget/settings', {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async updateBudgetSettings(body, options = {}) {
    const response = await apiClient.patch('/admin/marketing/budget/settings', body, {
      ...options,
      scope: 'admin',
      feature: 'marketing',
      forceReal: true,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  async approveCampaign(campaignId, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.post(
      `/admin/marketing/campaigns/${encodeURIComponent(id)}/approve`,
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

  async rejectCampaign(campaignId, body, options = {}) {
    const id = String(campaignId || '').trim()
    if (!id) throw new Error('Campaign id is required.')
    const response = await apiClient.post(
      `/admin/marketing/campaigns/${encodeURIComponent(id)}/reject`,
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
}
