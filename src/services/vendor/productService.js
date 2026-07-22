import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const productService = {
  getCatalogStoreTypes(options = {}) {
    return apiClient.get(endpoints.vendor.catalog.storeTypes, { ...options, scope: 'vendor' })
  },
  getCatalogItems(options = {}) {
    return apiClient.get(endpoints.vendor.catalog.items, { ...options, scope: 'vendor' })
  },
  getServiceBookings(options = {}) {
    return apiClient.get(endpoints.vendor.services.bookings, { ...options, scope: 'vendor' })
  },
  getServiceCalendar(options = {}) {
    return apiClient.get(endpoints.vendor.services.calendar, { ...options, scope: 'vendor' })
  },
}
