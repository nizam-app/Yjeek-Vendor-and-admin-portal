import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { mapAdminOrderDetailResponse } from '../../mappers/admin/mapAdminOrderDetail'
import {
  emptyAdminOrderActionOptions,
  mapAdminOrderActionOptionsResponse,
} from '../../mappers/admin/mapAdminOrderActionOptions'
import {
  emptyAdminNearbyChamps,
  mapAdminNearbyChampsResponse,
} from '../../mappers/admin/mapAdminNearbyChamps'
import {
  emptyAdminDispatchAttempts,
  mapAdminDispatchAttemptsResponse,
} from '../../mappers/admin/mapAdminDispatchAttempts'
import { ApiError } from '../../api/errors'

/**
 * Admin order detail + take-action service.
 *
 * Confirmed:
 * - GET /admin/orders/:orderId
 * - GET /admin/orders/action-options
 * - GET /admin/orders/:orderId/nearby-champs
 * - GET /admin/orders/:orderId/dispatch-attempts
 * - POST action paths (bodies from Postman samples)
 */
export const adminOrderService = {
  /**
   * GET /admin/orders/:orderId
   * @param {string} orderId
   * @param {{ signal?: AbortSignal, params?: object }} [options]
   */
  async getOrder(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Order id is required.' })
    }

    const { params, ...requestOptions } = options

    if (!isAdminRealApiFeature('dashboard')) {
      throw new ApiError({
        message: 'Admin order detail requires the dashboard real-API feature.',
      })
    }

    const response = await apiClient.get(endpoints.admin.orders.detail(id), {
      ...requestOptions,
      params,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminOrderDetailResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /admin/orders/action-options
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getActionOptions(options = {}) {
    if (!isAdminRealApiFeature('dashboard')) {
      return { data: emptyAdminOrderActionOptions(), meta: null }
    }

    const response = await apiClient.get(endpoints.admin.orders.actionOptions, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminOrderActionOptionsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /admin/orders/:orderId/nearby-champs
   * Used by Reassign champ picker.
   * @param {string} orderId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getNearbyChamps(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Order id is required.' })
    }

    if (!isAdminRealApiFeature('dashboard')) {
      return { data: emptyAdminNearbyChamps(), meta: null }
    }

    const response = await apiClient.get(endpoints.admin.orders.nearbyChamps(id), {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminNearbyChampsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /admin/orders/:orderId/dispatch-attempts
   * Confirmed empty: { success: true, data: [] }
   * @param {string} orderId
   * @param {{ signal?: AbortSignal }} [options]
   */
  async listDispatchAttempts(orderId, options = {}) {
    const id = String(orderId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Order id is required.' })
    }

    if (!isAdminRealApiFeature('dashboard')) {
      return { data: emptyAdminDispatchAttempts(), meta: null }
    }

    const response = await apiClient.get(endpoints.admin.orders.dispatchAttempts(id), {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminDispatchAttemptsResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /** POST /admin/orders/:orderId/redispatch */
  async redispatch(orderId, body, options = {}) {
    return apiClient.post(endpoints.admin.orders.redispatch(orderId), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },

  /** POST /admin/orders/:orderId/refund */
  async refund(orderId, body, options = {}) {
    return apiClient.post(endpoints.admin.orders.refund(orderId), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },

  /** POST /admin/orders/:orderId/reassign-champ */
  async reassignChamp(orderId, body, options = {}) {
    return apiClient.post(endpoints.admin.orders.reassignChamp(orderId), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },

  /** POST /admin/orders/:orderId/flag-vendor */
  async flagVendor(orderId, body, options = {}) {
    return apiClient.post(endpoints.admin.orders.flagVendor(orderId), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },

  /** POST /admin/orders/:orderId/cancel */
  async cancel(orderId, body, options = {}) {
    return apiClient.post(endpoints.admin.orders.cancel(orderId), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },

  /** POST /admin/orders/:orderId/suspend-champ */
  async suspendChamp(orderId, body, options = {}) {
    return apiClient.post(endpoints.admin.orders.suspendChamp(orderId), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },

  /**
   * POST /admin/incidents/:incidentId/resolve
   * Used by MARK_RESOLVED from the order Take-action menu.
   */
  async resolveIncident(incidentId, body, options = {}) {
    const id = String(incidentId || '').trim()
    if (!id) {
      throw new ApiError({ message: 'Incident id is required.' })
    }
    return apiClient.post(endpoints.admin.incidents.resolve(id), body, {
      ...options,
      scope: 'admin',
      feature: 'dashboard',
    })
  },
}
