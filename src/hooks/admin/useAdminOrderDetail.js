import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminOrderService } from '../../services/admin/orderService'

/**
 * Admin order detail hook.
 * Modal → useAdminOrderDetail(orderId) → adminOrderService.getOrder → mapper → apiClient
 *
 * @param {string|null|undefined} orderId API order id (not display orderNumber)
 */
export function useAdminOrderDetail(orderId) {
  const id = orderId ? String(orderId).trim() : ''
  const useReal = isAdminRealApiFeature('dashboard')

  return useApiResource(() => {
    if (!id || !useReal) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminOrderService.getOrder(id)
  }, [id, useReal])
}
