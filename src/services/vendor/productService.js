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
  /** @deprecated Prefer orderService.getServiceCalendar */
  getServiceCalendar(options = {}) {
    const { branchId, month, params, ...requestOptions } = options
    const query = { ...(params || {}) }
    if (month) query.month = String(month)
    if (branchId) query.branchId = String(branchId)
    return apiClient.get(endpoints.vendor.orders.servicesCalendar, {
      ...requestOptions,
      params: query,
      scope: 'vendor',
    })
  },
}
