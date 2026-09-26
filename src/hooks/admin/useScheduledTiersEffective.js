import { useApiResource } from '../useApiResource'
import { isAutomationRealApi } from '../../services/admin/dispatchAutomationFeature'
import { adminDispatchAutomationService } from '../../services/admin/dispatchAutomationService'

/**
 * Published SLA + scheduled-dispatch policy view for Automation → Scheduled Tiers.
 */
export function useScheduledTiersEffective() {
  const enabled = isAutomationRealApi()

  const resource = useApiResource(() => {
    if (!enabled) {
      return Promise.resolve({ data: null, meta: null })
    }
    return adminDispatchAutomationService.getScheduledTiers()
  }, [enabled])

  return {
    ...resource,
    enabled,
    effective: resource.data ?? null,
  }
}
