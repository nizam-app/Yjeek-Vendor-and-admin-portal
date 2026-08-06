import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { mapVendorDashboardResponse } from '../../mappers/vendor/mapVendorDashboard'
import { resolveVendorDashboardRange } from '../../mappers/vendor/vendorDashboardRange'

/**
 * Vendor dashboard service.
 * Confirmed: GET /vendor-panel/dashboard?branchId=&from=&to=
 */
export const dashboardService = {
  /**
   * @param {{ branchId?: string|null, rangeLabel?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getDashboard(options = {}) {
    const { branchId, rangeLabel = 'Day', params, ...requestOptions } = options
    const range = resolveVendorDashboardRange(rangeLabel)
    const query = {
      from: range.from,
      to: range.to,
      ...(params || {}),
    }

    if (branchId) {
      query.branchId = branchId
    }

    const response = await apiClient.get(endpoints.vendor.dashboard, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorDashboardResponse(response?.data, {
        rangeLabel,
        chartSubtitle: range.chartSubtitle,
      }),
      meta: response?.meta ?? null,
    }
  },
}
