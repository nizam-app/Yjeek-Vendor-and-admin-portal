import { apiClient } from '../api/client'

export const adminService = {
  getDashboard(options) {
    return apiClient.get('/admin/dashboard', options)
  },
  getLiveOrders(options) {
    return apiClient.get('/admin/live-orders', options)
  },
  getOperations(mode, options = {}) {
    return apiClient.get('/admin/operations', { ...options, params: { ...options.params, mode } })
  },
  getManagement(type, options = {}) {
    return apiClient.get('/admin/management', { ...options, params: { ...options.params, type } })
  },
}
