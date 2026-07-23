import { useApiResource } from '../useApiResource'
import { orderService } from '../../services/vendor/orderService'

/**
 * Vendor orders history list.
 * Orders history → useVendorOrderHistory → orderService.getOrderHistory → mapper → apiClient
 *
 * @param {{ limit?: number }} [options]
 */
export function useVendorOrderHistory(options = {}) {
  const limit = options.limit ?? 20

  return useApiResource(() => orderService.getOrderHistory({ limit }), [limit])
}
