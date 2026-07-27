import { useApiResource } from '../useApiResource'
import { isAdminRealApiFeature } from '../../api/config'
import { adminOrderService } from '../../services/admin/orderService'
import { emptyAdminOrderActionOptions } from '../../mappers/admin/mapAdminOrderActionOptions'

/**
 * Admin Take-action options catalog.
 * Page → useAdminOrderActionOptions → adminOrderService.getActionOptions → mapper
 */
export function useAdminOrderActionOptions() {
  const useReal = isAdminRealApiFeature('dashboard')

  return useApiResource(() => {
    if (!useReal) {
      return Promise.resolve({ data: emptyAdminOrderActionOptions(), meta: null })
    }
    return adminOrderService.getActionOptions()
  }, [useReal])
}
