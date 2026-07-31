import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { mapAdminDashboardOverviewResponse, attachOverviewBucketOrderPreviews } from '../../mappers/admin/mapAdminDashboardOverview'
import { mapAdminDashboardMapResponse } from '../../mappers/admin/mapAdminDashboardMap'
import { mapAdminLiveOrdersResponse } from '../../mappers/admin/mapAdminLiveOrders'
import { mapAdminScheduledBoardResponse } from '../../mappers/admin/mapAdminScheduledBoard'
import { mapAdminPickupBoardResponse } from '../../mappers/admin/mapAdminPickupBoard'
import { mapAdminDineInBoardResponse } from '../../mappers/admin/mapAdminDineInBoard'
import { mapAdminServicesBoardResponse } from '../../mappers/admin/mapAdminServicesBoard'
import { mapAdminChatsResponse } from '../../mappers/admin/mapAdminChats'
import { adminIncidentService } from './incidentService'

/**
 * Admin dashboard service.
 *
 * Confirmed:
 * - GET /admin/dashboard/overview?region=
 * - GET /admin/dashboard/map?layer=&region=
 * - GET /admin/dashboard/orders?bucket=&sort=&limit=
 * - GET /admin/dashboard/boards/scheduled?sort=&limit=
 * - GET /admin/dashboard/boards/pickup?limit=
 * - GET /admin/dashboard/boards/dine_in?limit=
 * - GET /admin/dashboard/boards/services?limit=
 * - GET /admin/dashboard/chats
 *
 * Incidents Log uses GET /admin/incidents via adminIncidentService.
 *
 * Real-API responses are mapped as-is. Unconfirmed sections stay empty —
 * mock padding is never mixed in. Mock client is only used when
 * VITE_ADMIN_USE_MOCK_API=true (and the feature is not flagged real).
 */
export const adminDashboardService = {
  /**
   * @param {{ region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getDashboard(options = {}) {
    const { region = 'BH', params, ...requestOptions } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.overview, {
        ...requestOptions,
        params: { region, ...(params || {}) },
        scope: 'admin',
        feature: 'dashboard',
      })

      let data = mapAdminDashboardOverviewResponse(response?.data)

      // Full Overview bucket cards — recent 2 per column from live-orders API
      // (same path as Live Orders board). Empty items[] stays empty.
      // Use allSettled so one bucket failing does not wipe the other previews.
      // Do not pass `region` here — Postman live-orders query is bucket/sort/limit only;
      // overview already scoped by region.
      const settled = await Promise.allSettled([
        this.getLiveOrders({
          bucket: 'critical',
          sort: 'time_left',
          limit: 2,
          ...requestOptions,
        }),
        this.getLiveOrders({
          bucket: 'at_risk',
          sort: 'time_left',
          limit: 2,
          ...requestOptions,
        }),
        this.getLiveOrders({
          bucket: 'on_track',
          sort: 'time_left',
          limit: 2,
          ...requestOptions,
        }),
      ])

      const [criticalResult, atRiskResult, onTrackResult] = settled
      data = attachOverviewBucketOrderPreviews(
        data,
        {
          critical: criticalResult.status === 'fulfilled' ? criticalResult.value?.data : null,
          at_risk: atRiskResult.status === 'fulfilled' ? atRiskResult.value?.data : null,
          on_track: onTrackResult.status === 'fulfilled' ? onTrackResult.value?.data : null,
        },
        2,
      )

      return {
        data,
        meta: response?.meta ?? null,
      }
    }

    return apiClient.get('/admin/dashboard', {
      ...requestOptions,
      params,
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/map?layer=&region=
   * @param {{ layer?: string, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getMap(options = {}) {
    const { layer = 'champs', region = 'BH', params, ...requestOptions } = options

    const response = await apiClient.get(endpoints.admin.dashboard.map, {
      ...requestOptions,
      params: { layer, region, ...(params || {}) },
      scope: 'admin',
      feature: 'dashboard',
    })

    return {
      data: mapAdminDashboardMapResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * GET /admin/dashboard/orders?bucket=&sort=&limit=
   * @param {{ bucket?: string, sort?: string, limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getLiveOrders(options = {}) {
    const {
      bucket = 'all',
      sort = 'time_left',
      limit = 50,
      region,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.orders, {
        ...requestOptions,
        params: {
          bucket,
          sort,
          limit,
          ...(region ? { region } : {}),
          ...(params || {}),
        },
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminLiveOrdersResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return apiClient.get('/admin/live-orders', {
      ...requestOptions,
      params,
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/boards/scheduled?sort=&limit=
   * @param {{ sort?: string, limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getScheduledBoard(options = {}) {
    const {
      sort = 'time_left',
      limit = 50,
      region,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.boards.scheduled, {
        ...requestOptions,
        params: {
          sort,
          limit,
          ...(region ? { region } : {}),
          ...(params || {}),
        },
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminScheduledBoardResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return apiClient.get('/admin/operations', {
      ...requestOptions,
      params: { mode: 'scheduled', ...(params || {}) },
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/boards/pickup?limit=
   * @param {{ limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getPickupBoard(options = {}) {
    const {
      limit = 50,
      region,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.boards.pickup, {
        ...requestOptions,
        params: {
          limit,
          ...(region ? { region } : {}),
          ...(params || {}),
        },
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminPickupBoardResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return apiClient.get('/admin/pickup', {
      ...requestOptions,
      params,
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/boards/dine_in?limit=
   * @param {{ limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getDineInBoard(options = {}) {
    const {
      limit = 50,
      region,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.boards.dineIn, {
        ...requestOptions,
        params: {
          limit,
          ...(region ? { region } : {}),
          ...(params || {}),
        },
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminDineInBoardResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return apiClient.get('/admin/dine-in', {
      ...requestOptions,
      params,
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/boards/services?limit=
   * @param {{ limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getServicesBoard(options = {}) {
    const {
      limit = 50,
      region,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.boards.services, {
        ...requestOptions,
        params: {
          limit,
          ...(region ? { region } : {}),
          ...(params || {}),
        },
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminServicesBoardResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return apiClient.get('/admin/services', {
      ...requestOptions,
      params,
      scope: 'admin',
    })
  },

  /**
   * @deprecated Prefer adminIncidentService.list — GET /admin/incidents
   * Kept for compatibility; forwards to the confirmed list endpoint.
   */
  async getIncidents(options = {}) {
    const { params, ...requestOptions } = options
    return adminIncidentService.list({
      ...requestOptions,
      status: params?.status ?? 'all',
      priority: params?.priority ?? 'all',
      limit: params?.limit ?? 50,
      params,
    })
  },

  /**
   * GET /admin/dashboard/chats
   * @param {{ params?: object, signal?: AbortSignal }} [options]
   */
  async getChats(options = {}) {
    const { params, ...requestOptions } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.chats, {
        ...requestOptions,
        params,
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminChatsResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return {
      data: { active: 0, items: [] },
      meta: null,
    }
  },
}
