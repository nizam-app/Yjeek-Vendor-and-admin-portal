import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const branchService = {
  getBranches(options = {}) {
    return apiClient.get(endpoints.vendor.branches, { ...options, scope: 'vendor' })
  },
}
