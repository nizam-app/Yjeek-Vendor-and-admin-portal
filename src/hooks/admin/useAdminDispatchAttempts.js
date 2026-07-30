import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminOrderService } from '../../services/admin/orderService'
import { emptyAdminDispatchAttempts } from '../../mappers/admin/mapAdminDispatchAttempts'

/**
 * Order dispatch attempts (offer history).
 * @param {string|null|undefined} orderId
 */
export function useAdminDispatchAttempts(orderId) {
  const id = orderId ? String(orderId).trim() : ''
  const useReal = isAdminRealApiFeature('dashboard')

  return useApiResource(() => {
    if (!id || !useReal) {
      return Promise.resolve({ data: emptyAdminDispatchAttempts(), meta: null })
    }
    return adminOrderService.listDispatchAttempts(id)
  }, [id, useReal])
}
