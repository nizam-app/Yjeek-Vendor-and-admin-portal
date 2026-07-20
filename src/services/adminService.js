import { apiClient } from '../api/client'

export const adminService = {
  getDashboard(options) {
    return apiClient.get('/admin/dashboard', options)
  },
  getLiveOrders(options) {
    return apiClient.get('/admin/live-orders', options)
  },
  getPickup(options) {
    return apiClient.get('/admin/pickup', options)
  },
  getDineIn(options) {
    return apiClient.get('/admin/dine-in', options)
  },
  getServices(options) {
    return apiClient.get('/admin/services', options)
  },
  getOperations(mode, options = {}) {
    return apiClient.get('/admin/operations', { ...options, params: { ...options.params, mode } })
  },
  getManagement(type, options = {}) {
    return apiClient.get('/admin/management', { ...options, params: { ...options.params, type } })
  },
}
