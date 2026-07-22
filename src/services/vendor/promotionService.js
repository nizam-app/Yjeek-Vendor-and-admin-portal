import { apiClient } from '../../api/client'
import { endpoints } from '../../api/endpoints'

export const promotionService = {
  getPromotions(options = {}) {
    return apiClient.get(endpoints.vendor.promotions, { ...options, scope: 'vendor' })
  },
}
