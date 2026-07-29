import { apiClient } from '../api/client'
import { adminDashboardService } from './admin/dashboardService'
import { adminVendorService } from './admin/vendorService'

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
    if (type === 'vendors') {
      return adminVendorService.listVendors(options)
    }
    return apiClient.get('/admin/management', { ...options, params: { ...options.params, type } })
  },
  getVendors(options = {}) {
    return adminVendorService.listVendors(options)
  },
  getVendorDetail(vendorId, options = {}) {
    return adminVendorService.getVendorDetail(vendorId, options)
  },
  updateVendor(vendorId, form, options = {}) {
    return adminVendorService.updateVendor(vendorId, form, options)
  },
  listStoreTypes(options = {}) {
    return adminVendorService.listStoreTypes(options)
  },
  forceCloseVendor(vendorId, form, options = {}) {
    return adminVendorService.forceCloseVendor(vendorId, form, options)
  },
  reopenVendor(vendorId, options = {}) {
    return adminVendorService.reopenVendor(vendorId, options)
  },
  suspendVendor(vendorId, form, options = {}) {
    return adminVendorService.suspendVendor(vendorId, form, options)
  },
  unsuspendVendor(vendorId, options = {}) {
    return adminVendorService.unsuspendVendor(vendorId, options)
  },
  listVendorBranches(vendorId, options = {}) {
    return adminVendorService.listBranches(vendorId, options)
  },
  createVendorBranch(vendorId, form, options = {}) {
    return adminVendorService.createBranch(vendorId, form, options)
  },
  updateVendorBranch(vendorId, branchId, form, options = {}) {
    return adminVendorService.updateBranch(vendorId, branchId, form, options)
  },
  deleteVendorBranch(vendorId, branchId, options = {}) {
    return adminVendorService.deleteBranch(vendorId, branchId, options)
  },
  listVendorStaff(vendorId, options = {}) {
    return adminVendorService.listStaff(vendorId, options)
  },
  createVendorStaff(vendorId, form, branchOptions = [], options = {}) {
    return adminVendorService.createStaff(vendorId, form, branchOptions, options)
  },
  getVendorDeliveryZones(vendorId, options = {}) {
    return adminVendorService.getDeliveryZones(vendorId, options)
  },
  updateVendorDeliveryZones(vendorId, form, options = {}) {
    return adminVendorService.updateDeliveryZones(vendorId, form, options)
  },
  applyVendorDeliveryZonesToAll(vendorId, options = {}) {
    return adminVendorService.applyDeliveryZonesToAll(vendorId, options)
  },
  getCustomerDetail(customerId, options = {}) {
    return apiClient.get('/admin/customers/detail', { ...options, params: { ...options.params, id: customerId } })
  },
  getChampDetail(champId, options = {}) {
    return apiClient.get('/admin/champs/detail', { ...options, params: { ...options.params, id: champId } })
  },
}
