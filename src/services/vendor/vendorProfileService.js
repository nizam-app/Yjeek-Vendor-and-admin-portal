import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const vendorProfileService = {
  getProfile(options = {}) {
    return apiClient.get(endpoints.vendor.profile, { ...options, scope: 'vendor' })
  },
  getLoginContent(options = {}) {
    return apiClient.get(endpoints.vendor.content.login, { ...options, scope: 'vendor' })
  },
}
