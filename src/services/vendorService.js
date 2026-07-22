/**
 * Compatibility barrel for existing Vendor pages.
 * Prefer importing from `src/services/vendor/*` for new code.
 * Pages are not rewritten in this step.
 */
import { branchService } from './vendor/branchService'
import { dashboardService } from './vendor/dashboardService'
import { notificationService } from './vendor/notificationService'
import { orderService } from './vendor/orderService'
import { productService } from './vendor/productService'
import { promotionService } from './vendor/promotionService'
import { staffService } from './vendor/staffService'
import { vendorProfileService } from './vendor/vendorProfileService'

export const vendorService = {
  getDashboard: (options) => dashboardService.getDashboard(options),
  getProfile: (options) => vendorProfileService.getProfile(options),
  getLiveOrders: (options) => orderService.getLiveOrders(options),
  getScheduledOrders: (options) => orderService.getScheduledOrders(options),
  getOrderHistory: (options) => orderService.getOrderHistory(options),
  getServiceBookings: (options) => productService.getServiceBookings(options),
  getServiceCalendar: (options) => productService.getServiceCalendar(options),
  getCatalogStoreTypes: (options) => productService.getCatalogStoreTypes(options),
  getCatalogItems: (options) => productService.getCatalogItems(options),
  getBranches: (options) => branchService.getBranches(options),
  getStaff: (options) => staffService.getStaff(options),
  getPromotions: (options) => promotionService.getPromotions(options),
  getNotifications: (options) => notificationService.getNotifications(options),
  getLoginContent: (options) => vendorProfileService.getLoginContent(options),
}
