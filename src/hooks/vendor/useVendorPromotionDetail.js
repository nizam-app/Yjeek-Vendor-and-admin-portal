import { useApiResource } from '../useApiResource'
import { promotionService } from '../../services/vendor/promotionService'

/**
 * Promotion detail page hook.
 * Prefers GET /vendor-panel/promotions/:id/analytics, falls back to GET detail.
 *
 * @param {string|null|undefined} promotionId
 */
export function useVendorPromotionDetail(promotionId) {
  const id = String(promotionId || '').trim()

  return useApiResource(() => {
    if (!id) {
      return Promise.resolve({ data: null, meta: null })
    }
    return promotionService.getPromotionDetailPage(id)
  }, [id])
}
