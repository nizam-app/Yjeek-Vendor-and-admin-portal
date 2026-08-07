import { useApiResource } from '../useApiResource'
import { promotionService } from '../../services/vendor/promotionService'

/**
 * Promotions page hook (list + summary KPIs).
 *
 * @param {{ status?: string, type?: string, search?: string }} [options]
 */
export function useVendorPromotions(options = {}) {
  const status = String(options.status || 'all').trim().toLowerCase() || 'all'
  const type = String(options.type || '').trim().toUpperCase()
  const search = String(options.search || '').trim()

  return useApiResource(
    () =>
      promotionService.getPromotions({
        status,
        type: type || undefined,
        search: search || undefined,
      }),
    [status, type, search],
  )
}
