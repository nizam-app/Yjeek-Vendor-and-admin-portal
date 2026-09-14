import { useApiResource } from '../useApiResource'
import { isAutomationRealApi } from '../../services/admin/dispatchAutomationFeature'
import { vendorAcceptanceSlaService } from '../../services/admin/vendorAcceptanceSlaService'

/**
 * Backend-resolved hot-food vendor acceptance timing for Automation (read-only).
 */
export function useVendorAcceptanceSlaEffective() {
  const enabled = isAutomationRealApi()

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return vendorAcceptanceSlaService.getHotFoodEffective()
  }, [enabled])

  return {
    ...resource,
    enabled,
    hotFood: resource.data?.hotFood ?? null,
    model: resource.data?.model ?? null,
  }
}
