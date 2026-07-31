import { apiClient } from '../api/client'
import { apiConfig, isAdminRealApiFeature } from '../api/config'
import { adminDashboardService } from './admin/dashboardService'
import { adminVendorService } from './admin/vendorService'
import { adminUserService } from './admin/userService'
import { adminFleetService } from './admin/fleetService'

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
    // Fleet list not wired yet — use getAdminFleetSummary for KPIs.
    // Users list uses listAdminUsers().
    return apiClient.get('/admin/management', { ...options, params: { ...options.params, type } })
  },
  getAdminFleetSummary(options = {}) {
    return adminFleetService.getFleetSummary(options)
  },
  listAdminFleetChamps(filters, options = {}) {
    return adminFleetService.listChamps(filters, options)
  },
  listAdminFleetSuppliers(options = {}) {
    return adminFleetService.listSuppliers(options)
  },
  getAdminFleetSupplier(supplierId, filters, options = {}) {
    return adminFleetService.getSupplier(supplierId, filters, options)
  },
  createAdminFleetSupplier(form, options = {}) {
    return adminFleetService.createSupplier(form, options)
  },
  updateAdminFleetSupplier(supplierId, form, options = {}) {
    return adminFleetService.updateSupplier(supplierId, form, options)
  },
  createAdminFleetChamp(form, options = {}) {
    return adminFleetService.createChamp(form, options)
  },
  getAdminFleetChampEarnings(champId, filters, options = {}) {
    return adminFleetService.getChampEarnings(champId, filters, options)
  },
  suspendAdminFleetChamp(champId, form, options = {}) {
    return adminFleetService.suspendChamp(champId, form, options)
  },
  unsuspendAdminFleetChamp(champId, options = {}) {
    return adminFleetService.unsuspendChamp(champId, options)
  },
  listAdminUsers(options = {}) {
    return adminUserService.listUsers(options)
  },
  getAdminUsersSummary(options = {}) {
    return adminUserService.getUsersSummary(options)
  },
  getAdminUsersMeta(options = {}) {
    return adminUserService.getUsersMeta(options)
  },
  getAdminUserDetail(userId, options = {}) {
    return adminUserService.getUserDetail(userId, options)
  },
  createAdminUser(form, options = {}) {
    return adminUserService.createUser(form, options)
  },
  updateAdminUser(userId, form, options = {}) {
    return adminUserService.updateUser(userId, form, options)
  },
  resetAdminUserPassword(userId, options = {}) {
    return adminUserService.resetUserPassword(userId, options)
  },
  resendAdminUserInvite(userId, options = {}) {
    return adminUserService.resendUserInvite(userId, options)
  },
  suspendAdminUser(userId, options = {}) {
    return adminUserService.suspendUser(userId, options)
  },
  unsuspendAdminUser(userId, options = {}) {
    return adminUserService.unsuspendUser(userId, options)
  },
  listAdminRoles(options = {}) {
    return adminUserService.listRoles(options)
  },
  getAdminRolesMeta(options = {}) {
    return adminUserService.getRolesMeta(options)
  },
  getAdminRoleDetail(roleId, options = {}) {
    return adminUserService.getRoleDetail(roleId, options)
  },
  createAdminRole(form, options = {}) {
    return adminUserService.createRole(form, options)
  },
  getAdminActivityMeta(options = {}) {
    return adminUserService.getActivityMeta(options)
  },
  listAdminActivity(filters, options = {}) {
    return adminUserService.listActivity(filters, options)
  },
  exportAdminActivity(filters, options = {}) {
    return adminUserService.exportActivity(filters, options)
  },
  getVendors(options = {}) {
    return adminVendorService.listVendors(options)
  },
  getVendorDetail(vendorId, options = {}) {
    return adminVendorService.getVendorDetail(vendorId, options)
  },
  createVendor(wizard, options = {}) {
    return adminVendorService.createVendor(wizard, options)
  },
  activateVendor(vendorId, options = {}) {
    return adminVendorService.activateVendor(vendorId, options)
  },
  listSlaModels(options = {}) {
    return adminVendorService.listSlaModels(options)
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
  getVendorCommission(vendorId, options = {}) {
    return adminVendorService.getCommission(vendorId, options)
  },
  updateVendorCommission(vendorId, form, options = {}) {
    return adminVendorService.updateCommission(vendorId, form, options)
  },
  listVendorPromotions(vendorId, options = {}) {
    return adminVendorService.listPromotions(vendorId, options)
  },
  getVendorPromotion(vendorId, promotionId, options = {}) {
    return adminVendorService.getPromotion(vendorId, promotionId, options)
  },
  createVendorPromotion(vendorId, form, options = {}) {
    return adminVendorService.createPromotion(vendorId, form, options)
  },
  updateVendorPromotion(vendorId, promotionId, form, options = {}) {
    return adminVendorService.updatePromotion(vendorId, promotionId, form, options)
  },
  getVendorSla(vendorId, options = {}) {
    return adminVendorService.getSla(vendorId, options)
  },
  updateVendorSla(vendorId, form, options = {}) {
    return adminVendorService.updateSla(vendorId, form, options)
  },
  getCustomerDetail(customerId, options = {}) {
    return apiClient.get('/admin/customers/detail', { ...options, params: { ...options.params, id: customerId } })
  },
  getChampDetail(champId, options = {}) {
    // Real admin mode (mocks off) or fleet feature flag → Postman overview endpoint.
    // Avoid dead mock path `/admin/champs/detail` when VITE_ADMIN_USE_MOCK_API=false.
    if (isAdminRealApiFeature('fleet') || !apiConfig.adminUseMockApi) {
      return adminFleetService.getChamp(champId, options)
    }
    return apiClient.get('/admin/champs/detail', {
      ...options,
      params: { ...options.params, id: champId },
    })
  },
}
