import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const staffService = {
  getStaff(options = {}) {
    return apiClient.get(endpoints.vendor.staff, { ...options, scope: 'vendor' })
  },
}
