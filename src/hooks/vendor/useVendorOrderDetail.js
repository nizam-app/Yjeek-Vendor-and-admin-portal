import { useApiResource } from '../useApiResource'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor order detail (history drill-down).
 * OrderHistoryDetail → useVendorOrderDetail → orderService.getOrderDetail → mapper → apiClient
 *
 * @param {string|null|undefined} orderId backend order id (cuid)
 */
export function useVendorOrderDetail(orderId) {
  const id = String(orderId || '').trim()

  return useApiResource(() => {
    if (!id) {
      return Promise.resolve({ data: null, meta: null })
    }
    return orderService.getOrderDetail(id)
  }, [id])
}
