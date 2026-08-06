import { apiClient } from '../../api/client'
import { isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import { mapAdminDashboardOverviewResponse, attachOverviewBucketOrderPreviews } from '../../mappers/admin/mapAdminDashboardOverview'
import { mapAdminDashboardMapResponse } from '../../mappers/admin/mapAdminDashboardMap'
import { mapAdminLiveOrdersResponse } from '../../mappers/admin/mapAdminLiveOrders'
import { mapAdminScheduledBoardResponse } from '../../mappers/admin/mapAdminScheduledBoard'
import { mapAdminScheduledCalendarResponse } from '../../mappers/admin/mapAdminScheduledCalendar'
import { mapAdminPickupBoardResponse } from '../../mappers/admin/mapAdminPickupBoard'
import { mapAdminDineInBoardResponse } from '../../mappers/admin/mapAdminDineInBoard'
import { mapAdminServicesBoardResponse } from '../../mappers/admin/mapAdminServicesBoard'
import { mapAdminChatsResponse } from '../../mappers/admin/mapAdminChats'
import { adminIncidentService } from './incidentService'

/**
 * Mode boards (pickup / dine_in / services): fetch each risk bucket so
 * On Track is not starved when Critical fills a single limit.
 */
async function fetchModeBoardByBuckets(path, mapResponse, options = {}) {
  const {
    limit = 5,
    region,
    params,
    ...requestOptions
  } = options

  const sharedParams = {
    limit,
    ...(region ? { region } : {}),
    ...(params || {}),
  }

  // If caller already pinned a bucket (full-view filter), do one request.
  if (sharedParams.bucket && sharedParams.bucket !== 'all') {
    const response = await apiClient.get(path, {
      ...requestOptions,
      params: sharedParams,
      scope: 'admin',
      feature: 'dashboard',
    })
    return {
      data: mapResponse(response?.data),
      meta: response?.meta ?? null,
    }
  }

  const [criticalRes, atRiskRes, onTrackRes] = await Promise.all([
    apiClient.get(path, {
      ...requestOptions,
      params: { ...sharedParams, bucket: 'critical' },
      scope: 'admin',
      feature: 'dashboard',
    }),
    apiClient.get(path, {
      ...requestOptions,
      params: { ...sharedParams, bucket: 'at_risk' },
      scope: 'admin',
      feature: 'dashboard',
    }),
    apiClient.get(path, {
      ...requestOptions,
      params: { ...sharedParams, bucket: 'on_track' },
      scope: 'admin',
      feature: 'dashboard',
    }),
  ])

  const counts =
    criticalRes?.data?.counts ||
    atRiskRes?.data?.counts ||
    onTrackRes?.data?.counts ||
    {}

  const items = [
    ...(Array.isArray(criticalRes?.data?.items) ? criticalRes.data.items : []),
    ...(Array.isArray(atRiskRes?.data?.items) ? atRiskRes.data.items : []),
    ...(Array.isArray(onTrackRes?.data?.items) ? onTrackRes.data.items : []),
  ]

  return {
    data: mapResponse({
      ...(criticalRes?.data && typeof criticalRes.data === 'object' ? criticalRes.data : {}),
      counts,
      bucket: 'all',
      items,
    }),
    meta: criticalRes?.meta ?? atRiskRes?.meta ?? onTrackRes?.meta ?? null,
  }
}

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
   * Board (`bucket=all`) fetches each risk column separately so Critical cannot
   * fill `limit` and leave At Risk / On Track empty while counts still show.
   * @param {{ bucket?: string, sort?: string, limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getLiveOrders(options = {}) {
    const {
      bucket = 'all',
      sort = 'time_left',
      limit = 50,
      region,
      q,
      vendorId,
      orderType,
      fulfillmentType,
      driverId,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const sharedParams = {
        sort,
        limit,
        ...(region ? { region } : {}),
        ...(q ? { q: String(q).trim() } : {}),
        ...(vendorId ? { vendorId: String(vendorId) } : {}),
        ...(orderType ? { orderType: String(orderType) } : {}),
        ...(fulfillmentType ? { fulfillmentType: String(fulfillmentType) } : {}),
        ...(driverId ? { driverId: String(driverId) } : {}),
        ...(params || {}),
      }

      if (bucket === 'all') {
        const [criticalRes, atRiskRes, onTrackRes] = await Promise.all([
          apiClient.get(endpoints.admin.dashboard.orders, {
            ...requestOptions,
            params: { ...sharedParams, bucket: 'critical' },
            scope: 'admin',
            feature: 'dashboard',
          }),
          apiClient.get(endpoints.admin.dashboard.orders, {
            ...requestOptions,
            params: { ...sharedParams, bucket: 'at_risk' },
            scope: 'admin',
            feature: 'dashboard',
          }),
          apiClient.get(endpoints.admin.dashboard.orders, {
            ...requestOptions,
            params: { ...sharedParams, bucket: 'on_track' },
            scope: 'admin',
            feature: 'dashboard',
          }),
        ])

        const counts =
          criticalRes?.data?.counts ||
          atRiskRes?.data?.counts ||
          onTrackRes?.data?.counts ||
          {}

        const items = [
          ...(Array.isArray(criticalRes?.data?.items) ? criticalRes.data.items : []),
          ...(Array.isArray(atRiskRes?.data?.items) ? atRiskRes.data.items : []),
          ...(Array.isArray(onTrackRes?.data?.items) ? onTrackRes.data.items : []),
        ]

        return {
          data: mapAdminLiveOrdersResponse({
            counts,
            bucket: 'all',
            sort,
            items,
          }),
          meta: criticalRes?.meta ?? atRiskRes?.meta ?? onTrackRes?.meta ?? null,
        }
      }

      const response = await apiClient.get(endpoints.admin.dashboard.orders, {
        ...requestOptions,
        params: {
          ...sharedParams,
          bucket,
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
   * GET /admin/dashboard/boards/scheduled/calendar?weekStart=&governorate=&city=&block=&type=&q=&sort=&limit=
   * Location cascade is applied client-side; pass filters when narrowing a single value.
   * @param {{
   *   weekStart?: string,
   *   governorate?: string,
   *   city?: string,
   *   block?: string,
   *   type?: string,
   *   vendorId?: string,
   *   driverId?: string,
   *   q?: string,
   *   sort?: string,
   *   limit?: number,
   *   region?: string,
   *   params?: object,
   *   signal?: AbortSignal,
   * }} [options]
   */
  async getScheduledCalendar(options = {}) {
    const {
      weekStart,
      governorate = 'all',
      city,
      block,
      type = 'all',
      vendorId,
      driverId,
      q,
      sort = 'window_asc',
      limit = 100,
      region,
      params,
      ...requestOptions
    } = options

    if (isAdminRealApiFeature('dashboard')) {
      const response = await apiClient.get(endpoints.admin.dashboard.boards.scheduledCalendar, {
        ...requestOptions,
        params: {
          weekStart,
          governorate,
          city,
          block,
          type,
          vendorId,
          driverId,
          q,
          sort,
          limit,
          ...(region ? { region } : {}),
          ...(params || {}),
        },
        scope: 'admin',
        feature: 'dashboard',
      })

      return {
        data: mapAdminScheduledCalendarResponse(response?.data),
        meta: response?.meta ?? null,
      }
    }

    return {
      data: mapAdminScheduledCalendarResponse({
        view: 'calendar',
        title: 'Orders × available delivery days',
        days: [],
        governorateCounts: [],
        filters: {},
        counts: { orders: 0, allMatched: 0, scheduledToday: 0 },
        items: [],
      }),
      meta: null,
    }
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
    const { params, ...rest } = options

    if (isAdminRealApiFeature('dashboard')) {
      return fetchModeBoardByBuckets(
        endpoints.admin.dashboard.boards.pickup,
        mapAdminPickupBoardResponse,
        { ...rest, params },
      )
    }

    return apiClient.get('/admin/pickup', {
      ...rest,
      params,
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/boards/dine_in?limit=
   * @param {{ limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getDineInBoard(options = {}) {
    const { params, ...rest } = options

    if (isAdminRealApiFeature('dashboard')) {
      return fetchModeBoardByBuckets(
        endpoints.admin.dashboard.boards.dineIn,
        mapAdminDineInBoardResponse,
        { ...rest, params },
      )
    }

    return apiClient.get('/admin/dine-in', {
      ...rest,
      params,
      scope: 'admin',
    })
  },

  /**
   * GET /admin/dashboard/boards/services?limit=
   * @param {{ limit?: number, region?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getServicesBoard(options = {}) {
    const { params, ...rest } = options

    if (isAdminRealApiFeature('dashboard')) {
      return fetchModeBoardByBuckets(
        endpoints.admin.dashboard.boards.services,
        mapAdminServicesBoardResponse,
        { ...rest, params },
      )
    }

    return apiClient.get('/admin/services', {
      ...rest,
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
