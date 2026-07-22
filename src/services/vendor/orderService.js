import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const orderService = {
  getLiveOrders(options = {}) {
    return apiClient.get(endpoints.vendor.orders.live, { ...options, scope: 'vendor' })
  },
  getScheduledOrders(options = {}) {
    return apiClient.get(endpoints.vendor.orders.scheduled, { ...options, scope: 'vendor' })
  },
  getOrderHistory(options = {}) {
    return apiClient.get(endpoints.vendor.orders.history, { ...options, scope: 'vendor' })
  },
}
