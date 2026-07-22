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
  getVendorDetail(vendorId, options = {}) {
    return apiClient.get('/admin/vendors/detail', { ...options, params: { ...options.params, id: vendorId } })
  },
  getCustomerDetail(customerId, options = {}) {
    return apiClient.get('/admin/customers/detail', { ...options, params: { ...options.params, id: customerId } })
  },
  getChampDetail(champId, options = {}) {
    return apiClient.get('/admin/champs/detail', { ...options, params: { ...options.params, id: champId } })
  },
}
