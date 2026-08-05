import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'
import { mapVendorAccountResponse } from '../../mappers/vendor/mapVendorAccount'

/**
 * Vendor account / profile service.
 * Confirmed: GET /vendor-panel/account
 * Update profile / business / payout remain for when Postman bodies are provided.
 */
export const vendorProfileService = {
  /**
   * GET /vendor-panel/account
   */
  async getAccount(options = {}) {
    const response = await apiClient.get(endpoints.vendor.account, {
      ...options,
      scope: 'vendor',
    })

    return {
      data: mapVendorAccountResponse(response?.data),
      meta: response?.meta ?? null,
    }
  },

  /** @deprecated Prefer getAccount — legacy mock profile path */
  getProfile(options = {}) {
    return apiClient.get(endpoints.vendor.profile, { ...options, scope: 'vendor' })
  },

  getLoginContent(options = {}) {
    return apiClient.get(endpoints.vendor.content.login, { ...options, scope: 'vendor' })
  },
}
