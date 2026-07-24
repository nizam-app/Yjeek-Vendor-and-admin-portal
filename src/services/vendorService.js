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
  getAccount: (options) => vendorProfileService.getAccount(options),
  getLiveOrders: (options) => orderService.getLiveOrders(options),
  getScheduledOrders: (options) => orderService.getScheduledOrders(options),
  getOrderHistory: (options) => orderService.getOrderHistory(options),
  getServiceBookings: (options) => productService.getServiceBookings(options),
  getServiceCalendar: (options) => productService.getServiceCalendar(options),
  getCatalogStoreTypes: (options) => productService.getCatalogStoreTypes(options),
  getCatalogCategories: (options) => productService.getCatalogCategories(options),
  getCatalogItems: (options) => productService.getCatalogProducts(options),
  getCatalogProducts: (options) => productService.getCatalogProducts(options),
  getCatalogProduct: (productId, options) => productService.getProduct(productId, options),
  createCatalogProduct: (form, options) => productService.createProduct(form, options),
  getBranches: (options) => branchService.getBranches(options),
  getStaff: (options) => staffService.getStaff(options),
  getPromotions: (options) => promotionService.getPromotions(options),
  getPromotion: (promotionId, options) => promotionService.getPromotion(promotionId, options),
  getPromotionAnalytics: (promotionId, options) =>
    promotionService.getPromotionAnalytics(promotionId, options),
  pausePromotion: (promotionId, isPaused, options) =>
    promotionService.pausePromotion(promotionId, isPaused, options),
  getNotifications: (options) => notificationService.getNotifications(options),
  getUnreadNotificationCount: (options) => notificationService.getUnreadCount(options),
  markNotificationRead: (notificationId, options) =>
    notificationService.markRead(notificationId, options),
  markAllNotificationsRead: (options) => notificationService.markAllRead(options),
  getLoginContent: (options) => vendorProfileService.getLoginContent(options),
}
