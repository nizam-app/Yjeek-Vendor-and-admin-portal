import { apiClient } from '../api/client'
import { adminDashboardService } from './admin/dashboardService'

export const adminService = {
  getDashboard(options) {
    return adminDashboardService.getDashboard(options)
  },
  getLiveOrders(options) {
    return adminDashboardService.getLiveOrders(options)
  },
  getPickup(options) {
    return adminDashboardService.getPickupBoard(options)
  },
  getDineIn(options) {
    return adminDashboardService.getDineInBoard(options)
  },
  getServices(options) {
    return adminDashboardService.getServicesBoard(options)
  },
  getOperations(mode, options = {}) {
    if (mode === 'scheduled') {
      return adminDashboardService.getScheduledBoard(options)
    }
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
