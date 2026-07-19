import { apiClient } from '../api/client'

export const vendorService = {
  getDashboard: (options) => apiClient.get('/vendor/dashboard', options),
  getProfile: (options) => apiClient.get('/vendor/profile', options),
  getLiveOrders: (options) => apiClient.get('/orders/live', options),
  getScheduledOrders: (options) => apiClient.get('/orders/scheduled', options),
  getOrderHistory: (options) => apiClient.get('/orders/history', options),
  getServiceBookings: (options) => apiClient.get('/services/bookings', options),
  getServiceCalendar: (options) => apiClient.get('/services/calendar', options),
  getCatalogStoreTypes: (options) => apiClient.get('/catalog/store-types', options),
  getCatalogItems: (options) => apiClient.get('/catalog/items', options),
  getBranches: (options) => apiClient.get('/branches', options),
  getStaff: (options) => apiClient.get('/staff', options),
  getPromotions: (options) => apiClient.get('/promotions', options),
  getNotifications: (options) => apiClient.get('/notifications', options),
  getLoginContent: (options) => apiClient.get('/content/login', options),
}
