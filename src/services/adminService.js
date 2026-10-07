import { apiClient } from '../api/client'
import { apiConfig, isAdminRealApiFeature } from '../api/config'
import { adminDashboardService } from './admin/dashboardService'
import { adminVendorService } from './admin/vendorService'
import { adminUserService } from './admin/userService'
import { adminFleetService } from './admin/fleetService'
import { adminStoreTypeService } from './admin/storeTypeService'
import { adminCustomerService } from './admin/customerService'
import { adminMarketingService } from './admin/marketingService'
import { adminReportService } from './admin/reportService'
import { adminSlaModelsService } from './admin/slaModelsService'

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
    if (type === 'stores' && (isAdminRealApiFeature('store-types') || !apiConfig.adminUseMockApi)) {
      return adminStoreTypeService.listForPage(options)
    }
    if (type === 'customers' && (isAdminRealApiFeature('customers') || !apiConfig.adminUseMockApi)) {
      return adminCustomerService.listForPage(options)
    }
    // Fleet list not wired yet — use getAdminFleetSummary for KPIs.
    // Users list uses listAdminUsers().
    // Marketing notifications / promo codes: use dedicated list methods.
    return apiClient.get('/admin/management', { ...options, params: { ...options.params, type } })
  },
  listAdminStoreTypes(options = {}) {
    return adminStoreTypeService.listStoreTypes(options)
  },
  listAdminStoreTypesForChampForm(options = {}) {
    return adminStoreTypeService.listStoreTypesForChampForm(options)
  },
  getAdminStoreType(storeTypeId, options = {}) {
    return adminStoreTypeService.getStoreType(storeTypeId, options)
  },
  createAdminStoreType(form, options = {}) {
    return adminStoreTypeService.createStoreType(form, options)
  },
  updateAdminStoreType(storeTypeId, form, options = {}) {
    return adminStoreTypeService.updateStoreType(storeTypeId, form, options)
  },
  publishAdminStoreType(storeTypeId, options = {}) {
    return adminStoreTypeService.publishStoreType(storeTypeId, options)
  },
  draftAdminStoreType(storeTypeId, options = {}) {
    return adminStoreTypeService.draftStoreType(storeTypeId, options)
  },
  deleteAdminStoreType(storeTypeId, options = {}) {
    return adminStoreTypeService.deleteStoreType(storeTypeId, options)
  },
  addAdminStoreTypeMenuCategory(storeTypeId, form, options = {}) {
    return adminStoreTypeService.addMenuCategory(storeTypeId, form, options)
  },
  updateAdminStoreTypeMenuCategory(storeTypeId, menuCategoryId, form, options = {}) {
    return adminStoreTypeService.updateMenuCategory(storeTypeId, menuCategoryId, form, options)
  },
  deleteAdminStoreTypeMenuCategory(storeTypeId, menuCategoryId, options = {}) {
    return adminStoreTypeService.deleteMenuCategory(storeTypeId, menuCategoryId, options)
  },
  addAdminStoreTypeBadge(storeTypeId, form, options = {}) {
    return adminStoreTypeService.addBadge(storeTypeId, form, options)
  },
  updateAdminStoreTypeBadge(storeTypeId, badgeId, form, options = {}) {
    return adminStoreTypeService.updateBadge(storeTypeId, badgeId, form, options)
  },
  deleteAdminStoreTypeBadge(storeTypeId, badgeId, options = {}) {
    return adminStoreTypeService.deleteBadge(storeTypeId, badgeId, options)
  },
  getAdminStoreTypeDeliveryDefaults(storeTypeId, options = {}) {
    return adminStoreTypeService.getDeliveryDefaults(storeTypeId, options)
  },
  updateAdminStoreTypeAllowedVehicles(storeTypeId, vehicles, options = {}) {
    return adminStoreTypeService.updateAllowedVehicles(storeTypeId, vehicles, options)
  },
  updateAdminStoreTypeDeliveryDefaults(storeTypeId, body, options = {}) {
    return adminStoreTypeService.updateDeliveryDefaults(storeTypeId, body, options)
  },
  getAdminStoreTypeCommissionDefaults(storeTypeId, options = {}) {
    return adminStoreTypeService.getCommissionDefaults(storeTypeId, options)
  },
  updateAdminStoreTypeCommissionDefaults(storeTypeId, body, options = {}) {
    return adminStoreTypeService.updateCommissionDefaults(storeTypeId, body, options)
  },
  resetAdminStoreTypeCommissionDefaults(storeTypeId, options = {}) {
    return adminStoreTypeService.resetCommissionDefaults(storeTypeId, options)
  },
  resetAdminStoreTypeCommercialSection(storeTypeId, section, options = {}) {
    return adminStoreTypeService.resetCommercialSection(storeTypeId, section, options)
  },
  getAdminStoreTypeItemClassConvertPreview(storeTypeId, disable, options = {}) {
    return adminStoreTypeService.getItemClassConvertPreview(storeTypeId, disable, options)
  },
  getAdminStoreTypeAttributes(storeTypeId, options = {}) {
    return adminStoreTypeService.getAttributes(storeTypeId, options)
  },
  putAdminStoreTypeAttributes(storeTypeId, axes, options = {}) {
    return adminStoreTypeService.putAttributes(storeTypeId, axes, options)
  },
  getAdminFleetSummary(options = {}) {
    return adminFleetService.getFleetSummary(options)
  },
  listAdminFleetChamps(filters, options = {}) {
    return adminFleetService.listChamps(filters, options)
  },
  listAdminChampNationalities(options = {}) {
    return adminFleetService.listChampNationalities(options)
  },
  addAdminChampNationality(label, options = {}) {
    return adminFleetService.addChampNationality(label, options)
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
  deactivateAdminFleetSupplier(supplierId, options = {}) {
    return adminFleetService.deactivateSupplier(supplierId, options)
  },
  activateAdminFleetSupplier(supplierId, options = {}) {
    return adminFleetService.activateSupplier(supplierId, options)
  },
  createAdminFleetChamp(form, options = {}) {
    return adminFleetService.createChamp(form, options)
  },
  updateAdminFleetChamp(champId, form, options = {}) {
    return adminFleetService.updateChamp(champId, form, options)
  },
  getAdminFleetChampEarnings(champId, filters, options = {}) {
    return adminFleetService.getChampEarnings(champId, filters, options)
  },
  suspendAdminFleetChamp(champId, form, options = {}) {
    return adminFleetService.suspendChamp(champId, form, options)
  },
  deleteAdminFleetChamp(champId, options = {}) {
    return adminFleetService.deleteChamp(champId, options)
  },
  unsuspendAdminFleetChamp(champId, options = {}) {
    return adminFleetService.unsuspendChamp(champId, options)
  },
  terminateAdminFleetChamp(champId, form, options = {}) {
    return adminFleetService.terminateChamp(champId, form, options)
  },
  setAdminFleetChampOnline(champId, online, options = {}) {
    return adminFleetService.setChampOnline(champId, online, options)
  },
  reconcileAdminFleetChampPod(champId, form, options = {}) {
    return adminFleetService.reconcileChampPod(champId, form, options)
  },
  messageAdminFleetChamp(champId, form, options = {}) {
    return adminFleetService.messageChamp(champId, form, options)
  },
  estimateAdminFleetNotify(form, options = {}) {
    return adminFleetService.estimateNotify(form, options)
  },
  sendAdminFleetNotify(form, options = {}) {
    return adminFleetService.sendNotify(form, options)
  },
  listAdminFleetNotifyHistory(options = {}) {
    return adminFleetService.listNotifyHistory(options)
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
  acceptAdminInvite(payload, options = {}) {
    return adminUserService.acceptInvite(payload, options)
  },
  suspendAdminUser(userId, options = {}) {
    return adminUserService.suspendUser(userId, options)
  },
  deleteAdminUser(userId, options = {}) {
    return adminUserService.deleteUser(userId, options)
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
  updateAdminRole(roleId, form, options = {}) {
    return adminUserService.updateRole(roleId, form, options)
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
  updateVendorStoreControls(vendorId, controls, options = {}) {
    return adminVendorService.updateVendorStoreControls(vendorId, controls, options)
  },
  listSlaModels(options = {}) {
    return adminVendorService.listSlaModels(options)
  },
  getSlaModel(slaModelId, options = {}) {
    return adminSlaModelsService.getById(slaModelId, options)
  },
  getSlaModelsPage(options = {}) {
    return adminSlaModelsService.getForPage(options)
  },
  saveSlaModelsForm(payload, options = {}) {
    return adminSlaModelsService.saveForm(payload, options)
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
  reopenVendor(vendorId, form = {}, options = {}) {
    return adminVendorService.reopenVendor(vendorId, form, options)
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
  deleteVendor(vendorId, options = {}) {
    return adminVendorService.deleteVendor(vendorId, options)
  },
  listVendorStaff(vendorId, options = {}) {
    return adminVendorService.listStaff(vendorId, options)
  },
  createVendorStaff(vendorId, form, branchOptions = [], options = {}) {
    return adminVendorService.createStaff(vendorId, form, branchOptions, options)
  },
  updateVendorStaff(vendorId, staffId, form, branchOptions = [], options = {}) {
    return adminVendorService.updateStaff(vendorId, staffId, form, branchOptions, options)
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
  getBranchDeliverySettings(vendorId, locationId, options = {}) {
    return adminVendorService.getBranchDeliverySettings(vendorId, locationId, options)
  },
  updateBranchDeliverySettings(vendorId, locationId, body, options = {}) {
    return adminVendorService.updateBranchDeliverySettings(vendorId, locationId, body, options)
  },
  resetBranchDeliverySettingsField(vendorId, locationId, body, options = {}) {
    return adminVendorService.resetBranchDeliverySettingsField(vendorId, locationId, body, options)
  },
  getVendorDeliverySettings(vendorId, options = {}) {
    return adminVendorService.getVendorDeliverySettings(vendorId, options)
  },
  updateVendorDeliverySettings(vendorId, body, options = {}) {
    return adminVendorService.updateVendorDeliverySettings(vendorId, body, options)
  },
  resetVendorDeliverySettingsField(vendorId, body, options = {}) {
    return adminVendorService.resetVendorDeliverySettingsField(vendorId, body, options)
  },
  pushVendorDeliverySettingsToBranches(vendorId, body, options = {}) {
    return adminVendorService.pushVendorDeliverySettingsToBranches(vendorId, body, options)
  },
  getStoreTypeChangePreview(vendorId, toStoreTypeId, options = {}) {
    return adminVendorService.getStoreTypeChangePreview(vendorId, toStoreTypeId, options)
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
  getVendorBookingSettings(vendorId, options = {}) {
    return adminVendorService.getBookingSettings(vendorId, options)
  },
  updateVendorBookingSettings(vendorId, body, options = {}) {
    return adminVendorService.updateBookingSettings(vendorId, body, options)
  },
  getCustomerDetail(customerId, options = {}) {
    if (isAdminRealApiFeature('customers') || !apiConfig.adminUseMockApi) {
      return adminCustomerService.getCustomer(customerId, options)
    }
    return apiClient.get('/admin/customers/detail', {
      ...options,
      params: { ...options.params, id: customerId },
    })
  },
  listAdminCustomers(filters, options = {}) {
    return adminCustomerService.listForPage({ ...filters, ...options })
  },
  getAdminCustomer(customerId, options = {}) {
    return adminCustomerService.getCustomer(customerId, options)
  },
  getAdminCustomerWallet(customerId, options = {}) {
    return adminCustomerService.getWallet(customerId, options)
  },
  getAdminCustomerSupport(customerId, options = {}) {
    return adminCustomerService.getSupportTickets(customerId, options)
  },
  getAdminCustomerSupportTicket(customerId, ticketId, options = {}) {
    return adminCustomerService.getSupportTicketDetail(customerId, ticketId, options)
  },
  suspendAdminCustomer(customerId, form, options = {}) {
    return adminCustomerService.suspendCustomer(customerId, form, options)
  },
  activateAdminCustomer(customerId, options = {}) {
    return adminCustomerService.activateCustomer(customerId, options)
  },
  listAdminMarketingNotifications(options = {}) {
    return adminMarketingService.listNotifications(options)
  },
  getAdminMarketingNotification(notificationId, options = {}) {
    return adminMarketingService.getNotification(notificationId, options)
  },
  getAdminMarketingNotificationReport(notificationId, options = {}) {
    return adminMarketingService.getNotificationReport(notificationId, options)
  },
  listAdminMarketingPushTriggers(options = {}) {
    return adminMarketingService.listPushTriggers(options)
  },
  updateAdminMarketingPushTrigger(trigger, body, options = {}) {
    return adminMarketingService.updatePushTrigger(trigger, body, options)
  },
  resendAdminMarketingNotification(notificationId, options = {}) {
    return adminMarketingService.resendNotification(notificationId, options)
  },
  deleteAdminMarketingNotification(notificationId, options = {}) {
    return adminMarketingService.deleteNotification(notificationId, options)
  },
  listAdminMarketingPromoCodes(options = {}) {
    return adminMarketingService.listPromoCodes(options)
  },
  createAdminMarketingPromoCode(form, options = {}) {
    return adminMarketingService.createPromoCode(form, options)
  },
  getAdminMarketingPromoCode(promoCodeId, options = {}) {
    return adminMarketingService.getPromoCode(promoCodeId, options)
  },
  updateAdminMarketingPromoCode(promoCodeId, form, options = {}) {
    return adminMarketingService.updatePromoCode(promoCodeId, form, options)
  },
  listAdminMarketingPromoCategories(options = {}) {
    return adminMarketingService.listPromoCategories(options)
  },
  createAdminMarketingPromoCategory(body, options = {}) {
    return adminMarketingService.createPromoCategory(body, options)
  },
  updateAdminMarketingPromoCategory(id, body, options = {}) {
    return adminMarketingService.updatePromoCategory(id, body, options)
  },
  retireAdminMarketingPromoCategory(id, options = {}) {
    return adminMarketingService.retirePromoCategory(id, options)
  },
  restoreAdminMarketingPromoCategory(id, options = {}) {
    return adminMarketingService.restorePromoCategory(id, options)
  },
  sendAdminCustomerNotification(form, options = {}) {
    return adminMarketingService.sendCustomerNotification(form, options)
  },
  listAdminCustomerNotificationHistory(options = {}) {
    return adminMarketingService.listCustomerNotificationHistory(options)
  },
  sendAdminVendorNotification(form, options = {}) {
    return adminMarketingService.sendVendorNotification(form, options)
  },
  listAdminVendorNotificationHistory(options = {}) {
    return adminMarketingService.listVendorNotificationHistory(options)
  },
  getAdminMarketingNotifyMeta(options = {}) {
    return adminMarketingService.getNotifyMeta(options)
  },
  estimateAdminVendorNotification(form, options = {}) {
    return adminMarketingService.estimateVendorNotification(form, options)
  },
  listAdminGeofenceCampaigns(options = {}) {
    return adminMarketingService.listGeofenceCampaigns(options)
  },
  getAdminGeofenceCampaign(campaignId, options = {}) {
    return adminMarketingService.getGeofenceCampaign(campaignId, options)
  },
  createAdminGeofenceCampaign(form, options = {}) {
    return adminMarketingService.createGeofenceCampaign(form, options)
  },
  updateAdminGeofenceCampaign(campaignId, form, options = {}) {
    return adminMarketingService.updateGeofenceCampaign(campaignId, form, options)
  },
  deleteAdminGeofenceCampaign(campaignId, options = {}) {
    return adminMarketingService.deleteGeofenceCampaign(campaignId, options)
  },
  getAdminCashback(options = {}) {
    return adminMarketingService.getCashback(options)
  },
  updateAdminCashbackSettings(body, options = {}) {
    return adminMarketingService.updateCashbackSettings(body, options)
  },
  updateAdminCashbackBaseRate(body, options = {}) {
    return adminMarketingService.updateCashbackBaseRate(body, options)
  },
  createAdminCashbackRule(body, options = {}) {
    return adminMarketingService.createCashbackRule(body, options)
  },
  updateAdminCashbackRule(ruleId, body, options = {}) {
    return adminMarketingService.updateCashbackRule(ruleId, body, options)
  },
  deleteAdminCashbackRule(ruleId, options = {}) {
    return adminMarketingService.deleteCashbackRule(ruleId, options)
  },
  getAdminCashbackReport(params, options = {}) {
    return adminMarketingService.getCashbackReport(params, options)
  },
  exportAdminCashbackReport(params, options = {}) {
    return adminMarketingService.exportCashbackReport(params, options)
  },
  getAdminReferral(options = {}) {
    return adminMarketingService.getReferral(options)
  },
  updateAdminReferralSettings(body, options = {}) {
    return adminMarketingService.updateReferralSettings(body, options)
  },
  updateAdminReferralValues(body, options = {}) {
    return adminMarketingService.updateReferralValues(body, options)
  },
  listAdminReferralInvites(params, options = {}) {
    return adminMarketingService.listReferralInvites(params, options)
  },
  exportAdminReferralInvites(params, options = {}) {
    return adminMarketingService.exportReferralInvites(params, options)
  },
  blockAdminReferralInviter(customerId, body, options = {}) {
    return adminMarketingService.blockReferralInviter(customerId, body, options)
  },
  unblockAdminReferralInviter(customerId, options = {}) {
    return adminMarketingService.unblockReferralInviter(customerId, options)
  },
  listAdminVoucherTemplates(params, options = {}) {
    return adminMarketingService.listVoucherTemplates(params, options)
  },
  getAdminVoucherTemplate(templateId, options = {}) {
    return adminMarketingService.getVoucherTemplate(templateId, options)
  },
  createAdminVoucherTemplate(body, options = {}) {
    return adminMarketingService.createVoucherTemplate(body, options)
  },
  updateAdminVoucherTemplate(templateId, body, options = {}) {
    return adminMarketingService.updateVoucherTemplate(templateId, body, options)
  },
  sendAdminVoucherForAcceptance(templateId, body, options = {}) {
    return adminMarketingService.sendVoucherForAcceptance(templateId, body, options)
  },
  listAdminVoucherVendorRequests(templateId, params, options = {}) {
    return adminMarketingService.listVoucherVendorRequests(templateId, params, options)
  },
  confirmAdminVoucherVendorRequest(requestId, body, options = {}) {
    return adminMarketingService.confirmVoucherVendorRequest(requestId, body, options)
  },
  updateAdminVoucherVendorExclusions(requestId, body, options = {}) {
    return adminMarketingService.updateVoucherVendorExclusions(requestId, body, options)
  },
  removeAdminVoucherVendorRequest(requestId, options = {}) {
    return adminMarketingService.removeVoucherVendorRequest(requestId, options)
  },
  resendAdminVoucherVendorRequest(requestId, body, options = {}) {
    return adminMarketingService.resendVoucherVendorRequest(requestId, body, options)
  },
  previewAdminVoucherVendorApplicability(templateId, body, options = {}) {
    return adminMarketingService.previewVoucherVendorApplicability(templateId, body, options)
  },
  grantAdminVoucher(templateId, body, options = {}) {
    return adminMarketingService.grantVoucher(templateId, body, options)
  },
  listAdminIssuedVouchers(params, options = {}) {
    return adminMarketingService.listIssuedVouchers(params, options)
  },
  revokeAdminVoucher(voucherId, options = {}) {
    return adminMarketingService.revokeVoucher(voucherId, options)
  },
  getAdminVoucherSettlement(params, options = {}) {
    return adminMarketingService.getVoucherSettlement(params, options)
  },
  exportAdminVoucherSettlement(params, options = {}) {
    return adminMarketingService.exportVoucherSettlement(params, options)
  },
  listAdminDistributionRules(params, options = {}) {
    return adminMarketingService.listDistributionRules(params, options)
  },
  createAdminDistributionRule(body, options = {}) {
    return adminMarketingService.createDistributionRule(body, options)
  },
  updateAdminDistributionRule(ruleId, body, options = {}) {
    return adminMarketingService.updateDistributionRule(ruleId, body, options)
  },
  runAdminDistributionRule(ruleId, body, options = {}) {
    return adminMarketingService.runDistributionRule(ruleId, body, options)
  },
  listAdminCampaigns(params, options = {}) {
    return adminMarketingService.listCampaigns(params, options)
  },
  getAdminCampaignOptions(options = {}) {
    return adminMarketingService.getCampaignOptions(options)
  },
  getAdminCampaign(campaignId, options = {}) {
    return adminMarketingService.getCampaign(campaignId, options)
  },
  previewAdminCampaignCost(body, options = {}) {
    return adminMarketingService.previewCampaignCost(body, options)
  },
  createAdminCampaign(body, options = {}) {
    return adminMarketingService.createCampaign(body, options)
  },
  updateAdminCampaign(campaignId, body, options = {}) {
    return adminMarketingService.updateCampaign(campaignId, body, options)
  },
  deleteAdminCampaign(campaignId, options = {}) {
    return adminMarketingService.deleteCampaign(campaignId, options)
  },
  activateAdminCampaign(campaignId, options = {}) {
    return adminMarketingService.activateCampaign(campaignId, options)
  },
  endAdminCampaign(campaignId, options = {}) {
    return adminMarketingService.endCampaign(campaignId, options)
  },
  submitAdminCampaignApproval(campaignId, options = {}) {
    return adminMarketingService.submitCampaignApproval(campaignId, options)
  },
  revertAdminCampaignDraft(campaignId, options = {}) {
    return adminMarketingService.revertCampaignDraft(campaignId, options)
  },
  approveAdminCampaign(campaignId, options = {}) {
    return adminMarketingService.approveCampaign(campaignId, options)
  },
  rejectAdminCampaign(campaignId, body, options = {}) {
    return adminMarketingService.rejectCampaign(campaignId, body, options)
  },
  getAdminBudgetSettings(options = {}) {
    return adminMarketingService.getBudgetSettings(options)
  },
  updateAdminBudgetSettings(body, options = {}) {
    return adminMarketingService.updateBudgetSettings(body, options)
  },
  createAdminCampaignFromSeason(body, options = {}) {
    return adminMarketingService.createCampaignFromSeason(body, options)
  },
  listAdminVendorPromotions(params, options = {}) {
    return adminMarketingService.listVendorPromotions(params, options)
  },
  getAdminVendorPromotionReport(options = {}) {
    return adminMarketingService.getVendorPromotionReport(options)
  },
  getAdminVendorPromotionSettings(options = {}) {
    return adminMarketingService.getVendorPromotionSettings(options)
  },
  updateAdminVendorPromotionSettings(body, options = {}) {
    return adminMarketingService.updateVendorPromotionSettings(body, options)
  },
  approveAdminVendorPromotion(promotionId, options = {}) {
    return adminMarketingService.approveVendorPromotion(promotionId, options)
  },
  rejectAdminVendorPromotion(promotionId, body, options = {}) {
    return adminMarketingService.rejectVendorPromotion(promotionId, body, options)
  },
  listAdminSpinWheels(options = {}) {
    return adminMarketingService.listSpinWheels(options)
  },
  getAdminSpinWheel(wheelId, options = {}) {
    return adminMarketingService.getSpinWheel(wheelId, options)
  },
  createAdminSpinWheel(body, options = {}) {
    return adminMarketingService.createSpinWheel(body, options)
  },
  updateAdminSpinWheel(wheelId, body, options = {}) {
    return adminMarketingService.updateSpinWheel(wheelId, body, options)
  },
  updateAdminSpinWheelAllowance(wheelId, body, options = {}) {
    return adminMarketingService.updateSpinWheelAllowance(wheelId, body, options)
  },
  replaceAdminSpinWheelSegments(wheelId, body, options = {}) {
    return adminMarketingService.replaceSpinWheelSegments(wheelId, body, options)
  },
  deleteAdminSpinWheel(wheelId, options = {}) {
    return adminMarketingService.deleteSpinWheel(wheelId, options)
  },
  getAdminSegments(params = {}, options = {}) {
    return adminMarketingService.getSegments(params, options)
  },
  getAdminSegment(id, options = {}) {
    return adminMarketingService.getSegment(id, options)
  },
  previewAdminSegment(body, options = {}) {
    return adminMarketingService.previewSegment(body, options)
  },
  createAdminSegment(body, options = {}) {
    return adminMarketingService.createSegment(body, options)
  },
  updateAdminSegment(id, body, options = {}) {
    return adminMarketingService.updateSegment(id, body, options)
  },
  deleteAdminSegment(id, options = {}) {
    return adminMarketingService.deleteSegment(id, options)
  },
  recalculateAdminSegment(id, options = {}) {
    return adminMarketingService.recalculateSegment(id, options)
  },
  getAdminSegmentCustomers(id, params = {}, options = {}) {
    return adminMarketingService.getSegmentCustomers(id, params, options)
  },
  getOrdersReport(filters, options = {}) {
    return adminReportService.getOrdersReport(filters, options)
  },
  exportOrdersReport(filters, options = {}) {
    return adminReportService.exportOrdersReport(filters, options)
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
  listChampDocuments(champId, options = {}) {
    return adminFleetService.listChampDocuments(champId, options)
  },
}
