import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { mapVendorDashboardResponse } from '../../mappers/vendor/mapVendorDashboard'

/**
 * Vendor dashboard service.
 * Confirmed: GET /vendor-panel/dashboard?branchId=
 */
export const dashboardService = {
  /**
   * @param {{ branchId?: string|null, rangeLabel?: string, params?: object, signal?: AbortSignal }} [options]
   */
  async getDashboard(options = {}) {
    const { branchId, rangeLabel, params, ...requestOptions } = options
    const query = { ...(params || {}) }

    if (branchId) {
      query.branchId = branchId
    }

    const response = await apiClient.get(endpoints.vendor.dashboard, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })

    return {
      data: mapVendorDashboardResponse(response?.data, { rangeLabel }),
      meta: response?.meta ?? null,
    }
  },
}
