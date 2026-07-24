import { useApiResource } from '../useApiResource'
import { promotionService } from '../../services/vendor/promotionService'

/**
 * Promotions page hook (list + summary KPIs).
 */
export function useVendorPromotions() {
  return useApiResource(() => promotionService.getPromotions(), [])
}
