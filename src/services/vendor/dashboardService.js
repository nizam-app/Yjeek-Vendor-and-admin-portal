import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const dashboardService = {
  getDashboard(options = {}) {
    return apiClient.get(endpoints.vendor.dashboard, { ...options, scope: 'vendor' })
  },
}
