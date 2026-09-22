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

  /**
   * Vendor cost-recovery obligations from incident refunds.
   * GET /admin/reports/vendor-cost-recovery
   */
  async getVendorCostRecovery(filters = {}, options = {}) {
    if (!useRealReportsApi()) {
      throw new Error('Real reports API is required. Enable VITE_ADMIN_REAL_API_FEATURES=reports.')
    }
    const params = {
      preset: filters.preset || '30d',
      from: filters.from || undefined,
      to: filters.to || undefined,
      limit: filters.limit || 100,
    }
    const response = await apiClient.get(endpoints.admin.reports.vendorCostRecovery, {
      ...options,
      scope: 'admin',
      feature: 'reports',
      forceReal: !apiConfig.adminUseMockApi,
      params,
    })
    return { data: response?.data ?? null, meta: response?.meta ?? null }
  },

  /**
   * Champ tip totals by driver for a date range / month.
   * GET /admin/reports/driver-tips?preset=&from=&to=&limit=
   */
  async getDriverTipsReport(filters = {}, options = {}) {
    if (!useRealReportsApi()) {
      throw new Error('Real reports API is required. Enable VITE_ADMIN_REAL_API_FEATURES=reports.')
    }
    const params = {
      preset: filters.preset || 'mtd',
      from: filters.from || undefined,
      to: filters.to || undefined,
      limit: filters.limit || 100,
    }
    const response = await apiClient.get(endpoints.admin.reports.driverTips, {
      ...options,
      scope: 'admin',
      feature: 'reports',
      forceReal: !apiConfig.adminUseMockApi,
      params,
    })
    return { data: mapDriverTipsReportResponse(response?.data), meta: response?.meta ?? null }
  },

  /**
   * Export champ tips CSV.
   * GET /admin/reports/driver-tips/export
   */
  async exportDriverTipsReport(filters = {}, options = {}) {
    if (!useRealReportsApi()) {
      throw new Error('Real reports API is required to export.')
    }
    const params = {
      preset: filters.preset || 'mtd',
      from: filters.from || undefined,
      to: filters.to || undefined,
      limit: filters.limit || 100,
    }
    const response = await apiClient.get(endpoints.admin.reports.driverTipsExport, {
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

function formatTipsMoney(value) {
  if (value === null || value === undefined || value === '') return 'BHD 0.000'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return String(value)
  return `BHD ${numeric.toFixed(3)}`
}

function mapDriverTipsReportResponse(data) {
  if (!data || typeof data !== 'object') return null
  const kpis = data.kpis && typeof data.kpis === 'object' ? data.kpis : {}
  const champs = Array.isArray(data.champs) ? data.champs : []
  return {
    range: data.range ?? null,
    kpis: [
      { key: 'totalTips', label: 'Total tips', value: formatTipsMoney(kpis.totalTips ?? 0) },
      { key: 'tippedOrders', label: 'Tipped orders', value: String(kpis.tippedOrders ?? 0) },
      { key: 'champsWithTips', label: 'Champs tipped', value: String(kpis.champsWithTips ?? 0) },
    ],
    rows: champs.map((row, index) => ({
      key: String(row.driverId || `${row.name}-${index}`),
      rank: row.rank ?? index + 1,
      driver: row.driverName || row.name || '—',
      displayCode: row.displayCode || '—',
      tippedOrders: row.tippedOrders ?? 0,
      totalTips: formatTipsMoney(row.totalTips ?? row.tipAmount ?? 0),
    })),
  }
}
