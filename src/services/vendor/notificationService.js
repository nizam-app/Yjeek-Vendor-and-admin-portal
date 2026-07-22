import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const notificationService = {
  getNotifications(options = {}) {
    return apiClient.get(endpoints.vendor.notifications, { ...options, scope: 'vendor' })
  },
}
