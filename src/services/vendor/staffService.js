import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { mapVendorStaffResponse } from '../../mappers/vendor/mapVendorStaff'

/**
 * Vendor staff service.
 * Confirmed: GET /vendor-panel/staff
 */
export const staffService = {
  /**
   * GET /vendor-panel/staff
   */
  async getStaff(options = {}) {
    const response = await apiClient.get(endpoints.vendor.staff, {
      ...options,
      scope: 'vendor',
    })

    const mapped = mapVendorStaffResponse(response?.data)

    return {
      data: mapped.items,
      meta: {
        ...(response?.meta || {}),
        count: mapped.count,
      },
    }
  },
}
