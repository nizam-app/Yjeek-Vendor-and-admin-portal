import { apiClient } from '../../api/client'
import { apiConfig, isAdminRealApiFeature } from '../../api/config'
import { endpoints } from '../../api/endpoints'
import {
  mapAdminOrdersReportQuery,
  mapAdminOrdersReportResponse,
} from '../../mappers/admin/mapAdminOrdersReport'

function useRealReportsApi() {
  return isAdminRealApiFeature('reports') || !apiConfig.adminUseMockApi
}

/**
 * Admin Reports — Orders.
 *
 * Confirmed:
 *   GET /admin/reports/orders?preset=&page=&limit=&sort=&search=&status=&sla=
 *   GET /admin/reports/orders/export?preset=&limit=
 *
 * Feature flag: `reports` (also on when VITE_ADMIN_USE_MOCK_API=false)
 */
export const adminReportService = {
  /**
   * Orders report KPIs + paginated rows.
   *
   * @param {Record<string, unknown>} [filters]
   * @param {{ signal?: AbortSignal }} [options]
   */
  async getOrdersReport(filters = {}, options = {}) {
    if (!useRealReportsApi()) {
      throw new Error('Real reports API is required. Enable VITE_ADMIN_REAL_API_FEATURES=reports.')
    }

    const params = mapAdminOrdersReportQuery(filters)
    const response = await apiClient.get(endpoints.admin.reports.orders, {
      ...options,
      scope: 'admin',
      feature: 'reports',
      forceReal: !apiConfig.adminUseMockApi,
      params,
    })

    return {
      data: mapAdminOrdersReportResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /**
   * Export orders report CSV.
   * Confirmed: GET /admin/reports/orders/export
   *
   * @param {Record<string, unknown>} [filters]
   * @param {{ signal?: AbortSignal }} [options]
   */
  async exportOrdersReport(filters = {}, options = {}) {
    if (!useRealReportsApi()) {
      throw new Error('Real reports API is required to export.')
    }

    const params = mapAdminOrdersReportQuery({
      ...filters,
      // Export uses limit cap from Postman sample when page omitted.
      page: undefined,
      limit: filters.limit || 100,
    })

    const response = await apiClient.get(endpoints.admin.reports.ordersExport, {
      ...options,
      scope: 'admin',
      feature: 'reports',
      forceReal: !apiConfig.adminUseMockApi,
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
}
